import { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || '',
      region: process.env.AWS_REGION || 'us-east-1',
      defaultAuthMode: 'iam'
    }
  }
}, { ssr: true });

const client = generateClient<Schema>({
  authMode: 'iam'
});

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  draft: boolean;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  labels: Array<{ name: string }>;
  assignees: Array<{ login: string }>;
}

export const handler = async (event: any) => {
  const { userId, githubToken } = event;

  if (!userId || !githubToken) {
    throw new Error('Missing required parameters');
  }

  try {
    // Fetch user's repositories
    const reposResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!reposResponse.ok) {
      throw new Error(`GitHub API error: ${reposResponse.statusText}`);
    }

    const repos: GitHubRepo[] = await reposResponse.json();

    // Sync repositories
    for (const repo of repos) {
      // Check if repository exists
      const existingRepos = await client.models.Repository.list({
        filter: {
          githubId: { eq: repo.id.toString() },
          userId: { eq: userId }
        }
      });

      const repoData = {
        userId,
        githubId: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        isPrivate: repo.private,
        defaultBranch: repo.default_branch,
        language: repo.language || '',
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        openIssuesCount: repo.open_issues_count,
        lastSyncedAt: new Date().toISOString(),
      };

      let repositoryId: string;

      if (existingRepos.data.length > 0) {
        // Update existing repository
        const updated = await client.models.Repository.update({
          id: existingRepos.data[0].id,
          ...repoData
        });
        repositoryId = updated.data!.id;
      } else {
        // Create new repository
        const created = await client.models.Repository.create(repoData);
        repositoryId = created.data!.id;
      }

      // Fetch pull requests for this repository
      const prsResponse = await fetch(
        `https://api.github.com/repos/${repo.full_name}/pulls?state=all&per_page=50`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (prsResponse.ok) {
        const prs: GitHubPR[] = await prsResponse.json();

        for (const pr of prs) {
          // Check if PR exists
          const existingPRs = await client.models.PullRequest.list({
            filter: {
              githubId: { eq: pr.id },
              repositoryId: { eq: repositoryId }
            }
          });

          const prData = {
            userId,
            repositoryId,
            githubId: pr.id,
            number: pr.number,
            title: pr.title,
            state: pr.state,
            draft: pr.draft || false,
            authorUsername: pr.user.login,
            authorAvatarUrl: pr.user.avatar_url,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            closedAt: pr.closed_at,
            mergedAt: pr.merged_at,
            headRef: pr.head.ref,
            baseRef: pr.base.ref,
            labels: pr.labels.map(l => l.name),
            assignees: pr.assignees.map(a => a.login),
          };

          if (existingPRs.data.length > 0) {
            // Update existing PR
            await client.models.PullRequest.update({
              id: existingPRs.data[0].id,
              ...prData
            });
          } else {
            // Create new PR
            await client.models.PullRequest.create(prData);

            // Create activity for new PR
            await client.models.Activity.create({
              userId,
              repositoryId,
              type: 'pr_opened',
              title: `New PR: ${pr.title}`,
              description: `${pr.user.login} opened PR #${pr.number} in ${repo.name}`,
              metadata: JSON.stringify({
                prNumber: pr.number,
                prTitle: pr.title,
                repoName: repo.name,
                authorUsername: pr.user.login,
                authorAvatarUrl: pr.user.avatar_url,
              }),
              createdAt: pr.created_at,
            });
          }
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'GitHub data synced successfully',
        reposCount: repos.length 
      }),
    };
  } catch (error) {
    console.error('Error syncing GitHub data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to sync GitHub data' }),
    };
  }
};