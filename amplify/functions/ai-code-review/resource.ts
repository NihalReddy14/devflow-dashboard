import { defineFunction } from '@aws-amplify/backend';

export const aiCodeReview = defineFunction({
  name: 'ai-code-review',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512
});