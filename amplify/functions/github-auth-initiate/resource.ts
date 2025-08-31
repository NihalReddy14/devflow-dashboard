import { defineFunction, secret } from '@aws-amplify/backend';

export const githubAuthInitiate = defineFunction({
  name: 'github-auth-initiate',
  entry: './handler.ts',
  environment: {
    GITHUB_CLIENT_ID: secret('GITHUB_CLIENT_ID'),
    GITHUB_REDIRECT_URI: process.env.NEXTAUTH_URL ? 
      `${process.env.NEXTAUTH_URL}/api/auth/github/callback` : 
      'http://localhost:3000/api/auth/github/callback',
  },
  timeoutSeconds: 10,
});