import { 
  ProductivityMetrics,
  CommitPattern,
  CommitActivity,
  PRVelocity,
  ReviewMetrics,
  DeveloperStats
} from '@/app/types/analytics';
import { format, subWeeks, subDays } from 'date-fns';

// Generate realistic mock data for analytics
export function generateMockAnalyticsData(): ProductivityMetrics {
  // Generate commit patterns (hour/day heatmap)
  const commitPatterns: CommitPattern[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let day = 0; day < 7; day++) {
      // More commits during working hours (9-18) on weekdays
      const isWorkingHour = hour >= 9 && hour <= 18;
      const isWeekday = day >= 1 && day <= 5;
      const baseCount = isWorkingHour && isWeekday ? 5 : 1;
      const randomMultiplier = Math.random() * 3;
      
      commitPatterns.push({
        hour,
        dayOfWeek: day,
        count: Math.floor(baseCount * randomMultiplier)
      });
    }
  }

  // Generate weekly activity
  const weeklyActivity: CommitActivity[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = subWeeks(new Date(), i);
    const count = Math.floor(Math.random() * 50) + 20;
    weeklyActivity.push({
      date: format(date, 'MMM dd'),
      count,
      additions: Math.floor(count * (Math.random() * 100 + 50)),
      deletions: Math.floor(count * (Math.random() * 50 + 10))
    });
  }

  // Generate PR velocity
  const prVelocity: PRVelocity[] = [];
  for (let i = 7; i >= 0; i--) {
    const week = subWeeks(new Date(), i);
    const created = Math.floor(Math.random() * 15) + 5;
    const merged = Math.floor(created * 0.7);
    const closed = created - merged;
    
    prVelocity.push({
      week: format(week, 'MMM dd'),
      created,
      merged,
      closed,
      avgTimeToMerge: Math.random() * 48 + 12 // 12-60 hours
    });
  }

  // Generate review metrics
  const reviewMetrics: ReviewMetrics[] = [];
  const prTitles = [
    'Add user authentication',
    'Fix memory leak in dashboard',
    'Update dependencies',
    'Implement real-time notifications',
    'Refactor API client',
    'Add unit tests for components',
    'Optimize bundle size',
    'Fix TypeScript errors',
    'Add dark mode support',
    'Improve error handling'
  ];

  for (let i = 0; i < 10; i++) {
    const createdAt = subDays(new Date(), Math.floor(Math.random() * 30));
    const isMerged = Math.random() > 0.3;
    const mergedAt = isMerged ? new Date(createdAt.getTime() + Math.random() * 86400000 * 3) : null;
    
    reviewMetrics.push({
      prNumber: 100 - i,
      title: prTitles[i],
      createdAt: createdAt.toISOString(),
      mergedAt: mergedAt?.toISOString() || null,
      closedAt: mergedAt?.toISOString() || null,
      timeToFirstReview: Math.random() * 24,
      timeToMerge: mergedAt ? Math.random() * 72 + 12 : null,
      reviewCount: Math.floor(Math.random() * 5) + 1,
      commentCount: Math.floor(Math.random() * 10),
      author: ['NihalReddy14', 'contributor1', 'contributor2'][Math.floor(Math.random() * 3)]
    });
  }

  // Generate developer stats
  const developers = ['NihalReddy14', 'JohnDoe', 'JaneSmith', 'BobJohnson', 'AliceWilliams'];
  const topContributors: DeveloperStats[] = developers.map((username, index) => ({
    username,
    avatarUrl: `https://github.com/${username}.png`,
    totalCommits: Math.floor(Math.random() * 200) + 50,
    totalPRs: Math.floor(Math.random() * 50) + 10,
    totalReviews: Math.floor(Math.random() * 30) + 5,
    avgPRMergeTime: Math.random() * 48 + 12,
    codeAdditions: Math.floor(Math.random() * 10000) + 1000,
    codeDeletions: Math.floor(Math.random() * 5000) + 500,
    mostActiveHour: Math.floor(Math.random() * 10) + 9, // 9-18
    mostActiveDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)]
  }));

  // Calculate team stats
  const teamStats = {
    totalCommits: weeklyActivity.reduce((sum, week) => sum + week.count, 0),
    totalPRs: prVelocity.reduce((sum, week) => sum + week.created, 0),
    avgPRMergeTime: prVelocity.reduce((sum, week) => sum + week.avgTimeToMerge, 0) / prVelocity.length,
    totalCodeChanges: weeklyActivity.reduce((sum, week) => sum + week.additions + week.deletions, 0),
    activeDevelopers: topContributors.length
  };

  return {
    commitPatterns,
    weeklyActivity,
    prVelocity,
    reviewMetrics,
    topContributors,
    teamStats
  };
}