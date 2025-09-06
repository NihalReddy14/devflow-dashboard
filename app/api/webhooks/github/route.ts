import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';
import crypto from 'crypto';

const client = generateClient<Schema>();

// Verify GitHub webhook signature
function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-hub-signature-256');
    const event = req.headers.get('x-github-event');
    const body = await req.text();
    
    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    
    // Handle different webhook events
    switch (event) {
      case 'workflow_run':
        await handleWorkflowRun(payload);
        break;
        
      case 'deployment':
        await handleDeployment(payload);
        break;
        
      case 'deployment_status':
        await handleDeploymentStatus(payload);
        break;
        
      case 'pull_request':
        // Already handled by existing sync
        break;
        
      default:
        console.log(`Unhandled webhook event: ${event}`);
    }
    
    return NextResponse.json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleWorkflowRun(payload: any) {
  const { workflow_run, repository } = payload;
  
  // Find the repository in our system
  const repos = await client.models.Repository.list({
    filter: {
      githubId: { eq: repository.id.toString() }
    }
  });
  
  if (repos.data.length === 0) {
    console.log(`Repository not found: ${repository.full_name}`);
    return;
  }
  
  const repositoryId = repos.data[0].id;
  
  // Check if build exists
  const existingBuilds = await client.models.Build.list({
    filter: {
      commitSha: { eq: workflow_run.head_sha },
      repositoryId: { eq: repositoryId },
      runId: { eq: workflow_run.id }
    }
  });
  
  // Calculate duration if completed
  let duration: number | undefined;
  if (workflow_run.conclusion) {
    const start = new Date(workflow_run.created_at).getTime();
    const end = new Date(workflow_run.updated_at).getTime();
    duration = Math.floor((end - start) / 1000);
  }
  
  const buildData = {
    repositoryId,
    commitSha: workflow_run.head_sha,
    branch: workflow_run.head_branch,
    status: workflow_run.status,
    conclusion: workflow_run.conclusion || undefined,
    startedAt: workflow_run.run_started_at,
    completedAt: workflow_run.conclusion ? workflow_run.updated_at : undefined,
    duration,
    url: workflow_run.html_url,
    author: workflow_run.actor.login,
    message: workflow_run.head_commit?.message || '',
    workflowName: workflow_run.name,
    workflowId: workflow_run.workflow_id,
    runNumber: workflow_run.run_number,
    runId: workflow_run.id,
  };
  
  if (existingBuilds.data.length > 0) {
    await client.models.Build.update({
      id: existingBuilds.data[0].id,
      ...buildData
    });
  } else {
    await client.models.Build.create(buildData);
  }
  
  // Create activity for significant events
  if (workflow_run.conclusion === 'failure') {
    await client.models.Activity.create({
      userId: repos.data[0].userId,
      repositoryId,
      type: 'build_failed',
      title: `Build Failed: ${workflow_run.name}`,
      description: `Build failed on ${workflow_run.head_branch}`,
      metadata: JSON.stringify({
        workflowName: workflow_run.name,
        branch: workflow_run.head_branch,
        commitSha: workflow_run.head_sha,
        conclusion: workflow_run.conclusion,
        url: workflow_run.html_url,
      }),
      createdAt: workflow_run.updated_at,
    });
  }
}

async function handleDeployment(payload: any) {
  const { deployment, repository } = payload;
  
  // Find the repository
  const repos = await client.models.Repository.list({
    filter: {
      githubId: { eq: repository.id.toString() }
    }
  });
  
  if (repos.data.length === 0) return;
  
  const repositoryId = repos.data[0].id;
  
  // Create deployment record (status will be updated by deployment_status webhook)
  await client.models.Deployment.create({
    repositoryId,
    environment: deployment.environment || 'production',
    commitSha: deployment.sha,
    branch: deployment.ref,
    status: 'pending',
    deployedBy: deployment.creator.login,
    startedAt: deployment.created_at,
    metadata: JSON.stringify({
      deploymentId: deployment.id,
      description: deployment.description,
      task: deployment.task,
    }),
  });
}

async function handleDeploymentStatus(payload: any) {
  const { deployment_status, deployment, repository } = payload;
  
  // Find the repository
  const repos = await client.models.Repository.list({
    filter: {
      githubId: { eq: repository.id.toString() }
    }
  });
  
  if (repos.data.length === 0) return;
  
  const repositoryId = repos.data[0].id;
  
  // Find the deployment
  const deployments = await client.models.Deployment.list({
    filter: {
      commitSha: { eq: deployment.sha },
      environment: { eq: deployment.environment || 'production' },
      repositoryId: { eq: repositoryId }
    }
  });
  
  if (deployments.data.length === 0) return;
  
  // Update deployment status
  const deploymentRecord = deployments.data[0];
  
  // Calculate duration if completed
  let duration: number | undefined;
  if (deployment_status.state === 'success' || deployment_status.state === 'failure') {
    const start = new Date(deploymentRecord.startedAt).getTime();
    const end = new Date(deployment_status.created_at).getTime();
    duration = Math.floor((end - start) / 1000);
  }
  
  await client.models.Deployment.update({
    id: deploymentRecord.id,
    status: mapDeploymentStatus(deployment_status.state),
    completedAt: deployment_status.state === 'success' || deployment_status.state === 'failure' 
      ? deployment_status.created_at 
      : undefined,
    duration,
    url: deployment_status.target_url || deployment.url,
  });
  
  // Create activity for deployment events
  if (deployment_status.state === 'success') {
    await client.models.Activity.create({
      userId: repos.data[0].userId,
      repositoryId,
      type: 'deployment_success',
      title: `Deployed to ${deployment.environment || 'production'}`,
      description: `Successfully deployed to ${deployment.environment || 'production'}`,
      metadata: JSON.stringify({
        environment: deployment.environment || 'production',
        commitSha: deployment.sha,
        url: deployment_status.target_url,
      }),
      createdAt: deployment_status.created_at,
    });
  } else if (deployment_status.state === 'failure') {
    await client.models.Activity.create({
      userId: repos.data[0].userId,
      repositoryId,
      type: 'deployment_failed',
      title: `Deployment Failed: ${deployment.environment || 'production'}`,
      description: `Deployment to ${deployment.environment || 'production'} failed`,
      metadata: JSON.stringify({
        environment: deployment.environment || 'production',
        commitSha: deployment.sha,
        url: deployment_status.target_url,
      }),
      createdAt: deployment_status.created_at,
    });
  }
}

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