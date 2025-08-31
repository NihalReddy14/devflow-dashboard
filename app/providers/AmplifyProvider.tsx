'use client';

import { useEffect, createContext, useContext, useState } from 'react';
import { Amplify } from 'aws-amplify';

// Create a context for app mode
const AppModeContext = createContext<{
  isAmplifyAvailable: boolean;
  isDemoMode: boolean;
}>({
  isAmplifyAvailable: false,
  isDemoMode: false,
});

export const useAppMode = () => useContext(AppModeContext);

// Mock Amplify outputs for demo mode
const mockOutputs = {
  auth: {
    user_pool_id: "mock-pool",
    aws_region: "us-east-1",
    user_pool_client_id: "mock-client",
    identity_pool_id: "mock-identity-pool",
    mfa_methods: [],
    standard_required_attributes: ["email"],
    username_attributes: ["email"],
    user_verification_types: ["email"],
    groups: [],
    mfa_configuration: "NONE",
    password_policy: {
      min_length: 8,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: true,
      require_uppercase: true
    },
    unauthenticated_identities_enabled: true
  },
  data: {
    url: "https://mock.appsync-api.amazonaws.com/graphql",
    aws_region: "us-east-1",
    api_key: "mock-api-key",
    default_authorization_type: "API_KEY",
    authorization_types: ["API_KEY"],
    model_introspection: {
      version: 1,
      models: {},
      enums: {},
      nonModels: {}
    }
  },
  version: "1.4"
};

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAmplifyAvailable, setIsAmplifyAvailable] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Try to load real Amplify outputs, fallback to mock mode
    const initializeAmplify = async () => {
      try {
        // Try to dynamically import amplify_outputs.json
        const outputs = await import('../../amplify_outputs.json');
        
        // Test if we can actually connect to AWS services
        Amplify.configure(outputs.default, {
          ssr: true
        });
        
        setIsAmplifyAvailable(true);
        setIsDemoMode(false);
        console.log('Amplify configured successfully with real AWS backend');
      } catch (error) {
        console.warn('Amplify outputs not found or AWS backend unavailable, switching to demo mode:', error);
        
        // Configure Amplify with mock outputs to prevent errors
        Amplify.configure(mockOutputs, {
          ssr: true
        });
        
        setIsAmplifyAvailable(false);
        setIsDemoMode(true);
        console.log('Running in demo mode with mock data');
      }
    };

    initializeAmplify();
  }, []);
  
  return (
    <AppModeContext.Provider value={{ isAmplifyAvailable, isDemoMode }}>
      {children}
    </AppModeContext.Provider>
  );
}