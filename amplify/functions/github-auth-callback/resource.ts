import { defineFunction, secret } from '@aws-amplify/backend';

export const githubAuthCallback = defineFunction({
  name: 'github-auth-callback',
  entry: './handler.ts',
  environment: {
    GITHUB_CLIENT_ID: 'temp_client_id',
    GITHUB_CLIENT_SECRET: 'temp_secret',
    GITHUB_REDIRECT_URI: 'http://localhost:3000/api/auth/github/callback',
    APP_URL: 'http://localhost:3000',
  },
  timeoutSeconds: 30,
});