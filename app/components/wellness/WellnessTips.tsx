'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Alert, AlertDescription } from '@/app/components/ui/Alert';
import type { Schema } from '@/amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { Lightbulb, CheckCircle, X, ChevronRight, Award, AlertTriangle, Info, Heart } from 'lucide-react';
import { useState } from 'react';

const client = generateClient<Schema>();

interface WellnessTipsProps {
  insights: Schema['WellnessInsight']['type'][];
  onDismiss: () => void;
  showAll?: boolean;
}

export default function WellnessTips({ insights, onDismiss, showAll = false }: WellnessTipsProps) {
  const [dismissing, setDismissing] = useState<string | null>(null);

  const handleDismiss = async (insightId: string) => {
    try {
      setDismissing(insightId);
      await client.models.WellnessInsight.update({
        id: insightId,
        isDismissed: true
      });
      onDismiss();
    } catch (error) {
      console.error('Error dismissing insight:', error);
    } finally {
      setDismissing(null);
    }
  };

  const handleMarkRead = async (insightId: string) => {
    try {
      await client.models.WellnessInsight.update({
        id: insightId,
        isRead: true
      });
      onDismiss();
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

  const displayedInsights = showAll ? insights : insights.slice(0, 3);

  if (insights.length === 0) {
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
      {!showAll && (
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
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{insight.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                        </div>
                        <p className="text-sm">{insight.message}</p>
                        {insight.actionItems && insight.actionItems.length > 0 && (
                          <ul className="text-sm space-y-1 mt-2">
                            {insight.actionItems.map((action, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2"
                        onClick={() => handleDismiss(insight.id)}
                        disabled={dismissing === insight.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
            {insights.length > 3 && !showAll && (
              <Button variant="link" className="mt-4 w-full">
                View all {insights.length} insights
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {showAll && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">All Wellness Insights</h2>
              <p className="text-muted-foreground">
                {insights.length} active {insights.length === 1 ? 'insight' : 'insights'}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Group insights by category */}
            {Object.entries(
              insights.reduce((acc, insight) => {
                if (!acc[insight.category]) {
                  acc[insight.category] = [];
                }
                acc[insight.category].push(insight);
                return acc;
              }, {} as Record<string, typeof insights>)
            ).map(([category, categoryInsights]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category} Insights</CardTitle>
                  <CardDescription>
                    {categoryInsights.length} {categoryInsights.length === 1 ? 'tip' : 'tips'} for {category}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryInsights.map((insight) => {
                    const Icon = getIcon(insight.type, insight.category);
                    return (
                      <div
                        key={insight.id}
                        className={`p-4 rounded-lg border ${
                          !insight.isRead ? 'bg-secondary/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon className={`h-5 w-5 mt-0.5 ${
                              insight.type === 'warning' ? 'text-yellow-500' :
                              insight.type === 'achievement' ? 'text-green-500' :
                              'text-blue-500'
                            }`} />
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{insight.title}</h4>
                                {!insight.isRead && (
                                  <Badge variant="default" className="text-xs">New</Badge>
                                )}
                                {insight.severity && (
                                  <Badge 
                                    variant={insight.severity === 'critical' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {insight.severity}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.message}</p>
                              {insight.actionItems && insight.actionItems.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold mb-2">Action Items:</p>
                                  <ul className="text-sm space-y-1">
                                    {insight.actionItems.map((action, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <CheckCircle className="h-3 w-3 mt-0.5 text-green-500" />
                                        <span>{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-3">
                                {!insight.isRead && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkRead(insight.id)}
                                  >
                                    Mark as Read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDismiss(insight.id)}
                                  disabled={dismissing === insight.id}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}