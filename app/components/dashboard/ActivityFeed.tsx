"use client";

import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "./EmptyState";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: any;
  createdAt: string;
  user?: {
    githubUsername?: string;
    githubAvatarUrl?: string;
  };
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Check authentication first
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      setLoading(true);
      // Fetch activities from our GitHub-based API
      const response = await fetch('/api/activities');
      
      if (response.ok) {
        const data = await response.json();
        if (data.activities) {
          setActivities(data.activities);
        }
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async (dataClient: any) => {
    // This function is no longer used
    // Activities are fetched from /api/activities instead
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'pr_opened':
        return <span className="text-green-500">↗</span>;
      case 'pr_closed':
        return <span className="text-red-500">↘</span>;
      case 'pr_merged':
        return <span className="text-purple-500">⇄</span>;
      case 'pr_reviewed':
        return <span className="text-blue-500">👁</span>;
      case 'push':
        return <span className="text-green-500">⬆</span>;
      case 'issue_opened':
        return <span className="text-yellow-500">⚠</span>;
      case 'issue_closed':
        return <span className="text-gray-500">✓</span>;
      case 'branch_created':
        return <span className="text-blue-500">🌿</span>;
      case 'branch_deleted':
        return <span className="text-red-500">✂</span>;
      case 'tag_created':
        return <span className="text-purple-500">🏷</span>;
      case 'build_started':
        return <span className="text-blue-500">▶</span>;
      case 'build_completed':
        return <span className="text-green-500">✓</span>;
      case 'build_failed':
        return <span className="text-red-500">✗</span>;
      default:
        return <span className="text-gray-500">•</span>;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        title="No Activity Yet"
        message="Activity from your repositories will appear here. Connect GitHub to see your activity."
        action={
          <button
            onClick={checkAuthAndFetch}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Refresh
          </button>
        }
      />
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium">Recent Activity</h3>
        <button
          onClick={checkAuthAndFetch}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Refresh
        </button>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity) => {
          const metadata = activity.metadata || {};
          
          return (
            <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {metadata.authorUsername && (
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={metadata.authorAvatarUrl}
                          alt={metadata.authorUsername}
                          fallback={metadata.authorUsername}
                          size="sm"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {metadata.authorUsername}
                        </span>
                      </div>
                    )}
                    {metadata.repoName && (
                      <Badge variant="default" size="sm">
                        {metadata.repoName}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}