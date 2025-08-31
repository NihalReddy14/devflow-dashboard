"use client";

import { useState, useEffect } from "react";
import { useAppMode } from "../providers/AmplifyProvider";

export function useTeamData() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAmplifyAvailable, isDemoMode } = useAppMode();

  useEffect(() => {
    fetchOrCreateTeam();
  }, [isAmplifyAvailable, isDemoMode]);

  const fetchOrCreateTeam = async () => {
    try {
      if (isDemoMode || !isAmplifyAvailable) {
        // Use mock team data
        const mockTeam = {
          id: "team_demo",
          name: "DevFlow Demo Team",
          slug: "devflow-demo-team",
          description: "Demo team for showcasing DevFlow features",
          ownerId: "demo-user",
          monthlyReviewCount: 3,
          reviewCountResetDate: new Date().toISOString(),
          slackWebhookUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        setTeamId(mockTeam.id);
        setTeamData(mockTeam);
        console.log("Using mock team data");
        return;
      }

      // Only try to use Amplify client if it's available
      const { generateClient } = await import("aws-amplify/data");
      const { Schema } = await import("../../amplify/data/resource");
      const client = generateClient<typeof Schema>();

      const defaultTeamId = "team_default";
      
      // Try to get existing team
      const { data: existingTeam } = await client.models.Team.get({ id: defaultTeamId });
      
      if (existingTeam) {
        setTeamId(existingTeam.id);
        setTeamData(existingTeam);
      } else {
        // Create a default team
        const { data: newTeam } = await client.models.Team.create({
          id: defaultTeamId,
          name: "Default Team",
          slug: "default-team",
          description: "Default team for demo purposes",
          ownerId: "demo-user",
          monthlyReviewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        if (newTeam) {
          setTeamId(newTeam.id);
          setTeamData(newTeam);
        }
      }
    } catch (error) {
      console.error("Error fetching/creating team:", error);
      // Fallback to mock data on error
      const mockTeam = {
        id: "team_fallback",
        name: "Fallback Demo Team",
        slug: "fallback-demo-team",
        description: "Fallback team data",
        ownerId: "demo-user",
        monthlyReviewCount: 0,
        reviewCountResetDate: new Date().toISOString(),
        slackWebhookUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setTeamId(mockTeam.id);
      setTeamData(mockTeam);
    } finally {
      setLoading(false);
    }
  };

  return { teamId, teamData, loading };
}