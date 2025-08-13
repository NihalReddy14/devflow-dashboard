import { 
  CommitPattern, 
  CommitActivity, 
  PRVelocity, 
  ReviewMetrics, 
  DeveloperStats,
  ProductivityMetrics,
  TimeRange 
} from '@/app/types/analytics';
import { 
  startOfWeek, 
  endOfWeek, 
  format, 
  differenceInHours,
  subWeeks,
  parseISO
} from 'date-fns';
import { githubCache, GitHubCache } from './githubCache';

const GITHUB_API_URL = 'https://api.github.com';

async function fetchWithAuth(url: string, token?: string) {
  // Check cache first
  const cacheKey = GitHubCache.generateKey(url);
  const cached = githubCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  // Only add authorization if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, { headers });

  if (!response.ok) {
    // Handle rate limiting
    if (response.status === 403) {
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining === '0') {
        throw new Error('GitHub API rate limit exceeded. Please try again later or authenticate.');
      }
    }
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Cache successful responses
  githubCache.set(cacheKey, data);
  
  return data;
}

export async function fetchCommitPatterns(
  owner: string,
  repo: string,
  token?: string,
  username?: string
): Promise<CommitPattern[]> {
  const patterns: Map<string, CommitPattern> = new Map();
  
  // Fetch commits from last 90 days
  const since = new Date();
  since.setDate(since.getDate() - 90);
  
  let page = 1;
  let hasMore = true;
  
  while (hasMore && page <= 2) { // Limit to 2 pages for public API
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/commits?since=${since.toISOString()}&per_page=100&page=${page}`;
    const commits = await fetchWithAuth(url, token);
    
    if (commits.length === 0) {
      hasMore = false;
      break;
    }
    
    commits.forEach((commit: any) => {
      if (username && commit.author?.login !== username) return;
      
      const date = new Date(commit.commit.author.date);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${hour}-${dayOfWeek}`;
      
      const existing = patterns.get(key) || { hour, dayOfWeek, count: 0 };
      existing.count++;
      patterns.set(key, existing);
    });
    
    page++;
  }
  
  return Array.from(patterns.values());
}

export async function fetchWeeklyActivity(
  owner: string,
  repo: string,
  token?: string,
  weeks: number = 12
): Promise<CommitActivity[]> {
  const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/stats/commit_activity`;
  const data = await fetchWithAuth(url, token);
  
  // Check if data is valid array
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('GitHub stats API returned invalid data, using empty array');
    return [];
  }
  
  // GitHub returns last 52 weeks, we'll take the most recent
  const recentWeeks = data.slice(-weeks);
  
  return recentWeeks.map((week: any) => ({
    date: format(new Date(week.week * 1000), 'MMM dd'),
    count: week.total,
    additions: week.additions || 0,
    deletions: week.deletions || 0
  }));
}

export async function fetchPRVelocity(
  owner: string,
  repo: string,
  token?: string,
  weeks: number = 8
): Promise<PRVelocity[]> {
  const velocityData: PRVelocity[] = [];
  
  for (let i = 0; i < weeks; i++) {
    const weekStart = startOfWeek(subWeeks(new Date(), i));
    const weekEnd = endOfWeek(subWeeks(new Date(), i));
    
    // Fetch PRs created this week
    const createdUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls?state=all&created=${weekStart.toISOString()}..${weekEnd.toISOString()}`;
    const createdPRs = await fetchWithAuth(createdUrl, token);
    
    let merged = 0;
    let closed = 0;
    let totalMergeTime = 0;
    let mergeCount = 0;
    
    createdPRs.forEach((pr: any) => {
      if (pr.merged_at) {
        merged++;
        const mergeTime = differenceInHours(
          new Date(pr.merged_at),
          new Date(pr.created_at)
        );
        totalMergeTime += mergeTime;
        mergeCount++;
      } else if (pr.closed_at) {
        closed++;
      }
    });
    
    velocityData.push({
      week: format(weekStart, 'MMM dd'),
      created: createdPRs.length,
      merged,
      closed,
      avgTimeToMerge: mergeCount > 0 ? totalMergeTime / mergeCount : 0
    });
  }
  
  return velocityData.reverse();
}

