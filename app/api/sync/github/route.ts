import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('github_token');
    const userCookie = cookieStore.get('github_user');

    if (!tokenCookie || !userCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const githubToken = tokenCookie.value;
    const user = JSON.parse(userCookie.value);

    // Fetch user's repositories
    const reposResponse = await fetch('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const repositories = await reposResponse.json();

    // Fetch pull requests for each repository
    const pullRequestsPromises = repositories.map(async (repo: any) => {
      const prsResponse = await fetch(`https://api.github.com/repos/${repo.full_name}/pulls?state=all&per_page=10`, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!prsResponse.ok) {
        console.error(`Failed to fetch PRs for ${repo.full_name}`);
        return [];
      }

      const prs = await prsResponse.json();
      return prs.map((pr: any) => ({
        ...pr,
        repository: {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
        },
      }));
    });

    const allPullRequests = (await Promise.all(pullRequestsPromises)).flat();

    return NextResponse.json({
      success: true,
      data: {
        repositories: repositories.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          private: repo.private,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          default_branch: repo.default_branch,
        })),
        pullRequests: allPullRequests.map((pr: any) => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          state: pr.state,
          draft: pr.draft,
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          closed_at: pr.closed_at,
          merged_at: pr.merged_at,
          author: {
            login: pr.user.login,
            avatar_url: pr.user.avatar_url,
          },
          head: {
            ref: pr.head.ref,
          },
          base: {
            ref: pr.base.ref,
          },
          repository: pr.repository,
        })),
        user: {
          id: user.id,
          login: user.login,
          email: user.email,
          avatar_url: user.avatar_url,
        },
      },
    });
  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync GitHub data' },
      { status: 500 }
    );
  }
}