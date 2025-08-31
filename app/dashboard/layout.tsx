"use client";

import { GitHubAuthButton } from "../components/auth/GitHubAuthButton";
import { useEffect, useState } from "react";
import { Avatar } from "../components/ui/Avatar";
import { useOnboarding } from "../hooks/useOnboarding";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";

interface GitHubUser {
  id: number;
  login: string;
  email: string;
  name: string;
  avatar_url: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [githubUser, setGitHubUser] = useState<GitHubUser | null>(null);
  const { showOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();

  useEffect(() => {
    // Check for GitHub user in cookies
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setGitHubUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      }
    };
    checkAuth();
  }, []);

  // Show onboarding if needed
  if (!onboardingLoading && showOnboarding) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                DevFlow Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {githubUser ? (
                <>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {githubUser.name || githubUser.login}
                  </span>
                  <Avatar 
                    src={githubUser.avatar_url} 
                    alt={githubUser.login}
                    size="sm"
                  />
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Not connected
                  </span>
                  <GitHubAuthButton size="sm" />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {children}
    </>
  );
}