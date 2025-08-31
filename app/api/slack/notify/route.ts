import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// This endpoint would be used to trigger Slack notifications
// In production, you'd configure the Lambda function ARN from environment variables
const SLACK_LAMBDA_ARN = process.env.SLACK_LAMBDA_ARN;

export async function POST(request: NextRequest) {
  try {
    const { teamId, type, data } = await request.json();

    if (!teamId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In production, you would invoke the Lambda function here
    if (SLACK_LAMBDA_ARN) {
      const client = new LambdaClient({});
      const command = new InvokeCommand({
        FunctionName: SLACK_LAMBDA_ARN,
        Payload: JSON.stringify({ teamId, type, data }),
      });

      const response = await client.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Payload));

      return NextResponse.json({ success: true, result });
    }

    // For development, just log the notification
    console.log('Slack notification (dev mode):', { teamId, type, data });
    return NextResponse.json({ success: true, message: 'Notification logged (dev mode)' });

  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}