export async function fetchReviewMetrics(
  owner: string,
  repo: string,
  token?: string,
  limit: number = 20
): Promise<ReviewMetrics[]> {
  const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls?state=all&per_page=${limit}&sort=created&direction=desc`;
  const prs = await fetchWithAuth(url, token);
  
  const metrics: ReviewMetrics[] = [];
  
  for (const pr of prs.slice(0, 10)) { // Limit to 10 PRs to reduce API calls
    // Skip detailed fetches for public API to reduce rate limit
    const reviews: any[] = [];
    const comments: any[] = [];
    
    let timeToFirstReview = null;
    if (reviews.length > 0) {
      const firstReview = reviews.sort((a: any, b: any) => 
        new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
      )[0];
      timeToFirstReview = differenceInHours(
        new Date(firstReview.submitted_at),
        new Date(pr.created_at)
      );
    }
    
    const timeToMerge = pr.merged_at ? 
      differenceInHours(new Date(pr.merged_at), new Date(pr.created_at)) : 
      null;
    
    metrics.push({
      prNumber: pr.number,
      title: pr.title,
      createdAt: pr.created_at,
      mergedAt: pr.merged_at,
      closedAt: pr.closed_at,
      timeToFirstReview,
      timeToMerge,
      reviewCount: reviews.length,
      commentCount: comments.length,
      author: pr.user.login
    });
  }
  
  return metrics;
}

export async function fetchDeveloperStats(
  owner: string,
  repo: string,
  token?: string,
  topN: number = 3
): Promise<DeveloperStats[]> {
  // Fetch contributors
  const contributorsUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/contributors?per_page=${topN}`;
  const contributors = await fetchWithAuth(contributorsUrl, token);
  
  const stats: DeveloperStats[] = [];
  
  for (const contributor of contributors) {
    // Fetch user's commits
    const commitsUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/commits?author=${contributor.login}&per_page=100`;
    const commits = await fetchWithAuth(commitsUrl, token);
    
    // Fetch user's PRs
    const prsUrl = `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls?state=all&creator=${contributor.login}`;
    const prs = await fetchWithAuth(prsUrl, token);
    
    // Calculate commit patterns
    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<number, number>();
    
    commits.forEach((commit: any) => {
      const date = new Date(commit.commit.author.date);
      const hour = date.getHours();
      const day = date.getDay();
      
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    });
    
    // Find most active hour and day
    let mostActiveHour = 0;
    let maxHourCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        mostActiveHour = hour;
      }
    });
    
    let mostActiveDay = 0;
    let maxDayCount = 0;
    dayCounts.forEach((count, day) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostActiveDay = day;
      }
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Calculate average PR merge time
    let totalMergeTime = 0;
    let mergedCount = 0;
    
    prs.forEach((pr: any) => {
      if (pr.merged_at) {
        const mergeTime = differenceInHours(
          new Date(pr.merged_at),
          new Date(pr.created_at)
        );
        totalMergeTime += mergeTime;
        mergedCount++;
      }
    });
    
    stats.push({
      username: contributor.login,
      avatarUrl: contributor.avatar_url,
      totalCommits: commits.length,
      totalPRs: prs.length,
      totalReviews: 0, // Would need additional API calls
      avgPRMergeTime: mergedCount > 0 ? totalMergeTime / mergedCount : 0,
      codeAdditions: 0, // Would need to fetch commit details
      codeDeletions: 0, // Would need to fetch commit details
      mostActiveHour,
      mostActiveDay: dayNames[mostActiveDay]
    });
  }
  
  return stats;
}

export async function fetchProductivityMetrics(
  owner: string,
  repo: string,
  token?: string,
  username?: string
): Promise<ProductivityMetrics> {
  const [
    commitPatterns,
    weeklyActivity,
    prVelocity,
    reviewMetrics,
    topContributors
  ] = await Promise.all([
    fetchCommitPatterns(owner, repo, token, username),
    fetchWeeklyActivity(owner, repo, token),
    fetchPRVelocity(owner, repo, token),
    fetchReviewMetrics(owner, repo, token),
    fetchDeveloperStats(owner, repo, token)
  ]);
  
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