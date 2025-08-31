'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Tabs, TabPanel } from '@/app/components/ui/Tabs';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import WorkLifeBalance from './WorkLifeBalance';
import FocusTimeChart from './FocusTimeChart';
import BurnoutRiskIndicator from './BurnoutRiskIndicator';
import WellnessTips from './WellnessTips';
import TeamWellnessOverview from './TeamWellnessOverview';
import { Heart, Brain, Clock, TrendingUp, Users } from 'lucide-react';

const client = generateClient<Schema>();

export default function WellnessDashboard() {
  const [metrics, setMetrics] = useState<Schema['DeveloperWellnessMetrics']['type'][]>([]);
  const [insights, setInsights] = useState<Schema['WellnessInsight']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('member');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchWellnessData();
  }, []);

  const fetchWellnessData = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching wellness data:', error);
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
          Track your coding habits and maintain a healthy work-life balance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
                <span className="text-sm font-normal text-muted-foreground">
                  {stat.suffix}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Burnout Risk Alert */}
      <BurnoutRiskIndicator metrics={latestMetrics} />

      {/* Main Content Tabs */}
      <div className="mt-6">
        <Tabs 
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "focus", label: "Focus Time" },
            { id: "balance", label: "Work-Life Balance" },
            { id: "insights", label: "Insights & Tips" },
            ...((userRole === 'owner' || userRole === 'admin') && teamId ? [{ id: "team", label: "Team Health" }] : [])
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="mt-6">
          <TabPanel isActive={activeTab === "overview"}>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <WorkLifeBalance metrics={metrics} />
                <FocusTimeChart metrics={metrics} />
              </div>
              <WellnessTips insights={insights} onDismiss={fetchWellnessData} />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "focus"}>
            <FocusTimeChart metrics={metrics} detailed={true} />
          </TabPanel>

          <TabPanel isActive={activeTab === "balance"}>
            <WorkLifeBalance metrics={metrics} detailed={true} />
          </TabPanel>

          <TabPanel isActive={activeTab === "insights"}>
            <WellnessTips 
              insights={insights} 
              onDismiss={fetchWellnessData}
              showAll={true} 
            />
          </TabPanel>

          {(userRole === 'owner' || userRole === 'admin') && teamId && (
            <TabPanel isActive={activeTab === "team"}>
              <TeamWellnessOverview teamId={teamId} />
            </TabPanel>
          )}
        </div>
      </div>
    </div>
  );
}