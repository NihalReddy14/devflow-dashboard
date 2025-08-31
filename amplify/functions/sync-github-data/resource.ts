import { defineFunction } from '@aws-amplify/backend';

export const syncGithubData = defineFunction({
  name: 'sync-github-data',
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes for large sync operations
  memoryMB: 512,
  environment: {
    // Environment variables will be auto-populated by Amplify
  },
  resourceGroupName: 'data'
});