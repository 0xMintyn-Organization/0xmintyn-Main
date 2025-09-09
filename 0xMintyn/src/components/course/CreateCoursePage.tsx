"use client";

import { useState } from "react";
import CourseInfoForm from "./CourseInfoForm";
import CoursePricingForm from "./CoursePricingForm";
import CourseBenefitsForm from "./CourseBenefitsForm";
import CourseContentForm from "./CourseContentForm";
import CourseFormTabs from "./CourseFormTabs";
import CourseFormFooter from "./CourseFormFooter";
import { CourseData } from "./types";

// Icons
import {
  BookOpen,
  DollarSign,
  Target,
  Layers,
} from "lucide-react";

const tabs = [
  { id: 1, name: "Course Info", icon: BookOpen },
  { id: 2, name: "Pricing", icon: DollarSign },
  { id: 3, name: "Benefits", icon: Target },
  { id: 4, name: "Content", icon: Layers },
];

export default function CreateCoursePage() {
  const [currentTab, setCurrentTab] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [courseData, setCourseData] = useState<CourseData>({
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
        if (!courseData.thumbnail) newErrors.thumbnail = "Thumbnail is required.";
        if (!courseData.demoUrl) newErrors.demoUrl = "Demo video is required.";
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

  const handleSubmit = () => {
    const allValid = [1, 2, 3, 4].every(validateTab);
    if (allValid) {
      console.log("🎉 Course Data Submitted:", courseData);
      // Submit to API or perform any action here
    } else {
      for (let i = 1; i <= 4; i++) {
        if (!validateTab(i)) {
          setCurrentTab(i);
          break;
        }
      }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-zinc-700 p-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Create New Course
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Fill in the details to create your course
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
          />
        </div>
      </div>
    </div>
  );
}