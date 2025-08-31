import { PullRequestWithRepo } from '../hooks/useGitHubData';

// Mock GitHub user data
export const mockGitHubUser = {
  id: 123456789,
  login: 'demo-user',
  email: 'demo@example.com',
  name: 'Demo User',
  avatar_url: 'https://github.com/octocat.png'
};

// Mock repositories
export const mockRepositories = [
  {
    id: '1',
    githubId: '1',
    name: 'devflow-dashboard',
    fullName: 'demo-user/devflow-dashboard',
    description: 'Real-time development team collaboration dashboard',
    isPrivate: false,
    defaultBranch: 'main',
    language: 'TypeScript',
    stargazersCount: 142,
    forksCount: 23,
    openIssuesCount: 8,
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: '2',
    githubId: '2',
    name: 'api-gateway',
    fullName: 'demo-user/api-gateway',
    description: 'Microservices API gateway with authentication',
    isPrivate: true,
    defaultBranch: 'main',
    language: 'Node.js',
    stargazersCount: 67,
    forksCount: 12,
    openIssuesCount: 3,
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: '3',
    githubId: '3',
    name: 'mobile-app',
    fullName: 'demo-user/mobile-app',
    description: 'React Native mobile application',
    isPrivate: false,
    defaultBranch: 'develop',
    language: 'JavaScript',
    stargazersCount: 89,
    forksCount: 34,
    openIssuesCount: 15,
    lastSyncedAt: new Date().toISOString(),
  }
];

