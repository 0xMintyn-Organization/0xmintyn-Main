// components/course/CourseBenefitsForm.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus } from "lucide-react";
import { CourseData } from "./types";

interface Props {
  courseData: CourseData;
  setCourseData: React.Dispatch<React.SetStateAction<CourseData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function CourseBenefitsForm({
  courseData,
  setCourseData,
  errors,
  setErrors,
}: Props) {
  const updateArrayField = (
    field: "benefits" | "prerequisites",
    index: number,
    value: string
  ) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const addArrayField = (field: "benefits" | "prerequisites") => {
    setCourseData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayField = (
    field: "benefits" | "prerequisites",
    index: number
  ) => {
    if (courseData[field].length > 1) {
      setCourseData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Benefits Section */}
      <div>
        <Label>What will students learn from this course? *</Label>
        <p className="text-sm text-gray-500 mb-2">
          List the key benefits and learning outcomes of your course.
        </p>

        <div className="space-y-2">
          {courseData.benefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={benefit}
                onChange={(e) =>
                  updateArrayField("benefits", index, e.target.value)
                }
                placeholder="e.g., Build full-stack web apps from scratch"
                className={
                  errors.benefits && !benefit.trim() ? "border-red-500" : ""
                }
              />
              {courseData.benefits.length > 1 && (
                <Button
                  onClick={() => removeArrayField("benefits", index)}
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.benefits && (
            <p className="text-red-500 text-sm mt-1">{errors.benefits}</p>
          )}

          <Button
            onClick={() => addArrayField("benefits")}
            variant="outline"
            className="w-full border-green-900 text-green-900 hover:bg-green-50"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Benefit
          </Button>
        </div>
      </div>

      {/* Prerequisites Section */}
      <div>
        <Label>What are the prerequisites for this course? *</Label>
        <p className="text-sm text-gray-500 mb-2">
          Mention any skills or knowledge students should have before enrolling.
        </p>

        <div className="space-y-2">
          {courseData.prerequisites.map((prerequisite, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={prerequisite}
                onChange={(e) =>
                  updateArrayField("prerequisites", index, e.target.value)
                }
                placeholder="e.g., Basic knowledge of HTML"
                className={
                  errors.prerequisites && !prerequisite.trim()
                    ? "border-red-500"
                    : ""
                }
              />
              {courseData.prerequisites.length > 1 && (
                <Button
                  onClick={() =>
                    removeArrayField("prerequisites", index)
                  }
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.prerequisites && (
            <p className="text-red-500 text-sm mt-1">
              {errors.prerequisites}
            </p>
          )}

          <Button
            onClick={() => addArrayField("prerequisites")}
            variant="outline"
            className="w-full border-green-900 text-green-900 hover:bg-green-50"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Prerequisite
          </Button>
        </div>
      </div>
    </div>
  );
}