'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Alert, AlertDescription } from '@/app/components/ui/Alert';
import { Badge } from '@/app/components/ui/Badge';
import { Avatar } from '@/app/components/ui/Avatar';
import { Progress } from '@/components/ui/progress';
import { Users, AlertTriangle, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAppMode } from '../../providers/AmplifyProvider';

interface TeamWellnessOverviewProps {
  teamId: string;
}

interface TeamMemberWellness {
  user: any;
  latestMetrics: any | null;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

// Mock data for demo mode
const mockTeamMembers: TeamMemberWellness[] = [
  {
    user: {
      id: '1',
      displayName: 'Alice Developer',
      githubUsername: 'alice-dev',
      githubAvatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4'
    },
    latestMetrics: {
      burnoutRiskScore: 25,
      workLifeBalanceScore: 85,
      focusScore: 90,
      codingHours: 7.2,
      prVelocity: 2.1
    },
    trend: 'improving',
    riskLevel: 'low'
  },
  {
    user: {
      id: '2',
      displayName: 'Bob Engineer',
      githubUsername: 'bob-eng',
      githubAvatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4'
    },
    latestMetrics: {
      burnoutRiskScore: 45,
      workLifeBalanceScore: 65,
      focusScore: 70,
      codingHours: 9.5,
      prVelocity: 1.5
    },
    trend: 'stable',
    riskLevel: 'moderate'
  },
  {
    user: {
      id: '3',
      displayName: 'Charlie Coder',
      githubUsername: 'charlie-code',
      githubAvatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4'
    },
    latestMetrics: {
      burnoutRiskScore: 78,
      workLifeBalanceScore: 35,
      focusScore: 45,
      codingHours: 11.2,
      prVelocity: 0.8
    },
    trend: 'declining',
    riskLevel: 'critical'
  }
];

const mockTeamInsights = [
  {
    id: '1',
    type: 'warning',
    category: 'burnout',
    severity: 'critical',
    title: 'Team Burnout Risk Alert',
    message: 'One team member is showing signs of critical burnout risk. Consider redistributing workload.',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    type: 'tip',
    category: 'productivity',
    severity: 'info',
    title: 'Team Productivity Insight',
    message: 'Team PR velocity has increased by 15% this week. Great collaborative effort!',
    createdAt: new Date().toISOString()
  }
];

export default function TeamWellnessOverview({ teamId }: TeamWellnessOverviewProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWellness[]>([]);
  const [teamInsights, setTeamInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAmplifyAvailable, isDemoMode } = useAppMode();

  useEffect(() => {
    fetchTeamWellnessData();
  }, [teamId, isAmplifyAvailable]);

  const fetchTeamWellnessData = async () => {
    try {
      if (isDemoMode || !isAmplifyAvailable) {
        // Use mock data in demo mode
        setTimeout(() => {
          setTeamMembers(mockTeamMembers);
          setTeamInsights(mockTeamInsights);
          setLoading(false);
        }, 1000);
        return;
      }

      const { generateClient } = await import('aws-amplify/data');
      const { Schema } = await import('../../../amplify/data/client-schema');
      const client = generateClient<typeof Schema>();
      
      // Get team members
      const memberships = await client.models.TeamMember.list({
        filter: { teamId: { eq: teamId } }
      });

      const memberWellnessData: TeamMemberWellness[] = [];

      for (const membership of memberships.data) {
        if (!membership.user) continue;

        // Get latest wellness metrics for each member
        const metricsData = await client.models.DeveloperWellnessMetrics.list({
          filter: { userId: { eq: membership.userId } },
          limit: 30
        });

        const sortedMetrics = metricsData.data.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const latestMetrics = sortedMetrics[0] || null;
        
        // Calculate trend
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (sortedMetrics.length >= 7) {
          const recentAvg = sortedMetrics.slice(0, 7).reduce((sum, m) => 
            sum + (m.burnoutRiskScore || 0), 0) / 7;
          const olderAvg = sortedMetrics.slice(7, 14).reduce((sum, m) => 
            sum + (m.burnoutRiskScore || 0), 0) / 7;
          
          if (recentAvg < olderAvg - 5) trend = 'improving';
          else if (recentAvg > olderAvg + 5) trend = 'declining';
        }

        // Determine risk level
        const burnoutScore = latestMetrics?.burnoutRiskScore || 0;
        const riskLevel = burnoutScore >= 75 ? 'critical' : 
                         burnoutScore >= 50 ? 'high' :
                         burnoutScore >= 25 ? 'moderate' : 'low';

        memberWellnessData.push({
          user: membership.user,
          latestMetrics,
          trend,
          riskLevel
        });
      }

      setTeamMembers(memberWellnessData);

      // Get team-level insights
      const insights = await client.models.WellnessInsight.list({
        filter: { 
          teamId: { eq: teamId },
          isDismissed: { eq: false }
        }
      });
      setTeamInsights(insights.data);
    } catch (error) {
      console.error('Error fetching team wellness data:', error);
      // Fallback to mock data on error
      setTeamMembers(mockTeamMembers);
      setTeamInsights(mockTeamInsights);
    } finally {
      setLoading(false);
    }
  };

  // Calculate team statistics
  const getTeamStats = () => {
    const stats = {
      avgBurnoutScore: 0,
      avgWorkLifeBalance: 0,
      avgFocusScore: 0,
      atRiskMembers: 0,
      totalMembers: teamMembers.length
    };

    teamMembers.forEach(member => {
      if (member.latestMetrics) {
        stats.avgBurnoutScore += member.latestMetrics.burnoutRiskScore || 0;
        stats.avgWorkLifeBalance += member.latestMetrics.workLifeBalanceScore || 0;
        stats.avgFocusScore += member.latestMetrics.focusScore || 0;
        if (member.riskLevel === 'high' || member.riskLevel === 'critical') {
          stats.atRiskMembers++;
        }
      }
    });

    if (stats.totalMembers > 0) {
      stats.avgBurnoutScore /= stats.totalMembers;
      stats.avgWorkLifeBalance /= stats.totalMembers;
      stats.avgFocusScore /= stats.totalMembers;
    }

    return stats;
  };

  const stats = getTeamStats();

  // Prepare data for charts
  const radarData = teamMembers.map(member => ({
    name: member.user?.displayName || member.user?.githubUsername || 'Unknown',
    burnout: 100 - (member.latestMetrics?.burnoutRiskScore || 0),
    balance: member.latestMetrics?.workLifeBalanceScore || 0,
    focus: member.latestMetrics?.focusScore || 0,
    productivity: (member.latestMetrics?.prVelocity || 0) * 20
  }));

  const barData = teamMembers.map(member => ({
    name: member.user?.displayName || member.user?.githubUsername || 'Unknown',
    codingHours: member.latestMetrics?.codingHours || 0,
    optimal: 8
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              At Risk
              {stats.atRiskMembers > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.atRiskMembers}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgWorkLifeBalance.toFixed(0)}</div>
            <Progress value={stats.avgWorkLifeBalance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgFocusScore.toFixed(0)}</div>
            <Progress value={stats.avgFocusScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Team Insights */}
      {teamInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Insights</CardTitle>
            <CardDescription>Important wellness notifications for your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamInsights.map(insight => (
                <Alert key={insight.id} variant={insight.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">{insight.title}</div>
                    <div className="text-sm mt-1">{insight.message}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Member Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Wellness Status</CardTitle>
          <CardDescription>Monitor each team member's wellness metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map(member => (
              <div key={member.user?.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={member.user?.githubAvatarUrl}
                    alt={member.user?.displayName || member.user?.githubUsername || 'Unknown'}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{member.user?.displayName || member.user?.githubUsername || 'Unknown'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={
                          member.riskLevel === 'critical' ? 'destructive' :
                          member.riskLevel === 'high' ? 'destructive' :
                          member.riskLevel === 'moderate' ? 'secondary' :
                          'default'
                        }
                      >
                        {member.riskLevel} risk
                      </Badge>
                      <div className="flex items-center gap-1 text-sm">
                        {member.trend === 'improving' ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">Improving</span>
                          </>
                        ) : member.trend === 'declining' ? (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span className="text-red-600">Declining</span>
                          </>
                        ) : (
                          <>
                            <Activity className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">Stable</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Burnout Score</p>
                  <p className="text-2xl font-bold">{member.latestMetrics?.burnoutRiskScore || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Wellness Radar</CardTitle>
            <CardDescription>Overall team performance across metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Wellness Score" dataKey="burnout" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Balance" dataKey="balance" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Radar name="Focus" dataKey="focus" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Coding Hours</CardTitle>
            <CardDescription>Compare against optimal work hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="codingHours" fill="#8884d8" />
                  <Bar dataKey="optimal" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}