import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "./EmptyState";
import { GitHubAuthButton } from "../auth/GitHubAuthButton";
import type { PullRequestWithRepo } from "@/app/hooks/useGitHubData";

interface PullRequestListProps {
  pullRequests: PullRequestWithRepo[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function PullRequestList({ 
  pullRequests, 
  loading, 
  error,
  isAuthenticated 
}: PullRequestListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Connect GitHub"
        message="Connect your GitHub account to see pull requests from your repositories."
        action={
          <GitHubAuthButton 
            text="Connect GitHub Account"
            variant="primary"
          />
        }
      />
    );
  }

  if (pullRequests.length === 0) {
    return (
      <EmptyState
        title="No Pull Requests"
        message="No pull requests found in your repositories."
      />
    );
  }

  const getPRStatusBadge = (state: string, draft: boolean) => {
    if (draft) {
      return <Badge variant="default">Draft</Badge>;
    }
    switch (state) {
      case 'open':
        return <Badge variant="success">Open</Badge>;
      case 'closed':
        return <Badge variant="error">Closed</Badge>;
      case 'merged':
        return <Badge variant="info">Merged</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {pullRequests.map((pr) => (
        <Card key={pr.id}>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {pr.title}
                  </h3>
                  {getPRStatusBadge(pr.state, pr.draft)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{pr.repository.name}</span>
                  <span>#{pr.number}</span>
                  <span>opened {formatDate(pr.createdAt)}</span>
                  <span>by {pr.authorUsername}</span>
                </div>
              </div>
              <Avatar
                src={pr.authorAvatarUrl}
                alt={pr.authorUsername}
                fallback={pr.authorUsername}
                size="sm"
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}