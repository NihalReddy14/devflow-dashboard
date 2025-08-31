"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface CodeReviewItemProps {
  review: {
    id: string;
    language: string;
    reviewType: string;
    severity: string;
    reviewContent: string;
    suggestions: string[];
    codeSnippet: string;
    createdAt: string;
  };
}

export function CodeReviewItem({ review }: CodeReviewItemProps) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200";
    }
  };

  const getReviewTypeIcon = (type: string) => {
    switch (type) {
      case "security":
        return "🔒";
      case "performance":
        return "⚡";
      case "best-practices":
        return "✨";
      default:
        return "🔍";
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{getReviewTypeIcon(review.reviewType)}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {review.language} Code Review
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(review.severity)}`}>
                  {review.severity?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Review Summary */}
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {review.reviewContent}
              </p>
            </div>

            {/* Suggestions */}
            {review.suggestions && review.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Suggestions:
                </h4>
                <ul className="space-y-1">
                  {review.suggestions.slice(0, expanded ? undefined : 2).map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                  {!expanded && review.suggestions.length > 2 && (
                    <li className="text-sm text-blue-600 dark:text-blue-400">
                      ... and {review.suggestions.length - 2} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Code Snippet (expandable) */}
            {expanded && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Code Snippet:
                </h4>
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md overflow-x-auto">
                  <code className="text-xs text-gray-800 dark:text-gray-200">
                    {review.codeSnippet}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg
            className={`w-5 h-5 transform transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}