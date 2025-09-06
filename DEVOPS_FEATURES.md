# DevOps Features Documentation

## Overview

The DevFlow Dashboard has been transformed into a comprehensive DevOps Engineering Platform with industry-standard DORA metrics, CI/CD monitoring, and infrastructure automation capabilities.

## New Features

### 1. **DORA Metrics Dashboard**
- **Deployment Frequency**: Track how often code is deployed to production
- **Lead Time for Changes**: Measure time from commit to production
- **Change Failure Rate**: Monitor percentage of deployments causing failures
- **Mean Time to Restore (MTTR)**: Track time to recover from failures

Performance levels are categorized as Elite, High, Medium, or Low based on industry standards.

### 2. **CI/CD Pipeline Monitoring**
- **Build History**: Real-time tracking of GitHub Actions workflow runs
- **Pipeline Health**: Visual analytics for build success rates and duration trends
- **Branch Performance**: Success rates broken down by branch
- **Workflow Analytics**: Performance metrics for different workflows

### 3. **Deployment Tracking**
- **Deployment Calendar**: Visual heatmap of deployment activity
- **Environment Tracking**: Monitor deployments across dev/staging/production
- **Rollback Detection**: Automatic tracking of deployment rollbacks
- **Deployment Status**: Real-time status updates for ongoing deployments

### 4. **Real-time Updates**
- GitHub webhook integration for instant updates
- Support for workflow_run, deployment, and deployment_status events
- Automatic activity feed updates for build and deployment events

## Architecture

### Data Models

1. **Build Model** (Extended)
   - Added workflow metadata (name, ID, run number)
   - Tracks GitHub Actions runs with full details
   - Linked to Repository model

2. **Deployment Model** (New)
   - Tracks production deployments
   - Environment-specific data
   - Links to builds and rollback tracking

3. **DoraMetrics Model** (New)
   - Stores calculated DORA metrics
   - Daily, weekly, and monthly aggregations
   - Team and repository-level metrics

### Lambda Functions

1. **sync-github-data** (Extended)
   - Now fetches GitHub Actions workflow runs
   - Collects deployment data from GitHub Deployments API
   - Creates activity records for significant events

2. **calculate-dora-metrics** (New)
   - Runs hourly via EventBridge
   - Calculates all four DORA metrics
   - Generates daily, weekly, and monthly aggregations

### API Endpoints

1. **/api/webhooks/github** (New)
   - Handles GitHub webhook events
   - Real-time updates for builds and deployments
   - Signature verification for security

## Setup Instructions

### 1. Enable GitHub Actions Data Collection

The system automatically collects GitHub Actions data when you sync. No additional setup required.

### 2. Configure GitHub Webhooks (Optional)

For real-time updates, add a webhook to your GitHub repositories:

1. Go to Settings > Webhooks in your GitHub repository
2. Add webhook URL: `https://your-domain.com/api/webhooks/github`
3. Content type: `application/json`
4. Select events:
   - Workflow runs
   - Deployments
   - Deployment statuses
5. Set a webhook secret and add to environment variables:
   ```
   GITHUB_WEBHOOK_SECRET=your-secret-here
   ```

### 3. Configure Deployments

To track deployments, ensure your GitHub Actions workflows use the GitHub Deployments API:

```yaml
- name: Create deployment
  uses: actions/github-script@v6
  with:
    script: |
      const deployment = await github.rest.repos.createDeployment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        ref: context.sha,
        environment: 'production',
        auto_merge: false,
        required_contexts: []
      });
```

## Usage

### Viewing DORA Metrics

1. Navigate to the DevOps tab (🚀) in the dashboard
2. Select time range (daily, weekly, or monthly)
3. View performance levels and trends
4. Click on metrics for detailed breakdowns

### Monitoring Builds

1. Build history shows recent workflow runs
2. Pipeline health visualizes success rates over time
3. Branch and workflow performance help identify bottlenecks
4. Click on any build to view in GitHub

### Tracking Deployments

1. Deployment calendar shows activity patterns
2. Click on any day to see deployment details
3. Failed deployments are highlighted in red
4. Success deployments in green

## Best Practices

1. **Regular Syncing**: Set up automated syncing or use webhooks for real-time data
2. **Deployment Tracking**: Use GitHub Deployments API in your CI/CD pipelines
3. **Metric Review**: Review DORA metrics weekly to identify improvement areas
4. **Failure Analysis**: Investigate high change failure rates promptly

## Troubleshooting

### No Data Showing

1. Ensure you're authenticated with GitHub
2. Click "Sync CI/CD Data" button
3. Check that your repositories have GitHub Actions enabled
4. Verify Lambda functions have proper permissions

### Metrics Not Calculating

1. Check CloudWatch logs for `calculate-dora-metrics` Lambda
2. Ensure EventBridge rule is active
3. Verify data exists in Build and Deployment tables

### Webhook Issues

1. Verify webhook secret matches environment variable
2. Check webhook delivery history in GitHub
3. Ensure API route is accessible publicly
4. Check CloudWatch logs for errors

## Future Enhancements

- Infrastructure as Code with AWS CDK
- Advanced analytics with ML-based predictions
- Cost analysis per deployment
- Integration with monitoring tools (Prometheus, Grafana)
- Compliance reporting capabilities