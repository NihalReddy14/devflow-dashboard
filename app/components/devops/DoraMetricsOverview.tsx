'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { MetricCard } from '../dashboard/MetricCard';
import { Card } from '../ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../../amplify/data/client-schema';

const client = generateClient<Schema>();

interface DoraMetric {
  deploymentFrequency: number;
  leadTimeMinutes: number;
  changeFailureRate: number;
  mttrMinutes: number;
  totalDeployments: number;
  failedDeployments: number;
  averageBuildDuration: number;
  calculatedAt: string;
}

export default function DoraMetricsOverview({ repositoryId }: { repositoryId?: string }) {
  const [metrics, setMetrics] = useState<DoraMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [previousMetrics, setPreviousMetrics] = useState<DoraMetric | null>(null);

  useEffect(() => {
    fetchDoraMetrics();
  }, [repositoryId, timeRange]);

  const fetchDoraMetrics = async () => {
    try {
      setLoading(true);
      
      // Get the latest metrics
      const today = new Date().toISOString().split('T')[0];
      const metricsResponse = await client.models.DoraMetrics.list({
        filter: {
          ...(repositoryId && { repositoryId: { eq: repositoryId } }),
          period: { eq: timeRange },
        },
        limit: 2, // Get current and previous
      });

      const sortedMetrics = metricsResponse.data.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (sortedMetrics.length > 0) {
        setMetrics(sortedMetrics[0] as any);
        if (sortedMetrics.length > 1) {
          setPreviousMetrics(sortedMetrics[1] as any);
        }
      }
    } catch (error) {
      console.error('Error fetching DORA metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current: number, previous: number | undefined, inverse = false) => {
    if (!previous) return { value: 0, trending: 'neutral' as const };
    const change = ((current - previous) / previous) * 100;
    const trending = inverse 
      ? (change < 0 ? 'up' : 'down')
      : (change > 0 ? 'up' : 'down');
    return { value: Math.abs(change), trending };
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const getPerformanceLevel = (metric: string, value: number) => {
    switch (metric) {
      case 'deploymentFrequency':
        if (value >= 1) return { level: 'Elite', color: 'text-green-600' };
        if (value >= 0.14) return { level: 'High', color: 'text-blue-600' };
        if (value >= 0.03) return { level: 'Medium', color: 'text-yellow-600' };
        return { level: 'Low', color: 'text-red-600' };
      
      case 'leadTime':
        if (value < 60) return { level: 'Elite', color: 'text-green-600' };
        if (value < 1440) return { level: 'High', color: 'text-blue-600' };
        if (value < 10080) return { level: 'Medium', color: 'text-yellow-600' };
        return { level: 'Low', color: 'text-red-600' };
      
      case 'changeFailureRate':
        if (value <= 5) return { level: 'Elite', color: 'text-green-600' };
        if (value <= 10) return { level: 'High', color: 'text-blue-600' };
        if (value <= 15) return { level: 'Medium', color: 'text-yellow-600' };
        return { level: 'Low', color: 'text-red-600' };
      
      case 'mttr':
        if (value < 60) return { level: 'Elite', color: 'text-green-600' };
        if (value < 1440) return { level: 'High', color: 'text-blue-600' };
        if (value < 10080) return { level: 'Medium', color: 'text-yellow-600' };
        return { level: 'Low', color: 'text-red-600' };
      
      default:
        return { level: 'Unknown', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No DORA Metrics Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Metrics will appear once you have deployment data
          </p>
        </div>
      </Card>
    );
  }

  const deployFreqTrend = calculateTrend(
    metrics.deploymentFrequency, 
    previousMetrics?.deploymentFrequency
  );
  
  const leadTimeTrend = calculateTrend(
    metrics.leadTimeMinutes, 
    previousMetrics?.leadTimeMinutes,
    true // Lower is better
  );
  
  const failureRateTrend = calculateTrend(
    metrics.changeFailureRate, 
    previousMetrics?.changeFailureRate,
    true // Lower is better
  );
  
  const mttrTrend = calculateTrend(
    metrics.mttrMinutes, 
    previousMetrics?.mttrMinutes,
    true // Lower is better
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          DORA Metrics Overview
        </h2>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Deployment Frequency"
          value={`${metrics.deploymentFrequency.toFixed(1)}/day`}
          change={deployFreqTrend.value}
          trending={deployFreqTrend.trending}
          icon={<TrendingUp className="h-4 w-4" />}
          subtitle={getPerformanceLevel('deploymentFrequency', metrics.deploymentFrequency).level}
          subtitleColor={getPerformanceLevel('deploymentFrequency', metrics.deploymentFrequency).color}
        />

        <MetricCard
          title="Lead Time for Changes"
          value={formatDuration(metrics.leadTimeMinutes)}
          change={leadTimeTrend.value}
          trending={leadTimeTrend.trending}
          icon={<Clock className="h-4 w-4" />}
          subtitle={getPerformanceLevel('leadTime', metrics.leadTimeMinutes).level}
          subtitleColor={getPerformanceLevel('leadTime', metrics.leadTimeMinutes).color}
        />

        <MetricCard
          title="Change Failure Rate"
          value={`${metrics.changeFailureRate.toFixed(1)}%`}
          change={failureRateTrend.value}
          trending={failureRateTrend.trending}
          icon={<AlertTriangle className="h-4 w-4" />}
          subtitle={getPerformanceLevel('changeFailureRate', metrics.changeFailureRate).level}
          subtitleColor={getPerformanceLevel('changeFailureRate', metrics.changeFailureRate).color}
        />

        <MetricCard
          title="Mean Time to Restore"
          value={formatDuration(metrics.mttrMinutes)}
          change={mttrTrend.value}
          trending={mttrTrend.trending}
          icon={<CheckCircle className="h-4 w-4" />}
          subtitle={getPerformanceLevel('mttr', metrics.mttrMinutes).level}
          subtitleColor={getPerformanceLevel('mttr', metrics.mttrMinutes).color}
        />
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Deployments</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {metrics.totalDeployments}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Failed Deployments</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
              {metrics.failedDeployments}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Build Duration</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {formatDuration(metrics.averageBuildDuration)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date(metrics.calculatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}