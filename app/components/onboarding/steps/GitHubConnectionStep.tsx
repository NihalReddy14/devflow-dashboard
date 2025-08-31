'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/client-schema';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

interface GitHubConnectionStepProps {
  onConnected: () => void;
}

export default function GitHubConnectionStep({ onConnected }: GitHubConnectionStepProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkGitHubConnection();
  }, []);

  const checkGitHubConnection = async () => {
    try {
      const user = await getCurrentUser();
      const { data: userData } = await client.models.User.list({
        filter: { email: { eq: user.signInDetails?.loginId || '' } }
      });

      if (userData && userData.length > 0 && userData[0].githubAccessToken) {
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Initiate GitHub OAuth flow
      window.location.href = '/api/auth/github/initiate';
    } catch (error) {
      console.error('Error connecting to GitHub:', error);
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          GitHub Connected Successfully!
        </h2>
        
        <p className="text-gray-600 mb-8">
          Your GitHub account is connected and we're ready to start tracking your development activity.
        </p>

        <Button onClick={onConnected}>
          Continue to Next Step
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
        Connect Your GitHub Account
      </h2>
      
      <p className="text-gray-600 mb-2 text-center">
        Connect your GitHub account to start tracking your repositories, pull requests, and development activity.
      </p>
      <p className="text-sm text-blue-600 mb-8 text-center font-medium">
        Free tier includes tracking for up to 5 repositories!
      </p>

      <Card className="p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            What we'll access:
          </h3>
          <Badge variant="info">Secure OAuth 2.0</Badge>
        </div>
        
        <ul className="space-y-3 mb-6">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">
              <strong>Repository metadata</strong> - Names, descriptions, and activity stats (not code)
            </span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">
              <strong>Pull requests & Issues</strong> - Track team collaboration and progress
            </span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">
              <strong>Commit activity</strong> - Understand development patterns and velocity
            </span>
          </li>
        </ul>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h4 className="text-sm font-semibold text-green-800">Privacy First</h4>
            </div>
            <p className="text-xs text-green-700">
              We never access or store your source code. Only metadata for analytics.
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h4 className="text-sm font-semibold text-blue-800">Revoke Anytime</h4>
            </div>
            <p className="text-xs text-blue-700">
              You can disconnect GitHub access at any time from your GitHub settings.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={handleConnect}
            disabled={connecting}
            size="lg"
            className="inline-flex items-center"
          >
            {connecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Connect with GitHub
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 mt-3">
            Uses GitHub's secure OAuth 2.0 authentication
          </p>
        </div>
      </Card>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">
          By connecting, you agree to our terms of service and privacy policy.
        </p>
        <p className="text-xs text-gray-400">
          DevFlow is not affiliated with GitHub, Inc.
        </p>
      </div>
    </div>
  );
}