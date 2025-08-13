# DevFlow Dashboard - Real-Time Collaboration App

A modern development dashboard that integrates with GitHub to provide real-time updates on pull requests, builds, and team activity. Built with Next.js, AWS Amplify Gen 2, and TypeScript.

## Features

✅ **GitHub Integration**
- OAuth authentication with GitHub
- Sync repositories and pull requests
- Real-time PR status updates

✅ **Real-Time Updates**
- Live updates using AWS AppSync subscriptions
- Activity feed with instant notifications
- Real-time connection indicator

✅ **Modern UI**
- Responsive dashboard with tabbed interface
- Dark mode support
- Reusable component library
- Empty states with actionable CTAs

✅ **AWS Amplify Backend**
- GraphQL API with DynamoDB
- Cognito authentication
- Lambda functions for GitHub sync
- Optimized for AWS Free Tier

## Project Structure

```
/app
  /components
    /ui              - Reusable UI components (Button, Card, Badge, etc.)
    /dashboard       - Dashboard-specific components
    /auth           - Authentication components
  /api/auth/github  - GitHub OAuth routes
  /dashboard        - Main dashboard pages
  /hooks           - Custom React hooks
/amplify
  /auth            - Cognito configuration
  /data            - GraphQL schema and data models
  /functions       - Lambda functions
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- AWS Account (free tier eligible)
- GitHub Account

### 2. Clone and Install
```bash
git clone [repository-url]
cd real-time-collaboration-app
npm install
```

### 3. Configure GitHub OAuth
1. Go to https://github.com/settings/applications/new
2. Create a new OAuth App with:
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
3. Copy the Client ID and Client Secret

### 4. Set Environment Variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your GitHub credentials:
```
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Deploy Amplify Backend
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli@latest

# Configure AWS credentials
amplify configure

# Deploy backend
npx ampx sandbox

# Set secrets
npx ampx sandbox secret set GITHUB_CLIENT_ID
npx ampx sandbox secret set GITHUB_CLIENT_SECRET
```

### 6. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Data Models

- **User**: GitHub user information and access tokens
- **Repository**: Synced GitHub repositories
- **PullRequest**: PR details with real-time updates
- **Build**: CI/CD build status
- **Activity**: Event feed items

## Cost Optimization

The app is designed to stay within AWS Free Tier limits:

- **AppSync**: 250K operations/month free
- **DynamoDB**: 25GB storage free
- **Lambda**: 1M requests/month free
- **Cognito**: 50K MAUs free

Real-time subscriptions are optimized to minimize connection time and data transfer.

## Security

- GitHub OAuth tokens are securely stored
- All API routes require authentication
- Data access controlled by Amplify authorization rules
- Sensitive operations handled server-side

## Development Tips

1. **Amplify Outputs**: Run `npx ampx generate outputs` to create `amplify_outputs.json`
2. **Local Testing**: Use `npx ampx sandbox` for local backend
3. **Monitoring**: Check CloudWatch logs for Lambda functions
4. **GitHub Rate Limits**: Be mindful of GitHub API rate limits (5000/hour for authenticated requests)

## Next Steps

- Add support for multiple GitHub organizations
- Implement build status webhooks
- Add team collaboration features
- Create mobile app with React Native
- Add notification preferences
- Implement data export functionality

## License

MIT
