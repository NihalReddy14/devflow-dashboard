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

interface DoraCalculationPeriod {
  repositoryId: string;
  teamId?: string;
  startDate: Date;
  endDate: Date;
  period: 'daily' | 'weekly' | 'monthly';
}

export const handler = async (event: any) => {
  console.log('Starting DORA metrics calculation', event);

  try {
    // Calculate metrics for all repositories
    const repositories = await client.models.Repository.list();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const repo of repositories.data) {
      if (!repo.id) continue;

      // Calculate daily metrics
      await calculateMetricsForPeriod({
        repositoryId: repo.id,
        startDate: yesterday,
        endDate: today,
        period: 'daily'
      });

      // Calculate weekly metrics (on Sundays)
      if (today.getDay() === 0) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        
        await calculateMetricsForPeriod({
          repositoryId: repo.id,
          startDate: weekStart,
          endDate: today,
          period: 'weekly'
        });
      }

      // Calculate monthly metrics (on the 1st)
      if (today.getDate() === 1) {
        const monthStart = new Date(today);
        monthStart.setMonth(monthStart.getMonth() - 1);
        
        await calculateMetricsForPeriod({
          repositoryId: repo.id,
          startDate: monthStart,
          endDate: today,
          period: 'monthly'
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'DORA metrics calculated successfully',
        repositoriesProcessed: repositories.data.length 
      }),
    };
  } catch (error) {
    console.error('Error calculating DORA metrics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to calculate DORA metrics' }),
    };
  }
};

async function calculateMetricsForPeriod(params: DoraCalculationPeriod) {
  const { repositoryId, teamId, startDate, endDate, period } = params;

  // Fetch deployments for the period
  const deployments = await client.models.Deployment.list({
    filter: {
      repositoryId: { eq: repositoryId },
      environment: { eq: 'production' },
      startedAt: { 
        between: [startDate.toISOString(), endDate.toISOString()] 
      }
    }
  });

  // Fetch builds for the period
  const builds = await client.models.Build.list({
    filter: {
      repositoryId: { eq: repositoryId },
      startedAt: { 
        between: [startDate.toISOString(), endDate.toISOString()] 
      }
    }
  });

  // Calculate deployment frequency (deployments per day)
  const daysInPeriod = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const deploymentFrequency = deployments.data.length / daysInPeriod;

  // Calculate change failure rate
  const failedDeployments = deployments.data.filter(d => d.status === 'failure').length;
  const changeFailureRate = deployments.data.length > 0 
    ? (failedDeployments / deployments.data.length) * 100 
    : 0;

  // Calculate lead time (from commit to production)
  let totalLeadTime = 0;
  let leadTimeCount = 0;

  for (const deployment of deployments.data) {
    if (deployment.status === 'success' && deployment.completedAt) {
      // Find the earliest commit time for this deployment
      const relatedBuilds = builds.data.filter(b => b.commitSha === deployment.commitSha);
      
      if (relatedBuilds.length > 0 && relatedBuilds[0].startedAt) {
        const commitTime = new Date(relatedBuilds[0].startedAt).getTime();
        const deployTime = new Date(deployment.completedAt).getTime();
        const leadTime = (deployTime - commitTime) / (1000 * 60); // in minutes
        
        totalLeadTime += leadTime;
        leadTimeCount++;
      }
    }
  }

  const averageLeadTime = leadTimeCount > 0 ? totalLeadTime / leadTimeCount : 0;

  // Calculate MTTR (Mean Time To Restore)
  let totalRestoreTime = 0;
  let restoreCount = 0;

  // Sort deployments by time
  const sortedDeployments = [...deployments.data].sort((a, b) => 
    new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  for (let i = 0; i < sortedDeployments.length; i++) {
    const deployment = sortedDeployments[i];
    
    if (deployment.status === 'failure' && deployment.completedAt) {
      // Look for the next successful deployment
      for (let j = i + 1; j < sortedDeployments.length; j++) {
        const nextDeployment = sortedDeployments[j];
        
        if (nextDeployment.status === 'success' && nextDeployment.completedAt) {
          const failureTime = new Date(deployment.completedAt).getTime();
          const restoreTime = new Date(nextDeployment.completedAt).getTime();
          const timeToRestore = (restoreTime - failureTime) / (1000 * 60); // in minutes
          
          totalRestoreTime += timeToRestore;
          restoreCount++;
          break;
        }
      }
    }
  }

  const mttr = restoreCount > 0 ? totalRestoreTime / restoreCount : 0;

  // Calculate build metrics
  const failedBuilds = builds.data.filter(b => b.conclusion === 'failure').length;
  const successfulBuilds = builds.data.filter(b => b.conclusion === 'success').length;
  
  let totalBuildDuration = 0;
  let buildDurationCount = 0;

  for (const build of builds.data) {
    if (build.duration) {
      totalBuildDuration += build.duration;
      buildDurationCount++;
    }
  }

  const averageBuildDuration = buildDurationCount > 0 
    ? (totalBuildDuration / buildDurationCount) / 60 // convert to minutes
    : 0;

  // Count rollbacks (deployments that reference a rollbackFromId)
  const rollbacks = deployments.data.filter(d => d.rollbackFromId).length;

  // Check if metrics already exist for this date and period
  const dateStr = startDate.toISOString().split('T')[0];
  const existingMetrics = await client.models.DoraMetrics.list({
    filter: {
      repositoryId: { eq: repositoryId },
      date: { eq: dateStr },
      period: { eq: period }
    }
  });

  const metricsData = {
    repositoryId,
    teamId,
    date: dateStr,
    period,
    deploymentFrequency: parseFloat(deploymentFrequency.toFixed(2)),
    leadTimeMinutes: parseFloat(averageLeadTime.toFixed(2)),
    changeFailureRate: parseFloat(changeFailureRate.toFixed(2)),
    mttrMinutes: parseFloat(mttr.toFixed(2)),
    totalDeployments: deployments.data.length,
    successfulDeployments: deployments.data.filter(d => d.status === 'success').length,
    failedDeployments,
    rollbacks,
    totalBuilds: builds.data.length,
    failedBuilds,
    averageBuildDuration: parseFloat(averageBuildDuration.toFixed(2)),
    calculatedAt: new Date().toISOString(),
  };

  if (existingMetrics.data.length > 0) {
    // Update existing metrics
    await client.models.DoraMetrics.update({
      id: existingMetrics.data[0].id,
      ...metricsData
    });
  } else {
    // Create new metrics
    await client.models.DoraMetrics.create(metricsData);
  }

  console.log(`DORA metrics calculated for ${repositoryId} (${period}):`, metricsData);
}