"use client";

import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "info" | "success" | "error";
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const typeStyles = {
    info: "bg-blue-500",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white shadow-lg transition-opacity ${typeStyles[type]} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {message}
    </div>
  );
}