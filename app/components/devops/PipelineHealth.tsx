'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { CheckCircle, XCircle, Clock, Activity, GitBranch, AlertCircle } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/client-schema';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const client = generateClient<Schema>();

interface BuildData {
  id: string;
  workflowName?: string;
  branch: string;
  status: string;
  conclusion?: string;
  startedAt?: string;
  duration?: number;
  author?: string;
  message?: string;
  url?: string;
}

interface PipelineStats {
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  averageDuration: number;
  successRate: number;
  branchStats: Record<string, {
    total: number;
    successful: number;
    failed: number;
  }>;
  workflowStats: Record<string, {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
  }>;
}

const COLORS = {
  success: '#10B981',
  failure: '#EF4444',
  pending: '#F59E0B',
  cancelled: '#6B7280',
};

export default function PipelineHealth({ repositoryId }: { repositoryId?: string }) {
  const [builds, setBuilds] = useState<BuildData[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // Days

  useEffect(() => {
    fetchBuilds();
  }, [repositoryId, timeRange]);

  const fetchBuilds = async () => {
    try {
      setLoading(true);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const buildsResponse = await client.models.Build.list({
        filter: {
          ...(repositoryId && { repositoryId: { eq: repositoryId } }),
          startedAt: { gt: startDate.toISOString() },
        },
        limit: 100,
      });

      const buildsData = buildsResponse.data as BuildData[];
      setBuilds(buildsData);

      // Calculate statistics
      const stats = calculateStats(buildsData);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (builds: BuildData[]): PipelineStats => {
    const stats: PipelineStats = {
      totalBuilds: builds.length,
      successfulBuilds: 0,
      failedBuilds: 0,
      averageDuration: 0,
      successRate: 0,
      branchStats: {},
      workflowStats: {},
    };

    let totalDuration = 0;
    let durationCount = 0;

    builds.forEach(build => {
      // Overall stats
      if (build.conclusion === 'success') {
        stats.successfulBuilds++;
      } else if (build.conclusion === 'failure') {
        stats.failedBuilds++;
      }

      if (build.duration) {
        totalDuration += build.duration;
        durationCount++;
      }

      // Branch stats
      if (!stats.branchStats[build.branch]) {
        stats.branchStats[build.branch] = { total: 0, successful: 0, failed: 0 };
      }
      stats.branchStats[build.branch].total++;
      if (build.conclusion === 'success') {
        stats.branchStats[build.branch].successful++;
      } else if (build.conclusion === 'failure') {
        stats.branchStats[build.branch].failed++;
      }

      // Workflow stats
      const workflowName = build.workflowName || 'Unknown';
      if (!stats.workflowStats[workflowName]) {
        stats.workflowStats[workflowName] = { 
          total: 0, 
          successful: 0, 
          failed: 0, 
          avgDuration: 0 
        };
      }
      stats.workflowStats[workflowName].total++;
      if (build.conclusion === 'success') {
        stats.workflowStats[workflowName].successful++;
      } else if (build.conclusion === 'failure') {
        stats.workflowStats[workflowName].failed++;
      }
    });

    stats.averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;
    stats.successRate = stats.totalBuilds > 0 
      ? (stats.successfulBuilds / stats.totalBuilds) * 100 
      : 0;

    // Calculate average durations for workflows
    Object.keys(stats.workflowStats).forEach(workflow => {
      const workflowBuilds = builds.filter(b => (b.workflowName || 'Unknown') === workflow);
      const durations = workflowBuilds
        .filter(b => b.duration)
        .map(b => b.duration!);
      
      if (durations.length > 0) {
        stats.workflowStats[workflow].avgDuration = 
          durations.reduce((a, b) => a + b, 0) / durations.length;
      }
    });

    return stats;
  };

  const prepareDailyData = () => {
    const dailyData: Record<string, { date: string; success: number; failed: number }> = {};
    
    builds.forEach(build => {
      if (build.startedAt) {
        const date = new Date(build.startedAt).toLocaleDateString();
        if (!dailyData[date]) {
          dailyData[date] = { date, success: 0, failed: 0 };
        }
        if (build.conclusion === 'success') {
          dailyData[date].success++;
        } else if (build.conclusion === 'failure') {
          dailyData[date].failed++;
        }
      }
    });

    return Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const preparePieData = () => {
    if (!stats) return [];
    return [
      { name: 'Success', value: stats.successfulBuilds },
      { name: 'Failed', value: stats.failedBuilds },
      { name: 'Other', value: stats.totalBuilds - stats.successfulBuilds - stats.failedBuilds },
    ].filter(item => item.value > 0);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || stats.totalBuilds === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Build Data Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Build data will appear once your CI/CD pipeline is active
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Builds</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.totalBuilds}
              </p>
            </div>
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {stats.successRate.toFixed(1)}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed Builds</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {stats.failedBuilds}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {Math.round(stats.averageDuration / 60)}m
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Build Success Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Build Success Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={prepareDailyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="success" 
                stroke={COLORS.success} 
                strokeWidth={2}
                name="Success"
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke={COLORS.failure} 
                strokeWidth={2}
                name="Failed"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Build Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Build Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={preparePieData()}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill={COLORS.success} />
                <Cell fill={COLORS.failure} />
                <Cell fill={COLORS.cancelled} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.failure }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
            </div>
          </div>
        </Card>

        {/* Branch Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Branch Performance
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.branchStats)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 5)
              .map(([branch, data]) => {
                const successRate = (data.successful / data.total) * 100;
                return (
                  <div key={branch} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {branch}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {data.total} builds
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Workflow Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Workflow Performance
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.workflowStats)
              .sort((a, b) => b[1].total - a[1].total)
              .slice(0, 5)
              .map(([workflow, data]) => {
                const successRate = (data.successful / data.total) * 100;
                return (
                  <div key={workflow} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {workflow}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(data.avgDuration / 60)}m avg
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[40px] text-right">
                        {successRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>
    </div>
  );
}