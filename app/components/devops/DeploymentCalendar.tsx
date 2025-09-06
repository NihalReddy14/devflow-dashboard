'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '@/amplify/data/client-schema';
import { ChevronLeft, ChevronRight, Rocket, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

const client = generateClient<Schema>();

interface Deployment {
  id: string;
  environment: string;
  status: string;
  startedAt: string;
  deployedBy: string;
  commitSha: string;
}

interface DayData {
  date: Date;
  deployments: Deployment[];
  successCount: number;
  failureCount: number;
}

export default function DeploymentCalendar({ repositoryId }: { repositoryId?: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  useEffect(() => {
    fetchDeployments();
  }, [repositoryId, currentDate]);

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const deploymentsResponse = await client.models.Deployment.list({
        filter: {
          ...(repositoryId && { repositoryId: { eq: repositoryId } }),
          startedAt: { 
            between: [startOfMonth.toISOString(), endOfMonth.toISOString()] 
          },
        },
      });

      setDeployments(deploymentsResponse.data as Deployment[]);
    } catch (error) {
      console.error('Error fetching deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (DayData | null)[] = [];

    // Add empty days for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayDeployments = deployments.filter(deployment => {
        const deployDate = new Date(deployment.startedAt);
        return deployDate.getDate() === day &&
               deployDate.getMonth() === month &&
               deployDate.getFullYear() === year;
      });

      const successCount = dayDeployments.filter(d => d.status === 'success').length;
      const failureCount = dayDeployments.filter(d => d.status === 'failure').length;

      days.push({
        date,
        deployments: dayDeployments,
        successCount,
        failureCount,
      });
    }

    return days;
  };

  const getIntensityColor = (count: number, isFailure = false) => {
    if (count === 0) return '';
    
    const baseColors = isFailure
      ? ['bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500']
      : ['bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500'];
    
    const darkColors = isFailure
      ? ['dark:bg-red-900', 'dark:bg-red-800', 'dark:bg-red-700', 'dark:bg-red-600', 'dark:bg-red-500']
      : ['dark:bg-green-900', 'dark:bg-green-800', 'dark:bg-green-700', 'dark:bg-green-600', 'dark:bg-green-500'];
    
    const intensity = Math.min(count - 1, 4);
    return `${baseColors[intensity]} ${darkColors[intensity]}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const days = getDaysInMonth();

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Deployment Calendar
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
              {formatDate(currentDate)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((dayData, index) => {
            if (!dayData) {
              return <div key={`empty-${index}`} className="h-16" />;
            }

            const hasDeployments = dayData.deployments.length > 0;
            const intensityClass = dayData.failureCount > 0
              ? getIntensityColor(dayData.failureCount, true)
              : getIntensityColor(dayData.successCount);

            return (
              <button
                key={dayData.date.toISOString()}
                className={`
                  h-16 p-1 rounded-lg border transition-all
                  ${isToday(dayData.date) 
                    ? 'border-blue-500 dark:border-blue-400' 
                    : 'border-gray-200 dark:border-gray-700'
                  }
                  ${hasDeployments 
                    ? `${intensityClass} hover:opacity-80 cursor-pointer` 
                    : 'bg-gray-50 dark:bg-gray-900'
                  }
                `}
                onClick={() => hasDeployments && setSelectedDay(dayData)}
                disabled={!hasDeployments}
              >
                <div className="flex flex-col h-full">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {dayData.date.getDate()}
                  </span>
                  {hasDeployments && (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs font-semibold">
                        {dayData.deployments.length}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 dark:bg-green-600 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 dark:bg-red-600 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Failed</span>
            </div>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            Total: {deployments.length} deployments
          </div>
        </div>
      </Card>

      {selectedDay && (
        <Card className="p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Deployments on {selectedDay.date.toLocaleDateString()}
          </h4>
          <div className="space-y-3">
            {selectedDay.deployments.map(deployment => (
              <div 
                key={deployment.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  {deployment.status === 'success' ? (
                    <Rocket className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {deployment.environment} deployment
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      by {deployment.deployedBy} • {deployment.commitSha.slice(0, 7)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${
                  deployment.status === 'success' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {deployment.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}