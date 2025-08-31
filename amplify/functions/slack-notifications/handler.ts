import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface SlackNotificationEvent {
  type: 'pr_created' | 'pr_merged' | 'pr_review_requested' | 'pr_review_completed' | 
        'build_failure' | 'build_success' | 'build_recovered' | 
        'code_review_completed' | 'code_review_critical';
  teamId: string;
  data: any;
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: any[];
  accessory?: any;
  fields?: any[];
}

export const handler = async (event: SlackNotificationEvent) => {
  console.log('Slack notification event:', JSON.stringify(event, null, 2));

  try {
    // Get team's Slack integration
    const slackIntegration = await getSlackIntegration(event.teamId);
    if (!slackIntegration || slackIntegration.status !== 'active') {
      console.log('No active Slack integration found for team:', event.teamId);
      return { statusCode: 200, body: 'No active integration' };
    }

    // Check notification settings
    const settings = await getNotificationSettings(slackIntegration.id);
    if (!shouldSendNotification(event.type, settings)) {
      console.log('Notification disabled for type:', event.type);
      return { statusCode: 200, body: 'Notification disabled' };
    }

    // Check free tier limits
    const canSend = await checkAndUpdateNotificationCount(slackIntegration.id);
    if (!canSend) {
      console.log('Monthly notification limit reached');
      return { statusCode: 200, body: 'Monthly limit reached' };
    }

    // Build and send Slack message
    const message = buildSlackMessage(event, slackIntegration.channelName);
    await sendToSlack(slackIntegration.webhookUrl, message);

    return { statusCode: 200, body: 'Notification sent' };
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return { statusCode: 500, body: 'Error sending notification' };
  }
};

async function getSlackIntegration(teamId: string) {
  const tableName = process.env.SLACK_INTEGRATION_TABLE_NAME;
  
  // In a real implementation, you'd query by teamId index
  // For now, we'll use a scan (not ideal for production)
  const command = new GetCommand({
    TableName: tableName,
    Key: { teamId }
  });

  const result = await docClient.send(command);
  return result.Item;
}

async function getNotificationSettings(slackIntegrationId: string) {
  const tableName = process.env.SLACK_NOTIFICATION_SETTINGS_TABLE_NAME;
  
  const command = new GetCommand({
    TableName: tableName,
    Key: { slackIntegrationId }
  });

  const result = await docClient.send(command);
  return result.Item || {};
}

function shouldSendNotification(type: string, settings: any): boolean {
  const settingMap: Record<string, string> = {
    'pr_created': 'notifyPrCreated',
    'pr_merged': 'notifyPrMerged',
    'pr_review_requested': 'notifyPrReviewRequested',
    'pr_review_completed': 'notifyPrReviewCompleted',
    'build_failure': 'notifyBuildFailure',
    'build_success': 'notifyBuildSuccess',
    'build_recovered': 'notifyBuildRecovered',
    'code_review_completed': 'notifyCodeReviewCompleted',
    'code_review_critical': 'notifyCodeReviewCritical'
  };

  const settingKey = settingMap[type];
  return settingKey ? settings[settingKey] !== false : true;
}

async function checkAndUpdateNotificationCount(slackIntegrationId: string): Promise<boolean> {
  const tableName = process.env.SLACK_INTEGRATION_TABLE_NAME;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const command = new UpdateCommand({
    TableName: tableName,
    Key: { id: slackIntegrationId },
    UpdateExpression: `
      SET monthlyNotificationCount = if_not_exists(monthlyNotificationCount, :zero) + :one,
          notificationCountResetDate = if_not_exists(notificationCountResetDate, :resetDate)
    `,
    ConditionExpression: 'monthlyNotificationCount < :limit OR attribute_not_exists(monthlyNotificationCount)',
    ExpressionAttributeValues: {
      ':zero': 0,
      ':one': 1,
      ':limit': 100, // Free tier limit
      ':resetDate': `${currentMonth}-01`
    },
    ReturnValues: 'ALL_NEW'
  });

  try {
    await docClient.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return false;
    }
    throw error;
  }
}

function buildSlackMessage(event: SlackNotificationEvent, channelName: string) {
  const blocks: SlackBlock[] = [];
  
  switch (event.type) {
    case 'pr_created':
      blocks.push(
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*New Pull Request Created*\n<${event.data.url}|${event.data.title}>`
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "View PR",
              emoji: true
            },
            url: event.data.url,
            action_id: "view_pr"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `*Repository:* ${event.data.repository} | *Author:* ${event.data.author} | *Branch:* ${event.data.branch}`
            }
          ]
        }
      );
      break;
      
    case 'pr_merged':
      blocks.push(
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `✅ *Pull Request Merged*\n<${event.data.url}|${event.data.title}>`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `*Repository:* ${event.data.repository} | *Merged by:* ${event.data.mergedBy}`
            }
          ]
        }
      );
      break;
      
    case 'build_failure':
      blocks.push(
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `❌ *Build Failed*\n\`${event.data.branch}\` in *${event.data.repository}*`
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Logs",
              emoji: true
            },
            url: event.data.logUrl,
            action_id: "view_logs"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `\`\`\`${event.data.error || 'Build failed'}\`\`\``
          }
        }
      );
      break;
      
    case 'code_review_critical':
      blocks.push(
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🚨 *Critical Issue Found in Code Review*\n*Repository:* ${event.data.repository}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Issue:* ${event.data.issue}\n*File:* \`${event.data.file}\`\n*Line:* ${event.data.line}`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Suggestion:*\n${event.data.suggestion}`
          }
        }
      );
      break;
      
    default:
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `DevFlow Notification: ${event.type}`
        }
      });
  }
  
  // Add footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Sent from DevFlow Dashboard to #${channelName}`
      }
    ]
  });

  return {
    blocks,
    text: `DevFlow notification: ${event.type}` // Fallback text
  };
}

async function sendToSlack(webhookUrl: string, message: any) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
  }
}