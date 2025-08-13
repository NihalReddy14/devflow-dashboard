# DevFlow Dashboard - Quick Setup Guide

## Current Status
✅ Frontend server is running at: http://localhost:3000
❌ Amplify sandbox needs AWS credentials

## To Complete Setup:

### 1. Configure AWS Credentials
```bash
# Option A: If you have AWS CLI installed
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter output format (json)

# Option B: Set environment variables
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_REGION=us-east-1
```

### 2. Create GitHub OAuth App
1. Go to: https://github.com/settings/applications/new
2. Fill in:
   - Application name: DevFlow Dashboard
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3000/api/auth/github/callback
3. Click "Register application"
4. Copy the Client ID and generate a Client Secret

### 3. Set Environment Variables
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add:
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Restart Amplify Sandbox
```bash
# Stop any running processes
npx ampx sandbox delete

# Start fresh
npx ampx sandbox

# In another terminal, set the secrets
npx ampx sandbox secret set GITHUB_CLIENT_ID your_github_client_id
npx ampx sandbox secret set GITHUB_CLIENT_SECRET your_github_client_secret
```

### 5. Access the App
Open http://localhost:3000 in your browser

## Running Processes
- Frontend: http://localhost:3000 (Already running)
- Amplify Sandbox: Needs AWS credentials to start

## Troubleshooting

### AWS Credentials Error
If you see "The security token included in the request is invalid":
1. Make sure you have an AWS account
2. Create IAM user with AdministratorAccess (for development)
3. Generate access keys for the IAM user
4. Configure credentials as shown above

### Free Tier Note
This app is designed to stay within AWS Free Tier limits:
- DynamoDB: 25GB storage free
- Lambda: 1M requests/month free
- AppSync: 250K operations/month free

## Next Steps
Once both servers are running:
1. Click "Connect GitHub" in the dashboard
2. Authorize the OAuth app
3. Your repositories and PRs will sync automatically
4. Real-time updates will show in the activity feed