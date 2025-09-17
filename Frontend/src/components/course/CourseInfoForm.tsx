/* eslint-disable @typescript-eslint/no-explicit-any */
// components/course/CourseInfoForm.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Upload, Video, FileVideo } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CourseData } from "./types";
import { useState } from "react";
import { uploadFileToBackend } from "@/lib/uploadFileToBackend";

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
  const [demoUploadProgress, setDemoUploadProgress] = useState<number | null>(null);
  

  const handleInputChange = (field: keyof CourseData, value: any) => {
    setCourseData((prev: CourseData) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: "" }));
  };

  const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  field: "thumbnail" | "demoUrl"
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (field === "thumbnail" && !file.type.startsWith("image/")) {
    setErrors((prev:any) => ({ ...prev, thumbnail: "Please upload an image file" }));
    return;
  }

  if (field === "demoUrl" && !file.type.startsWith("video/")) {
    setErrors((prev:any) => ({ ...prev, demoUrl: "Only video files allowed" }));
    return;
  }

 if (field === "demoUrl") {
  try {
    setDemoUploadProgress(0); // Start progress
    const { url } = await uploadFileToBackend(file, setDemoUploadProgress);

    setCourseData((prev: any) => ({
      ...prev,
      demoUrl: url, // ✅ FINAL FIX - set URL
      demoUrlPreview: url,
    }));
    setErrors((prev: any) => ({ ...prev, demoUrl: "" }));
  } catch (err) {
    console.error(err);
    setErrors((prev: any) => ({ ...prev, demoUrl: "Failed to upload demo video" }));
  } finally {
    setDemoUploadProgress(null); // End progress
  }
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

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !courseData.tags.includes(trimmed)) {
      setCourseData((prev: CourseData) => ({
        ...prev,
        tags: [...prev.tags, trimmed]
      }));
      setTagInput("");
    }
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
              <button
                onClick={() => handleInputChange('thumbnail', null)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
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

      {/* Demo Video Upload */}
      <div>
        <Label>Demo Video *</Label>
        <div className={`mt-1 border-2 border-dashed ${errors.demoUrl ? 'border-red-500' : 'border-gray-300'} rounded-lg p-6 text-center`}>
          {courseData.demoUrlPreview ? (
            <div className="space-y-2 text-center">
              <FileVideo className="w-8 h-8 mx-auto text-green-600" />
              <p className="text-xs text-gray-500">{courseData.demoUrl?.name}</p>
              <button
                onClick={() => handleInputChange('demoUrl', null)}
                className="text-red-500 text-sm hover:underline"
              >
                Remove video
              </button>
            </div>
          ) : (
            <label htmlFor="demoVideo" className="cursor-pointer">
              <Video className="w-12 h-12 mx-auto text-gray-400" />
              <p className="text-sm mt-2">Click to upload demo</p>
              <input
                id="demoVideo"
                type="file"
                accept="video/*"
                onChange={(e) => handleFileUpload(e, 'demoUrl')}
                className="hidden"
              />
              {demoUploadProgress !== null && (
  <div className="mt-2">
    <div className="h-2 bg-gray-200 rounded">
      <div
        className="h-2 bg-green-500 rounded"
        style={{ width: `${demoUploadProgress}%` }}
      />
    </div>
    <p className="text-xs text-gray-500 mt-1">
      Uploading: {demoUploadProgress}%
    </p>
  </div>
)}
            </label>
          )}
        </div>
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
            placeholder="Add tag and press Enter"
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