import type { Schema } from '@/amplify/data/resource';

interface ActivityData {
  activities: Schema['Activity']['type'][];
  pullRequests: Schema['PullRequest']['type'][];
  repositories: Schema['Repository']['type'][];
}

interface DailyMetrics {
  date: string;
  codingHours: number;
  breakTime: number;
  focusSessions: number;
  averageFocusDuration: number;
  longestFocusDuration: number;
  totalCommits: number;
  morningCommits: number;
  afternoonCommits: number;
  eveningCommits: number;
  lateNightCommits: number;
  weekendCommits: number;
  prsOpened: number;
  prsReviewed: number;
  prsMerged: number;
  averagePrSize: number;
  prVelocity: number;
  firstActivityTime: string | null;
  lastActivityTime: string | null;
  consecutiveWorkDays: number;
  lastDayOff: string | null;
}

export function calculateDailyMetrics(
  data: ActivityData,
  date: Date,
  previousMetrics?: Schema['DeveloperWellnessMetrics']['type'][]
): DailyMetrics {
  const dateStr = date.toISOString().split('T')[0];
  const dayActivities = data.activities.filter(a => 
    a.createdAt.startsWith(dateStr)
  );

  // Calculate coding hours and break time
  const { codingHours, breakTime, focusSessions } = calculateWorkPatterns(dayActivities);

  // Calculate commit patterns
  const commitActivities = dayActivities.filter(a => 
    a.type === 'commit' || a.type === 'push'
  );
  const commitPatterns = categorizeCommitsByTime(commitActivities);

  // Calculate PR metrics
  const dayPRs = data.pullRequests.filter(pr => 
    pr.createdAt.startsWith(dateStr)
  );
  const prMetrics = calculatePRMetrics(dayPRs, data.pullRequests);

  // Calculate focus session details
  const focusMetrics = calculateFocusMetrics(focusSessions);

  // Get first and last activity times
  const activityTimes = getActivityTimeRange(dayActivities);

  // Calculate consecutive work days
  const consecutiveWorkDays = calculateConsecutiveWorkDays(
    date,
    previousMetrics || []
  );

  // Find last day off
  const lastDayOff = findLastDayOff(date, previousMetrics || []);

  return {
    date: dateStr,
    codingHours,
    breakTime,
    focusSessions: focusSessions.length,
    averageFocusDuration: focusMetrics.averageDuration,
    longestFocusDuration: focusMetrics.longestDuration,
    totalCommits: commitActivities.length,
    ...commitPatterns,
    ...prMetrics,
    firstActivityTime: activityTimes.first,
    lastActivityTime: activityTimes.last,
    consecutiveWorkDays,
    lastDayOff,
  };
}

function calculateWorkPatterns(activities: Schema['Activity']['type'][]): {
  codingHours: number;
  breakTime: number;
  focusSessions: { start: Date; end: Date; duration: number }[];
} {
  if (activities.length === 0) {
    return { codingHours: 0, breakTime: 0, focusSessions: [] };
  }

  // Sort activities by time
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const focusSessions: { start: Date; end: Date; duration: number }[] = [];
  let currentSession: { start: Date; lastActivity: Date } | null = null;
  let totalActiveTime = 0;
  let totalBreakTime = 0;

  const FOCUS_THRESHOLD = 30 * 60 * 1000; // 30 minutes of inactivity breaks focus
  const BREAK_THRESHOLD = 5 * 60 * 1000; // 5 minutes is considered a break

  for (let i = 0; i < sortedActivities.length; i++) {
    const activity = sortedActivities[i];
    const activityTime = new Date(activity.createdAt);

    if (i === 0) {
      // Start first session
      currentSession = { start: activityTime, lastActivity: activityTime };
    } else {
      const prevActivity = sortedActivities[i - 1];
      const prevTime = new Date(prevActivity.createdAt);
      const timeDiff = activityTime.getTime() - prevTime.getTime();

      if (timeDiff > FOCUS_THRESHOLD) {
        // End current focus session
        if (currentSession) {
          const duration = currentSession.lastActivity.getTime() - currentSession.start.getTime();
          if (duration > 0) {
            focusSessions.push({
              start: currentSession.start,
              end: currentSession.lastActivity,
              duration: duration / (60 * 1000) // Convert to minutes
            });
            totalActiveTime += duration;
          }
        }

        // Track break time
        if (timeDiff > BREAK_THRESHOLD) {
          totalBreakTime += timeDiff;
        }

        // Start new session
        currentSession = { start: activityTime, lastActivity: activityTime };
      } else {
        // Continue current session
        if (currentSession) {
          currentSession.lastActivity = activityTime;
        }

        // Small gaps are active time
        totalActiveTime += timeDiff;
      }
    }
  }

  // Close final session
  if (currentSession) {
    const duration = currentSession.lastActivity.getTime() - currentSession.start.getTime();
    if (duration > 0) {
      focusSessions.push({
        start: currentSession.start,
        end: currentSession.lastActivity,
        duration: duration / (60 * 1000)
      });
      totalActiveTime += duration;
    }
  }

  // Filter out very short focus sessions (less than 15 minutes)
  const significantSessions = focusSessions.filter(s => s.duration >= 15);

  return {
    codingHours: totalActiveTime / (60 * 60 * 1000), // Convert to hours
    breakTime: totalBreakTime / (60 * 60 * 1000),
    focusSessions: significantSessions
  };
}

