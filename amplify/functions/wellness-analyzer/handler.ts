import type { DynamoDBStreamHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface WellnessMetrics {
  userId: string;
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
  firstActivityTime: string;
  lastActivityTime: string;
  consecutiveWorkDays: number;
  lastDayOff: string;
  burnoutRiskScore: number;
  workLifeBalanceScore: number;
  focusScore: number;
}

interface WellnessInsight {
  userId: string;
  teamId?: string;
  type: 'tip' | 'warning' | 'achievement' | 'recommendation';
  category: 'burnout' | 'focus' | 'balance' | 'productivity' | 'health';
  severity?: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionItems?: string[];
  relatedMetrics?: any;
  isRead: boolean;
  isDismissed: boolean;
  validUntil?: string;
}

export const handler: DynamoDBStreamHandler = async (event) => {
  console.log('Processing wellness metrics stream:', JSON.stringify(event.Records.length));

  for (const record of event.Records) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      if (record.dynamodb?.NewImage) {
        const newImage = unmarshall(record.dynamodb.NewImage as any) as any;
        
        // Check if this is a DeveloperWellnessMetrics record
        if (newImage.__typename === 'DeveloperWellnessMetrics') {
          await analyzeWellnessMetrics(newImage as WellnessMetrics);
        }
      }
    }
  }
};

async function analyzeWellnessMetrics(metrics: WellnessMetrics) {
  const insights: WellnessInsight[] = [];
  
  // Calculate burnout risk score
  const burnoutScore = calculateBurnoutRiskScore(metrics);
  
  // Generate insights based on metrics
  insights.push(...generateBurnoutInsights(metrics, burnoutScore));
  insights.push(...generateFocusInsights(metrics));
  insights.push(...generateWorkLifeBalanceInsights(metrics));
  insights.push(...generateProductivityInsights(metrics));
  insights.push(...generateHealthInsights(metrics));
  
  // Save insights to DynamoDB
  for (const insight of insights) {
    await saveInsight(insight);
  }
  
  // Update metrics with calculated scores
  await updateMetricsScores(metrics.userId, metrics.date, {
    burnoutRiskScore: burnoutScore,
    workLifeBalanceScore: calculateWorkLifeBalanceScore(metrics),
    focusScore: calculateFocusScore(metrics)
  });
}

function calculateBurnoutRiskScore(metrics: WellnessMetrics): number {
  let score = 0;
  
  // Excessive coding hours (max 30 points)
  if (metrics.codingHours > 12) score += 30;
  else if (metrics.codingHours > 10) score += 20;
  else if (metrics.codingHours > 8) score += 10;
  
  // Insufficient breaks (max 20 points)
  const breakRatio = metrics.breakTime / metrics.codingHours;
  if (breakRatio < 0.1) score += 20;
  else if (breakRatio < 0.2) score += 10;
  
  // Late night work (max 15 points)
  if (metrics.lateNightCommits > 5) score += 15;
  else if (metrics.lateNightCommits > 0) score += 10;
  
  // Weekend work (max 15 points)
  if (metrics.weekendCommits > 10) score += 15;
  else if (metrics.weekendCommits > 5) score += 10;
  else if (metrics.weekendCommits > 0) score += 5;
  
  // Consecutive work days (max 20 points)
  if (metrics.consecutiveWorkDays > 14) score += 20;
  else if (metrics.consecutiveWorkDays > 10) score += 15;
  else if (metrics.consecutiveWorkDays > 7) score += 10;
  
  return Math.min(100, score);
}

function calculateWorkLifeBalanceScore(metrics: WellnessMetrics): number {
  let score = 100;
  
  // Deduct for excessive hours
  if (metrics.codingHours > 10) score -= 20;
  else if (metrics.codingHours > 8) score -= 10;
  
  // Deduct for insufficient breaks
  const breakRatio = metrics.breakTime / metrics.codingHours;
  if (breakRatio < 0.15) score -= 20;
  else if (breakRatio < 0.25) score -= 10;
  
  // Deduct for late night work
  if (metrics.lateNightCommits > 0) score -= 15;
  
  // Deduct for weekend work
  if (metrics.weekendCommits > 5) score -= 15;
  else if (metrics.weekendCommits > 0) score -= 10;
  
  // Deduct for long consecutive work days
  if (metrics.consecutiveWorkDays > 10) score -= 20;
  else if (metrics.consecutiveWorkDays > 7) score -= 10;
  
  return Math.max(0, score);
}

