'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Tabs, TabPanel } from '@/app/components/ui/Tabs';
import WorkLifeBalance from './WorkLifeBalance';
import FocusTimeChart from './FocusTimeChart';
import BurnoutRiskIndicator from './BurnoutRiskIndicator';
import WellnessTips from './WellnessTips';
import TeamWellnessOverview from './TeamWellnessOverview';
import { Heart, Brain, Clock, TrendingUp, Users } from 'lucide-react';
import { useAppMode } from '../../providers/AmplifyProvider';

// Mock data for demo mode
const mockMetrics = [
  {
    id: '1',
    userId: 'demo-user',
    date: new Date().toISOString().split('T')[0],
    codingHours: 6.5,
    breakTime: 1.5,
    focusSessions: 4,
    averageFocusDuration: 85,
    longestFocusDuration: 120,
    totalCommits: 12,
    morningCommits: 3,
    afternoonCommits: 6,
    eveningCommits: 3,
    lateNightCommits: 0,
    weekendCommits: 0,
    prsOpened: 2,
    prsReviewed: 3,
    prsMerged: 1,
    averagePrSize: 150,
    prVelocity: 1.5,
    firstActivityTime: '09:30',
    lastActivityTime: '18:00',
    consecutiveWorkDays: 5,
    lastDayOff: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    burnoutRiskScore: 25,
    workLifeBalanceScore: 78,
    focusScore: 82,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const mockInsights = [
  {
    id: '1',
    userId: 'demo-user',
    type: 'tip',
    category: 'balance',
    severity: 'info',
    title: 'Great work-life balance!',
    message: 'Your coding hours are well-distributed throughout the day. Keep maintaining this healthy pattern.',
    actionItems: ['Continue taking regular breaks', 'Maintain consistent work hours'],
    isRead: false,
    isDismissed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function WellnessDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('member');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const { isAmplifyAvailable, isDemoMode } = useAppMode();

  useEffect(() => {
    fetchWellnessData();
  }, [isAmplifyAvailable]);

  const fetchWellnessData = async () => {
    try {
      if (isDemoMode || !isAmplifyAvailable) {
        // Use mock data in demo mode
        setMetrics(mockMetrics);
        setInsights(mockInsights);
        setUserRole('member');
        setTeamId('team_demo');
        setLoading(false);
        return;
      }

      const { generateClient } = await import('aws-amplify/data');
      const { getCurrentUser } = await import('aws-amplify/auth');
      const { Schema } = await import('../../../amplify/data/client-schema');
      
      try {
        const client = generateClient<typeof Schema>();
        const user = await getCurrentUser();
        
        // Get user's team membership to determine role
        const teamMemberships = await client.models.TeamMember.list({
          filter: { userId: { eq: user.userId } }
        });

        if (teamMemberships.data.length > 0) {
          const membership = teamMemberships.data[0];
          setUserRole(membership.role);
          setTeamId(membership.teamId);
        }

        // Fetch wellness metrics for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const metricsData = await client.models.DeveloperWellnessMetrics.list({
          filter: {
            userId: { eq: user.userId },
            date: { ge: thirtyDaysAgo.toISOString().split('T')[0] }
          }
        });
        setMetrics(metricsData.data);

        // Fetch unread wellness insights
        const insightsData = await client.models.WellnessInsight.list({
          filter: {
            userId: { eq: user.userId },
            isRead: { eq: false },
            isDismissed: { eq: false }
          }
        });
        setInsights(insightsData.data);
      } catch (innerError) {
        console.error('Error with Amplify operations:', innerError);
        // Fallback to mock data
        setMetrics(mockMetrics);
        setInsights(mockInsights);
        setUserRole('member');
        setTeamId('team_demo');
      }
    } catch (error) {
      console.error('Error fetching wellness data:', error);
      // Fallback to mock data
      setMetrics(mockMetrics);
      setInsights(mockInsights);
      setUserRole('member');
      setTeamId('team_demo');
    } finally {
      setLoading(false);
    }
  };

  const getLatestMetrics = () => {
    if (metrics.length === 0) return null;
    return metrics.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  };

  const latestMetrics = getLatestMetrics();

  const statsCards = [
    {
      title: 'Work-Life Balance',
      value: latestMetrics?.workLifeBalanceScore?.toFixed(0) || '0',
      suffix: '/100',
      description: 'Overall balance score',
      icon: Heart,
      color: 'text-green-600'
    },
    {
      title: 'Focus Score',
      value: latestMetrics?.focusScore?.toFixed(0) || '0',
      suffix: '/100',
      description: 'Deep work effectiveness',
      icon: Brain,
      color: 'text-blue-600'
    },
    {
      title: 'Daily Coding Hours',
      value: latestMetrics?.codingHours?.toFixed(1) || '0',
      suffix: 'hrs',
      description: 'Average time coding',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      title: 'PR Velocity',
      value: latestMetrics?.prVelocity?.toFixed(1) || '0',
      suffix: '/day',
      description: 'Pull requests completed',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Developer Wellness Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your coding habits, productivity patterns, and well-being metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                  <span className="text-sm font-normal text-muted-foreground">
                    {stat.suffix}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'focus', label: 'Focus Time' },
          { id: 'balance', label: 'Work-Life Balance' },
          { id: 'insights', label: 'Insights' },
          ...(userRole === 'owner' || userRole === 'admin' 
            ? [{ id: 'team', label: 'Team Overview', icon: Users }] 
            : [])
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <TabPanel isActive={activeTab === 'overview'}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BurnoutRiskIndicator score={latestMetrics?.burnoutRiskScore || 0} />
          <WellnessTips insights={insights} />
        </div>
      </TabPanel>

      <TabPanel isActive={activeTab === 'focus'}>
        <FocusTimeChart metrics={metrics} />
      </TabPanel>

      <TabPanel isActive={activeTab === 'balance'}>
        <WorkLifeBalance metrics={metrics} />
      </TabPanel>

      <TabPanel isActive={activeTab === 'insights'}>
        <WellnessTips insights={insights} detailed={true} />
      </TabPanel>

      {(userRole === 'owner' || userRole === 'admin') && teamId && (
        <TabPanel isActive={activeTab === 'team'}>
          <TeamWellnessOverview teamId={teamId} />
        </TabPanel>
      )}
    </div>
  );
}