import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchProductivityMetrics } from '@/app/utils/githubAnalytics';
import { fetchMinimalProductivityMetrics } from '@/app/utils/githubAnalyticsLite';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing owner or repo parameter' },
        { status: 400 }
      );
    }
    
    // Check if user is authenticated
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('github_token');
    
    let data;
    
    if (tokenCookie) {
      // User is authenticated, fetch with token
      try {
        data = await fetchProductivityMetrics(
          owner,
          repo,
          tokenCookie.value
        );
      } catch (error) {
        console.error('Error fetching with token:', error);
        // Fallback to public API
        data = await fetchMinimalProductivityMetrics(owner, repo);
      }
    } else {
      // No auth, use public API
      data = await fetchMinimalProductivityMetrics(owner, repo);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}