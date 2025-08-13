import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { auth } from '../auth/resource';
import { syncGithubData } from '../functions/sync-github-data/resource';

const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      githubUsername: a.string(),
      githubId: a.string(),
      githubAccessToken: a.string(),
      githubAvatarUrl: a.string(),
      displayName: a.string(),
      repositories: a.hasMany('Repository', 'userId'),
      pullRequests: a.hasMany('PullRequest', 'userId'),
      activities: a.hasMany('Activity', 'userId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('email'),
      allow.groups(['ADMINS']),
    ]),

  Repository: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      githubId: a.string().required(),
      name: a.string().required(),
      fullName: a.string().required(),
      description: a.string(),
      isPrivate: a.boolean().required(),
      defaultBranch: a.string(),
      language: a.string(),
      stargazersCount: a.integer(),
      forksCount: a.integer(),
      openIssuesCount: a.integer(),
      lastSyncedAt: a.datetime(),
      pullRequests: a.hasMany('PullRequest', 'repositoryId'),
      builds: a.hasMany('Build', 'repositoryId'),
      activities: a.hasMany('Activity', 'repositoryId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['DEVELOPERS', 'ADMINS']),
    ]),

  PullRequest: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      repositoryId: a.id().required(),
      repository: a.belongsTo('Repository', 'repositoryId'),
      githubId: a.integer().required(),
      number: a.integer().required(),
      title: a.string().required(),
      state: a.string().required(),
      draft: a.boolean(),
      authorUsername: a.string().required(),
      authorAvatarUrl: a.string(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      closedAt: a.datetime(),
      mergedAt: a.datetime(),
      headRef: a.string().required(),
      baseRef: a.string().required(),
      reviewStatus: a.string(),
      labels: a.string().array(),
      assignees: a.string().array(),
      activities: a.hasMany('Activity', 'pullRequestId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['DEVELOPERS', 'ADMINS']),
    ]),

  Build: a
    .model({
      repositoryId: a.id().required(),
      repository: a.belongsTo('Repository', 'repositoryId'),
      commitSha: a.string().required(),
      branch: a.string().required(),
      status: a.string().required(),
      conclusion: a.string(),
      startedAt: a.datetime(),
      completedAt: a.datetime(),
      duration: a.integer(),
      url: a.string(),
      author: a.string(),
      message: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['DEVELOPERS', 'ADMINS']),
    ]),

  Activity: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      pullRequestId: a.id(),
      pullRequest: a.belongsTo('PullRequest', 'pullRequestId'),
      repositoryId: a.id(),
      repository: a.belongsTo('Repository', 'repositoryId'),
      type: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      metadata: a.json(),
      createdAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['DEVELOPERS', 'ADMINS']),
    ]),

  syncGitHubData: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      githubToken: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(syncGithubData)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
