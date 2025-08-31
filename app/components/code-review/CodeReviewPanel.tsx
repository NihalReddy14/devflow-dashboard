"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { CodeReviewItem } from "./CodeReviewItem";
import { CodeReviewStats } from "./CodeReviewStats";
import { mockReviews } from "./mockData";
import { useAppMode } from "../../providers/AmplifyProvider";

interface CodeReviewPanelProps {
  teamId: string;
}

export function CodeReviewPanel({ teamId }: CodeReviewPanelProps) {
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [reviewType, setReviewType] = useState("general");
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [remainingReviews, setRemainingReviews] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const { isAmplifyAvailable, isDemoMode } = useAppMode();

  useEffect(() => {
    fetchReviews();
    fetchTeamStats();
  }, [teamId, isAmplifyAvailable]);

  const fetchReviews = async () => {
    if (isDemoMode || !isAmplifyAvailable) {
      // Use mock data in demo mode
      setReviews(mockReviews);
      return;
    }

    try {
      const { generateClient } = await import("aws-amplify/data");
      const { Schema } = await import("../../../amplify/data/client-schema");
      const client = generateClient<typeof Schema>();
      
      const { data: reviewData } = await client.models.AICodeReview.list({
        filter: { teamId: { eq: teamId } },
        limit: 10,
      });
      // Use mock data if no real reviews exist yet
      setReviews(reviewData && reviewData.length > 0 ? reviewData : mockReviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      // Fallback to mock data on error
      setReviews(mockReviews);
    }
  };

  const fetchTeamStats = async () => {
    if (isDemoMode || !isAmplifyAvailable) {
      // In demo mode, show default stats
      setRemainingReviews(7); // Show 3 used out of 10
      return;
    }

    try {
      const { generateClient } = await import("aws-amplify/data");
      const { Schema } = await import("../../../amplify/data/client-schema");
      const client = generateClient<typeof Schema>();
      
      const { data: teamData } = await client.models.Team.get({ id: teamId });
      if (teamData) {
        const used = teamData.monthlyReviewCount || 0;
        setRemainingReviews(10 - used);
      }
    } catch (err) {
      console.error("Error fetching team stats:", err);
      // Default to showing some reviews available
      setRemainingReviews(7);
    }
  };

  const handleSubmitReview = async () => {
    if (!codeSnippet.trim()) {
      setError("Please enter some code to review");
      return;
    }

    if (remainingReviews <= 0) {
      setError("Monthly review limit reached. Please upgrade to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    if (isDemoMode || !isAmplifyAvailable) {
      // Simulate AI review in demo mode
      setTimeout(() => {
        const mockReview = {
          id: `review_${Date.now()}`,
          teamId,
          repositoryName: "Demo Repository",
          branchName: "main",
          codeSnippet,
          language,
          reviewType,
          reviewContent: "This is a demo AI review. In production, this would contain real AI-generated feedback about your code quality, potential bugs, and improvement suggestions.",
          severity: "info",
          suggestions: {
            improvements: ["Consider adding error handling", "Extract this logic into a reusable function"],
            security: ["No security issues detected"],
            performance: ["Consider memoizing this expensive calculation"]
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setReviews(prev => [mockReview, ...prev]);
        setRemainingReviews(prev => prev - 1);
        setCodeSnippet("");
        setLoading(false);
      }, 2000);
      return;
    }

    try {
      const { generateClient } = await import("aws-amplify/data");
      const { Schema } = await import("../../../amplify/data/client-schema");
      const client = generateClient<typeof Schema>();
      
      const result = await client.mutations.performAICodeReview({
        teamId,
        codeSnippet,
        language,
        reviewType,
      });

      if (result.data?.success) {
        setCodeSnippet("");
        setRemainingReviews(result.data.remainingReviews || 0);
        await fetchReviews();
      } else {
        setError(result.data?.error || "Failed to perform code review");
      }
    } catch (err) {
      console.error("Error performing code review:", err);
      setError("An error occurred while performing the code review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <CodeReviewStats 
        remainingReviews={remainingReviews}
        totalReviews={10}
        reviewsThisMonth={10 - remainingReviews}
      />

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Submit Code for AI Review
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="javascript">JavaScript/TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="ruby">Ruby</option>
                <option value="php">PHP</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Review Type
              </label>
              <select
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="general">General Review</option>
                <option value="security">Security Audit</option>
                <option value="performance">Performance Analysis</option>
                <option value="refactoring">Refactoring Suggestions</option>
                <option value="testing">Test Coverage</option>
                <option value="documentation">Documentation Check</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code Snippet
            </label>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="Paste your code here for AI review..."
              className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <Button
            onClick={handleSubmitReview}
            disabled={loading || remainingReviews <= 0}
            className="w-full"
          >
            {loading ? "Analyzing..." : "Submit for AI Review"}
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Reviews
        </h3>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No reviews yet. Submit your first code snippet above!
          </div>
        ) : (
          reviews.map((review) => (
            <CodeReviewItem key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
}