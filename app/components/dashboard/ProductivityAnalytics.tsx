'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { 
  ProductivityMetrics, 
  ViewMode,
  ChartType,
  CommitPattern
} from '@/app/types/analytics';
import { fetchProductivityMetrics } from '@/app/utils/githubAnalytics';
import { generateMockAnalyticsData } from '@/app/utils/mockAnalyticsData';
import { fetchMinimalProductivityMetrics } from '@/app/utils/githubAnalyticsLite';

interface ProductivityAnalyticsProps {
  owner: string;
  repo: string;
  token?: string;
  username?: string;
  useServerAPI?: boolean; // Use server-side API for authenticated requests
}

export function ProductivityAnalytics({ owner, repo, token, username, useServerAPI }: ProductivityAnalyticsProps) {
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('team');
  const [selectedChart, setSelectedChart] = useState<ChartType>('activity');
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState(repo);
  const [selectedOwner, setSelectedOwner] = useState(owner);
  
  // Use popular public repos for demo when no token
  const demoRepos = [
    { owner: 'facebook', repo: 'react' },
    { owner: 'vercel', repo: 'next.js' },
    { owner: 'microsoft', repo: 'vscode' },
    { owner: 'tailwindlabs', repo: 'tailwindcss' }
  ];
  const [selectedDemo, setSelectedDemo] = useState(0);

  useEffect(() => {
    if (useServerAPI) {
      fetchUserRepos();
    }
  }, [useServerAPI]);

  useEffect(() => {
    loadMetrics();
  }, [selectedOwner, selectedRepo, token, username, viewMode, selectedDemo, useServerAPI]);

  const fetchUserRepos = async () => {
    try {
      const response = await fetch('/api/user/repos');
      if (response.ok) {
        const data = await response.json();
        setUserRepos(data.repos);
        // Set the first repo as selected if available
        if (data.repos.length > 0 && selectedRepo === 'devflow-dashboard') {
          setSelectedRepo(data.repos[0].name);
          setSelectedOwner(data.repos[0].owner);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user repos:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let targetOwner = selectedOwner;
      let targetRepo = selectedRepo;
      
      // If authenticated, use server API
      if (useServerAPI) {
        try {
          const response = await fetch(`/api/analytics?owner=${targetOwner}&repo=${targetRepo}`);
          if (!response.ok) {
            throw new Error('Failed to fetch analytics');
          }
          const data = await response.json();
          setMetrics(data);
          return;
        } catch (err) {
          console.error('Server API failed:', err);
          setError('Failed to load your repository data. Please try again.');
        }
      } else {
        // Use demo repos if not authenticated
        const demo = demoRepos[selectedDemo];
        targetOwner = demo.owner;
        targetRepo = demo.repo;
        
        // Use lightweight API for public repos
        try {
          const data = await fetchMinimalProductivityMetrics(targetOwner, targetRepo);
          setMetrics(data);
          return;
        } catch (lightErr) {
          console.log('Lightweight API failed, falling back to mock data');
          const mockData = generateMockAnalyticsData();
          setMetrics(mockData);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      // Only use mock data for demo mode
      if (!useServerAPI) {
        const mockData = generateMockAnalyticsData();
        setMetrics(mockData);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={loadMetrics}>Retry</Button>
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  // Prepare commit heatmap data
  const heatmapData = prepareHeatmapData(metrics.commitPatterns);

  // Color scales
  const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Mode Notice */}
      {useServerAPI ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Connected to GitHub - Viewing Your Repository Data
                </h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Real analytics from your repositories
                </p>
              </div>
            </div>
            {userRepos.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-green-800 dark:text-green-200">Repository:</label>
                <select
                  value={`${selectedOwner}/${selectedRepo}`}
                  onChange={(e) => {
                    const [owner, repo] = e.target.value.split('/');
                    setSelectedOwner(owner);
                    setSelectedRepo(repo);
                  }}
                  className="text-sm rounded-md border border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 px-3 py-1"
                >
                  {userRepos.map((repo: any) => (
                    <option key={repo.full_name} value={repo.full_name}>
                      {repo.full_name} {repo.private && '🔒'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Demo Mode - Viewing Real Public Repository Data
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Showing analytics from popular open-source projects. Connect GitHub to see your own data.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-blue-800 dark:text-blue-200">Demo repo:</label>
              <select
                value={selectedDemo}
                onChange={(e) => setSelectedDemo(Number(e.target.value))}
                className="text-sm rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 px-3 py-1"
              >
                {demoRepos.map((repo, index) => (
                  <option key={index} value={index}>
                    {repo.owner}/{repo.repo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Productivity Analytics</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Insights into {viewMode === 'team' ? 'team' : 'personal'} development patterns
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'team' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setViewMode('team')}
          >
            Team View
          </Button>
          <Button
            variant={viewMode === 'personal' ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setViewMode('personal')}
            disabled={!username}
          >
            Personal View
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.teamStats.totalCommits}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Commits</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {metrics.teamStats.totalPRs}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pull Requests</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {metrics.teamStats.avgPRMergeTime.toFixed(1)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Merge Time</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {(metrics.teamStats.totalCodeChanges / 1000).toFixed(1)}k
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Code Changes</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {metrics.teamStats.activeDevelopers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Devs</div>
          </div>
        </Card>
      </div>

      {/* Chart Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['activity', 'prs', 'commits', 'reviews'] as ChartType[]).map((chart) => (
          <Button
            key={chart}
            variant={selectedChart === chart ? 'primary' : 'secondary'}
            size="small"
            onClick={() => setSelectedChart(chart)}
          >
            {chart.charAt(0).toUpperCase() + chart.slice(1)}
          </Button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedChart === 'activity' && (
          <>
            {/* Weekly Activity Chart */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Weekly Commit Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    name="Commits"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="additions" 
                    stroke="#10B981" 
                    name="Additions"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="deletions" 
                    stroke="#EF4444" 
                    name="Deletions"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Commit Heatmap */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Commit Heatmap</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Most active times for commits
              </div>
              <CommitHeatmap data={heatmapData} />
            </Card>
          </>
        )}

        {selectedChart === 'prs' && (
          <>
            {/* PR Velocity */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">PR Velocity Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.prVelocity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="created" fill="#3B82F6" name="Created" />
                  <Bar dataKey="merged" fill="#10B981" name="Merged" />
                  <Bar dataKey="closed" fill="#EF4444" name="Closed" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Average Merge Time */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">Average PR Merge Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.prVelocity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="avgTimeToMerge" 
                    stroke="#8B5CF6" 
                    name="Avg Time to Merge"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </>
        )}

        {selectedChart === 'commits' && (
          <>
            {/* Top Contributors */}
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
              <div className="space-y-4">
                {metrics.topContributors.map((dev, index) => (
                  <div key={dev.username} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={dev.avatarUrl} 
                        alt={dev.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{dev.username}</div>
                        <div className="text-sm text-gray-500">
                          Most active: {dev.mostActiveDay} at {dev.mostActiveHour}:00
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="primary">{dev.totalCommits} commits</Badge>
                      <Badge variant="secondary">{dev.totalPRs} PRs</Badge>
                      <Badge variant="success">{dev.avgPRMergeTime.toFixed(1)}h avg</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {selectedChart === 'reviews' && (
          <>
            {/* Review Metrics */}
            <Card className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">Recent PR Review Metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b dark:border-gray-700">
                    <tr>
                      <th className="text-left pb-2">PR</th>
                      <th className="text-left pb-2">Author</th>
                      <th className="text-center pb-2">Reviews</th>
                      <th className="text-center pb-2">Comments</th>
                      <th className="text-center pb-2">Time to Review</th>
                      <th className="text-center pb-2">Time to Merge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {metrics.reviewMetrics.slice(0, 10).map((pr) => (
                      <tr key={pr.prNumber}>
                        <td className="py-2">
                          <a 
                            href={`https://github.com/${owner}/${repo}/pull/${pr.prNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            #{pr.prNumber}
                          </a>
                        </td>
                        <td className="py-2">{pr.author}</td>
                        <td className="text-center py-2">{pr.reviewCount}</td>
                        <td className="text-center py-2">{pr.commentCount}</td>
                        <td className="text-center py-2">
                          {pr.timeToFirstReview ? `${pr.timeToFirstReview.toFixed(1)}h` : '-'}
                        </td>
                        <td className="text-center py-2">
                          {pr.timeToMerge ? (
                            <Badge 
                              variant={pr.timeToMerge < 24 ? 'success' : pr.timeToMerge < 72 ? 'warning' : 'danger'}
                            >
                              {pr.timeToMerge.toFixed(1)}h
                            </Badge>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

// Helper component for commit heatmap
function CommitHeatmap({ data }: { data: number[][] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getIntensity = (value: number, max: number) => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = (value / max) * 100;
    if (intensity < 20) return 'bg-blue-200 dark:bg-blue-900';
    if (intensity < 40) return 'bg-blue-300 dark:bg-blue-800';
    if (intensity < 60) return 'bg-blue-400 dark:bg-blue-700';
    if (intensity < 80) return 'bg-blue-500 dark:bg-blue-600';
    return 'bg-blue-600 dark:bg-blue-500';
  };
  
  const maxValue = Math.max(...data.flat());
  
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex gap-1">
          <div className="w-12" /> {/* Empty corner */}
          {hours.map(hour => (
            <div key={hour} className="w-8 text-xs text-center text-gray-500">
              {hour}
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <div key={day} className="flex gap-1 mt-1">
            <div className="w-12 text-xs text-right pr-2 text-gray-500">{day}</div>
            {hours.map(hour => (
              <div
                key={`${day}-${hour}`}
                className={`w-8 h-8 rounded ${getIntensity(data[dayIndex][hour], maxValue)}`}
                title={`${day} ${hour}:00 - ${data[dayIndex][hour]} commits`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to prepare heatmap data
function prepareHeatmapData(patterns: CommitPattern[]): number[][] {
  const data: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
  
  patterns.forEach(pattern => {
    data[pattern.dayOfWeek][pattern.hour] = pattern.count;
  });
  
  return data;
}