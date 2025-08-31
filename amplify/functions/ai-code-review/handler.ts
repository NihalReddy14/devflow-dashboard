import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { Schema } from '../../data/resource';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

const MONTHLY_REVIEW_LIMIT = 10;
const TEAM_TABLE = process.env.AMPLIFY_DATA_TEAM_TABLE_NAME || '';
const AI_CODE_REVIEW_TABLE = process.env.AMPLIFY_DATA_AICODEREVIEW_TABLE_NAME || '';

interface CodeReviewRequest {
  teamId: string;
  codeSnippet: string;
  language: string;
  reviewType: string;
  repositoryName?: string;
  branchName?: string;
  pullRequestId?: string;
}

interface CodeReviewResponse {
  success: boolean;
  reviewId?: string;
  review?: {
    content: string;
    severity: string;
    suggestions: any[];
  };
  error?: string;
  remainingReviews?: number;
}

export const handler = async (event: any): Promise<CodeReviewResponse> => {
  try {
    const { teamId, codeSnippet, language, reviewType, repositoryName, branchName, pullRequestId } = event.arguments as CodeReviewRequest;
    const userId = event.identity?.sub || 'anonymous';

    // Check team's monthly review count
    const teamResponse = await docClient.send(new GetCommand({
      TableName: TEAM_TABLE,
      Key: { id: teamId }
    }));

    if (!teamResponse.Item) {
      return {
        success: false,
        error: 'Team not found'
      };
    }

    const team = teamResponse.Item;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Check if we need to reset the monthly counter
    let reviewCount = team.monthlyReviewCount || 0;
    const resetDate = team.reviewCountResetDate ? new Date(team.reviewCountResetDate) : null;
    const resetMonth = resetDate ? `${resetDate.getFullYear()}-${(resetDate.getMonth() + 1).toString().padStart(2, '0')}` : null;
    
    if (resetMonth !== currentMonth) {
      // Reset counter for new month
      reviewCount = 0;
      await docClient.send(new UpdateCommand({
        TableName: TEAM_TABLE,
        Key: { id: teamId },
        UpdateExpression: 'SET monthlyReviewCount = :count, reviewCountResetDate = :date',
        ExpressionAttributeValues: {
          ':count': 0,
          ':date': now.toISOString()
        }
      }));
    }

    // Check if within free tier limit
    if (reviewCount >= MONTHLY_REVIEW_LIMIT) {
      return {
        success: false,
        error: 'Monthly review limit reached. Please upgrade to continue.',
        remainingReviews: 0
      };
    }

    // Prepare the prompt for Claude Instant
    const prompt = prepareReviewPrompt(codeSnippet, language, reviewType);

    // Call AWS Bedrock Claude Instant (cheapest option)
    const modelId = 'anthropic.claude-instant-v1';
    const response = await bedrockClient.send(new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: prompt,
        max_tokens_to_sample: 1500,
        temperature: 0.7,
        top_p: 0.9,
      })
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const reviewContent = responseBody.completion || 'Unable to generate review';

    // Parse the review to extract severity and suggestions
    const { severity, suggestions } = parseReview(reviewContent, reviewType);

    // Save the review to database
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await docClient.send(new PutCommand({
      TableName: AI_CODE_REVIEW_TABLE,
      Item: {
        id: reviewId,
        teamId,
        userId,
        repositoryName: repositoryName || 'unknown',
        branchName: branchName || 'main',
        codeSnippet,
        language,
        reviewType,
        reviewContent,
        severity,
        suggestions,
        metadata: {
          model: modelId,
          timestamp: now.toISOString()
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    }));

    // Increment the review count
    await docClient.send(new UpdateCommand({
      TableName: TEAM_TABLE,
      Key: { id: teamId },
      UpdateExpression: 'SET monthlyReviewCount = monthlyReviewCount + :inc',
      ExpressionAttributeValues: {
        ':inc': 1
      }
    }));

    return {
      success: true,
      reviewId,
      review: {
        content: reviewContent,
        severity,
        suggestions
      },
      remainingReviews: MONTHLY_REVIEW_LIMIT - (reviewCount + 1)
    };

  } catch (error) {
    console.error('Error performing code review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

function prepareReviewPrompt(code: string, language: string, reviewType: string): string {
  const reviewTypePrompts = {
    security: 'Focus on security vulnerabilities, potential exploits, and unsafe practices.',
    performance: 'Focus on performance bottlenecks, inefficient algorithms, and optimization opportunities.',
    'best-practices': 'Focus on code style, maintainability, design patterns, and industry best practices.',
    general: 'Provide a comprehensive review covering security, performance, and best practices.'
  };

  const reviewFocus = reviewTypePrompts[reviewType as keyof typeof reviewTypePrompts] || reviewTypePrompts.general;

  return `Human: You are an expert code reviewer. Please review the following ${language} code snippet.

${reviewFocus}

Code to review:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. A severity level (critical, high, medium, low, or info)
2. Detailed explanation of any issues found
3. Specific suggestions for improvement
4. Example code fixes where applicable

Format your response as:
SEVERITY: [level]
REVIEW: [your detailed review]
SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]
- [etc]

Assistant: Human:`;
}

function parseReview(reviewContent: string, reviewType: string): { severity: string; suggestions: string[] } {
  // Extract severity from the review content
  const severityMatch = reviewContent.match(/SEVERITY:\s*(\w+)/i);
  const severity = severityMatch ? severityMatch[1].toLowerCase() : "medium";

  // Extract suggestions from the review content
  const suggestionsMatch = reviewContent.match(/SUGGESTIONS:\s*([\s\S]*?)(?=\n\n|$)/i);
  const suggestionsText = suggestionsMatch ? suggestionsMatch[1] : "";
  
  // Parse suggestions into an array
  const suggestions = suggestionsText
    .split("\n")
    .filter(line => line.trim().startsWith("-"))
    .map(line => line.trim().substring(2).trim())
    .filter(suggestion => suggestion.length > 0);

  return {
    severity: severity as string,
    suggestions
  };
}
