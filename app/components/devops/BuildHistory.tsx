'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  GitBranch,
  User,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/client-schema';
import Link from 'next/link';

const client = generateClient<Schema>();

interface Build {
  id: string;
  workflowName?: string;
  workflowId?: number;
  runNumber?: number;
  branch: string;
  status: string;
  conclusion?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  author?: string;
  message?: string;
  url?: string;
  commitSha: string;
}

export default function BuildHistory({ 
  repositoryId, 
  limit = 10 
}: { 
  repositoryId?: string; 
  limit?: number;
}) {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBuilds();
  }, [repositoryId, limit]);

  const fetchBuilds = async () => {
    try {
      setLoading(true);
      
      const buildsResponse = await client.models.Build.list({
        filter: repositoryId ? { repositoryId: { eq: repositoryId } } : undefined,
        limit,
      });

      // Sort by started date, most recent first
      const sortedBuilds = buildsResponse.data
        .filter(build => build.startedAt)
        .sort((a, b) => 
          new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime()
        );

      setBuilds(sortedBuilds as Build[]);
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBuilds();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string, conclusion?: string) => {
    if (status === 'in_progress' || status === 'queued') {
      return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
    }
    if (conclusion === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (conclusion === 'failure') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-gray-500" />;
  };

  const getStatusBadge = (status: string, conclusion?: string) => {
    if (status === 'in_progress') {
      return <Badge variant="warning">In Progress</Badge>;
    }
    if (status === 'queued') {
      return <Badge variant="secondary">Queued</Badge>;
    }
    if (conclusion === 'success') {
      return <Badge variant="success">Success</Badge>;
    }
    if (conclusion === 'failure') {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (conclusion === 'cancelled') {
      return <Badge variant="secondary">Cancelled</Badge>;
    }
    return <Badge variant="secondary">{conclusion || status}</Badge>;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const buildDate = new Date(date);
    const diffMs = now.getTime() - buildDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return buildDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (builds.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Build History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Build history will appear once your CI/CD pipeline runs
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Build History
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {builds.map((build) => (
            <div key={build.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-start gap-4">
                {getStatusIcon(build.status, build.conclusion)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {build.workflowName || 'Workflow'} #{build.runNumber || '—'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {build.message || 'No commit message'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          <span>{build.branch}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{build.author || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {build.duration ? formatDuration(build.duration) : '—'}
                          </span>
                        </div>
                        <span>{build.startedAt ? getRelativeTime(build.startedAt) : '—'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(build.status, build.conclusion)}
                      {build.url && (
                        <Link href={build.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}