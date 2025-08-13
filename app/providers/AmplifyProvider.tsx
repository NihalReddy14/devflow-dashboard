'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    Amplify.configure(outputs, {
      ssr: true // Enable SSR mode for Next.js
    });
  }, []);
  
  return <>{children}</>;
}