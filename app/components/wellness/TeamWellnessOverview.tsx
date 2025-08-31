'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Alert, AlertDescription } from '@/app/components/ui/Alert';
import { Badge } from '@/app/components/ui/Badge';
import { Avatar } from '@/app/components/ui/Avatar';
import { Progress } from '@/components/ui/progress';
import type { Schema } from '@/amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { Users, AlertTriangle, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const client = generateClient<Schema>();

interface TeamWellnessOverviewProps {
  teamId: string;
}

interface TeamMemberWellness {
  user: Schema['User']['type'];
  latestMetrics: Schema['DeveloperWellnessMetrics']['type'] | null;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

export default function TeamWellnessOverview({ teamId }: TeamWellnessOverviewProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWellness[]>([]);
  const [teamInsights, setTeamInsights] = useState<Schema['WellnessInsight']['type'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamWellnessData();
  }, [teamId]);

  const fetchTeamWellnessData = async () => {
    try {
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

  // Prepare data for team comparison chart
  const getTeamComparisonData = () => {
    return teamMembers.map(member => ({
      name: member.user.displayName || member.user.email,
      burnoutRisk: member.latestMetrics?.burnoutRiskScore || 0,
      workLifeBalance: member.latestMetrics?.workLifeBalanceScore || 0,
      focusScore: member.latestMetrics?.focusScore || 0
    }));
  };

  // Prepare data for radar chart
  const getRadarData = () => {
    const stats = getTeamStats();
    return [
      {
        metric: 'Burnout Risk',
        value: 100 - stats.avgBurnoutScore,
        fullMark: 100
      },
      {
        metric: 'Work-Life Balance',
        value: stats.avgWorkLifeBalance,
        fullMark: 100
      },
      {
        metric: 'Focus Quality',
        value: stats.avgFocusScore,
        fullMark: 100
      },
      {
        metric: 'Team Health',
        value: ((stats.totalMembers - stats.atRiskMembers) / stats.totalMembers) * 100,
        fullMark: 100
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = getTeamStats();

  return (
    <div className="space-y-6">
      {/* Team Health Alert */}
      {stats.atRiskMembers > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.atRiskMembers} team {stats.atRiskMembers === 1 ? 'member is' : 'members are'} showing 
            signs of burnout risk. Consider scheduling check-ins and encouraging breaks.
          </AlertDescription>
        </Alert>
      )}

      {/* Team Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active developers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.atRiskMembers}</div>
            <p className="text-xs text-muted-foreground">
              Members need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Balance Score</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgWorkLifeBalance.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Burnout Risk</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgBurnoutScore.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Average risk level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Health Overview Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Team Health Overview</CardTitle>
          <CardDescription>Overall team wellness metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={getRadarData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Team Health" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Individual Member Status */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Member Wellness</CardTitle>
          <CardDescription>Track each team member's wellness status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map(member => (
              <div key={member.user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={member.user.githubAvatarUrl || ''}
                    alt={member.user.displayName || member.user.email}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">{member.user.displayName || member.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={
                          member.riskLevel === 'critical' ? 'destructive' :
                          member.riskLevel === 'high' ? 'warning' :
                          member.riskLevel === 'moderate' ? 'secondary' : 'success'
                        }
                      >
                        {member.riskLevel} risk
                      </Badge>
                      <div className="flex items-center gap-1">
                        {member.trend === 'improving' && (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">Improving</span>
                          </>
                        )}
                        {member.trend === 'declining' && (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600">Declining</span>
                          </>
                        )}
                        {member.trend === 'stable' && (
                          <span className="text-xs text-muted-foreground">Stable</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Burnout Risk</p>
                    <p className="font-semibold">
                      {member.latestMetrics?.burnoutRiskScore?.toFixed(0) || 'N/A'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-semibold">
                      {member.latestMetrics?.workLifeBalanceScore?.toFixed(0) || 'N/A'}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Focus</p>
                    <p className="font-semibold">
                      {member.latestMetrics?.focusScore?.toFixed(0) || 'N/A'}/100
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Wellness Comparison</CardTitle>
          <CardDescription>Compare wellness metrics across team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getTeamComparisonData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="burnoutRisk" fill="#ef4444" name="Burnout Risk" />
                <Bar dataKey="workLifeBalance" fill="#10b981" name="Work-Life Balance" />
                <Bar dataKey="focusScore" fill="#3b82f6" name="Focus Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Insights */}
      {teamInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team-Level Insights</CardTitle>
            <CardDescription>Recommendations for improving team wellness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamInsights.slice(0, 5).map(insight => (
                <Alert key={insight.id}>
                  <AlertDescription>
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm mt-1">{insight.message}</p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}