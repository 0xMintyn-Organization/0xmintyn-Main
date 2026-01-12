// components/course/CoursePricingForm.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins } from "lucide-react";
import { CourseData } from "./types";

interface Props {
  courseData: CourseData;
  setCourseData: React.Dispatch<React.SetStateAction<CourseData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function CoursePricingForm({
  courseData,
  setCourseData,
  errors,
  setErrors,
}: Props) {
  const handleInputChange = (field: keyof CourseData, value: number) => {
    setCourseData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const calculateDiscountPercentage = () => {
    const { price, estimatedPrice } = courseData;
    if (price > 0 && estimatedPrice > 0 && estimatedPrice > price) {
      const discount = ((estimatedPrice - price) / estimatedPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Pricing Tip Alert */}
      <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20">
        <AlertDescription className="text-green-800 dark:text-green-300">
          Set competitive pricing for your course in Mintyn tokens (0XM). The estimated price can be
          higher to showcase value and discounts.
        </AlertDescription>
      </Alert>

      {/* Course Price */}
      <div>
        <Label htmlFor="price">Course Price (0XM) *</Label>
        <div className="relative mt-1">
          <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="price"
            type="number"
            value={courseData.price}
            onChange={(e) =>
              handleInputChange("price", parseFloat(e.target.value) || 0)
            }
            placeholder="0"
            className={`pl-10 ${errors.price ? "border-red-500" : ""}`}
            min="0"
            step="1"
          />
        </div>
        {errors.price && (
          <p className="text-red-500 text-sm mt-1">{errors.price}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Price in Mintyn tokens (0XM). Example: 100 0XM
        </p>
      </div>

      {/* Estimated Price */}
      <div>
        <Label htmlFor="estimatedPrice">Estimated Price (0XM) *</Label>
        <div className="relative mt-1">
          <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="estimatedPrice"
            type="number"
            value={courseData.estimatedPrice}
            onChange={(e) =>
              handleInputChange(
                "estimatedPrice",
                parseFloat(e.target.value) || 0
              )
            }
            placeholder="0"
            className={`pl-10 ${
              errors.estimatedPrice ? "border-red-500" : ""
            }`}
            min="0"
            step="1"
          />
        </div>
        {errors.estimatedPrice && (
          <p className="text-red-500 text-sm mt-1">
            {errors.estimatedPrice}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          This should be higher than the actual price to display discounted
          value. Example: 150 0XM (if course price is 100 0XM)
        </p>
      </div>

      {/* Discount Preview */}
      {courseData.price > 0 &&
        courseData.estimatedPrice > 0 &&
        courseData.estimatedPrice > courseData.price && (
          <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-400">
              Discount: {calculateDiscountPercentage()}% OFF
            </p>
          </div>
        )}
    </div>
  );
}