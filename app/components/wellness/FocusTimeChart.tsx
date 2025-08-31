'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import type { Schema } from '@/amplify/data/resource';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface FocusTimeChartProps {
  metrics: Schema['DeveloperWellnessMetrics']['type'][];
  detailed?: boolean;
}

export default function FocusTimeChart({ metrics, detailed = false }: FocusTimeChartProps) {
  // Calculate focus statistics
  const calculateFocusStats = () => {
    if (metrics.length === 0) return null;

    const totalSessions = metrics.reduce((sum, m) => sum + (m.focusSessions || 0), 0);
    const avgSessionsPerDay = totalSessions / metrics.length;
    const avgDuration = metrics.reduce((sum, m) => sum + (m.averageFocusDuration || 0), 0) / metrics.length;
    const longestSession = Math.max(...metrics.map(m => m.longestFocusDuration || 0));
    
    // Calculate trend
    const recentMetrics = metrics.slice(-7);
    const olderMetrics = metrics.slice(-14, -7);
    const recentAvg = recentMetrics.reduce((sum, m) => sum + (m.focusSessions || 0), 0) / recentMetrics.length;
    const olderAvg = olderMetrics.length > 0 
      ? olderMetrics.reduce((sum, m) => sum + (m.focusSessions || 0), 0) / olderMetrics.length
      : recentAvg;
    const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

    return {
      totalSessions,
      avgSessionsPerDay,
      avgDuration,
      longestSession,
      trend
    };
  };

  const stats = calculateFocusStats();

  // Prepare data for focus sessions chart
  const getFocusSessionsData = () => {
    return metrics.slice(detailed ? -30 : -7).map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      sessions: m.focusSessions || 0,
      avgDuration: m.averageFocusDuration || 0,
      longestDuration: m.longestFocusDuration || 0,
      focusScore: m.focusScore || 0
    }));
  };

  // Prepare data for focus quality distribution
  const getFocusQualityData = () => {
    const distribution = {
      deep: 0,    // >90 min sessions
      medium: 0,  // 45-90 min sessions
      shallow: 0  // <45 min sessions
    };

    metrics.forEach(m => {
      if (m.averageFocusDuration) {
        if (m.averageFocusDuration >= 90) distribution.deep++;
        else if (m.averageFocusDuration >= 45) distribution.medium++;
        else distribution.shallow++;
      }
    });

    return [
      { name: 'Deep Focus', value: distribution.deep, description: '>90 min' },
      { name: 'Medium Focus', value: distribution.medium, description: '45-90 min' },
      { name: 'Shallow Focus', value: distribution.shallow, description: '<45 min' }
    ];
  };

  // Calculate optimal focus times
  const getOptimalFocusTimes = () => {
    const timeSlots = {
      earlyMorning: { total: 0, count: 0 }, // 6-9am
      morning: { total: 0, count: 0 },      // 9am-12pm
      afternoon: { total: 0, count: 0 },    // 12-3pm
      lateAfternoon: { total: 0, count: 0 }, // 3-6pm
      evening: { total: 0, count: 0 }       // 6-9pm
    };

    metrics.forEach(m => {
      if (m.firstActivityTime && m.focusSessions && m.focusSessions > 0) {
        const hour = parseInt(m.firstActivityTime.split(':')[0]);
        
        if (hour >= 6 && hour < 9) {
          timeSlots.earlyMorning.total += m.averageFocusDuration || 0;
          timeSlots.earlyMorning.count++;
        } else if (hour >= 9 && hour < 12) {
          timeSlots.morning.total += m.averageFocusDuration || 0;
          timeSlots.morning.count++;
        } else if (hour >= 12 && hour < 15) {
          timeSlots.afternoon.total += m.averageFocusDuration || 0;
          timeSlots.afternoon.count++;
        } else if (hour >= 15 && hour < 18) {
          timeSlots.lateAfternoon.total += m.averageFocusDuration || 0;
          timeSlots.lateAfternoon.count++;
        } else if (hour >= 18 && hour < 21) {
          timeSlots.evening.total += m.averageFocusDuration || 0;
          timeSlots.evening.count++;
        }
      }
    });

    return Object.entries(timeSlots)
      .map(([slot, data]) => ({
        slot,
        avgDuration: data.count > 0 ? data.total / data.count : 0,
        sessions: data.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration);
  };

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Focus Time</CardTitle>
          <CardDescription>No focus data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className={detailed ? '' : 'h-full'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Focus Time Analysis
          </CardTitle>
          <CardDescription>
            Deep work sessions and concentration patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Daily Sessions</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold">{stats.avgSessionsPerDay.toFixed(1)}</p>
                {stats.trend !== 0 && (
                  <Badge variant={stats.trend > 0 ? "default" : "secondary"} className="text-xs">
                    {stats.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(stats.trend).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-semibold">{stats.avgDuration.toFixed(0)} min</p>
            </div>
          </div>

          {/* Longest Session Badge */}
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Longest Focus Session</span>
            </div>
            <Badge variant="outline">{stats.longestSession.toFixed(0)} min</Badge>
          </div>

          {!detailed && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getFocusSessionsData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Focus Sessions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="focusScore" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Focus Score"
                    yAxisId="right"
                  />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {detailed && (
        <>
          {/* Focus Sessions Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Sessions Trend</CardTitle>
              <CardDescription>Number and quality of deep work sessions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getFocusSessionsData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="sessions" 
                      stackId="1"
                      stroke="#8b5cf6" 
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                      name="Focus Sessions"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avgDuration" 
                      stackId="2"
                      stroke="#3b82f6" 
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Avg Duration (min)"
                      yAxisId="right"
                    />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Focus Quality Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Focus Quality Distribution</CardTitle>
              <CardDescription>Breakdown of your focus session durations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFocusQualityData().map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.description}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(item.value / metrics.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {item.value} days ({((item.value / metrics.length) * 100).toFixed(0)}%)
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimal Focus Times */}
          <Card>
            <CardHeader>
              <CardTitle>Your Optimal Focus Times</CardTitle>
              <CardDescription>When you achieve the best deep work sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getOptimalFocusTimes().slice(0, 3).map((time, index) => (
                  <div key={time.slot} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium capitalize">
                        {time.slot.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{time.avgDuration.toFixed(0)} min</p>
                      <p className="text-xs text-muted-foreground">{time.sessions} sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}