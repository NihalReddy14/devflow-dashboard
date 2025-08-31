import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { githubAuthInitiate } from './functions/github-auth-initiate/resource';
import { githubAuthCallback } from './functions/github-auth-callback/resource';
import { syncGithubData } from './functions/sync-github-data/resource';
import { aiCodeReview } from './functions/ai-code-review/resource';
import { slackNotifications } from './functions/slack-notifications/resource';
// import { wellnessAnalyzer } from './functions/wellness-analyzer/resource';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  githubAuthInitiate,
  githubAuthCallback,
  syncGithubData,
  aiCodeReview,
  slackNotifications,
  // wellnessAnalyzer,
});

// Grant the callback function permissions to manage Cognito users
backend.githubAuthCallback.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'cognito-idp:AdminCreateUser',
      'cognito-idp:AdminSetUserPassword',
      'cognito-idp:AdminUpdateUserAttributes',
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:AdminGetUser',
    ],
    resources: [
      backend.auth.resources.userPool.userPoolArn,
    ],
  })
);

// Grant the AI code review function permissions for Bedrock
backend.aiCodeReview.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'bedrock:InvokeModel',
      'bedrock:ListModels',
    ],
    resources: ['*'], // Bedrock requires wildcard for model invocation
  })
);

// Note: Data access permissions are automatically granted when functions are in the 'data' resource group

// Grant permissions for wellness analyzer function
// backend.data.resources.tables['DeveloperWellnessMetrics'].grantReadWriteData(backend.wellnessAnalyzer.resources.lambda);
// backend.data.resources.tables['WellnessInsight'].grantReadWriteData(backend.wellnessAnalyzer.resources.lambda);

// Set environment variables for wellness analyzer
// const wellnessMetricsTable = backend.data.resources.tables['DeveloperWellnessMetrics'];
// const wellnessInsightTable = backend.data.resources.tables['WellnessInsight'];
// const wellnessAnalyzerLambda = backend.wellnessAnalyzer.resources.lambda as any;
// if (wellnessAnalyzerLambda.addEnvironment) {
//   wellnessAnalyzerLambda.addEnvironment(
//     'WELLNESS_METRICS_TABLE_NAME',
//     wellnessMetricsTable.tableName
//   );
//   wellnessAnalyzerLambda.addEnvironment(
//     'WELLNESS_INSIGHT_TABLE_NAME',
//     wellnessInsightTable.tableName
//   );
// }

// Configure DynamoDB streams for wellness metrics
// Note: DynamoDB streams configuration would be done through CDK if needed
// For now, we'll use polling or GraphQL subscriptions instead

// Environment variables will be added through the resource definitions
