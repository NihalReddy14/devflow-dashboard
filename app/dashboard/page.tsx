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
import { ProductivityAnalytics } from "../components/dashboard/ProductivityAnalytics";
import { useGitHubData } from "../hooks/useGitHubData";
import { CodeReviewPanel } from "../components/code-review/CodeReviewPanel";
import { useTeamData } from "../hooks/useTeamData";
import { SlackIntegration } from "../components/slack-integration/SlackIntegration";
import WellnessDashboard from "../components/wellness/WellnessDashboard";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [githubToken, setGithubToken] = useState<string>("");
  const [githubUser, setGithubUser] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>();
  const [hasSlackIntegration, setHasSlackIntegration] = useState(false);
  const { pullRequests, repositories, loading, error, syncWithGitHub } = useGitHubData();
  const { teamId, teamData } = useTeamData();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
        
        // Store user data
        if (data.authenticated && data.user) {
          setGithubUser(data.user);
          // Note: We can't access httpOnly cookies from client, 
          // so we'll need to pass token through API
        }
        
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
    { id: "ai-review", label: "AI Review ✨" },
    { id: "analytics", label: "Analytics" },
    { id: "wellness", label: "Wellness 💚" },
    { id: "pulls", label: "Pull Requests" },
    { id: "builds", label: "Builds" },
    { id: "activity", label: "Activity Feed" },
    { id: "integrations", label: "Integrations 🔗" }
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
                title="AI Reviews"
                value={teamData ? (10 - (teamData.monthlyReviewCount || 0)).toString() : "10"}
                subtitle="Reviews remaining"
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

            {/* Quick Actions Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Slack Integration Card */}
                {!hasSlackIntegration && teamId && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Connect Slack
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          Get instant notifications for PRs, builds, and code reviews
                        </p>
                        <button
                          onClick={() => setActiveTab("integrations")}
                          className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          Connect Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* GitHub Sync Card */}
                {isAuthenticated && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Sync GitHub Data
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {lastUpdate ? `Last synced ${new Date(lastUpdate).toLocaleTimeString()}` : 'Refresh your repository data'}
                        </p>
                        <button
                          onClick={() => syncWithGitHub()}
                          disabled={loading}
                          className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {loading ? 'Syncing...' : 'Sync Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === "ai-review"}>
          <div>
            {teamId ? (
              <CodeReviewPanel teamId={teamId} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Loading team data...</p>
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === "analytics"}>
          <div>
            <ProductivityAnalytics 
              owner={githubUser?.username || "NihalReddy14"} 
              repo="devflow-dashboard"
              username={githubUser?.username}
              useServerAPI={isAuthenticated}
            />
          </div>
        </TabPanel>

        <TabPanel isActive={activeTab === "wellness"}>
          <div>
            <WellnessDashboard />
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

        <TabPanel isActive={activeTab === "integrations"}>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Integrations</h2>
            {teamId ? (
              <div className="max-w-3xl">
                <SlackIntegration teamId={teamId} teamName={teamData?.name} />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Loading team data...</p>
              </div>
            )}
          </div>
        </TabPanel>
      </main>
    </div>
  );
}