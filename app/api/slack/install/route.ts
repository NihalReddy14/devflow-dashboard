import { NextRequest, NextResponse } from 'next/server';

// You'll need to register your app at https://api.slack.com/apps
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '';
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || 'http://localhost:3000/api/slack/callback';
const SLACK_SCOPES = 'incoming-webhook,channels:read,chat:write,chat:write.public';

export async function POST(request: NextRequest) {
  try {
    const { teamId } = await request.json();

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    if (!SLACK_CLIENT_ID) {
      return NextResponse.json({ 
        error: 'Slack integration not configured. Please set SLACK_CLIENT_ID environment variable.' 
      }, { status: 500 });
    }

    // Store teamId in state parameter for the callback
    const state = Buffer.from(JSON.stringify({ teamId })).toString('base64');

    // Build Slack OAuth URL
    const params = new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      scope: SLACK_SCOPES,
      redirect_uri: SLACK_REDIRECT_URI,
      state: state,
    });

    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?${params.toString()}`;

    return NextResponse.json({ url: slackAuthUrl });
  } catch (error) {
    console.error('Error initiating Slack OAuth:', error);
    return NextResponse.json({ error: 'Failed to initiate Slack connection' }, { status: 500 });
  }
}