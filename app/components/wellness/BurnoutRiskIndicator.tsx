'use client';

import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/Alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/app/components/ui/Badge';
import type { Schema } from '@/amplify/data/client-schema';
import { AlertTriangle, CheckCircle, Info, XCircle, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

interface BurnoutRiskIndicatorProps {
  metrics: Schema['DeveloperWellnessMetrics']['type'] | null;
}

export default function BurnoutRiskIndicator({ metrics }: BurnoutRiskIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!metrics) {
    return null;
  }

  const burnoutScore = metrics.burnoutRiskScore || 0;
  
  // Determine risk level
  const getRiskLevel = (score: number) => {
    if (score >= 75) return { level: 'Critical', color: 'destructive', icon: XCircle };
    if (score >= 50) return { level: 'High', color: 'warning', icon: AlertTriangle };
    if (score >= 25) return { level: 'Moderate', color: 'default', icon: Info };
    return { level: 'Low', color: 'success', icon: CheckCircle };
  };

  const risk = getRiskLevel(burnoutScore);
  const RiskIcon = risk.icon;

  // Calculate risk factors
  const riskFactors = [];
  
  if ((metrics.codingHours || 0) > 10) {
    riskFactors.push({
      factor: 'Excessive Daily Hours',
      description: `${metrics.codingHours?.toFixed(1)} hours of coding (recommended: <8)`,
      severity: 'high'
    });
  }

  if ((metrics.consecutiveWorkDays || 0) > 10) {
    riskFactors.push({
      factor: 'No Recent Breaks',
      description: `${metrics.consecutiveWorkDays} consecutive work days`,
      severity: 'high'
    });
  }

  if ((metrics.lateNightCommits || 0) > 0) {
    riskFactors.push({
      factor: 'Late Night Work',
      description: `${metrics.lateNightCommits} commits after midnight`,
      severity: 'medium'
    });
  }

  if ((metrics.weekendCommits || 0) > 5) {
    riskFactors.push({
      factor: 'Weekend Work',
      description: `${metrics.weekendCommits} weekend commits`,
      severity: 'medium'
    });
  }

  if ((metrics.breakTime || 0) < 1) {
    riskFactors.push({
      factor: 'Insufficient Breaks',
      description: `Only ${metrics.breakTime?.toFixed(1)} hours of break time`,
      severity: 'high'
    });
  }

  // Recovery recommendations
  const getRecommendations = () => {
    const recommendations = [];
    
    if (burnoutScore >= 50) {
      recommendations.push('Consider taking a full day off to recharge');
      recommendations.push('Set strict work hour boundaries (e.g., 9 AM - 6 PM)');
    }
    
    if ((metrics.lateNightCommits || 0) > 0) {
      recommendations.push('Avoid coding after 10 PM for better sleep quality');
    }
    
    if ((metrics.breakTime || 0) < 2) {
      recommendations.push('Take a 5-minute break every 25 minutes (Pomodoro Technique)');
      recommendations.push('Schedule lunch breaks away from your desk');
    }
    
    if ((metrics.focusSessions || 0) < 2) {
      recommendations.push('Block out 2-3 hours daily for uninterrupted deep work');
    }
    
    return recommendations;
  };

  if (burnoutScore < 25 && !showDetails) {
    return null; // Don't show if risk is low
  }

  return (
    <Alert 
      variant={risk.color as any}
      className="cursor-pointer"
      onClick={() => setShowDetails(!showDetails)}
    >
      <RiskIcon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Burnout Risk: {risk.level}</span>
        <Badge variant={risk.color as any} className="ml-2">
          {burnoutScore.toFixed(0)}%
        </Badge>
      </AlertTitle>
      <AlertDescription>
        {burnoutScore >= 50 
          ? 'Your work patterns indicate elevated stress levels. Consider taking breaks.'
          : burnoutScore >= 25
          ? 'Some concerning work patterns detected. Monitor your work-life balance.'
          : 'Your work patterns are healthy. Keep up the good balance!'}
      </AlertDescription>

      {showDetails && (
        <div className="mt-4 space-y-4">
          {/* Risk Score Breakdown */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Risk Score Breakdown</h4>
            <Progress value={burnoutScore} className="h-2" />
          </div>

          {/* Risk Factors */}
          {riskFactors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Risk Factors</h4>
              <div className="space-y-1">
                {riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Activity className={`h-4 w-4 mt-0.5 ${
                      factor.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">{factor.factor}</p>
                      <p className="text-xs text-muted-foreground">{factor.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Recommendations</h4>
            <ul className="space-y-1 text-sm">
              {getRecommendations().map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Wellness Metrics Summary */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Work-Life Balance</p>
              <p className="font-semibold">{metrics.workLifeBalanceScore?.toFixed(0) || 0}/100</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Focus Score</p>
              <p className="font-semibold">{metrics.focusScore?.toFixed(0) || 0}/100</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Days Since Break</p>
              <p className="font-semibold">{metrics.consecutiveWorkDays || 0}</p>
            </div>
          </div>
        </div>
      )}
    </Alert>
  );
}