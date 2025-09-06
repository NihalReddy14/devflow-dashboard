# DevFlow Dashboard Setup Guide

This guide will help you set up the DevFlow Dashboard on a new machine.

## Prerequisites

- Node.js 18+ and npm
- Git
- An AWS account (or AWS student account)
- A GitHub account

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "DevFlow Dashboard"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# GitHub OAuth Configuration
# Create a GitHub OAuth App at https://github.com/settings/applications/new
# - Application name: DevFlow Dashboard
# - Homepage URL: http://localhost:3000
# - Authorization callback URL: http://localhost:3000/api/auth/github/callback
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_secret_key_here

# AWS Credentials (for Amplify backend)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Slack Integration (Optional)
# Create a Slack App at https://api.slack.com/apps
# SLACK_CLIENT_ID=your_slack_client_id
# SLACK_CLIENT_SECRET=your_slack_client_secret
# SLACK_REDIRECT_URI=http://localhost:3000/api/slack/callback
```

### 4. Generate NextAuth Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `NEXTAUTH_SECRET`.

### 5. Set Up GitHub OAuth

1. Go to https://github.com/settings/applications/new
2. Fill in:
   - **Application name**: DevFlow Dashboard
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/api/auth/github/callback
3. Click "Register application"
4. Copy the **Client ID**
5. Generate a new **Client Secret** and copy it
6. Add both to your `.env.local` file

### 6. Set Up AWS Amplify Backend

#### Option A: Use Existing AWS Backend
If you have AWS credentials with an existing Amplify deployment:

```bash
# Pull the existing backend configuration
npx ampx generate outputs --app-id <your-amplify-app-id> --branch main
```

#### Option B: Deploy New AWS Backend
If you need to deploy a new backend:

```bash
# Configure AWS credentials
aws configure

# Deploy the backend
npx ampx sandbox

# For production deployment
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

#### Option C: Run in Demo Mode
The app can run without AWS backend in demo mode with limited functionality.

### 7. Run the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

### 8. (Optional) Set Up Slack Integration

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name it "DevFlow Dashboard" and select your workspace
4. In **OAuth & Permissions**, add these scopes:
   - `incoming-webhook`
   - `channels:read`
   - `chat:write`
   - `chat:write.public`
5. Add Redirect URL: `http://localhost:3000/api/slack/callback`
6. Copy the Client ID and Client Secret to `.env.local`

## Common Issues

### "Amplify has not been configured" Error
- Ensure `amplify_outputs.json` exists in the root directory
- Check that AWS credentials are correctly set in `.env.local`
- Try running `npx ampx sandbox` to generate the configuration

### GitHub Authentication Issues
- Verify the callback URL matches exactly: `http://localhost:3000/api/auth/github/callback`
- Ensure both Client ID and Secret are correctly copied
- Check that the GitHub OAuth app is not in suspended state

### Port Already in Use
If port 3000 is busy, the app will automatically use 3001. Update your GitHub OAuth callback URL accordingly.

## Production Deployment

For production deployment on AWS Amplify:

1. Push your code to GitHub
2. Connect your GitHub repository to AWS Amplify Console
3. Set environment variables in Amplify Console
4. Deploy the application

## Demo Mode

The application includes a demo mode that works without AWS backend:
- Mock data for repositories and pull requests
- Simulated real-time updates
- Limited functionality (no data persistence)

This is useful for:
- Testing UI/UX without AWS costs
- Demo presentations
- Local development without backend