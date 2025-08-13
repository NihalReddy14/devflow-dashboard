import { ReactNode } from "react";
import { Card } from "../ui/Card";

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="text-center py-12">
          {icon && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
          )}
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {message}
          </p>
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}