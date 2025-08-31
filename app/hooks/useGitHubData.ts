"use client";

import { useState, useEffect } from 'react';
import { useAppMode } from '../providers/AmplifyProvider';

export interface PullRequestWithRepo {
  id: string;
  number: number;
  title: string;
  state: string;
  draft: boolean;
  authorUsername: string;
  authorAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  repository: {
    name: string;
    fullName: string;
  };
}

export function useGitHubData() {
  const [pullRequests, setPullRequests] = useState<PullRequestWithRepo[]>([]);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status first
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        
        // Only fetch data if authenticated
        if (data.authenticated) {
          // Delay initialization to ensure Amplify is configured
          setTimeout(() => {
            fetchData();
          }, 100);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [subscriptions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch synced GitHub data from our API
      const syncResponse = await fetch('/api/sync/github', {
        method: 'POST',
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        
        if (syncData.success && syncData.data) {
          // Update repositories
          setRepositories(syncData.data.repositories);
          
          // Update pull requests with repository info
          const prsWithRepo = syncData.data.pullRequests.map((pr: any) => ({
            id: pr.id.toString(),
            number: pr.number,
            title: pr.title,
            state: pr.state,
            draft: pr.draft || false,
            authorUsername: pr.author.login,
            authorAvatarUrl: pr.author.avatar_url,
            createdAt: pr.created_at,
            updatedAt: pr.updated_at,
            repository: {
              name: pr.repository.name,
              fullName: pr.repository.full_name,
            },
          }));
          
          setPullRequests(prsWithRepo);
        }
      } else {
        setError('Failed to sync GitHub data');
      }
    } catch (err) {
      console.error('Error fetching GitHub data:', err);
      setError('Failed to fetch GitHub data');
    } finally {
      setLoading(false);
    }
  };

  const setupSubscriptions = () => {
    // Subscriptions disabled for now - using direct GitHub API
    // Will enable once Cognito user is created
  };

  const syncWithGitHub = async (userId: string, githubToken: string) => {
    // Using direct API sync for now
    return fetchData();
  };

  return {
    pullRequests,
    repositories,
    loading,
    error,
    isAuthenticated,
    syncWithGitHub,
    refetch: fetchData,
  };
}