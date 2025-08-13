import { Card } from "../ui/Card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function MetricCard({ title, value, subtitle, trend, trendValue }: MetricCardProps) {
  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-gray-600 dark:text-gray-400"
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
          {trend && trendValue && (
            <span className={`ml-2 text-sm ${trendColors[trend]}`}>
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trendValue}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}