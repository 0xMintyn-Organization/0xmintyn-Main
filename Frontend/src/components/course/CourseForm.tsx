/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import CourseBenefitsForm from "./CourseBenefitsForm";
import CourseContentForm from "./CourseContentForm";
import CourseFormFooter from "./CourseFormFooter";
import CourseFormTabs from "./CourseFormTabs";
import CourseInfoForm from "./CourseInfoForm";
import CoursePricingForm from "./CoursePricingForm";
import { CourseData } from "./types";
import {
  BookOpen,
  DollarSign,
  Layers,
  Target,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

const tabs = [
  { id: 1, name: "Course Info", icon: BookOpen },
  { id: 2, name: "Pricing", icon: DollarSign },
  { id: 3, name: "Benefits", icon: Target },
  { id: 4, name: "Content", icon: Layers },
];

interface CourseFormProps {
  mode: "create" | "edit";
  courseId?: string;
  initialData?: CourseData;
}

export default function CourseForm({ mode, courseId, initialData }: CourseFormProps) {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(mode === "edit" && !initialData);
  const [courseData, setCourseData] = useState<CourseData>(initialData || {
    name: "",
    description: "",
    categories: "",
    price: 0,
    estimatedPrice: 0,
    thumbnail: null,
    thumbnailPreview: "",
    tags: [],
    level: "",
    demoUrl: null,
    demoUrlPreview: "",
    benefits: [""],
    prerequisites: [""],
    courseData: [
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
  });

  // Fetch course data for edit mode
  useEffect(() => {
    if (mode === "edit" && courseId && !initialData) {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URI}course/enrolled-course/${courseId}`,
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
            
            // Convert API data to component format
            const convertedData: CourseData = {
              name: course.name,
              description: course.description,
              categories: course.categories,
              price: course.price,
              estimatedPrice: course.estimatedPrice,
              thumbnail: null, // Keep as null for existing files
              thumbnailPreview: course.thumbnail,
              tags: course.tags || [],
              level: course.level,
              demoUrl: null, // Keep as null for existing files
              demoUrlPreview: course.demoUrl,
              benefits: course.benefits && course.benefits.length > 0 ? course.benefits : [""],
              prerequisites: course.prerequisites && course.prerequisites.length > 0 ? course.prerequisites : [""],
              courseData: course.courseData && course.courseData.length > 0 ? course.courseData.map((section: any) => ({
                title: section.title || "",
                description: section.description || "",
                videoSection: section.videoSection || "",
                videos: section.videos && section.videos.length > 0 ? section.videos.map((video: any) => ({
                  title: video.title || "",
                  videoUrl: video.videoUrl || null,
                  videoLength: video.videoLength || 0,
                  videoPlayer: video.videoPlayer || "",
                  links: video.links || [],
                  description: video.description || "",
                })) : [{
                  title: "",
                  videoUrl: null,
                  videoLength: 0,
                  videoPlayer: "",
                  links: [],
                  description: "",
                }]
              })) : [{
                title: "",
                description: "",
                videos: [{
                  title: "",
                  videoUrl: null,
                  videoLength: 0,
                  videoPlayer: "",
                  links: [],
                  description: "",
                }],
                videoSection: "",
              }]
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

      fetchCourse();
    }
  }, [mode, courseId, initialData, toast, router]);

  const sharedProps = {
    courseData,
    setCourseData,
    errors,
    setErrors,
  };

  const validateTab = (tabId: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (tabId) {
      case 1:
        if (!courseData.name.trim()) newErrors.name = "Course name is required.";
        if (!courseData.description.trim()) newErrors.description = "Course description is required.";
        if (!courseData.categories) newErrors.categories = "Please select a category.";
        if (!courseData.level) newErrors.level = "Please select a level.";
        if (!courseData.thumbnail && !courseData.thumbnailPreview) newErrors.thumbnail = "Thumbnail is required.";
        if (!courseData.demoUrl && !courseData.demoUrlPreview) newErrors.demoUrl = "Demo video is required.";
        if (courseData.tags.length === 0) newErrors.tags = "At least one tag is required.";
        break;
      case 2:
        if (courseData.price <= 0) newErrors.price = "Price must be greater than 0.";
        if (courseData.estimatedPrice <= 0) newErrors.estimatedPrice = "Estimated price must be greater than 0.";
        break;
      case 3:
        if (courseData.benefits.filter((b) => b.trim() !== "").length === 0) {
          newErrors.benefits = "At least one valid benefit is required.";
        }
        if (courseData.prerequisites.filter((p) => p.trim() !== "").length === 0) {
          newErrors.prerequisites = "At least one valid prerequisite is required.";
        }
        break;
      case 4:
        courseData.courseData.forEach((section, sectionIndex) => {
          if (!section.title.trim()) {
            newErrors[`section_${sectionIndex}_title`] = "Section title is required.";
          }
          section.videos.forEach((video, videoIndex) => {
            if (!video.title.trim()) {
              newErrors[`section_${sectionIndex}_video_${videoIndex}_title`] = "Video title is required.";
            }
            if (!video.videoUrl) {
              newErrors[`section_${sectionIndex}_video_${videoIndex}_file`] = "Video upload is required.";
            }
          });
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTabChange = (tabId: number) => {
    if (tabId > currentTab) {
      if (validateTab(currentTab)) {
        setCurrentTab(tabId);
      }
    } else {
      setCurrentTab(tabId);
    }
  };

  const handleSubmit = async () => {
    const isValid = [1, 2, 3, 4].every(validateTab);
    if (!isValid) {
      for (let i = 1; i <= 4; i++) {
        if (!validateTab(i)) {
          setCurrentTab(i);
          break;
        }
      }
      return;
    }

    try {
      const formData = new FormData();

      // Basic Fields
      formData.append("name", courseData.name);
      formData.append("description", courseData.description);
      formData.append("categories", courseData.categories);
      formData.append("level", courseData.level);
      formData.append("price", courseData.price.toString());
      formData.append("estimatedPrice", courseData.estimatedPrice.toString());
      
      // Uploading files
      if (courseData.thumbnail) {
        formData.append("thumbnail", courseData.thumbnail);
      }

      if (typeof courseData.demoUrl === "string") {
        formData.append("demoUrl", courseData.demoUrl); 
      }

      // JSON-encoded arrays
      formData.append("tags", JSON.stringify(courseData.tags));
      formData.append("benefits", JSON.stringify(courseData.benefits));
      formData.append("prerequisites", JSON.stringify(courseData.prerequisites));
      formData.append("courseData", JSON.stringify(courseData.courseData));

      const url = mode === "create" 
        ? `${process.env.NEXT_PUBLIC_SERVER_URI}course/create`
        : `${process.env.NEXT_PUBLIC_SERVER_URI}course/${courseId}`;
      
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Success",
          description: mode === "create" ? "Course created successfully!" : "Course updated successfully!",
        });
        
        if (mode === "create") {
          router.push('/instructor/courses');
        } else {
          router.push(`/instructor/courses/${courseId}`);
        }
      } else {
        toast({
          title: "Error",
          description: data.message || `Failed to ${mode} course`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Course Operation Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 1:
        return <CourseInfoForm {...sharedProps} />;
      case 2:
        return <CoursePricingForm {...sharedProps} />;
      case 3:
        return <CourseBenefitsForm {...sharedProps} />;
      case 4:
        return <CourseContentForm {...sharedProps} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-zinc-700 p-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              {mode === "create" ? "Create New Course" : "Edit Course"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {mode === "create" 
                ? "Fill in the details to create your course" 
                : "Update your course information and content"
              }
            </p>
          </div>

          {/* Tabs Header */}
          <CourseFormTabs
            tabs={tabs}
            currentTab={currentTab}
            handleTabChange={handleTabChange}
          />

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>

          {/* Navigation Footer */}
          <CourseFormFooter
            currentTab={currentTab}
            handleTabChange={handleTabChange}
            handleSubmit={handleSubmit}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
}