function categorizeCommitsByTime(commits: Schema['Activity']['type'][]): {
  morningCommits: number;
  afternoonCommits: number;
  eveningCommits: number;
  lateNightCommits: number;
  weekendCommits: number;
} {
  const result = {
    morningCommits: 0,
    afternoonCommits: 0,
    eveningCommits: 0,
    lateNightCommits: 0,
    weekendCommits: 0
  };

  commits.forEach(commit => {
    const date = new Date(commit.createdAt);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Categorize by time of day
    if (hour >= 6 && hour < 12) {
      result.morningCommits++;
    } else if (hour >= 12 && hour < 18) {
      result.afternoonCommits++;
    } else if (hour >= 18 && hour < 24) {
      result.eveningCommits++;
    } else {
      result.lateNightCommits++;
    }

    // Check for weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      result.weekendCommits++;
    }
  });

  return result;
}

function calculatePRMetrics(
  todayPRs: Schema['PullRequest']['type'][],
  allPRs: Schema['PullRequest']['type'][]
): {
  prsOpened: number;
  prsReviewed: number;
  prsMerged: number;
  averagePrSize: number;
  prVelocity: number;
} {
  const prsOpened = todayPRs.filter(pr => pr.state === 'open').length;
  const prsMerged = todayPRs.filter(pr => pr.mergedAt).length;
  
  // For reviewed PRs, we'd need review data - using a placeholder
  const prsReviewed = todayPRs.filter(pr => pr.reviewStatus === 'approved').length;

  // Calculate average PR size (would need diff data in real implementation)
  // Using a mock calculation based on PR metadata
  const averagePrSize = todayPRs.length > 0 
    ? Math.floor(Math.random() * 300) + 50 // Mock: 50-350 lines
    : 0;

  // Calculate PR velocity (PRs completed per day over last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPRs = allPRs.filter(pr => 
    new Date(pr.mergedAt || pr.closedAt || '').getTime() > sevenDaysAgo.getTime()
  );
  const prVelocity = recentPRs.length / 7;

  return {
    prsOpened,
    prsReviewed,
    prsMerged,
    averagePrSize,
    prVelocity
  };
}

function calculateFocusMetrics(
  sessions: { start: Date; end: Date; duration: number }[]
): {
  averageDuration: number;
  longestDuration: number;
} {
  if (sessions.length === 0) {
    return { averageDuration: 0, longestDuration: 0 };
  }

  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const averageDuration = totalDuration / sessions.length;
  const longestDuration = Math.max(...sessions.map(s => s.duration));

  return { averageDuration, longestDuration };
}

function getActivityTimeRange(
  activities: Schema['Activity']['type'][]
): {
  first: string | null;
  last: string | null;
} {
  if (activities.length === 0) {
    return { first: null, last: null };
  }

  const sorted = [...activities].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const first = new Date(sorted[0].createdAt);
  const last = new Date(sorted[sorted.length - 1].createdAt);

  return {
    first: `${first.getHours().toString().padStart(2, '0')}:${first.getMinutes().toString().padStart(2, '0')}`,
    last: `${last.getHours().toString().padStart(2, '0')}:${last.getMinutes().toString().padStart(2, '0')}`
  };
}

