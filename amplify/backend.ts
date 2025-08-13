import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { githubAuthInitiate } from './functions/github-auth-initiate/resource';
import { githubAuthCallback } from './functions/github-auth-callback/resource';
import { syncGithubData } from './functions/sync-github-data/resource';
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

// Environment variables will be added through the resource definitions
