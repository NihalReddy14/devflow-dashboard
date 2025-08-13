import { defineFunction, secret } from '@aws-amplify/backend';

export const githubAuthInitiate = defineFunction({
  name: 'github-auth-initiate',
  entry: './handler.ts',
  environment: {
    GITHUB_CLIENT_ID: 'temp_client_id',
    GITHUB_REDIRECT_URI: 'http://localhost:3000/api/auth/github/callback',
  },
  timeoutSeconds: 10,
});