import { NextRequest, NextResponse } from 'next/server';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../../amplify/data/resource";
import { Amplify } from 'aws-amplify';
import config from '../../../../amplify_outputs.json';

// Configure Amplify for server-side
Amplify.configure(config, { ssr: true });

const client = generateClient<Schema>();

export async function POST(request: NextRequest) {
  try {
    const { slackIntegrationId } = await request.json();

    if (!slackIntegrationId) {
      return NextResponse.json({ error: 'Slack integration ID is required' }, { status: 400 });
    }

    // Get the Slack integration
    const { data: integration } = await client.models.SlackIntegration.get({ id: slackIntegrationId });

    if (!integration) {
      return NextResponse.json({ error: 'Slack integration not found' }, { status: 404 });
    }

    if (integration.status !== 'active') {
      return NextResponse.json({ error: 'Slack integration is not active' }, { status: 400 });
    }

    // Get team info
    const { data: team } = await client.models.Team.get({ id: integration.teamId });

    // Send test message
    const testMessage = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "🧪 *Test Message from DevFlow Dashboard*"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `Great! Your Slack integration for *${team?.name || 'your team'}* is working perfectly. You'll receive notifications for PRs, builds, and code reviews right here in *#${integration.channelName}*.`
          },
          accessory: {
            type: "image",
            image_url: "https://api.dicebear.com/7.x/shapes/svg?seed=devflow",
            alt_text: "DevFlow"
          }
        },
        {
          type: "divider"
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Test sent at ${new Date().toLocaleString()} | Free tier: ${integration.monthlyNotificationCount || 0}/100 notifications used this month`
            }
          ]
        }
      ],
      text: "Test message from DevFlow Dashboard" // Fallback text
    };

    const response = await fetch(integration.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Slack API error:', errorText);
      return NextResponse.json({ error: 'Failed to send test message to Slack' }, { status: 500 });
    }

    // Update last test timestamp
    await client.models.SlackIntegration.update({
      id: slackIntegrationId,
      lastTestAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending test message:', error);
    return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 });
  }
}