// Generate mock pull requests
export const generateMockPullRequests = (): PullRequestWithRepo[] => {
  const prTitles = [
    'Add user authentication system',
    'Fix memory leak in dashboard component',
    'Update dependencies to latest versions',
    'Implement real-time notifications',
    'Refactor API client for better error handling',
    'Add comprehensive unit tests',
    'Optimize bundle size and loading performance',
    'Fix TypeScript strict mode errors',
    'Add dark mode theme support',
    'Improve accessibility compliance',
    'Add pagination to user list',
    'Fix responsive design issues',
    'Implement code splitting',
    'Add error boundary components',
    'Update documentation'
  ];

  const authors = [
    { login: 'demo-user', avatar_url: 'https://github.com/octocat.png' },
    { login: 'john-dev', avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4' },
    { login: 'sarah-coder', avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4' },
    { login: 'mike-eng', avatar_url: 'https://avatars.githubusercontent.com/u/3?v=4' },
  ];

  const pullRequests: PullRequestWithRepo[] = [];

  // Generate 12 pull requests across different repositories
  for (let i = 0; i < 12; i++) {
    const repo = mockRepositories[i % mockRepositories.length];
    const author = authors[i % authors.length];
    const isOpen = Math.random() > 0.4; // 60% chance of being open
    const isDraft = isOpen && Math.random() > 0.7; // 30% of open PRs are drafts
    const createdDaysAgo = Math.floor(Math.random() * 14) + 1; // 1-14 days ago
    const updatedHoursAgo = Math.floor(Math.random() * 48) + 1; // 1-48 hours ago

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - createdDaysAgo);
    
    const updatedAt = new Date();
    updatedAt.setHours(updatedAt.getHours() - updatedHoursAgo);

    pullRequests.push({
      id: `pr_${i + 1}`,
      number: 100 + i,
      title: prTitles[i % prTitles.length],
      state: isOpen ? 'open' : 'closed',
      draft: isDraft,
      authorUsername: author.login,
      authorAvatarUrl: author.avatar_url,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      repository: {
        name: repo.name,
        fullName: repo.fullName,
      },
    });
  }

  return pullRequests.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

// Mock team data
export const mockTeamData = {
  id: 'team_demo_1',
  name: 'Demo Development Team',
  description: 'A high-performing development team',
  monthlyReviewCount: 3,
  ownerId: 'demo-user-id',
  members: [
    {
      id: 'member_1',
      userId: 'demo-user-id',
      role: 'owner',
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    },
    {
      id: 'member_2', 
      userId: 'john-dev-id',
      role: 'developer',
      joinedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    },
    {
      id: 'member_3',
      userId: 'sarah-coder-id', 
      role: 'developer',
      joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    }
  ]
};

// Mock wellness metrics
export const generateMockWellnessMetrics = () => {
  const metrics = [];
  
  // Generate data for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate varying wellness metrics
    const workLifeBalanceScore = Math.random() * 40 + 60; // 60-100
    const focusScore = Math.random() * 30 + 70; // 70-100
    const codingHours = Math.random() * 4 + 6; // 6-10 hours
    const prVelocity = Math.random() * 3 + 1; // 1-4 PRs per day
    const meetingHours = Math.random() * 3 + 1; // 1-4 hours
    const stressLevel = Math.random() * 3 + 2; // 2-5 scale
    
    metrics.push({
      id: `metric_${i}`,
      userId: 'demo-user-id',
      date: date.toISOString().split('T')[0],
      workLifeBalanceScore,
      focusScore,
      codingHours,
      prVelocity,
      meetingHours,
      stressLevel,
      burnoutRisk: stressLevel > 4 ? 'high' : stressLevel > 3 ? 'medium' : 'low',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
  }
  
  return metrics;
};

// Mock wellness insights
export const mockWellnessInsights = [
  {
    id: 'insight_1',
    userId: 'demo-user-id',
    type: 'tip',
    category: 'work-life-balance',
    title: 'Take Regular Breaks',
    message: 'Your coding sessions have been quite long lately. Consider taking a 5-10 minute break every hour to maintain focus and prevent burnout.',
    severity: 'low',
    isRead: false,
    isDismissed: false,
    metadata: { suggestedAction: 'Set a timer for hourly breaks' },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'insight_2',
    userId: 'demo-user-id',
    type: 'alert',
    category: 'burnout-prevention',
    title: 'High Stress Levels Detected',
    message: 'Your recent activity patterns suggest elevated stress levels. Consider reducing workload or discussing priorities with your team lead.',
    severity: 'medium',
    isRead: false,
    isDismissed: false,
    metadata: { suggestedAction: 'Schedule team check-in' },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: 'insight_3',
    userId: 'demo-user-id',
    type: 'insight',
    category: 'productivity',
    title: 'Peak Performance Time',
    message: 'You seem most productive between 10 AM and 2 PM. Consider scheduling your most challenging tasks during this window.',
    severity: 'low',
    isRead: false,
    isDismissed: false,
    metadata: { suggestedAction: 'Block calendar for deep work' },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  }
];

// Mock activities for activity feed
export const generateMockActivities = () => {
  const activities = [];
  const activityTypes = [
    'commit',
    'pull_request_opened',
    'pull_request_merged',
    'pull_request_reviewed',
    'issue_created',
    'issue_closed',
    'release_published'
  ];

  const repos = mockRepositories.map(r => r.name);
  
  // Generate 20 recent activities
  for (let i = 0; i < 20; i++) {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const repo = repos[Math.floor(Math.random() * repos.length)];
    const hoursAgo = Math.floor(Math.random() * 48) + 1;
    
    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() - hoursAgo);
    
    let title = '';
    let description = '';
    
    switch (type) {
      case 'commit':
        title = `Pushed commit to ${repo}`;
        description = 'Fix validation logic in user registration';
        break;
      case 'pull_request_opened':
        title = `Opened pull request in ${repo}`;
        description = 'Add user profile management features';
        break;
      case 'pull_request_merged':
        title = `Merged pull request in ${repo}`;
        description = 'Implement dark mode theme switching';
        break;
      case 'pull_request_reviewed':
        title = `Reviewed pull request in ${repo}`;
        description = 'Code review for authentication improvements';
        break;
      case 'issue_created':
        title = `Created issue in ${repo}`;
        description = 'Memory leak in dashboard component';
        break;
      case 'issue_closed':
        title = `Closed issue in ${repo}`;
        description = 'Fixed responsive design on mobile devices';
        break;
      case 'release_published':
        title = `Published release in ${repo}`;
        description = 'Version 2.1.0 with new wellness features';
        break;
    }

    activities.push({
      id: `activity_${i}`,
      userId: 'demo-user-id',
      type,
      title,
      description,
      repositoryId: repo,
      metadata: {
        repository: repo,
        author: mockGitHubUser.login
      },
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    });
  }

  return activities.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// Mock onboarding progress
export const getMockOnboardingProgress = () => {
  const stored = localStorage.getItem('demo_onboarding_progress');
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Default onboarding state
  return {
    id: 'onboarding_demo',
    userId: 'demo-user-id',
    currentStep: 'welcome',
    completedSteps: [],
    skippedSteps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  };
};

// Save onboarding progress to localStorage
export const saveMockOnboardingProgress = (progress: any) => {
  localStorage.setItem('demo_onboarding_progress', JSON.stringify(progress));
};

// Check if we should show demo mode banner
export const shouldShowDemoModeBanner = () => {
  const dismissed = localStorage.getItem('demo_mode_banner_dismissed');
  return !dismissed;
};

// Dismiss demo mode banner
export const dismissDemoModeBanner = () => {
  localStorage.setItem('demo_mode_banner_dismissed', 'true');
};