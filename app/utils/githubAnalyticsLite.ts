// Lightweight version that makes minimal API calls
import { ProductivityMetrics } from '@/app/types/analytics';
import { generateMockAnalyticsData } from './mockAnalyticsData';
import { githubCache, GitHubCache } from './githubCache';
import { format, subWeeks } from 'date-fns';

const GITHUB_API_URL = 'https://api.github.com';

async function fetchMinimal(url: string): Promise<any> {
  const cacheKey = GitHubCache.generateKey(url);
  const cached = githubCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    githubCache.set(cacheKey, data, 10 * 60 * 1000); // Cache for 10 minutes
    return data;
  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
}

export async function fetchMinimalProductivityMetrics(
  owner: string,
  repo: string
): Promise<ProductivityMetrics> {
  try {
    // Fetch only the most essential data
    const [repoInfo, contributors, recentPRs] = await Promise.all([
      fetchMinimal(`${GITHUB_API_URL}/repos/${owner}/${repo}`),
      fetchMinimal(`${GITHUB_API_URL}/repos/${owner}/${repo}/contributors?per_page=5`),
      fetchMinimal(`${GITHUB_API_URL}/repos/${owner}/${repo}/pulls?state=all&per_page=10&sort=created&direction=desc`)
    ]);

    // Start with empty data structure
    const baseData: ProductivityMetrics = {
      commitPatterns: [],
      weeklyActivity: [],
      prVelocity: [],
      reviewMetrics: [],
      topContributors: [],
      teamStats: {
        totalCommits: 0,
        totalPRs: 0,
        avgPRMergeTime: 0,
        totalCodeChanges: 0,
        activeDevelopers: 0
      }
    };

    // Enhance with real data
    const enhancedData: ProductivityMetrics = {
      ...baseData,
      topContributors: contributors.slice(0, 5).map((contrib: any) => ({
        username: contrib.login,
        avatarUrl: contrib.avatar_url,
        totalCommits: contrib.contributions,
        totalPRs: 0, // Will be calculated from actual PRs
        totalReviews: 0, // Would need separate API call
        avgPRMergeTime: 0, // Will be calculated from PRs
        codeAdditions: 0, // Would need commit details
        codeDeletions: 0, // Would need commit details
        mostActiveHour: 0,
        mostActiveDay: 'Unknown'
      })),
      reviewMetrics: recentPRs.map((pr: any) => ({
        prNumber: pr.number,
        title: pr.title,
        createdAt: pr.created_at,
        mergedAt: pr.merged_at,
        closedAt: pr.closed_at,
        timeToFirstReview: null, // Would need review API
        timeToMerge: pr.merged_at ? 
          (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60) : 
          null,
        reviewCount: 0, // Would need review API
        commentCount: pr.comments || 0,
        author: pr.user.login
      })),
      teamStats: {
        totalCommits: contributors.reduce((sum: number, c: any) => sum + c.contributions, 0),
        totalPRs: recentPRs.length,
        avgPRMergeTime: 0, // Will be calculated below
        totalCodeChanges: 0, // Would need commit details
        activeDevelopers: contributors.length
      }
    };

    // Calculate average PR merge time
    const mergedPRs = recentPRs.filter((pr: any) => pr.merged_at);
    if (mergedPRs.length > 0) {
      const totalMergeTime = mergedPRs.reduce((sum: number, pr: any) => {
        const mergeTime = (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60);
        return sum + mergeTime;
      }, 0);
      enhancedData.teamStats.avgPRMergeTime = totalMergeTime / mergedPRs.length;
    }

    return enhancedData;
  } catch (error) {
    console.error('Failed to fetch GitHub data, using mock data:', error);
    return generateMockAnalyticsData();
  }
}