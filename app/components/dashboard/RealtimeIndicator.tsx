"use client";

import { useEffect, useState } from "react";

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
}

export function RealtimeIndicator({ isConnected, lastUpdate }: RealtimeIndicatorProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        {pulse && isConnected && (
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
        )}
      </div>
      <span className="text-gray-600 dark:text-gray-400">
        {isConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}