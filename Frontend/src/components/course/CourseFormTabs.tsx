// components/course/CourseFormTabs.tsx

"use client";

import { Check } from "lucide-react";
import React from "react";

interface TabItem {
  id: number;
  name: string;
  icon: React.ElementType;
}

interface Props {
  tabs: TabItem[];
  currentTab: number;
  handleTabChange: (tabId: number) => void;
}

export default function CourseFormTabs({
  tabs,
  currentTab,
  handleTabChange,
}: Props) {
  return (
    <div className="border-b border-gray-200 dark:border-zinc-700">
      <div className="flex flex-col sm:flex-row">
        {tabs.map(({ id, name, icon: Icon }) => {
          const isActive = currentTab === id;
          const isCompleted = id < currentTab;

          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex-1 px-4 py-4 flex items-center justify-center gap-2 text-sm font-medium border-b-2 transition-colors
                ${
                  isActive
                    ? "border-green-900 text-green-900 dark:text-green-400"
                    : isCompleted
                    ? "border-green-500 text-green-700 dark:text-green-500"
                    : "border-transparent text-gray-500 hover:text-zinc-700 dark:hover:text-gray-300"
                }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              <span>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}