import { NextRequest, NextResponse } from 'next/server';
import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  UsernameExistsException
} from '@aws-sdk/client-cognito-identity-provider';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import type { Schema } from '@/amplify/data/resource';

// Configure Amplify
Amplify.configure(outputs, { ssr: true });

const cognitoClient = new CognitoIdentityProviderClient({
  region: outputs.auth.aws_region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

const dataClient = generateClient<Schema>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, githubId, githubUsername, githubAccessToken, githubAvatarUrl, displayName } = body;

    const userPoolId = outputs.auth.user_pool_id;
    
    // Check if user already exists
    let userExists = false;
    try {
      await cognitoClient.send(new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email, // Using email as username since we configured email as username attribute
      }));
      userExists = true;
    } catch (error: any) {
      if (error.name !== 'UserNotFoundException') {
        throw error;
      }
    }

    if (!userExists) {
      // Create the user
      const tempPassword = `TempPass${Math.random().toString(36).substring(2, 15)}!`;
      
      await cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'custom:githubId', Value: githubId },
          { Name: 'custom:githubUsername', Value: githubUsername },
        ],
        TemporaryPassword: tempPassword,
        MessageAction: 'SUPPRESS', // Don't send welcome email
      }));

      // Set permanent password
      await cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: `GitHub${githubId}!`, // Use GitHub ID as part of password
        Permanent: true,
      }));

      // Add user to DEVELOPERS group
      await cognitoClient.send(new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: 'DEVELOPERS',
      }));
    } else {
      // Update existing user attributes
      await cognitoClient.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'custom:githubId', Value: githubId },
          { Name: 'custom:githubUsername', Value: githubUsername },
        ],
      }));
    }

    // Create or update user in DynamoDB via GraphQL
    try {
      // Check if user exists in DynamoDB
      const existingUsers = await dataClient.models.User.list({
        filter: {
          email: {
            eq: email
          }
        }
      });

      if (existingUsers.data.length === 0) {
        // Create new user
        await dataClient.models.User.create({
          email,
          githubId,
          githubUsername,
          githubAccessToken,
          githubAvatarUrl,
          displayName,
        });
      } else {
        // Update existing user
        const user = existingUsers.data[0];
        await dataClient.models.User.update({
          id: user.id,
          githubAccessToken,
          githubAvatarUrl,
          displayName,
        });
      }
    } catch (error) {
      console.error('Error creating/updating user in DynamoDB:', error);
    }

    return NextResponse.json({ 
      success: true, 
      username: email,
      message: userExists ? 'User updated' : 'User created'
    });
  } catch (error) {
    console.error('Error creating Cognito user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}