function calculateFocusScore(metrics: WellnessMetrics): number {
  let score = 0;
  
  // Base score from number of focus sessions (max 40 points)
  if (metrics.focusSessions >= 3) score += 40;
  else if (metrics.focusSessions >= 2) score += 30;
  else if (metrics.focusSessions >= 1) score += 20;
  
  // Average focus duration (max 30 points)
  if (metrics.averageFocusDuration >= 90) score += 30;
  else if (metrics.averageFocusDuration >= 60) score += 20;
  else if (metrics.averageFocusDuration >= 45) score += 10;
  
  // Longest focus session (max 30 points)
  if (metrics.longestFocusDuration >= 120) score += 30;
  else if (metrics.longestFocusDuration >= 90) score += 20;
  else if (metrics.longestFocusDuration >= 60) score += 10;
  
  return Math.min(100, score);
}

function generateBurnoutInsights(metrics: WellnessMetrics, burnoutScore: number): WellnessInsight[] {
  const insights: WellnessInsight[] = [];
  
  if (burnoutScore >= 75) {
    insights.push({
      userId: metrics.userId,
      type: 'warning',
      category: 'burnout',
      severity: 'critical',
      title: 'Critical Burnout Risk Detected',
      message: 'Your work patterns indicate a very high risk of burnout. Immediate action is recommended.',
      actionItems: [
        'Take a full day off within the next 2 days',
        'Schedule a meeting with your manager to discuss workload',
        'Set strict work hour boundaries (9 AM - 6 PM)',
        'Enable "Do Not Disturb" mode after work hours'
      ],
      relatedMetrics: {
        burnoutScore,
        codingHours: metrics.codingHours,
        consecutiveWorkDays: metrics.consecutiveWorkDays
      },
      isRead: false,
      isDismissed: false,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } else if (burnoutScore >= 50) {
    insights.push({
      userId: metrics.userId,
      type: 'warning',
      category: 'burnout',
      severity: 'warning',
      title: 'High Burnout Risk',
      message: 'Your recent work patterns show signs of potential burnout. Consider adjusting your schedule.',
      actionItems: [
        'Plan regular breaks throughout your workday',
        'Avoid working late nights and weekends',
        'Practice time-boxing for better work-life separation'
      ],
      relatedMetrics: { burnoutScore },
      isRead: false,
      isDismissed: false
    });
  }
  
  // Specific pattern warnings
  if (metrics.lateNightCommits > 5) {
    insights.push({
      userId: metrics.userId,
      type: 'tip',
      category: 'health',
      title: 'Late Night Coding Detected',
      message: `You made ${metrics.lateNightCommits} commits after midnight. Late night coding can disrupt sleep patterns and reduce productivity.`,
      actionItems: [
        'Set a hard stop time for coding (e.g., 10 PM)',
        'Use blue light filters on your devices',
        'Create a wind-down routine before bed'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  if (metrics.consecutiveWorkDays > 10) {
    insights.push({
      userId: metrics.userId,
      type: 'warning',
      category: 'balance',
      severity: 'warning',
      title: 'No Recent Days Off',
      message: `You've worked ${metrics.consecutiveWorkDays} consecutive days. Regular rest is essential for sustained productivity.`,
      actionItems: [
        'Schedule a day off this week',
        'Plan a weekend without any coding',
        'Set up calendar blocks for personal time'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  return insights;
}

function generateFocusInsights(metrics: WellnessMetrics): WellnessInsight[] {
  const insights: WellnessInsight[] = [];
  
  if (metrics.focusSessions < 2) {
    insights.push({
      userId: metrics.userId,
      type: 'recommendation',
      category: 'focus',
      title: 'Improve Deep Work Sessions',
      message: 'You had fewer than 2 focus sessions today. Deep work is crucial for complex problem-solving.',
      actionItems: [
        'Block 2-3 hours daily for uninterrupted coding',
        'Turn off notifications during focus time',
        'Use the Pomodoro Technique for structured work sessions'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  if (metrics.averageFocusDuration < 45 && metrics.focusSessions > 0) {
    insights.push({
      userId: metrics.userId,
      type: 'tip',
      category: 'productivity',
      title: 'Short Focus Sessions',
      message: 'Your average focus session is under 45 minutes. Longer sessions can improve code quality and productivity.',
      actionItems: [
        'Minimize context switching between tasks',
        'Batch similar activities together',
        'Create a dedicated workspace free from distractions'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  // Achievement for good focus
  if (metrics.focusScore >= 80) {
    insights.push({
      userId: metrics.userId,
      type: 'achievement',
      category: 'focus',
      title: 'Excellent Focus Performance!',
      message: `You achieved a focus score of ${metrics.focusScore}. Your deep work sessions are highly productive!`,
      actionItems: [
        'Share your focus techniques with the team',
        'Document your productive workflow'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  return insights;
}

function generateWorkLifeBalanceInsights(metrics: WellnessMetrics): WellnessInsight[] {
  const insights: WellnessInsight[] = [];
  
  const breakRatio = metrics.breakTime / metrics.codingHours;
  if (breakRatio < 0.15) {
    insights.push({
      userId: metrics.userId,
      type: 'warning',
      category: 'balance',
      title: 'Insufficient Break Time',
      message: "You're taking very few breaks. Regular breaks improve focus and prevent fatigue.",
      actionItems: [
        'Set hourly reminders to stretch and move',
        'Take a 15-minute break every 90 minutes',
        'Go for a short walk during lunch'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  if (metrics.weekendCommits > 10) {
    insights.push({
      userId: metrics.userId,
      type: 'tip',
      category: 'balance',
      title: 'Heavy Weekend Coding',
      message: 'You made significant commits over the weekend. Weekends are important for mental recovery.',
      actionItems: [
        'Plan non-coding activities for weekends',
        'Set boundaries with work projects',
        'Explore hobbies outside of programming'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  // Positive reinforcement
  if (metrics.workLifeBalanceScore >= 80 && metrics.codingHours <= 8) {
    insights.push({
      userId: metrics.userId,
      type: 'achievement',
      category: 'balance',
      title: 'Great Work-Life Balance!',
      message: 'You maintained healthy work hours and took adequate breaks. Keep it up!',
      isRead: false,
      isDismissed: false
    });
  }
  
  return insights;
}

function generateProductivityInsights(metrics: WellnessMetrics): WellnessInsight[] {
  const insights: WellnessInsight[] = [];
  
  if (metrics.prVelocity > 3) {
    insights.push({
      userId: metrics.userId,
      type: 'achievement',
      category: 'productivity',
      title: 'High PR Velocity!',
      message: `You completed ${metrics.prVelocity.toFixed(1)} PRs per day. Great productivity!`,
      actionItems: [
        'Consider mentoring teammates on your workflow',
        'Document your PR best practices'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  if (metrics.averagePrSize > 500) {
    insights.push({
      userId: metrics.userId,
      type: 'recommendation',
      category: 'productivity',
      title: 'Large Pull Requests',
      message: 'Your PRs average over 500 lines. Smaller PRs are easier to review and merge.',
      actionItems: [
        'Break features into smaller, incremental changes',
        'Consider feature flags for gradual rollouts',
        'Aim for PRs under 200 lines when possible'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  return insights;
}

function generateHealthInsights(metrics: WellnessMetrics): WellnessInsight[] {
  const insights: WellnessInsight[] = [];
  
  // Early/late work patterns
  if (metrics.firstActivityTime && parseInt(metrics.firstActivityTime.split(':')[0]) < 6) {
    insights.push({
      userId: metrics.userId,
      type: 'tip',
      category: 'health',
      title: 'Very Early Start Time',
      message: 'Starting work before 6 AM regularly can impact your circadian rhythm.',
      actionItems: [
        "Ensure you're getting 7-8 hours of sleep",
        'Consider adjusting your schedule if feeling tired',
        'Maintain consistent sleep/wake times'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  if (metrics.lastActivityTime && parseInt(metrics.lastActivityTime.split(':')[0]) >= 22) {
    insights.push({
      userId: metrics.userId,
      type: 'tip',
      category: 'health',
      title: 'Late Work Hours',
      message: 'Working past 10 PM can interfere with sleep quality and recovery.',
      actionItems: [
        'Set a firm end time for work',
        'Create an evening routine without screens',
        'Use night mode on devices after sunset'
      ],
      isRead: false,
      isDismissed: false
    });
  }
  
  return insights;
}

async function saveInsight(insight: WellnessInsight) {
  const tableName = process.env.WELLNESS_INSIGHT_TABLE_NAME;
  if (!tableName) {
    console.error('WELLNESS_INSIGHT_TABLE_NAME not set');
    return;
  }
  
  try {
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        ...insight,
        id: `${insight.userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'WellnessInsight'
      }
    }));
  } catch (error) {
    console.error('Error saving insight:', error);
  }
}

async function updateMetricsScores(userId: string, date: string, scores: {
  burnoutRiskScore: number;
  workLifeBalanceScore: number;
  focusScore: number;
}) {
  const tableName = process.env.WELLNESS_METRICS_TABLE_NAME;
  if (!tableName) {
    console.error('WELLNESS_METRICS_TABLE_NAME not set');
    return;
  }
  
  // Note: In a real implementation, you would update the existing record
  // This is a simplified version
  console.log('Would update scores for user:', userId, 'date:', date, 'scores:', scores);
}