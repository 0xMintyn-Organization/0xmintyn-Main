/* eslint-disable @typescript-eslint/no-explicit-any */
// components/course/CourseInfoForm.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Upload, Video, FileVideo, Youtube } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CourseData } from "./types";
import { useState } from "react";
import { isValidYouTubeUrl, getYouTubeEmbedUrl, extractYouTubeVideoId } from "@/lib/youtubeUtils";
import YouTubePlayer from "@/components/YouTubePlayer";

const categories = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "Design",
  "Marketing",
  "Business",
  "Photography",
  "Music",
  "Other"
];

const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];

interface Props {
  courseData: CourseData;
  setCourseData: any;
  errors: Record<string, string>;
  setErrors: any;
}

export default function CourseInfoForm({
  courseData,
  setCourseData,
  errors,
  setErrors
}: Props) {
  const [tagInput, setTagInput] = useState("");
  const [demoUrlInput, setDemoUrlInput] = useState("");
  

  const handleInputChange = (field: keyof CourseData, value: any) => {
    setCourseData((prev: CourseData) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: "" }));
  };

  const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  field: "thumbnail"
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (field === "thumbnail" && !file.type.startsWith("image/")) {
    setErrors((prev:any) => ({ ...prev, thumbnail: "Please upload an image file" }));
    return;
  }

  // Thumbnail only local preview
  if (field === "thumbnail") {
    setCourseData((prev:any) => ({
      ...prev,
      thumbnail: file,
      thumbnailPreview: URL.createObjectURL(file),
    }));
  }
};

  const handleDemoUrlChange = (url: string) => {
    setDemoUrlInput(url);
    setErrors((prev: any) => ({ ...prev, demoUrl: "" }));
  };

  const handleDemoUrlSubmit = () => {
    const url = demoUrlInput.trim();
    
    if (!url) {
      setErrors((prev: any) => ({ ...prev, demoUrl: "Please enter a YouTube URL" }));
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setErrors((prev: any) => ({ ...prev, demoUrl: "Please enter a valid YouTube URL" }));
      return;
    }

    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      setCourseData((prev: any) => ({
        ...prev,
        demoUrl: url,
        demoUrlPreview: getYouTubeEmbedUrl(url) || url,
      }));
      setDemoUrlInput("");
      setErrors((prev: any) => ({ ...prev, demoUrl: "" }));
    }
  };

  const addTag = () => {
    const raw = tagInput.trim();
    if (!raw) return;

    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length === 0) return;

    setCourseData((prev: CourseData) => {
      const existing = new Set(prev.tags);
      const newTags = parts.filter((p) => !existing.has(p));
      if (newTags.length === 0) return prev;
      return {
        ...prev,
        tags: [...prev.tags, ...newTags]
      };
    });
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setCourseData((prev: CourseData) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Course Name */}
      <div>
        <Label htmlFor="name">Course Name *</Label>
        <Input
          id="name"
          value={courseData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter course name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Course Description *</Label>
        <Textarea
          id="description"
          value={courseData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what students will learn"
          className={`mt-1 min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Category & Level */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={courseData.categories}
            onValueChange={(val) => handleInputChange('categories', val)}
          >
            <SelectTrigger className={errors.categories ? 'border-red-500' : ''}>
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories}</p>}
        </div>

        <div>
          <Label htmlFor="level">Level *</Label>
          <Select
            value={courseData.level}
            onValueChange={(val) => handleInputChange('level', val)}
          >
            <SelectTrigger className={errors.level ? 'border-red-500' : ''}>
              <SelectValue placeholder="Choose level" />
            </SelectTrigger>
            <SelectContent>
              {levels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
        </div>
      </div>

      {/* Thumbnail Upload */}
      <div>
        <Label>Course Thumbnail *</Label>
        <div className={`mt-1 border-2 border-dashed ${errors.thumbnail ? 'border-red-500' : 'border-gray-300'} rounded-lg p-6 text-center`}>
          {courseData.thumbnailPreview ? (
            <div className="relative w-full h-48">
              <Image
                src={courseData.thumbnailPreview}
                alt="Course thumbnail"
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <label className="cursor-pointer bg-white dark:bg-zinc-700 text-zinc-800 dark:text-white px-2 py-1 rounded-md text-sm shadow hover:bg-gray-100 dark:hover:bg-zinc-600">
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "thumbnail")}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCourseData((prev: any) => ({ ...prev, thumbnail: null, thumbnailPreview: "" }));
                    if (errors.thumbnail) setErrors((prev: any) => ({ ...prev, thumbnail: "" }));
                  }}
                  className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                  title="Remove thumbnail"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="thumbnail" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto text-gray-400" />
              <p className="text-sm mt-2">Click to upload</p>
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'thumbnail')}
                className="hidden"
              />
              
            </label>
          )}
        </div>
        {errors.thumbnail && <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>}
      </div>

      {/* Demo Video - YouTube URL */}
      <div>
        <Label>Demo Video (YouTube URL) *</Label>
        {courseData.demoUrl ? (
          <div className="mt-2 space-y-2">
            <div className="border rounded-md overflow-hidden">
              <YouTubePlayer
                url={courseData.demoUrl}
                title="Course Demo Video"
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={courseData.demoUrl}
                readOnly
                className="flex-1 bg-gray-50"
                placeholder="YouTube URL"
              />
              <Button
                variant="outline"
                onClick={() => {
                  handleInputChange('demoUrl', null);
                  handleInputChange('demoUrlPreview', '');
                }}
                className="text-red-500"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Input
                value={demoUrlInput}
                onChange={(e) => handleDemoUrlChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleDemoUrlSubmit();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className={errors.demoUrl ? "border-red-500" : ""}
              />
              <Button
                onClick={handleDemoUrlSubmit}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Youtube className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Enter a YouTube video URL for the course demo/preview
            </p>
          </div>
        )}
        {errors.demoUrl && <p className="text-red-500 text-sm mt-1">{errors.demoUrl}</p>}
      </div>

      {/* Tags */}
      <div>
        <Label>Tags *</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add tags (comma-separated or one at a time) and press Enter"
            className={errors.tags ? 'border-red-500' : ''}
          />
          <Button onClick={addTag}>Add</Button>
        </div>
        {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}

        <div className="flex flex-wrap gap-2 mt-2">
          {courseData.tags.map(tag => (
            <span
              key={tag}
              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {tag}
              <button onClick={() => removeTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}