"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

interface SlackNotificationSettingsProps {
  slackIntegrationId: string;
  onSave?: () => void;
}

export function SlackNotificationSettings({ slackIntegrationId, onSave }: SlackNotificationSettingsProps) {
  const [settings, setSettings] = useState({
    // PR notifications
    notifyPrCreated: true,
    notifyPrMerged: true,
    notifyPrClosed: false,
    notifyPrReviewRequested: true,
    notifyPrReviewCompleted: true,
    // Build notifications
    notifyBuildFailure: true,
    notifyBuildSuccess: false,
    notifyBuildRecovered: true,
    // Code review notifications
    notifyCodeReviewCompleted: true,
    notifyCodeReviewCritical: true,
    // General settings
    mentionUsersOnCritical: true,
    notificationHours: {
      enabled: false,
      start: "09:00",
      end: "18:00",
      timezone: "America/New_York"
    },
    enabledDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [slackIntegrationId]);

  const loadSettings = async () => {
    try {
      const { data } = await client.models.SlackNotificationSettings.list({
        filter: { slackIntegrationId: { eq: slackIntegrationId } }
      });

      if (data && data.length > 0) {
        const existing = data[0];
        setSettings({
          notifyPrCreated: existing.notifyPrCreated ?? true,
          notifyPrMerged: existing.notifyPrMerged ?? true,
          notifyPrClosed: existing.notifyPrClosed ?? false,
          notifyPrReviewRequested: existing.notifyPrReviewRequested ?? true,
          notifyPrReviewCompleted: existing.notifyPrReviewCompleted ?? true,
          notifyBuildFailure: existing.notifyBuildFailure ?? true,
          notifyBuildSuccess: existing.notifyBuildSuccess ?? false,
          notifyBuildRecovered: existing.notifyBuildRecovered ?? true,
          notifyCodeReviewCompleted: existing.notifyCodeReviewCompleted ?? true,
          notifyCodeReviewCritical: existing.notifyCodeReviewCritical ?? true,
          mentionUsersOnCritical: existing.mentionUsersOnCritical ?? true,
          notificationHours: existing.notificationHours || {
            enabled: false,
            start: "09:00",
            end: "18:00",
            timezone: "America/New_York"
          },
          enabledDays: existing.enabledDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { data: existing } = await client.models.SlackNotificationSettings.list({
        filter: { slackIntegrationId: { eq: slackIntegrationId } }
      });

      const settingsData = {
        slackIntegrationId,
        ...settings,
        notificationHours: JSON.stringify(settings.notificationHours),
      };

      if (existing && existing.length > 0) {
        // Update existing settings
        await client.models.SlackNotificationSettings.update({
          id: existing[0].id,
          ...settingsData,
        });
      } else {
        // Create new settings
        await client.models.SlackNotificationSettings.create({
          ...settingsData,
          mutedRepositories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      onSave?.();
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const toggleDay = (day: string) => {
    setSettings(prev => ({
      ...prev,
      enabledDays: prev.enabledDays.includes(day)
        ? prev.enabledDays.filter(d => d !== day)
        : [...prev.enabledDays, day]
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Notification Settings
      </h3>

      <div className="space-y-6">
        {/* Pull Request Notifications */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Pull Request Notifications
          </h4>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">New PR created</span>
              <input
                type="checkbox"
                checked={settings.notifyPrCreated}
                onChange={() => toggleSetting('notifyPrCreated')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">PR merged</span>
              <input
                type="checkbox"
                checked={settings.notifyPrMerged}
                onChange={() => toggleSetting('notifyPrMerged')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Review requested</span>
              <input
                type="checkbox"
                checked={settings.notifyPrReviewRequested}
                onChange={() => toggleSetting('notifyPrReviewRequested')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Review completed</span>
              <input
                type="checkbox"
                checked={settings.notifyPrReviewCompleted}
                onChange={() => toggleSetting('notifyPrReviewCompleted')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Build Notifications */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Build Notifications
          </h4>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Build failures</span>
              <input
                type="checkbox"
                checked={settings.notifyBuildFailure}
                onChange={() => toggleSetting('notifyBuildFailure')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Build success</span>
              <input
                type="checkbox"
                checked={settings.notifyBuildSuccess}
                onChange={() => toggleSetting('notifyBuildSuccess')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Build recovered</span>
              <input
                type="checkbox"
                checked={settings.notifyBuildRecovered}
                onChange={() => toggleSetting('notifyBuildRecovered')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Code Review Notifications */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            AI Code Review Notifications
          </h4>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Review completed</span>
              <input
                type="checkbox"
                checked={settings.notifyCodeReviewCompleted}
                onChange={() => toggleSetting('notifyCodeReviewCompleted')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Critical issues found</span>
              <input
                type="checkbox"
                checked={settings.notifyCodeReviewCritical}
                onChange={() => toggleSetting('notifyCodeReviewCritical')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">@mention users on critical</span>
              <input
                type="checkbox"
                checked={settings.mentionUsersOnCritical}
                onChange={() => toggleSetting('mentionUsersOnCritical')}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>

        {/* Active Days */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Active Days
          </h4>
          <div className="flex flex-wrap gap-2">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  settings.enabledDays.includes(day)
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}