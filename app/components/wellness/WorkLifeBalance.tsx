'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import type { Schema } from '@/amplify/data/client-schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Clock, Coffee, Moon, Sun, Calendar } from 'lucide-react';

interface WorkLifeBalanceProps {
  metrics: Schema['DeveloperWellnessMetrics']['type'][];
  detailed?: boolean;
}

export default function WorkLifeBalance({ metrics, detailed = false }: WorkLifeBalanceProps) {
  // Calculate work patterns
  const calculateWorkPatterns = () => {
    if (metrics.length === 0) return null;

    const totalDays = metrics.length;
    const weekendDays = metrics.filter(m => {
      const date = new Date(m.date);
      return date.getDay() === 0 || date.getDay() === 6;
    }).length;

    const avgCodingHours = metrics.reduce((sum, m) => sum + (m.codingHours || 0), 0) / totalDays;
    const avgBreakTime = metrics.reduce((sum, m) => sum + (m.breakTime || 0), 0) / totalDays;
    const lateNightWork = metrics.filter(m => (m.lateNightCommits || 0) > 0).length;
    const weekendWork = metrics.filter(m => (m.weekendCommits || 0) > 0).length;

    return {
      avgCodingHours,
      avgBreakTime,
      lateNightWorkDays: lateNightWork,
      weekendWorkDays: weekendWork,
      weekendDaysTotal: weekendDays,
      totalDays
    };
  };

  const patterns = calculateWorkPatterns();

  // Prepare data for time distribution chart
  const getTimeDistributionData = () => {
    const distribution = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      lateNight: 0
    };

    metrics.forEach(m => {
      distribution.morning += m.morningCommits || 0;
      distribution.afternoon += m.afternoonCommits || 0;
      distribution.evening += m.eveningCommits || 0;
      distribution.lateNight += m.lateNightCommits || 0;
    });

    return [
      { name: 'Morning', value: distribution.morning, label: '6AM-12PM' },
      { name: 'Afternoon', value: distribution.afternoon, label: '12PM-6PM' },
      { name: 'Evening', value: distribution.evening, label: '6PM-12AM' },
      { name: 'Late Night', value: distribution.lateNight, label: '12AM-6AM' }
    ];
  };

  // Prepare data for daily hours chart
  const getDailyHoursData = () => {
    return metrics.slice(-7).map(m => ({
      date: new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      coding: m.codingHours || 0,
      breaks: m.breakTime || 0,
      isWeekend: new Date(m.date).getDay() === 0 || new Date(m.date).getDay() === 6
    }));
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  if (!patterns) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Work-Life Balance</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const workLifeScore = 100 - (
    (patterns.lateNightWorkDays / patterns.totalDays) * 30 +
    (patterns.weekendWorkDays / patterns.weekendDaysTotal) * 20 +
    Math.max(0, (patterns.avgCodingHours - 8) / 8) * 50
  );

  return (
    <>
      <Card className={detailed ? '' : 'h-full'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Work-Life Balance
          </CardTitle>
          <CardDescription>
            Your coding hours and break time patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Score */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Balance Score</span>
              <span className="font-semibold">{workLifeScore.toFixed(0)}/100</span>
            </div>
            <Progress value={workLifeScore} className="h-2" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Daily Hours</p>
              <p className="text-2xl font-semibold">{patterns.avgCodingHours.toFixed(1)}h</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Break Time</p>
              <p className="text-2xl font-semibold">{patterns.avgBreakTime.toFixed(1)}h</p>
            </div>
          </div>

          {/* Work Patterns Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Late Night Work</span>
              </div>
              <span className={`text-sm font-medium ${patterns.lateNightWorkDays > 3 ? 'text-red-600' : 'text-green-600'}`}>
                {patterns.lateNightWorkDays} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Weekend Work</span>
              </div>
              <span className={`text-sm font-medium ${patterns.weekendWorkDays > 2 ? 'text-red-600' : 'text-green-600'}`}>
                {patterns.weekendWorkDays} days
              </span>
            </div>
          </div>

          {!detailed && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getDailyHoursData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="coding" fill="#3b82f6" name="Coding Hours" />
                  <Bar dataKey="breaks" fill="#10b981" name="Break Time" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {detailed && (
        <>
          {/* Daily Hours Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Work Hours Trend</CardTitle>
              <CardDescription>Your coding and break time over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDailyHoursData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tick={({ x, y, payload }) => (
                        <text 
                          x={x} 
                          y={y} 
                          textAnchor="middle" 
                          fill={payload.value.isWeekend ? '#ef4444' : '#666'}
                        >
                          {payload.value}
                        </text>
                      )}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="coding" fill="#3b82f6" name="Coding Hours" />
                    <Bar dataKey="breaks" fill="#10b981" name="Break Time" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Work Time Distribution</CardTitle>
              <CardDescription>When you're most active during the day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getTimeDistributionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getTimeDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {getTimeDistributionData().map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-sm">{item.name}: {item.label}</span>
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