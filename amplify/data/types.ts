// This file exports only the types from the schema, without any CDK dependencies
// Use this file for frontend imports to avoid CDK build errors

import { type ClientSchema, a } from '@aws-amplify/backend';

// Re-export the schema definition without the backend dependencies
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
      teams: a.hasMany('TeamMember', 'userId'),
      ownedTeams: a.hasMany('Team', 'ownerId'),
      sentInvitations: a.hasMany('TeamInvitation', 'invitedBy'),
      codeReviews: a.hasMany('AICodeReview', 'userId'),
      onboardingProgress: a.hasOne('OnboardingProgress', 'userId'),
      wellnessMetrics: a.hasMany('DeveloperWellnessMetrics', 'userId'),
      wellnessInsights: a.hasMany('WellnessInsight', 'userId'),
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
      codeReviews: a.hasMany('AICodeReview', 'pullRequestId'),
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

  Team: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      description: a.string(),
      ownerId: a.id().required(),
      owner: a.belongsTo('User', 'ownerId'),
      members: a.hasMany('TeamMember', 'teamId'),
      subscription: a.hasOne('TeamSubscription', 'teamId'),
      invitations: a.hasMany('TeamInvitation', 'teamId'),
      codeReviews: a.hasMany('AICodeReview', 'teamId'),
      slackIntegration: a.hasOne('SlackIntegration', 'teamId'),
      wellnessInsights: a.hasMany('WellnessInsight', 'teamId'),
      monthlyReviewCount: a.integer().default(0),
      reviewCountResetDate: a.datetime(),
      slackWebhookUrl: a.string(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('ownerId'),
      allow.groups(['ADMINS']),
    ]),

  TeamMember: a
    .model({
      teamId: a.id().required(),
      team: a.belongsTo('Team', 'teamId'),
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      role: a.string().required(), // 'owner' | 'admin' | 'member'
      joinedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.groups(['ADMINS']),
    ]),

  TeamSubscription: a
    .model({
      teamId: a.id().required(),
      team: a.belongsTo('Team', 'teamId'),
      tier: a.string().required(), // 'free' | 'pro' | 'enterprise'
      status: a.string().required(), // 'active' | 'inactive' | 'cancelled'
      maxMembers: a.integer().required(),
      maxRepositories: a.integer().required(),
      features: a.string().array(), // Array of enabled features
      billingCycle: a.string(), // 'monthly' | 'yearly'
      currentPeriodStart: a.datetime(),
      currentPeriodEnd: a.datetime(),
      cancelledAt: a.datetime(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['ADMINS']),
    ]),

  TeamInvitation: a
    .model({
      teamId: a.id().required(),
      team: a.belongsTo('Team', 'teamId'),
      email: a.string().required(),
      invitedBy: a.id().required(),
      inviter: a.belongsTo('User', 'invitedBy'),
      token: a.string().required(),
      status: a.string().required(), // 'pending' | 'accepted' | 'expired'
      expiresAt: a.datetime().required(),
      acceptedAt: a.datetime(),
      createdAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['ADMINS']),
    ]),

  OnboardingProgress: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      currentStep: a.string().required(), // 'welcome' | 'github' | 'team' | 'tour' | 'completed'
      completedSteps: a.string().array(),
      skippedSteps: a.string().array(),
      metadata: a.json(), // Store additional onboarding data
      completedAt: a.datetime(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.groups(['ADMINS']),
    ]),

  AICodeReview: a
    .model({
      teamId: a.id().required(),
      team: a.belongsTo('Team', 'teamId'),
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      pullRequestId: a.id(),
      pullRequest: a.belongsTo('PullRequest', 'pullRequestId'),
      repositoryName: a.string().required(),
      branchName: a.string().required(),
      codeSnippet: a.string().required(),
      language: a.string().required(),
      reviewType: a.string().required(), // 'security' | 'performance' | 'best-practices' | 'general'
      reviewContent: a.string().required(),
      severity: a.string(), // 'critical' | 'high' | 'medium' | 'low' | 'info'
      suggestions: a.json(), // Array of suggested improvements
      metadata: a.json(), // Additional review metadata
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.groups(['ADMINS']),
    ]),

  SlackIntegration: a
    .model({
      teamId: a.id().required(),
      team: a.belongsTo('Team', 'teamId'),
      workspaceId: a.string().required(),
      workspaceName: a.string().required(),
      channelId: a.string().required(),
      channelName: a.string().required(),
      webhookUrl: a.string().required(),
      accessToken: a.string().required(),
      botUserId: a.string(),
      status: a.string().required(), // 'active' | 'inactive' | 'error'
      notificationSettings: a.hasOne('SlackNotificationSettings', 'slackIntegrationId'),
      lastTestAt: a.datetime(),
      monthlyNotificationCount: a.integer().default(0),
      notificationCountResetDate: a.datetime(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['ADMINS']),
    ]),

  SlackNotificationSettings: a
    .model({
      slackIntegrationId: a.id().required(),
      slackIntegration: a.belongsTo('SlackIntegration', 'slackIntegrationId'),
      // PR notifications
      notifyPrCreated: a.boolean().default(true),
      notifyPrMerged: a.boolean().default(true),
      notifyPrClosed: a.boolean().default(false),
      notifyPrReviewRequested: a.boolean().default(true),
      notifyPrReviewCompleted: a.boolean().default(true),
      // Build notifications
      notifyBuildFailure: a.boolean().default(true),
      notifyBuildSuccess: a.boolean().default(false),
      notifyBuildRecovered: a.boolean().default(true),
      // Code review notifications
      notifyCodeReviewCompleted: a.boolean().default(true),
      notifyCodeReviewCritical: a.boolean().default(true),
      // General settings
      notificationHours: a.json(), // { start: "09:00", end: "18:00", timezone: "America/New_York" }
      enabledDays: a.string().array(), // ["monday", "tuesday", "wednesday", "thursday", "friday"]
      mutedRepositories: a.string().array(), // Repository IDs to mute
      mentionUsersOnCritical: a.boolean().default(true),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated(),
      allow.groups(['ADMINS']),
    ]),

  DeveloperWellnessMetrics: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      date: a.date().required(),
      // Work metrics
      codingHours: a.float().required(), // Total hours spent coding
      breakTime: a.float().required(), // Total break time in hours
      focusSessions: a.integer().required(), // Number of deep work sessions
      averageFocusDuration: a.float(), // Average duration of focus sessions in minutes
      longestFocusDuration: a.float(), // Longest focus session in minutes
      // Commit patterns
      totalCommits: a.integer().required(),
      morningCommits: a.integer(), // 6am-12pm
      afternoonCommits: a.integer(), // 12pm-6pm
      eveningCommits: a.integer(), // 6pm-12am
      lateNightCommits: a.integer(), // 12am-6am
      weekendCommits: a.integer(),
      // PR metrics
      prsOpened: a.integer().required(),
      prsReviewed: a.integer().required(),
      prsMerged: a.integer().required(),
      averagePrSize: a.float(), // Average lines changed per PR
      prVelocity: a.float(), // PRs completed per day
      // Work patterns
      firstActivityTime: a.time(), // First activity of the day
      lastActivityTime: a.time(), // Last activity of the day
      consecutiveWorkDays: a.integer(), // Days worked without break
      lastDayOff: a.date(), // Last day with no activity
      // Wellness scores
      burnoutRiskScore: a.float(), // 0-100, higher is worse
      workLifeBalanceScore: a.float(), // 0-100, higher is better
      focusScore: a.float(), // 0-100, higher is better
      // Metadata
      rawActivityData: a.json(), // Store raw activity data for analysis
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.groups(['ADMINS']),
    ])
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['date']).name('byUserAndDate'),
    ]),

  WellnessInsight: a
    .model({
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      teamId: a.id(), // Optional, for team-level insights
      team: a.belongsTo('Team', 'teamId'),
      type: a.string().required(), // 'tip' | 'warning' | 'achievement' | 'recommendation'
      category: a.string().required(), // 'burnout' | 'focus' | 'balance' | 'productivity' | 'health'
      severity: a.string(), // 'info' | 'warning' | 'critical'
      title: a.string().required(),
      message: a.string().required(),
      actionItems: a.string().array(), // Specific actions to take
      relatedMetrics: a.json(), // Metrics that triggered this insight
      isRead: a.boolean().default(false),
      isDismissed: a.boolean().default(false),
      validUntil: a.datetime(), // When this insight expires
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('userId'),
      allow.groups(['ADMINS']),
    ])
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['createdAt']).name('byUserAndCreatedAt'),
      index('teamId').sortKeys(['createdAt']).name('byTeamAndCreatedAt'),
    ]),

  syncGitHubData: a
    .mutation()
    .arguments({
      userId: a.string().required(),
      githubToken: a.string().required(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function('syncGithubData')),

  performAICodeReview: a
    .mutation()
    .arguments({
      teamId: a.string().required(),
      codeSnippet: a.string().required(),
      language: a.string().required(),
      reviewType: a.string().required(),
      repositoryName: a.string(),
      branchName: a.string(),
      pullRequestId: a.string(),
    })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function('aiCodeReview')),
});

export type Schema = ClientSchema<typeof schema>;