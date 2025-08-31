import { defineFunction } from '@aws-amplify/backend';

export const wellnessAnalyzer = defineFunction({
  name: 'wellness-analyzer',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  resourceGroupName: 'data'
});