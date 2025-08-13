import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('github_token');
    const userCookie = cookieStore.get('github_user');
    
    if (!tokenCookie || !userCookie) {
      // Return demo activities if not authenticated
      return NextResponse.json({ 
        activities: getDemoActivities() 
      });
    }
    
    const user = JSON.parse(userCookie.value);
    const token = tokenCookie.value;
    
    // Fetch recent events from GitHub
    const response = await fetch(`https://api.github.com/users/${user.username}/events?per_page=30`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub events');
    }
    
    const events = await response.json();
    
    // Transform GitHub events into our activity format
    const activities = events
      .filter((event: any) => {
        // Filter for relevant event types
        return ['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'CreateEvent', 'DeleteEvent', 'PullRequestReviewEvent'].includes(event.type);
      })
      .map((event: any) => {
        return transformGitHubEvent(event);
      })
      .filter(Boolean) // Remove null entries
      .slice(0, 20); // Limit to 20 activities
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ 
      activities: getDemoActivities(),
      error: 'Failed to fetch activities' 
    });
  }
}

function transformGitHubEvent(event: any) {
  const baseActivity = {
    id: event.id,
    createdAt: event.created_at,
    metadata: {
      repoName: event.repo.name.split('/')[1],
      repoFullName: event.repo.name,
      authorUsername: event.actor.login,
      authorAvatarUrl: event.actor.avatar_url
    }
  };
  
  switch (event.type) {
    case 'PushEvent':
      const commitCount = event.payload.commits?.length || 0;
      return {
        ...baseActivity,
        type: 'push',
        title: `Pushed ${commitCount} commit${commitCount !== 1 ? 's' : ''} to ${event.payload.ref.replace('refs/heads/', '')}`,
        description: event.payload.commits?.[0]?.message || 'No commit message'
      };
      
    case 'PullRequestEvent':
      return {
        ...baseActivity,
        type: `pr_${event.payload.action}`,
        title: `${event.payload.action.charAt(0).toUpperCase() + event.payload.action.slice(1)} pull request #${event.payload.pull_request.number}`,
        description: event.payload.pull_request.title
      };
      
    case 'IssuesEvent':
      return {
        ...baseActivity,
        type: `issue_${event.payload.action}`,
        title: `${event.payload.action.charAt(0).toUpperCase() + event.payload.action.slice(1)} issue #${event.payload.issue.number}`,
        description: event.payload.issue.title
      };
      
    case 'CreateEvent':
      if (event.payload.ref_type === 'branch') {
        return {
          ...baseActivity,
          type: 'branch_created',
          title: `Created branch ${event.payload.ref}`,
          description: `New branch in ${event.repo.name}`
        };
      } else if (event.payload.ref_type === 'tag') {
        return {
          ...baseActivity,
          type: 'tag_created',
          title: `Created tag ${event.payload.ref}`,
          description: `New release tag in ${event.repo.name}`
        };
      }
      return null;
      
    case 'DeleteEvent':
      return {
        ...baseActivity,
        type: 'branch_deleted',
        title: `Deleted ${event.payload.ref_type} ${event.payload.ref}`,
        description: `Removed from ${event.repo.name}`
      };
      
    case 'PullRequestReviewEvent':
      return {
        ...baseActivity,
        type: 'pr_reviewed',
        title: `Reviewed pull request #${event.payload.pull_request.number}`,
        description: event.payload.pull_request.title
      };
      
    default:
      return null;
  }
}

function getDemoActivities() {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'pr_opened',
      title: 'Opened pull request #42',
      description: 'Add user authentication system',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      metadata: {
        repoName: 'devflow-dashboard',
        authorUsername: 'demo-user',
        authorAvatarUrl: 'https://github.com/ghost.png'
      }
    },
    {
      id: '2',
      type: 'push',
      title: 'Pushed 3 commits to main',
      description: 'Fix: resolve memory leak in dashboard component',
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      metadata: {
        repoName: 'devflow-dashboard',
        authorUsername: 'demo-user',
        authorAvatarUrl: 'https://github.com/ghost.png'
      }
    },
    {
      id: '3',
      type: 'pr_merged',
      title: 'Merged pull request #41',
      description: 'Update dependencies to latest versions',
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      metadata: {
        repoName: 'devflow-dashboard',
        authorUsername: 'demo-user',
        authorAvatarUrl: 'https://github.com/ghost.png'
      }
    }
  ];
}