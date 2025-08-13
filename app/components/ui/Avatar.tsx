interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ src, alt, fallback, size = "md" }: AvatarProps) {
  const sizeStyles = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base"
  };

  if (src) {
    return (
      <img
        className={`${sizeStyles[size]} rounded-full object-cover`}
        src={src}
        alt={alt || "Avatar"}
      />
    );
  }

  return (
    <div
      className={`${sizeStyles[size]} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-medium text-gray-600 dark:text-gray-300`}
    >
      {fallback ? fallback.slice(0, 2).toUpperCase() : "?"}
    </div>
  );
}