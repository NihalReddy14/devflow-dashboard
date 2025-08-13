export interface CommitPattern {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface CommitActivity {
  date: string;
  count: number;
  additions: number;
  deletions: number;
}

export interface PRVelocity {
  week: string;
  created: number;
  merged: number;
  closed: number;
  avgTimeToMerge: number; // in hours
}

export interface ReviewMetrics {
  prNumber: number;
  title: string;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  timeToFirstReview: number | null; // in hours
  timeToMerge: number | null; // in hours
  reviewCount: number;
  commentCount: number;
  author: string;
}

export interface DeveloperStats {
  username: string;
  avatarUrl: string;
  totalCommits: number;
  totalPRs: number;
  totalReviews: number;
  avgPRMergeTime: number; // in hours
  codeAdditions: number;
  codeDeletions: number;
  mostActiveHour: number;
  mostActiveDay: string;
}

export interface ProductivityMetrics {
  commitPatterns: CommitPattern[];
  weeklyActivity: CommitActivity[];
  prVelocity: PRVelocity[];
  reviewMetrics: ReviewMetrics[];
  topContributors: DeveloperStats[];
  teamStats: {
    totalCommits: number;
    totalPRs: number;
    avgPRMergeTime: number;
    totalCodeChanges: number;
    activeDevelopers: number;
  };
}

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export type ViewMode = 'personal' | 'team';
export type ChartType = 'commits' | 'prs' | 'reviews' | 'activity';