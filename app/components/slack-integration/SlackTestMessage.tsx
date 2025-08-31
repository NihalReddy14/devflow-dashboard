"use client";

import { useState } from "react";

interface SlackTestMessageProps {
  slackIntegrationId: string;
  teamName?: string;
}

export function SlackTestMessage({ slackIntegrationId, teamName = "Your Team" }: SlackTestMessageProps) {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendTestMessage = async () => {
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/slack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slackIntegrationId }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: "Test message sent successfully!" });
      } else {
        setResult({ success: false, message: data.error || "Failed to send test message" });
      }
    } catch (error) {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Test Slack Integration
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Send a test message to verify your Slack integration is working correctly.
      </p>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
        <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-3 text-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM12 14a1 1 0 00-.707.293l-.707.707a1 1 0 101.414 1.414l.707-.707A1 1 0 0012 14zM4.343 12.343a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">DevFlow Dashboard</p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">{teamName}</span> Slack integration is working! 
                You'll receive notifications for PRs, builds, and code reviews here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className={`mb-4 p-3 rounded-lg ${
          result.success 
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800" 
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
        }`}>
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      <button
        onClick={sendTestMessage}
        disabled={isSending}
        className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        {isSending ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Send Test Message</span>
          </>
        )}
      </button>
    </div>
  );
}