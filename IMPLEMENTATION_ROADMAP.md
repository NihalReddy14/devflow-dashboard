# DevFlow Dashboard Implementation Roadmap

## Current Status

The DevFlow Dashboard is currently running with:
- ✅ AWS Amplify backend deployed (DynamoDB, AppSync, Cognito, Lambda)
- ✅ Frontend UI with all dashboard components
- ✅ GitHub OAuth authentication configured
- ⚠️ Mock data for all metrics and visualizations
- ❌ No real data collection or synchronization

## Priority 1: Make GitHub Data Real

### 1.1 Fix GitHub Data Synchronization
**File:** `amplify/functions/sync-github-data/handler.ts`

**What needs to be done:**
- Implement the actual GitHub API calls using Octokit
- Store user's GitHub access token securely after OAuth
- Fetch and store:
  - User's repositories
  - Pull requests (open, closed, merged)
  - Commit history
  - Issue tracking
  - Code review activities

**Implementation steps:**
```typescript
// In handler.ts
import { Octokit } from '@octokit/rest';

// Fetch user repos
const repos = await octokit.repos.listForAuthenticatedUser();

// Fetch PRs for each repo
const prs = await octokit.pulls.list({
  owner,
  repo,
  state: 'all'
});

// Store in DynamoDB via GraphQL
await client.models.Repository.create(repoData);
await client.models.PullRequest.create(prData);
```

### 1.2 Schedule Regular Sync
- Set up EventBridge rule to trigger sync every hour
- Add webhook support for real-time updates

## Priority 2: Enable Wellness Analyzer

### 2.1 Fix Module Resolution Issue
**File:** `amplify/backend.ts`

**Current issue:** The wellness analyzer import is failing. Need to:
1. Check the file path and exports
2. Ensure TypeScript compilation works
3. Uncomment and fix the integration

### 2.2 Implement Real Metrics Calculation
**File:** `amplify/functions/wellness-analyzer/handler.ts`

**What it should do:**
- Listen to DynamoDB streams for new activities
- Calculate daily metrics:
  - Coding hours (based on commit timestamps)
  - Focus sessions (gaps between activities)
  - PR velocity
  - Work patterns
- Generate insights based on thresholds
- Store calculated metrics in DeveloperWellnessMetrics table

## Priority 3: Real-Time Activity Tracking

### 3.1 Implement Activity Collection
**Options for tracking coding time:**

1. **Browser Extension** (Recommended)
   - Create a Chrome/VS Code extension
   - Track active coding time
   - Send heartbeats to API
   - Detect idle time

2. **IDE Plugins**
   - VS Code extension
   - IntelliJ plugin
   - Track file changes and active time

3. **Git Hooks**
   - Pre-commit hooks to log activity
   - Less accurate but easier to implement

### 3.2 Activity Processing
**File:** Create new Lambda function `process-activities`

```typescript
export const processActivities = defineFunction({
  name: 'process-activities',
  entry: './handler.ts',
  resourceGroupName: 'data'
});
```

## Priority 4: CI/CD Integration

### 4.1 GitHub Actions Integration
**File:** Create `app/api/webhooks/github-actions/route.ts`

**Features to implement:**
- Receive webhooks from GitHub Actions
- Store build status, duration, failures
- Track deployment success rates

### 4.2 Other CI/CD Platforms
- Jenkins webhook receiver
- CircleCI integration
- GitLab CI support

## Priority 5: Complete Missing Features

### 5.1 Team Collaboration
- Implement team creation flow
- Add member invitation system
- Enable team-wide metrics

### 5.2 Slack Integration
**Files:** 
- `amplify/functions/slack-notifications/handler.ts`
- `app/api/slack/callback/route.ts`

**Implementation:**
- Complete OAuth flow
- Store workspace tokens
- Send notifications for:
  - PR reviews needed
  - Build failures
  - Team wellness alerts

### 5.3 AI Code Review
**File:** `amplify/functions/ai-code-review/handler.ts`

**Current status:** Function exists but needs:
- Proper Bedrock model configuration
- PR diff analysis
- Review result formatting
- Integration with PR comments

## Priority 6: Fix TypeScript Issues

### 6.1 Generate Proper Types
```bash
# After AWS credentials are set
npx ampx generate graphql-client-code --format modelgen --model-target typescript

# Update imports to use generated types
```

### 6.2 Create Type Definitions
**File:** `app/types/amplify.d.ts`

Define proper types for all models and operations.

## Testing Checklist

- [ ] User can sign in with GitHub
- [ ] GitHub repos appear in dashboard
- [ ] Pull requests are synced
- [ ] Commits show in activity feed
- [ ] Wellness metrics update daily
- [ ] Insights are generated based on real data
- [ ] Slack notifications work
- [ ] AI code review provides feedback
- [ ] Team features allow collaboration
- [ ] Build tracking shows CI/CD status

## Environment Variables Needed

```env
# Production secrets (add to Amplify Console)
GITHUB_CLIENT_ID=<production_id>
GITHUB_CLIENT_SECRET=<production_secret>
SLACK_CLIENT_ID=<slack_app_id>
SLACK_CLIENT_SECRET=<slack_app_secret>
NEXTAUTH_URL=https://your-domain.amplifyapp.com
NEXTAUTH_SECRET=<generate_with_openssl>

# AWS Bedrock (for AI reviews)
BEDROCK_MODEL_ID=anthropic.claude-v2
AWS_REGION=us-east-1
```

## Deployment Steps

1. **Local Development**
   ```bash
   npm run dev
   npx ampx sandbox
   ```

2. **Production Deployment**
   ```bash
   git add .
   git commit -m "feat: implement real data sync"
   git push origin main
   # Amplify will auto-deploy
   ```

## Estimated Timeline

- **Week 1**: GitHub sync + Wellness analyzer
- **Week 2**: Activity tracking + CI/CD integration
- **Week 3**: Team features + Slack integration
- **Week 4**: AI code review + Testing + Polish

## Resources

- [Amplify Gen 2 Docs](https://docs.amplify.aws/react/build-a-backend/)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Slack API](https://api.slack.com/)
- [AWS Bedrock](https://docs.aws.amazon.com/bedrock/)

## Notes

- Start with GitHub sync as it provides the most immediate value
- Wellness features depend on having real activity data
- Consider adding analytics (Mixpanel/Amplitude) for usage tracking
- Add error monitoring (Sentry) for production