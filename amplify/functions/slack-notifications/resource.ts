import { defineFunction } from '@aws-amplify/backend';

export const slackNotifications = defineFunction({
  name: 'slack-notifications',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  resourceGroupName: 'data'
});