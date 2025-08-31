// This file contains only the type definitions for the client-side
// It does not import any backend or CDK dependencies

export interface Schema {
  User: {
    type: "model";
    properties: {
      email: string;
      githubUsername?: string | null;
      githubId?: string | null;
      githubAccessToken?: string | null;
      githubAvatarUrl?: string | null;
      displayName?: string | null;
      repositories?: Array<any>;
      pullRequests?: Array<any>;
      activities?: Array<any>;
      teams?: Array<any>;
      ownedTeams?: Array<any>;
      sentInvitations?: Array<any>;
      codeReviews?: Array<any>;
      onboardingProgress?: any;
      wellnessMetrics?: Array<any>;
      wellnessInsights?: Array<any>;
      id: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  Repository: {
    type: "model";
    properties: {
      userId: string;
      user?: any;
      githubId: string;
      name: string;
      fullName: string;
      description?: string | null;
      isPrivate: boolean;
      defaultBranch?: string | null;
      language?: string | null;
      stargazersCount?: number | null;
      forksCount?: number | null;
      openIssuesCount?: number | null;
      lastSyncedAt?: string | null;
      pullRequests?: Array<any>;
      builds?: Array<any>;
      activities?: Array<any>;
      id: string;
      createdAt: string;
      updatedAt: string;
      owner?: string | null;
    };
  };
  PullRequest: {
    type: "model";
    properties: {
      userId: string;
      user?: any;
      repositoryId: string;
      repository?: any;
      githubId: number;
      number: number;
      title: string;
      state: string;
      draft?: boolean | null;
      authorUsername: string;
      authorAvatarUrl?: string | null;
      createdAt: string;
      updatedAt: string;
      closedAt?: string | null;
      mergedAt?: string | null;
      headRef: string;
      baseRef: string;
      reviewStatus?: string | null;
      labels?: Array<string> | null;
      assignees?: Array<string> | null;
      activities?: Array<any>;
      codeReviews?: Array<any>;
      id: string;
      owner?: string | null;
    };
  };
  Build: {
    type: "model";
    properties: {
      repositoryId: string;
      repository?: any;
      commitSha: string;
      branch: string;
      status: string;
      conclusion?: string | null;
      startedAt?: string | null;
      completedAt?: string | null;
      duration?: number | null;
      url?: string | null;
      author?: string | null;
      message?: string | null;
      id: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  Activity: {
    type: "model";
    properties: {
      userId: string;
      user?: any;
      pullRequestId?: string | null;
      pullRequest?: any;
      repositoryId?: string | null;
      repository?: any;
      type: string;
      title: string;
      description?: string | null;
      metadata?: any;
      createdAt: string;
      id: string;
      updatedAt: string;
    };
  };
  Team: {
    type: "model";
    properties: {
      name: string;
      slug: string;
      description?: string | null;
      ownerId: string;
      owner?: any;
      members?: Array<any>;
      subscription?: any;
      invitations?: Array<any>;
      codeReviews?: Array<any>;
      slackIntegration?: any;
      wellnessInsights?: Array<any>;
      monthlyReviewCount?: number | null;
      reviewCountResetDate?: string | null;
      slackWebhookUrl?: string | null;
      createdAt: string;
      updatedAt: string;
      id: string;
    };
  };
  TeamMember: {
    type: "model";
    properties: {
      teamId: string;
      team?: any;
      userId: string;
      user?: any;
      role: string;
      joinedAt: string;
      id: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  TeamSubscription: {
    type: "model";
    properties: {
      teamId: string;
      team?: any;
      tier: string;
      status: string;
      maxMembers: number;
      maxRepositories: number;
      features?: Array<string> | null;
      billingCycle?: string | null;
      currentPeriodStart?: string | null;
      currentPeriodEnd?: string | null;
      cancelledAt?: string | null;
      createdAt: string;
      updatedAt: string;
      id: string;
    };
  };
  TeamInvitation: {
    type: "model";
    properties: {
      teamId: string;
      team?: any;
      email: string;
      invitedBy: string;
      inviter?: any;
      token: string;
      status: string;
      expiresAt: string;
      acceptedAt?: string | null;
      createdAt: string;
      id: string;
      updatedAt: string;
    };
  };
  OnboardingProgress: {
    type: "model";
    properties: {
      userId: string;
      user?: any;
      currentStep: string;
      completedSteps?: Array<string> | null;
      skippedSteps?: Array<string> | null;
      metadata?: any;
      completedAt?: string | null;
      createdAt: string;
      updatedAt: string;
      id: string;
    };
  };
  AICodeReview: {
    type: "model";
    properties: {
      teamId: string;
      team?: any;
      userId: string;
      user?: any;
      pullRequestId?: string | null;
      pullRequest?: any;
      repositoryName: string;
      branchName: string;
      codeSnippet: string;
      language: string;
      reviewType: string;
      reviewContent: string;
      severity?: string | null;
      suggestions?: any;
      metadata?: any;
      createdAt: string;
      updatedAt: string;
      id: string;
    };
  };
  SlackIntegration: {
    type: "model";
    properties: {
      teamId: string;
      team?: any;
      workspaceId: string;
      workspaceName: string;
      channelId: string;
      channelName: string;
      webhookUrl: string;
      accessToken: string;
      botUserId?: string | null;
      status: string;
      notificationSettings?: any;
      lastTestAt?: string | null;
      monthlyNotificationCount?: number | null;
      notificationCountResetDate?: string | null;
      createdAt: string;
      updatedAt: string;
      id: string;
    };
  };
  SlackNotificationSettings: {
    type: "model";
    properties: {
      slackIntegrationId: string;
      slackIntegration?: any;
      notifyPrCreated?: boolean | null;
      notifyPrMerged?: boolean | null;
      notifyPrClosed?: boolean | null;
      notifyPrReviewRequested?: boolean | null;
      notifyPrReviewCompleted?: boolean | null;
      notifyBuildFailure?: boolean | null;
      notifyBuildSuccess?: boolean | null;
      notifyBuildRecovered?: boolean | null;
      notifyCodeReviewCompleted?: boolean | null;
      notifyCodeReviewCritical?: boolean | null;
      notificationHours?: any;
      enabledDays?: Array<string> | null;
      mutedRepositories?: Array<string> | null;
      mentionUsersOnCritical?: boolean | null;
      createdAt: string;
      updatedAt: string;
      id: string;
    };
  };
  DeveloperWellnessMetrics: {
    type: "model";
    properties: {
      userId: string;
      user?: any;
      date: string;
      codingHours: number;
      breakTime: number;
      focusSessions: number;
      averageFocusDuration?: number | null;
      longestFocusDuration?: number | null;
      totalCommits: number;
      morningCommits?: number | null;
      afternoonCommits?: number | null;
      eveningCommits?: number | null;
      lateNightCommits?: number | null;
      weekendCommits?: number | null;
      prsOpened: number;
      prsReviewed: number;
      prsMerged: number;
      averagePrSize?: number | null;
      prVelocity?: number | null;
      firstActivityTime?: string | null;
      lastActivityTime?: string | null;
      consecutiveWorkDays?: number | null;
      lastDayOff?: string | null;
      burnoutRiskScore?: number | null;
      workLifeBalanceScore?: number | null;
      focusScore?: number | null;
      rawActivityData?: any;
      createdAt: string;
      updatedAt: string;
      id: string;
    };
  };
  WellnessInsight: {
    type: "model";
    properties: {
      userId: string;
      user?: any;
      teamId?: string | null;
      team?: any;
      type: string;
      category: string;
      severity?: string | null;
      title: string;
      message: string;
      actionItems?: Array<string> | null;
      relatedMetrics?: any;
      isRead?: boolean | null;
      isDismissed?: boolean | null;
      validUntil?: string | null;
      createdAt: string;
      updatedAt: string;
      id: string;
    };
  };
}