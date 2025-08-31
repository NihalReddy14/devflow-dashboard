import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/client-schema";

const client = generateClient<Schema>();

export type SlackNotificationType = 
  | 'pr_created' 
  | 'pr_merged' 
  | 'pr_review_requested' 
  | 'pr_review_completed' 
  | 'build_failure' 
  | 'build_success' 
  | 'build_recovered' 
  | 'code_review_completed' 
  | 'code_review_critical';

interface SlackNotificationData {
  repository?: string;
  title?: string;
  url?: string;
  author?: string;
  branch?: string;
  mergedBy?: string;
  error?: string;
  logUrl?: string;
  issue?: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

/**
 * Send a Slack notification for a team event
 * This is a client-side helper that would typically call a server endpoint
 * that invokes the Lambda function
 */
export async function sendSlackNotification(
  teamId: string,
  type: SlackNotificationType,
  data: SlackNotificationData
): Promise<boolean> {
  try {
    // In production, you would call an API endpoint that invokes the Lambda
    const response = await fetch('/api/slack/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, type, data }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return false;
  }
}

/**
 * Check if a team has an active Slack integration
 */
export async function checkSlackIntegration(teamId: string): Promise<boolean> {
  try {
    const { data } = await client.models.SlackIntegration.list({
      filter: { 
        teamId: { eq: teamId },
        status: { eq: 'active' }
      }
    });

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking Slack integration:', error);
    return false;
  }
}

/**
 * Helper to format PR notification data
 */
export function formatPRNotification(pr: any, repository: any): SlackNotificationData {
  return {
    repository: repository.name,
    title: pr.title,
    url: pr.html_url || `https://github.com/${repository.full_name}/pull/${pr.number}`,
    author: pr.user?.login || pr.authorUsername,
    branch: pr.head?.ref || pr.headRef,
  };
}

/**
 * Helper to format build notification data
 */
export function formatBuildNotification(build: any, repository: any): SlackNotificationData {
  return {
    repository: repository.name,
    branch: build.branch,
    error: build.conclusion === 'failure' ? build.message || 'Build failed' : undefined,
    logUrl: build.url,
  };
}

/**
 * Helper to format code review notification data
 */
export function formatCodeReviewNotification(review: any, repository?: any): SlackNotificationData {
  return {
    repository: repository?.name || review.repositoryName,
    issue: review.reviewContent,
    file: review.metadata?.file,
    line: review.metadata?.line,
    suggestion: review.suggestions?.[0]?.suggestion,
  };
}