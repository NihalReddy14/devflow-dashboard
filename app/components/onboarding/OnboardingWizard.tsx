'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import WelcomeStep from './steps/WelcomeStep';
import GitHubConnectionStep from './steps/GitHubConnectionStep';
import TeamSetupStep from './steps/TeamSetupStep';
import ProductTourStep from './steps/ProductTourStep';
import { Button } from '../ui/Button';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export type OnboardingStep = 'welcome' | 'github' | 'team' | 'tour' | 'completed';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadOnboardingProgress();
  }, []);

  const loadOnboardingProgress = async () => {
    try {
      const user = await getCurrentUser();
      setUserId(user.userId);
      
      const { data: progress } = await client.models.OnboardingProgress.list({
        filter: { userId: { eq: user.userId } }
      });

      if (progress && progress.length > 0) {
        const userProgress = progress[0];
        setCurrentStep(userProgress.currentStep as OnboardingStep);
        setCompletedSteps(userProgress.completedSteps as OnboardingStep[]);
      } else {
        // Create initial onboarding progress
        await client.models.OnboardingProgress.create({
          userId: user.userId,
          currentStep: 'welcome',
          completedSteps: [],
          skippedSteps: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (step: OnboardingStep, completed: boolean = false) => {
    try {
      const { data: progress } = await client.models.OnboardingProgress.list({
        filter: { userId: { eq: userId } }
      });

      if (progress && progress.length > 0) {
        const updatedCompletedSteps = completed 
          ? [...completedSteps, currentStep]
          : completedSteps;

        await client.models.OnboardingProgress.update({
          id: progress[0].id,
          currentStep: step,
          completedSteps: updatedCompletedSteps,
          updatedAt: new Date().toISOString(),
          completedAt: step === 'completed' ? new Date().toISOString() : undefined,
        });

        if (completed) {
          setCompletedSteps(updatedCompletedSteps);
        }
        setCurrentStep(step);
      }
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
    }
  };

  const handleNext = async () => {
    const steps: OnboardingStep[] = ['welcome', 'github', 'team', 'tour', 'completed'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      await updateProgress(steps[currentIndex + 1], true);
    }
    
    if (steps[currentIndex + 1] === 'completed') {
      onComplete();
    }
  };

  const handleSkip = async () => {
    const steps: OnboardingStep[] = ['welcome', 'github', 'team', 'tour', 'completed'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      // Track skipped step
      const { data: progress } = await client.models.OnboardingProgress.list({
        filter: { userId: { eq: userId } }
      });

      if (progress && progress.length > 0) {
        const skippedSteps = progress[0].skippedSteps || [];
        await client.models.OnboardingProgress.update({
          id: progress[0].id,
          skippedSteps: [...skippedSteps, currentStep],
          updatedAt: new Date().toISOString(),
        });
      }

      await updateProgress(steps[currentIndex + 1], false);
    }
  };

  const handleBack = async () => {
    const steps: OnboardingStep[] = ['welcome', 'github', 'team', 'tour'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      await updateProgress(steps[currentIndex - 1], false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'github':
        return <GitHubConnectionStep onConnected={handleNext} />;
      case 'team':
        return <TeamSetupStep userId={userId} />;
      case 'tour':
        return <ProductTourStep onComplete={handleNext} />;
      default:
        return null;
    }
  };

  const canSkip = currentStep === 'team' || currentStep === 'tour';
  const showBack = currentStep !== 'welcome';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['welcome', 'github', 'team', 'tour'].map((step, index) => (
              <div
                key={step}
                className={`flex-1 ${index !== 0 ? 'ml-2' : ''}`}
              >
                <div
                  className={`h-2 rounded-full transition-colors duration-300 ${
                    completedSteps.includes(step as OnboardingStep) || currentStep === step
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                />
                <p className="text-xs mt-2 text-center capitalize text-gray-600">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          {renderStep()}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {showBack && (
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            
            <div className="flex gap-4 ml-auto">
              {canSkip && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                >
                  Skip
                </Button>
              )}
              
              {currentStep !== 'github' && currentStep !== 'tour' && (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 'completed'}
                >
                  {currentStep === 'tour' ? 'Complete' : 'Next'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}