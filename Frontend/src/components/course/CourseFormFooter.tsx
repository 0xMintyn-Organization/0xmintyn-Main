// components/course/CourseFormFooter.tsx

"use client";

import { Button } from "@/components/ui/button";

interface Props {
  currentTab: number;
  handleTabChange: (tabId: number) => void;
  handleSubmit: () => void;
  mode?: "create" | "edit";
}

export default function CourseFormFooter({
  currentTab,
  handleTabChange,
  handleSubmit,
  mode = "create",
}: Props) {
  return (
    <div className="border-t border-gray-200 dark:border-zinc-700 p-6">
      <div className="flex justify-between items-center">
        {/* Previous Button */}
        <Button
          onClick={() => handleTabChange(currentTab - 1)}
          variant="outline"
          disabled={currentTab === 1}
        >
          Previous
        </Button>

        {/* Next or Submit */}
        {currentTab === 4 ? (
          <Button
            onClick={handleSubmit}
            className="bg-green-900 hover:bg-green-800 text-white"
          >
            {mode === "create" ? "Create Course" : "Update Course"}
          </Button>
        ) : (
          <Button
            onClick={() => handleTabChange(currentTab + 1)}
            className="bg-green-900 hover:bg-green-800 text-white"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}