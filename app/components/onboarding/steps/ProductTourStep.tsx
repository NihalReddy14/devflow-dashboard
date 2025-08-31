'use client';

import { useState } from 'react';
// import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';

interface ProductTourStepProps {
  onComplete: () => void;
}

export default function ProductTourStep({ onComplete }: ProductTourStepProps) {
  const [runTour, setRunTour] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);

  const tourSteps: any[] = [
    {
      target: '.tour-dashboard',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Welcome to Your Dashboard!</h3>
          <p>This is your command center for tracking team development activity in real-time.</p>
          <p className="text-sm text-blue-600 mt-2">Free tier includes all essential features!</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-activity-feed',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Real-time Activity Feed</h3>
          <p>See commits, pull requests, and code reviews as they happen across your repositories.</p>
          <p className="text-sm text-gray-600 mt-2">Updates appear instantly without refreshing!</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-analytics',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Productivity Analytics</h3>
          <p>Understand your team's work patterns with visual charts and insights.</p>
          <p className="text-sm text-gray-600 mt-2">Track velocity, PR cycle time, and more.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-repositories',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Repository Overview</h3>
          <p>Monitor activity across all your connected repositories.</p>
          <p className="text-sm text-green-600 mt-2">Free tier supports up to 5 repositories!</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-team-members',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Team Collaboration</h3>
          <p>See individual contributions and team member activity at a glance.</p>
          <p className="text-sm text-gray-600 mt-2">Perfect for daily standups!</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.tour-realtime-indicator',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Real-time Connection</h3>
          <p>Know when your dashboard is syncing with GitHub for live updates.</p>
          <p className="text-sm text-gray-600 mt-2">Green means you're connected!</p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  const handleJoyrideCallback = (data: any) => {
    // Temporarily disabled due to React 19 compatibility
    setTourCompleted(true);
    setRunTour(false);
  };

  const startTour = () => {
    setRunTour(true);
  };

  return (
    <div>
      {/* <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={runTour}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={tourSteps}
        styles={{
          options: {
            arrowColor: '#fff',
            backgroundColor: '#fff',
            primaryColor: '#2563eb',
            textColor: '#374151',
            zIndex: 10000,
          },
          spotlight: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      /> */}

      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
        Take a Quick Tour
      </h2>
      
      <p className="text-gray-600 mb-2 text-center">
        Let us show you around the dashboard and highlight key features to help you get started.
      </p>
      <p className="text-sm text-blue-600 mb-8 text-center font-medium">
        This 2-minute tour will help you get the most out of DevFlow!
      </p>

      {/* Mock Dashboard Preview */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="space-y-4">
          <div className="tour-dashboard bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Dashboard Overview</h3>
              <Badge variant="success">Free Tier</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">Active PRs</p>
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">12</p>
                <p className="text-xs text-blue-500 mt-1">↑ 20%</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">Commits Today</p>
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">45</p>
                <p className="text-xs text-green-500 mt-1">On track</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">Team Members</p>
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-1">3</p>
                <p className="text-xs text-purple-500 mt-1">Active now</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="tour-activity-feed bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Activity Feed
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-gray-600">PR #123 merged by Sarah</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <span className="text-gray-600">New commit to main</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </span>
                  <span className="text-gray-600">Review requested</span>
                </div>
              </div>
            </div>

            <div className="tour-analytics bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-medium text-gray-800 mb-3">Analytics</h4>
              <div className="h-24 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 rounded-lg opacity-50"></div>
                <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 40">
                  <path d="M0,30 L20,20 L40,25 L60,10 L80,15 L100,5" stroke="#3B82F6" strokeWidth="2" fill="none" />
                  <circle cx="20" cy="20" r="3" fill="#3B82F6" />
                  <circle cx="40" cy="25" r="3" fill="#3B82F6" />
                  <circle cx="60" cy="10" r="3" fill="#3B82F6" />
                  <circle cx="80" cy="15" r="3" fill="#3B82F6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="tour-repositories bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-medium text-gray-800 mb-3">Repositories (3/5)</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    frontend-app
                  </span>
                  <span className="text-xs text-gray-500">23 commits</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    backend-api
                  </span>
                  <span className="text-xs text-gray-500">18 commits</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    mobile-app
                  </span>
                  <span className="text-xs text-gray-500">5 commits</span>
                </div>
              </div>
            </div>

            <div className="tour-team-members bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h4 className="font-medium text-gray-800 mb-3">Team Members (3/3)</h4>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    JS
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    AK
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    MR
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full"></span>
                </div>
              </div>
            </div>
          </div>

          <div className="tour-realtime-indicator bg-white p-3 rounded-lg shadow-md text-center">
            <span className="text-sm text-green-600 font-medium flex items-center justify-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Real-time updates active - Connected to GitHub
            </span>
          </div>
        </div>
      </Card>

      <div className="text-center">
        {!tourCompleted ? (
          <div>
            <Button
              onClick={startTour}
              size="lg"
              className="mb-4"
            >
              Start Interactive Tour
            </Button>
            <p className="text-sm text-gray-500">
              This will guide you through the main features of the dashboard
            </p>
          </div>
        ) : (
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Tour Completed!
            </h3>
            <p className="text-gray-600 mb-6">
              You're all set to start using DevFlow Dashboard.
            </p>
            <Button onClick={onComplete} size="lg">
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}