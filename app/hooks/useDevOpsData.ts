'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export interface DevOpsStats {
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  averageBuildDuration: number;
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  lastDeployment?: {
    environment: string;
    status: string;
    startedAt: string;
    deployedBy: string;
  };
}

export function useDevOpsData(repositoryId?: string) {
  const [stats, setStats] = useState<DevOpsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchDevOpsData();
  }, [repositoryId]);

  const fetchDevOpsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch builds
      const buildsResponse = await client.models.Build.list({
        filter: repositoryId ? { repositoryId: { eq: repositoryId } } : undefined,
        limit: 1000,
      });

      // Fetch deployments
      const deploymentsResponse = await client.models.Deployment.list({
        filter: repositoryId ? { repositoryId: { eq: repositoryId } } : undefined,
        limit: 100,
      });

      // Calculate stats
      const builds = buildsResponse.data;
      const deployments = deploymentsResponse.data;

      const successfulBuilds = builds.filter(b => b.conclusion === 'success').length;
      const failedBuilds = builds.filter(b => b.conclusion === 'failure').length;
      
      const durations = builds
        .filter(b => b.duration)
        .map(b => b.duration!);
      const averageBuildDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

      const successfulDeployments = deployments.filter(d => d.status === 'success').length;
      const failedDeployments = deployments.filter(d => d.status === 'failure').length;

      // Get last deployment
      const sortedDeployments = deployments
        .filter(d => d.startedAt)
        .sort((a, b) => 
          new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime()
        );
      
      const lastDeployment = sortedDeployments[0];

      setStats({
        totalBuilds: builds.length,
        successfulBuilds,
        failedBuilds,
        averageBuildDuration,
        totalDeployments: deployments.length,
        successfulDeployments,
        failedDeployments,
        lastDeployment: lastDeployment ? {
          environment: lastDeployment.environment,
          status: lastDeployment.status,
          startedAt: lastDeployment.startedAt,
          deployedBy: lastDeployment.deployedBy,
        } : undefined,
      });
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching DevOps data:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncBuilds = async () => {
    try {
      const response = await fetch('/api/sync/github', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sync builds');
      }

      // Refresh data after sync
      await fetchDevOpsData();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    stats,
    loading,
    error,
    refresh: fetchDevOpsData,
    syncBuilds,
  };
}