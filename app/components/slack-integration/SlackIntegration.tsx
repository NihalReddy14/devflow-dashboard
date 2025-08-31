"use client";

import { useState, useEffect } from "react";
import { SlackSetup } from "./SlackSetup";
import { SlackNotificationSettings } from "./SlackNotificationSettings";
import { SlackTestMessage } from "./SlackTestMessage";
import { useAppMode } from "../../providers/AmplifyProvider";

interface SlackIntegrationProps {
  teamId: string;
  teamName?: string;
}

// Mock data for demo mode
const mockSlackIntegration = {
  id: 'slack_demo',
  teamId: 'team_demo',
  workspaceId: 'W1234567890',
  workspaceName: 'Demo Workspace',
  channelId: 'C1234567890',
  channelName: 'devflow-notifications',
  webhookUrl: 'https://hooks.slack.com/services/demo',
  accessToken: 'xoxb-demo-token',
  status: 'active',
  lastTestAt: new Date().toISOString(),
  monthlyNotificationCount: 42,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function SlackIntegration({ teamId, teamName }: SlackIntegrationProps) {
  const [slackIntegration, setSlackIntegration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { isAmplifyAvailable, isDemoMode } = useAppMode();

  useEffect(() => {
    loadSlackIntegration();
  }, [teamId, isAmplifyAvailable]);

  const loadSlackIntegration = async () => {
    try {
      if (isDemoMode || !isAmplifyAvailable) {
        // Use mock data in demo mode
        setTimeout(() => {
          setSlackIntegration(mockSlackIntegration);
          setIsLoading(false);
        }, 500);
        return;
      }

      const { generateClient } = await import("aws-amplify/data");
      const { Schema } = await import("../../../amplify/data/client-schema");
      const client = generateClient<typeof Schema>();
      
      const { data } = await client.models.SlackIntegration.list({
        filter: { teamId: { eq: teamId } }
      });

      if (data && data.length > 0) {
        setSlackIntegration(data[0]);
      }
    } catch (error) {
      console.error("Error loading Slack integration:", error);
      // In case of error, don't show mock data
      setSlackIntegration(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!slackIntegration || !confirm("Are you sure you want to disconnect Slack?")) {
      return;
    }

    if (isDemoMode || !isAmplifyAvailable) {
      // Simulate disconnect in demo mode
      setSlackIntegration(null);
      return;
    }

    try {
      const { generateClient } = await import("aws-amplify/data");
      const { Schema } = await import("../../../amplify/data/client-schema");
      const client = generateClient<typeof Schema>();
      
      await client.models.SlackIntegration.update({
        id: slackIntegration.id,
        status: 'inactive'
      });
      setSlackIntegration(null);
    } catch (error) {
      console.error("Error disconnecting Slack:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!slackIntegration || slackIntegration.status !== 'active') {
    return <SlackSetup teamId={teamId} onComplete={loadSlackIntegration} />;
  }

  return (
    <div className="space-y-6">
      {/* Connected Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Slack Connected
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Workspace: <span className="font-medium">{slackIntegration.workspaceName}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Channel: <span className="font-medium">#{slackIntegration.channelName}</span>
              </p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <svg className="w-1.5 h-1.5 mr-1" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Active
              </div>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Test Message Section */}
      <SlackTestMessage slackIntegration={slackIntegration} />

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notification Settings
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showSettings ? "Hide" : "Configure"}
          </button>
        </div>
        
        {showSettings && (
          <SlackNotificationSettings 
            slackIntegrationId={slackIntegration.id} 
            onSave={() => setShowSettings(false)}
          />
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Usage Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {slackIntegration.monthlyNotificationCount || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Notifications this month
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {slackIntegration.lastTestAt ? 
                new Date(slackIntegration.lastTestAt).toLocaleDateString() : 
                'Never'
              }
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Last test message
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ∞
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monthly limit
            </p>
          </div>
        </div>
      </div>

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Demo Mode:</strong> This is a simulated Slack integration. In production, this would connect to your actual Slack workspace.
          </p>
        </div>
      )}
    </div>
  );
}