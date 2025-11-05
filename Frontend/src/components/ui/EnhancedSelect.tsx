'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface EnhancedSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function EnhancedSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  className,
  disabled = false
}: EnhancedSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger 
        className={cn(
          "w-full border-gray-300 dark:border-gray-600 rounded-lg",
          "focus:ring-2 focus:ring-green-500 focus:border-green-500",
          "transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent 
        className={cn(
          "z-[9999] max-h-[200px] overflow-y-auto",
          "border border-gray-200 dark:border-gray-700",
          "bg-white dark:bg-gray-800 shadow-lg"
        )}
        position="popper"
        sideOffset={4}
      >
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="flex items-center gap-2">
              {option.icon}
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Language options for the settings page
export const languageOptions: SelectOption[] = [
  {
    value: "en",
    label: "English (US)",
    icon: <span>🇺🇸</span>
  },
  {
    value: "es", 
    label: "Español (Spain)",
    icon: <span>🇪🇸</span>
  },
  {
    value: "fr",
    label: "Français (France)", 
    icon: <span>🇫🇷</span>
  },
  {
    value: "de",
    label: "Deutsch (Germany)",
    icon: <span>🇩🇪</span>
  },
  {
    value: "zh",
    label: "中文 (Simplified)",
    icon: <span>🇨🇳</span>
  },
  {
    value: "hi",
    label: "हिन्दी (Hindi)",
    icon: <span>🇮🇳</span>
  },
  {
    value: "pt",
    label: "Português (Portugal)",
    icon: <span>🇵🇹</span>
  }
];

