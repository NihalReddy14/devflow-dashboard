import { defineFunction, secret } from '@aws-amplify/backend';

export const githubAuthCallback = defineFunction({
  name: 'github-auth-callback',
  entry: './handler.ts',
  environment: {
    GITHUB_CLIENT_ID: secret('GITHUB_CLIENT_ID'),
    GITHUB_CLIENT_SECRET: secret('GITHUB_CLIENT_SECRET'),
    GITHUB_REDIRECT_URI: process.env.NEXTAUTH_URL ? 
      `${process.env.NEXTAUTH_URL}/api/auth/github/callback` : 
      'http://localhost:3000/api/auth/github/callback',
    APP_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  timeoutSeconds: 30,
});