"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Protected from "@/hooks/useProtected";
import CreateCoursePage from "@/components/course/CreateCoursePage";
import { CourseData } from "@/components/course/types";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";

interface CourseDataFromAPI {
  _id: string;
  name: string;
  description: string;
  categories: string;
  level: string;
  price: number;
  estimatedPrice: number;
  thumbnail: string;
  demoUrl: string;
  tags: string[];
  benefits: string[];
  prerequisites: string[];
  courseData: CourseSection[];
  createdBy: {
    _id: string;
    username: string;
    avatar: string;
  };
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

interface CourseSection {
  title: string;
  description: string;
  videoSection: string;
  videos: CourseVideo[];
}

interface CourseVideo {
  title: string;
  videoUrl: string;
  videoLength: number;
  description: string;
  links: CourseLink[];
}

interface CourseLink {
  title: string;
  url: string;
}

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [originalCourse, setOriginalCourse] = useState<CourseDataFromAPI | null>(null);

  const courseId = params.courseId as string;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URI}/course/${courseId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch course");
        }

        const data = await response.json();
        if (data.success) {
          const course = data.course;
          setOriginalCourse(course);
          
          // Convert API data to component format
          const convertedData: CourseData = {
            name: course.name,
            description: course.description,
            categories: course.categories,
            price: course.price,
            estimatedPrice: course.estimatedPrice,
            thumbnail: null, // Will be handled separately
            thumbnailPreview: course.thumbnail,
            tags: course.tags || [],
            level: course.level,
            demoUrl: null, // Will be handled separately
            demoUrlPreview: course.demoUrl,
            benefits: course.benefits || [""],
            prerequisites: course.prerequisites || [""],
            courseData: course.courseData || [
              {
                title: "",
                description: "",
                videos: [
                  {
                    title: "",
                    videoUrl: null,
                    videoLength: 0,
                    videoPlayer: "",
                    links: [],
                    description: "",
                  },
                ],
                videoSection: "",
              },
            ],
          };
          
          setCourseData(convertedData);
        } else {
          throw new Error(data.message || "Failed to fetch course");
        }
      } catch (err: any) {
        console.error("Error fetching course:", err);
        toast({
          title: "Error",
          description: "Failed to load course for editing",
          variant: "destructive",
        });
        router.push("/instructor/my_courses");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, toast, router]);

  if (loading) {
    return (
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <Spinner />
        </div>
      </Protected>
    );
  }

  if (!courseData || !originalCourse) {
    return (
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Course Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The course you're trying to edit doesn't exist.
            </p>
            <button
              onClick={() => router.push("/instructor/my_courses")}
              className="px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800"
            >
              Back to My Courses
            </button>
          </div>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-zinc-700 p-6">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Edit Course: {originalCourse.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Update your course information and content
              </p>
            </div>

            {/* Course Form */}
            <div className="p-6">
              <EditCourseForm 
                courseData={courseData} 
                setCourseData={setCourseData}
                originalCourse={originalCourse}
                courseId={courseId}
              />
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}

// Custom Edit Course Form Component
function EditCourseForm({ 
  courseData, 
  setCourseData, 
  originalCourse, 
  courseId 
}: {
  courseData: CourseData;
  setCourseData: (data: CourseData) => void;
  originalCourse: CourseDataFromAPI;
  courseId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    if (!courseData.name.trim()) {
      setErrors({ name: "Course name is required" });
      return;
    }

    if (!courseData.description.trim()) {
      setErrors({ description: "Course description is required" });
      return;
    }

    if (courseData.price <= 0) {
      setErrors({ price: "Price must be greater than 0" });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Basic Fields
      formData.append("name", courseData.name);
      formData.append("description", courseData.description);
      formData.append("categories", courseData.categories);
      formData.append("level", courseData.level);
      formData.append("price", courseData.price.toString());
      formData.append("estimatedPrice", courseData.estimatedPrice.toString());

      // Handle thumbnail - only upload if it's a new file
      if (courseData.thumbnail && courseData.thumbnail instanceof File) {
        formData.append("thumbnail", courseData.thumbnail);
      }

      // Handle demo URL - only upload if it's a new file
      if (courseData.demoUrl && courseData.demoUrl instanceof File) {
        formData.append("demoUrl", courseData.demoUrl);
      } else if (typeof courseData.demoUrl === "string") {
        formData.append("demoUrl", courseData.demoUrl);
      }

      // JSON-encoded arrays
      formData.append("tags", JSON.stringify(courseData.tags));
      formData.append("benefits", JSON.stringify(courseData.benefits));
      formData.append("prerequisites", JSON.stringify(courseData.prerequisites));
      formData.append("courseData", JSON.stringify(courseData.courseData));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/course/${courseId}`,
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description: "Course updated successfully!",
        });
        router.push(`/instructor/courses/${courseId}`);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update course",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Course Update Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Name</label>
            <input
              type="text"
              value={courseData.name}
              onChange={(e) => setCourseData({ ...courseData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter course name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={courseData.categories}
              onChange={(e) => setCourseData({ ...courseData, categories: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              <option value="Web Development">Web Development</option>
              <option value="Mobile Development">Mobile Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Business">Business</option>
              <option value="Photography">Photography</option>
              <option value="Music">Music</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={courseData.description}
            onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            rows={4}
            placeholder="Describe what students will learn"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price ($)</label>
            <input
              type="number"
              value={courseData.price}
              onChange={(e) => setCourseData({ ...courseData, price: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estimated Price ($)</label>
            <input
              type="number"
              value={courseData.estimatedPrice}
              onChange={(e) => setCourseData({ ...courseData, estimatedPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Updating..." : "Update Course"}
        </button>
        <button
          onClick={() => router.push(`/instructor/courses/${courseId}`)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}