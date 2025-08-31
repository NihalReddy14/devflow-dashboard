// Centralized Amplify client configuration
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import outputs from '@/amplify_outputs.json';

// Configure Amplify once
Amplify.configure(outputs, { ssr: true });

// Generate the client
export const dataClient = generateClient();

// Export types for models
export type UserModel = {
  email: string;
  githubUsername?: string | null;
  githubId?: string | null;
  githubAccessToken?: string | null;
  githubAvatarUrl?: string | null;
  displayName?: string | null;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RepositoryModel = {
  userId: string;
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
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TeamModel = {
  name: string;
  description?: string | null;
  ownerId: string;
  slackWebhookUrl?: string | null;
  slackChannelId?: string | null;
  githubOrganization?: string | null;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SlackIntegrationModel = {
  teamId: string;
  slackTeamId: string;
  slackTeamName: string;
  slackChannelId: string;
  slackChannelName: string;
  slackWebhookUrl?: string | null;
  slackBotToken?: string | null;
  isActive: boolean;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SlackNotificationSettingsModel = {
  teamId: string;
  enablePrNotifications: boolean;
  enableBuildNotifications: boolean;
  enableReviewNotifications: boolean;
  enableMergeNotifications: boolean;
  notifyOnPrOpen: boolean;
  notifyOnPrComment: boolean;
  notifyOnPrApproval: boolean;
  notifyOnPrMerge: boolean;
  notifyOnBuildStart: boolean;
  notifyOnBuildSuccess: boolean;
  notifyOnBuildFailure: boolean;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OnboardingProgressModel = {
  userId: string;
  currentStep: 'welcome' | 'github' | 'team' | 'completed';
  completedSteps: string[];
  skippedSteps: string[];
  isCompleted: boolean;
  completedAt?: string | null;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DeveloperWellnessMetricsModel = {
  userId: string;
  date: string;
  codingHours: number;
  breakTime: number;
  focusSessions: number;
  averageFocusDuration: number;
  longestFocusDuration: number;
  totalCommits: number;
  morningCommits: number;
  afternoonCommits: number;
  eveningCommits: number;
  lateNightCommits: number;
  weekendCommits: number;
  prsOpened: number;
  prsReviewed: number;
  prsMerged: number;
  averagePrSize: number;
  prVelocity: number;
  firstActivityTime?: string | null;
  lastActivityTime?: string | null;
  consecutiveWorkDays: number;
  lastDayOff?: string | null;
  burnoutRiskScore: number;
  workLifeBalanceScore: number;
  focusScore: number;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WellnessInsightModel = {
  userId: string;
  teamId?: string | null;
  type: 'tip' | 'warning' | 'achievement' | 'recommendation';
  category: 'burnout' | 'focus' | 'balance' | 'productivity' | 'health';
  severity?: 'info' | 'warning' | 'critical' | null;
  title: string;
  message: string;
  actionItems?: string[] | null;
  relatedMetrics?: any | null;
  isRead: boolean;
  isDismissed: boolean;
  validUntil?: string | null;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};