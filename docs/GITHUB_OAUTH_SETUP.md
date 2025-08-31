# GitHub OAuth Setup Guide

## Local Development

The GitHub OAuth credentials are already configured in `.env.local`:
- `GITHUB_CLIENT_ID`: Ov23liEr0GihP53FevSs
- `GITHUB_CLIENT_SECRET`: 7a0a39d67dac866998f04130980cd1f3a8fa5acf

## Production Setup (Amplify)

When deploying to AWS Amplify, you need to configure these secrets:

### 1. Create GitHub OAuth App for Production

1. Go to https://github.com/settings/applications/new
2. Fill in the details:
   - **Application name**: DevFlow Dashboard
   - **Homepage URL**: `https://your-amplify-domain.amplifyapp.com`
   - **Authorization callback URL**: `https://your-amplify-domain.amplifyapp.com/api/auth/github/callback`
3. Click "Register application"
4. Copy the Client ID
5. Generate a new Client Secret and copy it

### 2. Add Secrets to Amplify

Using the AWS Console:
1. Go to AWS Amplify Console
2. Select your app
3. Go to "App settings" > "Environment variables"
4. Add these variables:
   - `GITHUB_CLIENT_ID`: Your production GitHub OAuth Client ID
   - `GITHUB_CLIENT_SECRET`: Your production GitHub OAuth Client Secret
   - `NEXTAUTH_URL`: Your production URL (e.g., `https://your-amplify-domain.amplifyapp.com`)
   - `NEXTAUTH_SECRET`: Generate using `openssl rand -base64 32`

Using AWS CLI:
```bash
aws amplify update-app --app-id YOUR_APP_ID --environment-variables \
  GITHUB_CLIENT_ID=your_client_id,\
  GITHUB_CLIENT_SECRET=your_client_secret,\
  NEXTAUTH_URL=https://your-amplify-domain.amplifyapp.com,\
  NEXTAUTH_SECRET=your_generated_secret
```

### 3. Using Amplify Secrets (Recommended)

For sensitive values like `GITHUB_CLIENT_SECRET`, use Amplify secrets:

```bash
npx ampx sandbox secret set GITHUB_CLIENT_SECRET
# Enter the secret value when prompted

# For production:
npx ampx secret set GITHUB_CLIENT_SECRET --branch main
```

### 4. Update Lambda Functions

The GitHub auth Lambda functions need these secrets. They're already configured to read from environment variables in:
- `amplify/functions/github-auth-initiate/handler.ts`
- `amplify/functions/github-auth-callback/handler.ts`

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret | Yes |
| `NEXTAUTH_URL` | Your app's URL (without trailing slash) | Yes |
| `NEXTAUTH_SECRET` | Random string for JWT encryption | Yes |

### Testing

1. After setting up, test the OAuth flow:
   - Click "Sign in with GitHub" on your app
   - Should redirect to GitHub for authorization
   - After authorizing, should redirect back and create user in Cognito

2. Check CloudWatch logs for any errors in:
   - `/aws/lambda/github-auth-initiate-*`
   - `/aws/lambda/github-auth-callback-*`