"use client";

interface CodeReviewStatsProps {
  remainingReviews: number;
  totalReviews: number;
  reviewsThisMonth: number;
}

export function CodeReviewStats({ remainingReviews, totalReviews, reviewsThisMonth }: CodeReviewStatsProps) {
  const usagePercentage = (reviewsThisMonth / totalReviews) * 100;
  const isNearLimit = remainingReviews <= 3;
  const isAtLimit = remainingReviews === 0;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">AI Code Review</h2>
          <p className="text-blue-100">
            Powered by AWS Bedrock Claude Instant
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{remainingReviews}</p>
          <p className="text-sm text-blue-100">Reviews left</p>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Monthly Usage</span>
          <span>{reviewsThisMonth} / {totalReviews}</span>
        </div>
        <div className="bg-blue-400/30 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isAtLimit 
                ? "bg-red-500" 
                : isNearLimit 
                ? "bg-yellow-400" 
                : "bg-white"
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>

      {/* Status Messages */}
      {isAtLimit && (
        <div className="bg-red-500/20 border border-red-300 rounded-md p-3 mb-4">
          <p className="text-sm font-medium">Monthly limit reached!</p>
          <p className="text-xs text-red-100 mt-1">
            Upgrade to Pro for unlimited AI code reviews
          </p>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="bg-yellow-500/20 border border-yellow-300 rounded-md p-3 mb-4">
          <p className="text-sm font-medium">Only {remainingReviews} reviews left!</p>
          <p className="text-xs text-yellow-100 mt-1">
            Consider upgrading to avoid interruptions
          </p>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Security Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Performance Tips</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Best Practices</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Code Suggestions</span>
        </div>
      </div>

      {/* Upgrade CTA */}
      {(isNearLimit || isAtLimit) && (
        <button className="w-full mt-4 bg-white text-purple-600 font-semibold py-2 px-4 rounded-md hover:bg-gray-100 transition-colors">
          Upgrade to Pro
        </button>
      )}
    </div>
  );
}