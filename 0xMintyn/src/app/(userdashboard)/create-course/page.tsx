"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X, Plus, Upload, Video, Link, Check, FileVideo, BookOpen, DollarSign, Target, Layers, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CourseLink {
  title: string;
  url: string;
}

interface CourseVideo {
  title: string;
  videoUrl: File | null;
  videoLength: number;
  videoPlayer: string;
  links: CourseLink[];
  description: string;
}

interface CourseSection {
  title: string;
  description: string;
  videos: CourseVideo[];
  videoSection: string;
}

interface CourseData {
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice: number;
  thumbnail: File | null;
  thumbnailPreview: string;
  tags: string[];
  level: string;
  demoUrl: File | null;
  demoUrlPreview: string;
  benefits: string[];
  prerequisites: string[];
  courseData: CourseSection[];
}

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
    courseData: [{
      title: "",
      description: "",
      videos: [{
        title: "",
        videoUrl: null,
        videoLength: 0,
        videoPlayer: "",
        links: [],
        description: ""
      }],
      videoSection: ""
    }]
  });

  const [tagInput, setTagInput] = useState("");
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const validateTab = (tabId: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (tabId) {
      case 1:
        if (!courseData.name) newErrors.name = "Course name is required";
        if (!courseData.description) newErrors.description = "Course description is required";
        if (!courseData.categories) newErrors.categories = "Please select a category";
        if (!courseData.level) newErrors.level = "Please select a level";
        if (!courseData.thumbnail) newErrors.thumbnail = "Course thumbnail is required";
        if (!courseData.demoUrl) newErrors.demoUrl = "Demo video is required";
        if (courseData.tags.length === 0) newErrors.tags = "Add at least one tag";
        break;
      case 2:
        if (courseData.price <= 0) newErrors.price = "Price must be greater than 0";
        if (courseData.estimatedPrice <= 0) newErrors.estimatedPrice = "Estimated price must be greater than 0";
        break;
      case 3:
        if (courseData.benefits.filter(b => b.trim()).length === 0) newErrors.benefits = "Add at least one benefit";
        if (courseData.prerequisites.filter(p => p.trim()).length === 0) newErrors.prerequisites = "Add at least one prerequisite";
        break;
      case 4:
        // Validate each section
        courseData.courseData.forEach((section, sectionIndex) => {
          if (!section.title) newErrors[`section_${sectionIndex}_title`] = "Section title is required";
          
          // Validate each video in the section
          section.videos.forEach((video, videoIndex) => {
            if (!video.title) newErrors[`section_${sectionIndex}_video_${videoIndex}_title`] = "Video title is required";
            if (!video.videoUrl) newErrors[`section_${sectionIndex}_video_${videoIndex}_file`] = "Video file is required";
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

  const handleInputChange = (field: keyof CourseData, value: any) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnail' | 'demoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === 'thumbnail' && !file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, thumbnail: "Please upload an image file" }));
        return;
      }
      if (field === 'demoUrl' && !file.type.startsWith('video/')) {
        setErrors(prev => ({ ...prev, demoUrl: "Please upload a video file" }));
        return;

      }

      setCourseData(prev => ({
        ...prev,
        [field]: file,
        [`${field}Preview`]: URL.createObjectURL(file)
      }));
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionIndex: number, videoIndex: number) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      // Create a preview URL and get video duration
      const videoUrl = URL.createObjectURL(file);
      const videoElement = document.createElement('video');
      
      videoElement.src = videoUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        const duration = Math.round(videoElement.duration / 60); // Convert to minutes
        
        updateCourseVideo(sectionIndex, videoIndex, {
          videoUrl: file,
          videoLength: duration
        });
        
        setErrors(prev => ({ 
          ...prev, 
          [`section_${sectionIndex}_video_${videoIndex}_file`]: "" 
        }));
        
        // Clean up
        URL.revokeObjectURL(videoUrl);
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !courseData.tags.includes(tagInput.trim())) {
      setCourseData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
      setErrors(prev => ({ ...prev, tags: "" }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCourseData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const updateArrayField = (field: 'benefits' | 'prerequisites', index: number, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const addArrayField = (field: 'benefits' | 'prerequisites') => {
    setCourseData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayField = (field: 'benefits' | 'prerequisites', index: number) => {
    if (courseData[field].length > 1) {
      setCourseData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const updateCourseSection = (index: number, field: keyof CourseSection, value: any) => {
    setCourseData(prev => ({
      ...prev,
      courseData: prev.courseData.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
    if (field === 'title') {
      setErrors(prev => ({ ...prev, [`section_${index}_title`]: "" }));
    }
  };

  const updateCourseVideo = (sectionIndex: number, videoIndex: number, updates: Partial<CourseVideo>) => {
    setCourseData(prev => ({
      ...prev,
      courseData: prev.courseData.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              videos: section.videos.map((video, j) => 
                j === videoIndex ? { ...video, ...updates } : video
              )
            }
          : section
      )
    }));
    
    // Clear errors for this video if title is being updated
    if (updates.title && errors[`section_${sectionIndex}_video_${videoIndex}_title`]) {
      setErrors(prev => ({ 
        ...prev, 
        [`section_${sectionIndex}_video_${videoIndex}_title`]: "" 
      }));
    }
  };

  const addCourseSection = () => {
    // Check if current section is complete before adding a new one
    const currentSection = courseData.courseData[courseData.courseData.length - 1];
    const hasEmptyVideoTitle = currentSection.videos.some(video => !video.title.trim());
    const hasEmptyVideoFile = currentSection.videos.some(video => !video.videoUrl);
    
    if (!currentSection.title || hasEmptyVideoTitle || hasEmptyVideoFile) {
      setErrors({ 
        ...errors, 
        section_incomplete: "Please complete the current section before adding a new one" 
      });
      return;
    }
    
    setErrors(prev => ({ ...prev, section_incomplete: "" }));
    
    setCourseData(prev => ({
      ...prev,
      courseData: [...prev.courseData, {
        title: "",
        description: "",
        videos: [{
          title: "",
          videoUrl: null,
          videoLength: 0,
          videoPlayer: "",
          links: [],
          description: ""
        }],
        videoSection: ""
      }]
    }));
  };

  const removeCourseSection = (index: number) => {
    if (courseData.courseData.length > 1) {
      setCourseData(prev => ({
        ...prev,
        courseData: prev.courseData.filter((_, i) => i !== index)
      }));
    }
  };

  const addVideoToSection = (sectionIndex: number) => {
    // Check if current video is complete before adding a new one
    const currentVideos = courseData.courseData[sectionIndex].videos;
    const lastVideo = currentVideos[currentVideos.length - 1];
    
    if (!lastVideo.title || !lastVideo.videoUrl) {
      setErrors({ 
        ...errors, 
        video_incomplete: "Please complete the current video before adding a new one" 
      });
      return;
    }
    
    setErrors(prev => ({ ...prev, video_incomplete: "" }));
    
    setCourseData(prev => ({
      ...prev,
      courseData: prev.courseData.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              videos: [...section.videos, {
                title: "",
                videoUrl: null,
                videoLength: 0,
                videoPlayer: "",
                links: [],
                description: ""
              }]
            }
          : section
      )
    }));
  };

  const removeVideoFromSection = (sectionIndex: number, videoIndex: number) => {
    if (courseData.courseData[sectionIndex].videos.length > 1) {
      setCourseData(prev => ({
        ...prev,
        courseData: prev.courseData.map((section, i) => 
          i === sectionIndex 
            ? {
                ...section,
                videos: section.videos.filter((_, j) => j !== videoIndex)
              }
            : section
        )
      }));
    }
  };

  const addLink = (sectionIndex: number, videoIndex: number) => {
    setCourseData(prev => ({
      ...prev,
      courseData: prev.courseData.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              videos: section.videos.map((video, j) => 
                j === videoIndex 
                  ? { ...video, links: [...video.links, { title: "", url: "" }] }
                  : video
              )
            }
          : section
      )
    }));
  };

  const updateLink = (sectionIndex: number, videoIndex: number, linkIndex: number, field: 'title' | 'url', value: string) => {
    setCourseData(prev => ({
      ...prev,
      courseData: prev.courseData.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              videos: section.videos.map((video, j) => 
                j === videoIndex 
                  ? {
                      ...video,
                      links: video.links.map((link, k) => 
                        k === linkIndex ? { ...link, [field]: value } : link
                      )
                    }
                  : video
              )
            }
          : section
      )
    }));
  };

  const removeLink = (sectionIndex: number, videoIndex: number, linkIndex: number) => {
    setCourseData(prev => ({
      ...prev,
      courseData: prev.courseData.map((section, i) => 
        i === sectionIndex 
          ? {
              ...section,
              videos: section.videos.map((video, j) => 
                j === videoIndex 
                  ? { ...video, links: video.links.filter((_, k) => k !== linkIndex) }
                  : video
              )
            }
          : section
      )
    }));
  };

  const calculateSectionTotalLength = (section: CourseSection) => {
    return section.videos.reduce((total, video) => total + video.videoLength, 0);
  };

  const handleSubmit = () => {
    let isValid = true;
    for (let i = 1; i <= 4; i++) {
      if (!validateTab(i)) {
        isValid = false;
      }
    }
    
    if (isValid) {
      console.log("Course Data:", courseData);
      // Handle form submission here
    } else {
      // Find first tab with errors
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
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Course Name *</Label>
              <Input
                id="name"
                value={courseData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter course name"
                className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={courseData.categories} onValueChange={(value) => handleInputChange('categories', value)}>
                  <SelectTrigger className={`mt-1 ${errors.categories ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories}</p>}
              </div>

              <div>
                <Label htmlFor="level">Level *</Label>
                <Select value={courseData.level} onValueChange={(value) => handleInputChange('level', value)}>
                  <SelectTrigger className={`mt-1 ${errors.level ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select level" />
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

            <div>
              <Label>Course Thumbnail *</Label>
              <div className={`mt-1 border-2 border-dashed ${errors.thumbnail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg p-6 text-center`}>
                {courseData.thumbnailPreview ? (
                  <div className="relative w-full h-48">
                    <Image
                      src={courseData.thumbnailPreview}
                      alt="Course thumbnail"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setCourseData(prev => ({ ...prev, thumbnail: null, thumbnailPreview: "" }))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="thumbnail" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Click to upload course thumbnail
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
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

            <div>
              <Label>Demo Video *</Label>
              <div className={`mt-1 border-2 border-dashed ${errors.demoUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg p-6 text-center`}>
                {courseData.demoUrlPreview ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <FileVideo className="w-8 h-8" />
                      <span className="text-sm font-medium">Demo video uploaded</span>
                    </div>
                    <p className="text-xs text-gray-500">{courseData.demoUrl?.name}</p>
                    <button
                      onClick={() => setCourseData(prev => ({ ...prev, demoUrl: null, demoUrlPreview: "" }))}
                      className="text-red-500 text-sm hover:underline"
                    >
                      Remove video
                    </button>
                  </div>
                ) : (
                  <label htmlFor="demoVideo" className="cursor-pointer">
                    <Video className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Click to upload demo video
                    </p>
                    <p className="text-xs text-gray-500 mt-1">MP4, WebM up to 100MB</p>
                    <input
                      id="demoVideo"
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'demoUrl')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              {errors.demoUrl && <p className="text-red-500 text-sm mt-1">{errors.demoUrl}</p>}
            </div>

            <div>
              <Label>Tags *</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag and press Enter"
                  className={errors.tags ? 'border-red-500' : ''}
                />
                <Button onClick={addTag} className="bg-green-900 hover:bg-green-800">
                  Add
                </Button>
              </div>
              {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {courseData.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-green-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Set competitive pricing for your course. The estimated price can be higher to show value.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="price">Course Price ($) *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="price"
                  type="number"
                  value={courseData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <Label htmlFor="estimatedPrice">Estimated Price ($) *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="estimatedPrice"
                  type="number"
                  value={courseData.estimatedPrice}
                  onChange={(e) => handleInputChange('estimatedPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className={`pl-10 ${errors.estimatedPrice ? 'border-red-500' : ''}`}
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.estimatedPrice && <p className="text-red-500 text-sm mt-1">{errors.estimatedPrice}</p>}
              <p className="text-sm text-gray-500 mt-1">
                This should be higher than the actual price to show discount value
              </p>
            </div>

            {courseData.price > 0 && courseData.estimatedPrice > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-400">
                  Discount: {Math.round(((courseData.estimatedPrice - courseData.price) / courseData.estimatedPrice) * 100)}% OFF
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>What will students learn from this course? *</Label>
              <p className="text-sm text-gray-500 mb-2">List the key benefits and learning outcomes</p>
              <div className="space-y-2">
                {courseData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={benefit}
                      onChange={(e) => updateArrayField('benefits', index, e.target.value)}
                      placeholder="e.g., Build responsive websites from scratch"
                      className={errors.benefits && !benefit.trim() ? 'border-red-500' : ''}
                    />
                    {courseData.benefits.length > 1 && (
                      <Button
                        onClick={() => removeArrayField('benefits', index)}
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {errors.benefits && <p className="text-red-500 text-sm">{errors.benefits}</p>}
                <Button
                  onClick={() => addArrayField('benefits')}
                  variant="outline"
                  className="w-full border-green-900 text-green-900 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Benefit
                </Button>
              </div>
            </div>

            <div>
              <Label>What are the prerequisites for this course? *</Label>
              <p className="text-sm text-gray-500 mb-2">List what students need to know before taking this course</p>
              <div className="space-y-2">
                {courseData.prerequisites.map((prerequisite, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={prerequisite}
                      onChange={(e) => updateArrayField('prerequisites', index, e.target.value)}
                      placeholder="e.g., Basic understanding of HTML and CSS"
                      className={errors.prerequisites && !prerequisite.trim() ? 'border-red-500' : ''}
                    />
                    {courseData.prerequisites.length > 1 && (
                      <Button
                        onClick={() => removeArrayField('prerequisites', index)}
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {errors.prerequisites && <p className="text-red-500 text-sm">{errors.prerequisites}</p>}
                <Button
                  onClick={() => addArrayField('prerequisites')}
                  variant="outline"
                  className="w-full border-green-900 text-green-900 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Prerequisite
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Organize your course content into sections. Each section can have multiple videos/lectures.
              </AlertDescription>
            </Alert>

            {errors.section_incomplete && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  {errors.section_incomplete}
                </AlertDescription>
              </Alert>
            )}

            {errors.video_incomplete && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  {errors.video_incomplete}
                </AlertDescription>
              </Alert>
            )}

            {courseData.courseData.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border border-gray-200 dark:border-zinc-700 rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-400">
                    Section {sectionIndex + 1}
                  </h3>
                  {courseData.courseData.length > 1 && (
                    <Button
                      onClick={() => removeCourseSection(sectionIndex)}
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" /> Remove Section
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Section Title *</Label>
                    <Input
                      value={section.title}
                      onChange={(e) => updateCourseSection(sectionIndex, 'title', e.target.value)}
                      placeholder="e.g., Introduction to React"
                      className={`mt-1 ${errors[`section_${sectionIndex}_title`] ? 'border-red-500' : ''}`}
                    />
                    {errors[`section_${sectionIndex}_title`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`section_${sectionIndex}_title`]}</p>
                    )}
                  </div>

                  <div>
                    <Label>Video Section</Label>
                    <Input
                      value={section.videoSection}
                      onChange={(e) => updateCourseSection(sectionIndex, 'videoSection', e.target.value)}
                      placeholder="e.g., Module 1"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Section Description</Label>
                  <Textarea
                    value={section.description}
                    onChange={(e) => updateCourseSection(sectionIndex, 'description', e.target.value)}
                    placeholder="Describe what will be covered in this section"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-zinc-900 dark:text-white">Videos/Lectures</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      Total: {calculateSectionTotalLength(section)} minutes
                    </div>
                  </div>

                  {section.videos.map((video, videoIndex) => (
                    <div key={videoIndex} className="mb-6 p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium text-zinc-900 dark:text-white">Video {videoIndex + 1}</h5>
                        {section.videos.length > 1 && (
                          <Button
                            onClick={() => removeVideoFromSection(sectionIndex, videoIndex)}
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" /> Remove Video
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Video Title *</Label>
                          <Input
                            value={video.title}
                            onChange={(e) => updateCourseVideo(sectionIndex, videoIndex, { title: e.target.value })}
                            placeholder="e.g., Introduction to Components"
                            className={`mt-1 ${errors[`section_${sectionIndex}_video_${videoIndex}_title`] ? 'border-red-500' : ''}`}
                          />
                          {errors[`section_${sectionIndex}_video_${videoIndex}_title`] && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors[`section_${sectionIndex}_video_${videoIndex}_title`]}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Video Length (minutes)</Label>
                            <Input
                              type="number"
                              value={video.videoLength}
                              onChange={(e) => updateCourseVideo(sectionIndex, videoIndex, { 
                                videoLength: parseInt(e.target.value) || 0 
                              })}
                              placeholder="0"
                              className="mt-1"
                              min="0"
                            />
                          </div>

                          <div>
                            <Label>Video Player</Label>
                            <Input
                              value={video.videoPlayer}
                              onChange={(e) => updateCourseVideo(sectionIndex, videoIndex, { videoPlayer: e.target.value })}
                              placeholder="e.g., Vimeo"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label>Video Description</Label>
                        <Textarea
                          value={video.description}
                          onChange={(e) => updateCourseVideo(sectionIndex, videoIndex, { description: e.target.value })}
                          placeholder="Describe what this video covers"
                          className="mt-1"
                          rows={2}
                        />
                      </div>

                      <div className="mb-4">
                        <Label>Video Upload *</Label>
                        <div className={`mt-1 border-2 border-dashed ${errors[`section_${sectionIndex}_video_${videoIndex}_file`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg p-4 text-center`}>
                          {video.videoUrl ? (
                            <div className="space-y-1">
                              <FileVideo className="w-8 h-8 mx-auto text-green-600" />
                              <p className="text-xs text-gray-500">{video.videoUrl.name}</p>
                              <p className="text-xs text-gray-500">{video.videoLength} minutes</p>
                              <button
                                onClick={() => updateCourseVideo(sectionIndex, videoIndex, { 
                                  videoUrl: null, 
                                  videoLength: 0 
                                })}
                                className="text-red-500 text-xs hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <label htmlFor={`video-${sectionIndex}-${videoIndex}`} className="cursor-pointer">
                              <Video className="w-8 h-8 mx-auto text-gray-400" />
                              <p className="mt-1 text-xs text-gray-600">Upload video</p>
                              <input
                                id={`video-${sectionIndex}-${videoIndex}`}
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleVideoUpload(e, sectionIndex, videoIndex)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                        {errors[`section_${sectionIndex}_video_${videoIndex}_file`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors[`section_${sectionIndex}_video_${videoIndex}_file`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Resource Links</Label>
                        <div className="space-y-2 mt-2">
                          {video.links.map((link, linkIndex) => (
                            <div key={linkIndex} className="flex gap-2">
                              <Input
                                value={link.title}
                                onChange={(e) => updateLink(sectionIndex, videoIndex, linkIndex, 'title', e.target.value)}
                                placeholder="Link title"
                                className="flex-1"
                              />
                              <Input
                                value={link.url}
                                onChange={(e) => updateLink(sectionIndex, videoIndex, linkIndex, 'url', e.target.value)}
                                placeholder="https://..."
                                className="flex-1"
                              />
                              <Button
                                onClick={() => removeLink(sectionIndex, videoIndex, linkIndex)}
                                variant="outline"
                                size="icon"
                                className="text-red-500 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            onClick={() => addLink(sectionIndex, videoIndex)}
                            variant="outline"
                            size="sm"
                            className="w-full border-green-900 text-green-900 hover:bg-green-50"
                          >
                            <Link className="w-4 h-4 mr-2" /> Add Resource Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={() => addVideoToSection(sectionIndex)}
                    variant="outline"
                    className="w-full border-green-900 text-green-900 hover:bg-green-50"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Video to This Section
                  </Button>
                </div>
              </div>
            ))}

            <Button
              onClick={addCourseSection}
              className="w-full bg-green-900 hover:bg-green-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Add New Section
            </Button>
          </div>
        );

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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create New Course</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Fill in the details to create your course
            </p>
          </div>

          {/* Progress Tabs */}
          <div className="border-b border-gray-200 dark:border-zinc-700">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                const isCompleted = tab.id < currentTab;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 px-4 py-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
                      isActive
                        ? 'border-green-900 text-green-900 dark:text-green-400'
                        : isCompleted
                        ? 'border-green-500 text-green-700 dark:text-green-500'
                        : 'border-transparent text-gray-500 hover:text-zinc-700 dark:hover:text-gray-300'
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
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 dark:border-zinc-700 p-6">
            <div className="flex justify-between">
              <Button
                onClick={() => currentTab > 1 && setCurrentTab(currentTab - 1)}
                variant="outline"
                disabled={currentTab === 1}
              >
                Previous
              </Button>
              
              {currentTab === 4 ? (
                <Button
                  onClick={handleSubmit}
                  className="bg-green-900 hover:bg-green-800 text-white"
                >
                  Create Course
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
        </div>
      </div>
    </div>
  );
}