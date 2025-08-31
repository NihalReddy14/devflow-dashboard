import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/client-schema";
import { Amplify } from 'aws-amplify';
import config from '../../../../amplify_outputs.json';

// Configure Amplify for server-side
Amplify.configure(config, { ssr: true });

const client = generateClient<Schema>();

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '';
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/slack/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle errors
  if (error) {
    return NextResponse.redirect(new URL('/dashboard?slack_error=cancelled', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?slack_error=invalid_request', request.url));
  }

  try {
    // Decode state to get teamId
    const { teamId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code: code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData);
      return NextResponse.redirect(new URL('/dashboard?slack_error=auth_failed', request.url));
    }

    // Extract relevant data
    const {
      access_token,
      incoming_webhook,
      team,
      authed_user,
    } = tokenData;

    // Create or update Slack integration
    const integrationData = {
      teamId,
      workspaceId: team.id,
      workspaceName: team.name,
      channelId: incoming_webhook.channel_id,
      channelName: incoming_webhook.channel,
      webhookUrl: incoming_webhook.url,
      accessToken: access_token,
      botUserId: authed_user.id,
      status: 'active',
      monthlyNotificationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check if integration already exists
    const { data: existingIntegrations } = await client.models.SlackIntegration.list({
      filter: { teamId: { eq: teamId } }
    });

    if (existingIntegrations && existingIntegrations.length > 0) {
      // Update existing integration
      await client.models.SlackIntegration.update({
        id: existingIntegrations[0].id,
        ...integrationData,
      });
    } else {
      // Create new integration
      const { data: newIntegration } = await client.models.SlackIntegration.create(integrationData);
      
      // Create default notification settings
      if (newIntegration) {
        await client.models.SlackNotificationSettings.create({
          slackIntegrationId: newIntegration.id,
          notifyPrCreated: true,
          notifyPrMerged: true,
          notifyPrClosed: false,
          notifyPrReviewRequested: true,
          notifyPrReviewCompleted: true,
          notifyBuildFailure: true,
          notifyBuildSuccess: false,
          notifyBuildRecovered: true,
          notifyCodeReviewCompleted: true,
          notifyCodeReviewCritical: true,
          mentionUsersOnCritical: true,
          notificationHours: JSON.stringify({
            enabled: false,
            start: "09:00",
            end: "18:00",
            timezone: "America/New_York"
          }),
          enabledDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          mutedRepositories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Also update the team's slackWebhookUrl for backward compatibility
    await client.models.Team.update({
      id: teamId,
      slackWebhookUrl: incoming_webhook.url,
    });

    // Send a welcome message to Slack
    await sendWelcomeMessage(incoming_webhook.url, team.name);

    return NextResponse.redirect(new URL('/dashboard?slack_connected=true', request.url));
  } catch (error) {
    console.error('Error handling Slack callback:', error);
    return NextResponse.redirect(new URL('/dashboard?slack_error=server_error', request.url));
  }
}

async function sendWelcomeMessage(webhookUrl: string, teamName: string) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🎉 *DevFlow Dashboard Connected Successfully!*\n\n*${teamName}* is now connected to DevFlow. You'll receive notifications for:`
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "✅ Pull Request updates"
              },
              {
                type: "mrkdwn",
                text: "🔨 Build failures"
              },
              {
                type: "mrkdwn",
                text: "🤖 AI Code Review alerts"
              },
              {
                type: "mrkdwn",
                text: "📊 Team activity summaries"
              }
            ]
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "You can customize your notification preferences in the DevFlow Dashboard. Free tier includes 100 notifications/month."
              }
            ]
          }
        ],
        text: "DevFlow Dashboard connected successfully!" // Fallback text
      })
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
}