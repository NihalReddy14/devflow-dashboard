"use client";

import { useState, useEffect } from "react";
import { Tabs, TabPanel } from "../components/ui/Tabs";
import { MetricCard } from "../components/dashboard/MetricCard";
import { EmptyState } from "../components/dashboard/EmptyState";
import { Button } from "../components/ui/Button";
import { GitHubAuthButton } from "../components/auth/GitHubAuthButton";
import { PullRequestList } from "../components/dashboard/PullRequestList";
import { RealtimeIndicator } from "../components/dashboard/RealtimeIndicator";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { useGitHubData } from "../hooks/useGitHubData";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const { pullRequests, repositories, loading, error, syncWithGitHub } = useGitHubData();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        
        // If authenticated, sync GitHub data
        if (data.authenticated) {
          // Sync data from GitHub
          const syncResponse = await fetch('/api/sync/github', {
            method: 'POST',
          });
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            console.log('GitHub data synced:', syncData);
            // The useGitHubData hook will fetch the data from our local state
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "pulls", label: "Pull Requests" },
    { id: "builds", label: "Builds" },
    { id: "activity", label: "Activity Feed" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Tabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabPanel isActive={activeTab === "overview"}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h2>
              <RealtimeIndicator isConnected={isAuthenticated} lastUpdate={lastUpdate} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Open PRs"
                value={pullRequests.filter(pr => pr.state === 'open').length}
                subtitle={`${pullRequests.filter(pr => pr.state === 'open' && pr.draft).length} drafts`}
              />
              <MetricCard
                title="Repositories"
                value={repositories.length}
                subtitle="Connected repos"
              />
              <MetricCard
                title="Deploy Status"
                value="✓"
                subtitle="All deployments healthy"
              />
              <MetricCard
                title="Recent Activity"
                value={pullRequests.filter(pr => {
                  const date = new Date(pr.updatedAt);
                  const dayAgo = new Date();
                  dayAgo.setDate(dayAgo.getDate() - 1);
                  return date > dayAgo;
                }).length}
                subtitle="Updates in last 24h"
              />
            </div>
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === "pulls"}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pull Requests</h2>
            <PullRequestList
              pullRequests={pullRequests}
              loading={loading}
              error={error}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === "builds"}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Build History</h2>
            <EmptyState
              title="No Builds Yet"
              message="No build history available. Builds will appear here once CI/CD is connected."
              action={
                <Button variant="outline">
                  Setup CI/CD Pipeline
                </Button>
              }
            />
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === "activity"}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Activity Feed</h2>
            <ActivityFeed />
          </div>
        </TabPanel>
      </main>
    </div>
  );
}