'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Alert, AlertDescription } from '@/app/components/ui/Alert';
import { Lightbulb, CheckCircle, X, ChevronRight, Award, AlertTriangle, Info, Heart } from 'lucide-react';
import { useState } from 'react';
import { useAppMode } from '../../providers/AmplifyProvider';

interface WellnessTipsProps {
  insights: any[];
  detailed?: boolean;
}

export default function WellnessTips({ insights, detailed = false }: WellnessTipsProps) {
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [localInsights, setLocalInsights] = useState(insights);
  const { isAmplifyAvailable, isDemoMode } = useAppMode();

  const handleDismiss = async (insightId: string) => {
    if (isDemoMode || !isAmplifyAvailable) {
      // In demo mode, just remove from local state
      setLocalInsights(prev => prev.filter(i => i.id !== insightId));
      return;
    }

    try {
      setDismissing(insightId);
      const { generateClient } = await import('aws-amplify/data');
      const { Schema } = await import('../../../amplify/data/client-schema');
      const client = generateClient<typeof Schema>();
      
      await client.models.WellnessInsight.update({
        id: insightId,
        isDismissed: true
      });
      setLocalInsights(prev => prev.filter(i => i.id !== insightId));
    } catch (error) {
      console.error('Error dismissing insight:', error);
    } finally {
      setDismissing(null);
    }
  };

  const handleMarkRead = async (insightId: string) => {
    if (isDemoMode || !isAmplifyAvailable) {
      // In demo mode, just update local state
      setLocalInsights(prev => prev.map(i => 
        i.id === insightId ? { ...i, isRead: true } : i
      ));
      return;
    }

    try {
      const { generateClient } = await import('aws-amplify/data');
      const { Schema } = await import('../../../amplify/data/client-schema');
      const client = generateClient<typeof Schema>();
      
      await client.models.WellnessInsight.update({
        id: insightId,
        isRead: true
      });
      setLocalInsights(prev => prev.map(i => 
        i.id === insightId ? { ...i, isRead: true } : i
      ));
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  const getIcon = (type: string, category: string) => {
    if (type === 'achievement') return Award;
    if (type === 'warning') return AlertTriangle;
    if (category === 'health') return Heart;
    return Lightbulb;
  };

  const getVariant = (type: string, severity?: string) => {
    if (type === 'warning' || severity === 'critical') return 'destructive';
    if (type === 'achievement') return 'success';
    if (severity === 'warning') return 'warning';
    return 'default';
  };

  const displayedInsights = detailed ? localInsights : localInsights.slice(0, 3);

  if (localInsights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Wellness Insights
          </CardTitle>
          <CardDescription>
            Personalized tips to improve your developer wellness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold">You're doing great!</p>
            <p className="text-sm text-muted-foreground mt-2">
              No new wellness insights at the moment. Keep up the healthy habits!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!detailed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Wellness Insights
            </CardTitle>
            <CardDescription>
              Personalized tips to improve your developer wellness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayedInsights.map((insight) => {
                const Icon = getIcon(insight.type, insight.category);
                return (
                  <Alert key={insight.id} variant={getVariant(insight.type, insight.severity) as any}>
                    <Icon className="h-4 w-4" />
                    <AlertDescription className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div>
                          <p className="font-medium">{insight.title}</p>
                          <p className="text-sm mt-1">{insight.message}</p>
                        </div>
                        {insight.actionItems && insight.actionItems.length > 0 && (
                          <ul className="text-sm list-disc list-inside space-y-1">
                            {insight.actionItems.map((item: string, index: number) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(insight.id)}
                        disabled={dismissing === insight.id}
                        className="ml-4"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                );
              })}
              {insights.length > 3 && !detailed && (
                <Button variant="outline" className="w-full" size="sm">
                  View All {insights.length} Insights
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {detailed && (
        <>
          <h2 className="text-2xl font-bold">All Wellness Insights</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {displayedInsights.map((insight) => {
              const Icon = getIcon(insight.type, insight.category);
              return (
                <Card key={insight.id} className={insight.isRead ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <div>
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getVariant(insight.type, insight.severity) as any}>
                              {insight.type}
                            </Badge>
                            <Badge variant="outline">{insight.category}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(insight.id)}
                        disabled={dismissing === insight.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{insight.message}</p>
                    {insight.actionItems && insight.actionItems.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommended Actions:</p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {insight.actionItems.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!insight.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => handleMarkRead(insight.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}