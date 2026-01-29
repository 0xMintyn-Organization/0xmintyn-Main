import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullScreen?: boolean;
  text?: string;
  inline?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  className, 
  fullScreen = false,
  text,
  inline = false
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const containerClasses = fullScreen 
    ? "flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    : inline 
    ? "flex items-center justify-center"
    : "flex flex-col justify-center items-center p-8";

  return (
    <div className={cn(containerClasses, className)}>
      {/* Modern Spinner with Equalmint branding */}
      <div className="relative">
        {/* Outer ring */}
        <div className={cn(
          "border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin",
          sizeClasses[size]
        )}></div>
        
        {/* Inner ring with gradient */}
        <div className={cn(
          "absolute top-0 left-0 border-4 border-transparent border-t-green-500 border-r-green-400 rounded-full animate-spin",
          sizeClasses[size]
        )} style={{ animationDuration: '1s' }}></div>
        
        {/* Center dot */}
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 rounded-full animate-pulse",
          size === "sm" ? "w-1 h-1" : size === "md" ? "w-2 h-2" : size === "lg" ? "w-3 h-3" : "w-4 h-4"
        )}></div>
      </div>

      {/* Loading text */}
      {text && !inline && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {text}
          </p>
          <div className="flex items-center justify-center mt-2 space-x-1">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {/* Equalmint branding for full screen */}
      {fullScreen && (
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">0x</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Equalmint
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading your experience...
          </p>
        </div>
      )}
    </div>
  );
};

export default Spinner;
