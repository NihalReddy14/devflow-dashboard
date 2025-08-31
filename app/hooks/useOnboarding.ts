'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/client-schema';
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const user = await getCurrentUser();
      
      // Check if user has completed onboarding
      const { data: progress } = await client.models.OnboardingProgress.list({
        filter: { userId: { eq: user.userId } }
      });

      if (!progress || progress.length === 0 || progress[0].currentStep !== 'completed') {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      const user = await getCurrentUser();
      const { data: progress } = await client.models.OnboardingProgress.list({
        filter: { userId: { eq: user.userId } }
      });

      if (progress && progress.length > 0) {
        await client.models.OnboardingProgress.update({
          id: progress[0].id,
          currentStep: 'completed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return {
    showOnboarding,
    loading,
    completeOnboarding,
  };
}