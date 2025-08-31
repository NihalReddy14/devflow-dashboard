"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import { Button } from "../ui/Button";
import { CodeReviewItem } from "./CodeReviewItem";
import { CodeReviewStats } from "./CodeReviewStats";
import type { Schema } from "../../../amplify/data/resource";
import { mockReviews } from "./mockData";

const client = generateClient<Schema>();

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

  useEffect(() => {
    fetchReviews();
    fetchTeamStats();
  }, [teamId]);

  const fetchReviews = async () => {
    try {
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
    try {
      const { data: teamData } = await client.models.Team.get({ id: teamId });
      if (teamData) {
        const used = teamData.monthlyReviewCount || 0;
        setRemainingReviews(10 - used);
      }
    } catch (err) {
      console.error("Error fetching team stats:", err);
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

    try {
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Review Type
              </label>
              <select
                value={reviewType}
                onChange={(e) => setReviewType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="general">General Review</option>
                <option value="security">Security Focus</option>
                <option value="performance">Performance Focus</option>
                <option value="best-practices">Best Practices</option>
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
              placeholder="Paste your code here..."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSubmitReview}
            disabled={loading || remainingReviews <= 0}
            className="w-full"
          >
            {loading ? "Analyzing..." : remainingReviews <= 0 ? "Upgrade to Continue" : "Submit for Review"}
          </Button>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Reviews
        </h3>
        
        {reviews.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No reviews yet. Submit your first code snippet above!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <CodeReviewItem key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}