import { defineFunction } from '@aws-amplify/backend';

export const calculateDoraMetrics = defineFunction({
  name: 'calculate-dora-metrics',
  environment: {
    AMPLIFY_DATA_GRAPHQL_ENDPOINT: process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT || '',
  },
  timeoutSeconds: 300, // 5 minutes for processing all repositories
  memoryMB: 512,
});