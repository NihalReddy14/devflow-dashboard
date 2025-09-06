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

interface GitHubWorkflowRun {
  id: number;
  workflow_id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  workflow_url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
  run_number: number;
  actor: {
    login: string;
    avatar_url: string;
  };
  head_commit: {
    message: string;
    author: {
      name: string;
      email: string;
    };
  };
}

interface GitHubDeployment {
  id: number;
  ref: string;
  sha: string;
  environment: string | null;
  description: string | null;
  creator: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  url: string;
  task: string;
  payload: any;
}

interface GitHubDeploymentStatus {
  state: string;
  target_url: string | null;
  description: string | null;
  created_at: string;
}

// Helper function to map GitHub deployment status to our status
function mapDeploymentStatus(githubStatus: string): string {
  switch (githubStatus) {
    case 'error':
    case 'failure':
      return 'failure';
    case 'pending':
      return 'pending';
    case 'in_progress':
      return 'in_progress';
    case 'queued':
      return 'pending';
    case 'success':
      return 'success';
    default:
      return 'pending';
  }
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

      // Fetch workflow runs for this repository
      const workflowRunsResponse = await fetch(
        `https://api.github.com/repos/${repo.full_name}/actions/runs?per_page=30`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (workflowRunsResponse.ok) {
        const { workflow_runs }: { workflow_runs: GitHubWorkflowRun[] } = await workflowRunsResponse.json();

        for (const run of workflow_runs) {
          // Check if build exists
          const existingBuilds = await client.models.Build.list({
            filter: {
              commitSha: { eq: run.head_sha },
              repositoryId: { eq: repositoryId }
            }
          });

          // Calculate duration if completed
          let duration: number | undefined;
          if (run.conclusion && run.created_at && run.updated_at) {
            const start = new Date(run.created_at).getTime();
            const end = new Date(run.updated_at).getTime();
            duration = Math.floor((end - start) / 1000); // duration in seconds
          }

          const buildData = {
            repositoryId,
            commitSha: run.head_sha,
            branch: run.head_branch,
            status: run.status,
            conclusion: run.conclusion || undefined,
            startedAt: run.run_started_at,
            completedAt: run.conclusion ? run.updated_at : undefined,
            duration,
            url: run.html_url,
            author: run.actor.login,
            message: run.head_commit?.message || '',
            workflowName: run.name,
            workflowId: run.workflow_id,
            runNumber: run.run_number,
            runId: run.id,
          };

          if (existingBuilds.data.length > 0) {
            // Update existing build
            await client.models.Build.update({
              id: existingBuilds.data[0].id,
              ...buildData
            });
          } else {
            // Create new build
            await client.models.Build.create(buildData);

            // Create activity for build events
            if (run.conclusion === 'failure') {
              await client.models.Activity.create({
                userId,
                repositoryId,
                type: 'build_failed',
                title: `Build Failed: ${run.name}`,
                description: `${run.actor.login}'s build failed on ${run.head_branch}`,
                metadata: JSON.stringify({
                  workflowName: run.name,
                  branch: run.head_branch,
                  commitSha: run.head_sha,
                  conclusion: run.conclusion,
                  url: run.html_url,
                }),
                createdAt: run.updated_at,
              });
            } else if (run.conclusion === 'success' && run.head_branch === repo.default_branch) {
              // Only create activity for successful builds on default branch
              await client.models.Activity.create({
                userId,
                repositoryId,
                type: 'build_success',
                title: `Build Succeeded: ${run.name}`,
                description: `${run.actor.login}'s build succeeded on ${run.head_branch}`,
                metadata: JSON.stringify({
                  workflowName: run.name,
                  branch: run.head_branch,
                  commitSha: run.head_sha,
                  conclusion: run.conclusion,
                  url: run.html_url,
                }),
                createdAt: run.updated_at,
              });
            }
          }
        }
      }

      // Fetch deployment data for production environments
      const deploymentsResponse = await fetch(
        `https://api.github.com/repos/${repo.full_name}/deployments?per_page=20&environment=production`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (deploymentsResponse.ok) {
        const deployments: GitHubDeployment[] = await deploymentsResponse.json();

        for (const deployment of deployments) {
          // Fetch deployment status
          const statusResponse = await fetch(
            `https://api.github.com/repos/${repo.full_name}/deployments/${deployment.id}/statuses?per_page=1`,
            {
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );

          if (statusResponse.ok) {
            const statuses: GitHubDeploymentStatus[] = await statusResponse.json();
            const latestStatus = statuses[0];

            if (latestStatus) {
              // Check if deployment exists
              const existingDeployments = await client.models.Deployment.list({
                filter: {
                  commitSha: { eq: deployment.sha },
                  environment: { eq: deployment.environment || 'production' },
                  repositoryId: { eq: repositoryId }
                }
              });

              // Calculate duration if completed
              let duration: number | undefined;
              if (latestStatus.state === 'success' || latestStatus.state === 'failure') {
                const start = new Date(deployment.created_at).getTime();
                const end = new Date(latestStatus.created_at).getTime();
                duration = Math.floor((end - start) / 1000); // duration in seconds
              }

              // Find associated build
              const builds = await client.models.Build.list({
                filter: {
                  commitSha: { eq: deployment.sha },
                  repositoryId: { eq: repositoryId }
                }
              });

              const deploymentData = {
                repositoryId,
                environment: deployment.environment || 'production',
                commitSha: deployment.sha,
                branch: deployment.ref,
                buildId: builds.data.length > 0 ? builds.data[0].id : undefined,
                status: mapDeploymentStatus(latestStatus.state),
                deployedBy: deployment.creator.login,
                startedAt: deployment.created_at,
                completedAt: latestStatus.state === 'success' || latestStatus.state === 'failure' ? latestStatus.created_at : undefined,
                duration,
                url: latestStatus.target_url || deployment.url,
                metadata: JSON.stringify({
                  deploymentId: deployment.id,
                  description: deployment.description,
                  task: deployment.task,
                  payload: deployment.payload,
                }),
              };

              if (existingDeployments.data.length > 0) {
                // Update existing deployment
                await client.models.Deployment.update({
                  id: existingDeployments.data[0].id,
                  ...deploymentData
                });
              } else {
                // Create new deployment
                await client.models.Deployment.create(deploymentData);

                // Create activity for deployment events
                if (latestStatus.state === 'failure') {
                  await client.models.Activity.create({
                    userId,
                    repositoryId,
                    type: 'deployment_failed',
                    title: `Deployment Failed: ${deployment.environment || 'production'}`,
                    description: `${deployment.creator.login}'s deployment to ${deployment.environment || 'production'} failed`,
                    metadata: JSON.stringify({
                      environment: deployment.environment || 'production',
                      commitSha: deployment.sha,
                      url: latestStatus.target_url,
                    }),
                    createdAt: latestStatus.created_at,
                  });
                } else if (latestStatus.state === 'success') {
                  await client.models.Activity.create({
                    userId,
                    repositoryId,
                    type: 'deployment_success',
                    title: `Deployed to ${deployment.environment || 'production'}`,
                    description: `${deployment.creator.login} successfully deployed to ${deployment.environment || 'production'}`,
                    metadata: JSON.stringify({
                      environment: deployment.environment || 'production',
                      commitSha: deployment.sha,
                      url: latestStatus.target_url,
                    }),
                    createdAt: latestStatus.created_at,
                  });
                }
              }
            }
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