function calculateConsecutiveWorkDays(
  currentDate: Date,
  previousMetrics: Schema['DeveloperWellnessMetrics']['type'][]
): number {
  let consecutiveDays = 1; // Current day
  const checkDate = new Date(currentDate);
  checkDate.setDate(checkDate.getDate() - 1);

  // Look backwards to count consecutive days
  while (checkDate >= new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayMetrics = previousMetrics.find(m => m.date === dateStr);

    if (dayMetrics && dayMetrics.totalCommits > 0) {
      consecutiveDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return consecutiveDays;
}

function findLastDayOff(
  currentDate: Date,
  previousMetrics: Schema['DeveloperWellnessMetrics']['type'][]
): string | null {
  const checkDate = new Date(currentDate);
  checkDate.setDate(checkDate.getDate() - 1);

  // Look backwards to find last day with no activity
  while (checkDate >= new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const dayMetrics = previousMetrics.find(m => m.date === dateStr);

    if (!dayMetrics || dayMetrics.totalCommits === 0) {
      return dateStr;
    }

    checkDate.setDate(checkDate.getDate() - 1);
  }

  return null;
}

export function generateMockWellnessData(userId: string, days: number = 30): Schema['DeveloperWellnessMetrics']['type'][] {
  const metrics: Schema['DeveloperWellnessMetrics']['type'][] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    // Generate realistic patterns
    const baseHours = isWeekend ? 2 : 8;
    const variance = (Math.random() - 0.5) * 4;
    const codingHours = Math.max(0, baseHours + variance);
    
    const focusSessions = Math.floor(Math.random() * 4) + (isWeekend ? 0 : 1);
    const avgFocusDuration = focusSessions > 0 ? 45 + Math.random() * 60 : 0;

    // Calculate scores with some randomness
    const burnoutRiskScore = Math.min(100, Math.max(0, 
      30 + (codingHours - 8) * 10 + (isWeekend ? 20 : 0) + (Math.random() - 0.5) * 20
    ));
    
    const workLifeBalanceScore = Math.min(100, Math.max(0,
      100 - burnoutRiskScore + (Math.random() - 0.5) * 20
    ));
    
    const focusScore = Math.min(100, Math.max(0,
      focusSessions * 20 + (avgFocusDuration / 90) * 40 + (Math.random() - 0.5) * 20
    ));

    metrics.push({
      id: `${userId}-${dateStr}`,
      userId,
      date: dateStr,
      codingHours,
      breakTime: codingHours * 0.2,
      focusSessions,
      averageFocusDuration: avgFocusDuration,
      longestFocusDuration: avgFocusDuration * 1.5,
      totalCommits: Math.floor(Math.random() * 20) + (isWeekend ? 0 : 5),
      morningCommits: isWeekend ? 0 : Math.floor(Math.random() * 5),
      afternoonCommits: isWeekend ? 0 : Math.floor(Math.random() * 8),
      eveningCommits: Math.floor(Math.random() * 5),
      lateNightCommits: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0,
      weekendCommits: isWeekend ? Math.floor(Math.random() * 10) : 0,
      prsOpened: Math.floor(Math.random() * 3),
      prsReviewed: Math.floor(Math.random() * 5),
      prsMerged: Math.floor(Math.random() * 2),
      averagePrSize: 150 + Math.random() * 200,
      prVelocity: 1.5 + Math.random(),
      firstActivityTime: isWeekend ? null : `${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      lastActivityTime: isWeekend ? null : `${17 + Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      consecutiveWorkDays: i === 0 ? 1 : Math.min(i + 1, Math.floor(Math.random() * 10) + 1),
      lastDayOff: null,
      burnoutRiskScore,
      workLifeBalanceScore,
      focusScore,
      rawActivityData: {},
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      __typename: 'DeveloperWellnessMetrics' as const,
      user: null
    });
  }

  return metrics;
}