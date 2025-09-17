"use client";

import {
  Plus,
  X,
  Video,
  FileVideo,
  Link,
  Clock,
} from "lucide-react";
import { useState, useRef } from "react";
import { CourseData, CourseSection, CourseVideo } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadFileToBackend } from "@/lib/uploadFileToBackend";

interface Props {
  courseData: CourseData;
  setCourseData: React.Dispatch<React.SetStateAction<CourseData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function CourseContentForm({
  courseData,
  setCourseData,
  errors,
  setErrors,
}: Props) {
  const [uploadProgressMap, setUploadProgressMap] = useState<Record<string, number>>({});

  const updateCourseSection = (sectionIndex: number, field: keyof CourseSection, value: any) => {
    setCourseData((prev) => ({
      ...prev,
      courseData: prev.courseData.map((section, i) =>
        i === sectionIndex ? { ...section, [field]: value } : section
      ),
    }));
    if (field === "title") {
      setErrors((prev) => ({
        ...prev,
        [`section_${sectionIndex}_title`]: "",
      }));
    }
  };

  const updateCourseVideo = (sectionIndex: number, videoIndex: number, updates: Partial<CourseVideo>) => {
    setCourseData((prev) => ({
      ...prev,
      courseData: prev.courseData.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              videos: section.videos.map((video, j) =>
                j === videoIndex ? { ...video, ...updates } : video
              ),
            }
          : section
      ),
    }));
    if (updates.title && errors[`section_${sectionIndex}_video_${videoIndex}_title`]) {
      setErrors((prev) => ({
        ...prev,
        [`section_${sectionIndex}_video_${videoIndex}_title`]: "",
      }));
    }
  };

  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionIndex: number,
    videoIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) return;

    const tempKey = `section_${sectionIndex}_video_${videoIndex}`;
    const objectUrl = URL.createObjectURL(file);

    try {
      const videoElem = document.createElement("video");
      videoElem.src = objectUrl;

      videoElem.onloadedmetadata = async () => {
        const duration = Math.round(videoElem.duration / 60);

        setUploadProgressMap((prev) => ({ ...prev, [tempKey]: 0 }));

        const { url } = await uploadFileToBackend(file, (progress) => {
          setUploadProgressMap((prev) => ({ ...prev, [tempKey]: progress }));
        });

        updateCourseVideo(sectionIndex, videoIndex, {
          videoUrl: url,
          videoLength: duration,
          videoPlayer: "custom",
          description: "Uploaded to server",
        });

        setUploadProgressMap((prev) => {
          const { [tempKey]: _, ...rest } = prev;
          return rest;
        });

        setErrors((prev) => ({
          ...prev,
          [`section_${sectionIndex}_video_${videoIndex}_file`]: "",
        }));

        URL.revokeObjectURL(objectUrl);
      };
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({
        ...prev,
        [`section_${sectionIndex}_video_${videoIndex}_file`]: "Upload failed!",
      }));
      setUploadProgressMap((prev) => {
        const { [tempKey]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const addCourseSection = () => {
    const current = courseData.courseData.at(-1);

    const isIncomplete =
      !current?.title || current.videos.some((v) => !v.title || !v.videoUrl);

    if (isIncomplete) {
      setErrors((prev) => ({
        ...prev,
        section_incomplete: "Please complete the current section before adding a new one.",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, section_incomplete: "" }));

    setCourseData((prev) => ({
      ...prev,
      courseData: [
        ...prev.courseData,
        {
          title: "",
          description: "",
          videoSection: "",
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
        },
      ],
    }));
  };

  const removeCourseSection = (sectionIndex: number) => {
    if (courseData.courseData.length <= 1) return;

    setCourseData((prev) => ({
      ...prev,
      courseData: prev.courseData.filter((_, i) => i !== sectionIndex),
    }));
  };

  const addVideoToSection = (sectionIndex: number) => {
    const lastVideo = courseData.courseData[sectionIndex].videos.at(-1);

    if (!lastVideo?.title || !lastVideo?.videoUrl) {
      setErrors((prev) => ({
        ...prev,
        video_incomplete: "Please complete the current video before adding another.",
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, video_incomplete: "" }));

    updateCourseSection(sectionIndex, "videos", [
      ...courseData.courseData[sectionIndex].videos,
      {
        title: "",
        videoUrl: null,
        videoPlayer: "",
        videoLength: 0,
        description: "",
        links: [],
      },
    ]);
  };

  const removeVideoFromSection = (sectionIndex: number, videoIndex: number) => {
    if (courseData.courseData[sectionIndex].videos.length <= 1) return;

    updateCourseSection(
      sectionIndex,
      "videos",
      courseData.courseData[sectionIndex].videos.filter((_, i) => i !== videoIndex)
    );
  };

  const addLink = (sectionIndex: number, videoIndex: number) => {
    const links = courseData.courseData[sectionIndex].videos[videoIndex].links;

    updateCourseVideo(sectionIndex, videoIndex, {
      links: [...links, { title: "", url: "" }],
    });
  };

  const updateLink = (
    sectionIndex: number,
    videoIndex: number,
    linkIndex: number,
    key: "title" | "url",
    value: string
  ) => {
    const links = [...courseData.courseData[sectionIndex].videos[videoIndex].links];
    links[linkIndex][key] = value;

    updateCourseVideo(sectionIndex, videoIndex, { links });
  };

  const removeLink = (sectionIndex: number, videoIndex: number, linkIndex: number) => {
    const links = courseData.courseData[sectionIndex].videos[videoIndex].links;
    updateCourseVideo(sectionIndex, videoIndex, {
      links: links.filter((_, i) => i !== linkIndex),
    });
  };

  const calculateSectionDuration = (section: CourseSection) =>
    section.videos.reduce((total, v) => total + v.videoLength, 0);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {errors.section_incomplete && (
        <Alert className="bg-red-50 border border-red-200">
          <AlertDescription className="text-red-800">
            {errors.section_incomplete}
          </AlertDescription>
        </Alert>
      )}
      {errors.video_incomplete && (
        <Alert className="bg-red-50 border border-red-200">
          <AlertDescription className="text-red-800">
            {errors.video_incomplete}
          </AlertDescription>
        </Alert>
      )}

      {/* Sections */}
      {courseData.courseData.map((section, sectionIndex) => (
        <div key={sectionIndex} className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Section {sectionIndex + 1}</h3>
            {courseData.courseData.length > 1 && (
              <Button
                onClick={() => removeCourseSection(sectionIndex)}
                variant="outline"
                size="sm"
                className="text-red-600"
              >
                <X className="w-4 h-4 mr-1" />
                Remove Section
              </Button>
            )}
          </div>

          {/* Section Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Section Title *</Label>
              <Input
                value={section.title}
                onChange={(e) =>
                  updateCourseSection(sectionIndex, "title", e.target.value)
                }
                placeholder="e.g., Introduction to React"
                className={errors[`section_${sectionIndex}_title`] ? "border-red-500" : ""}
              />
            </div>
            <div>
              <Label>Video Section</Label>
              <Input
                value={section.videoSection}
                onChange={(e) =>
                  updateCourseSection(sectionIndex, "videoSection", e.target.value)
                }
                placeholder="e.g., Module 1"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={section.description}
              onChange={(e) =>
                updateCourseSection(sectionIndex, "description", e.target.value)
              }
              rows={3}
              placeholder="What will this section cover?"
            />
          </div>

          {/* Videos */}
          {section.videos.map((video, videoIndex) => {
            const key = `section_${sectionIndex}_video_${videoIndex}`;
            return (
              <div key={videoIndex} className="border p-4 rounded-lg ">
                <div className="flex justify-between items-center mb-4">
                  <h4>Video {videoIndex + 1}</h4>
                  {section.videos.length > 1 && (
                    <Button
                      onClick={() => removeVideoFromSection(sectionIndex, videoIndex)}
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                {/* Title/Length/Player */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder="Video Title *"
                    value={video.title}
                    onChange={(e) =>
                      updateCourseVideo(sectionIndex, videoIndex, {
                        title: e.target.value,
                      })
                    }
                    className={
                      errors[`${key}_title`] ? "border-red-500" : ""
                    }
                  />
                  <Input
                    placeholder="Duration (min)"
                    type="number"
                    value={video.videoLength}
                    onChange={(e) =>
                      updateCourseVideo(sectionIndex, videoIndex, {
                        videoLength: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-md p-6 text-center ${
                    errors[`${key}_file`] ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {video.videoUrl ? (
                    <div>
                      <video
                        src={video.videoUrl}
                        controls
                        className="w-full h-48 rounded-md mx-auto mb-2"
                      />
                      <Button
                        variant="link"
                        onClick={() =>
                          updateCourseVideo(sectionIndex, videoIndex, {
                            videoUrl: null,
                            videoLength: 0,
                          })
                        }
                        className="text-red-500 text-sm"
                      >
                        Remove Video
                      </Button>
                    </div>
                  ) : (
                    <>
                      <label className="cursor-pointer flex flex-col items-center justify-center">
                        <Video className="w-8 h-8 text-gray-400" />
                        <span className="text-sm">Upload Video</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="video/*"
                          onChange={(e) =>
                            handleVideoUpload(e, sectionIndex, videoIndex)
                          }
                        />
                      </label>

                      {uploadProgressMap[key] !== undefined && (
                        <div className="mt-2">
                          <div className="h-2 w-full bg-gray-200 rounded">
                            <div
                              className="bg-green-500 h-2 rounded"
                              style={{ width: `${uploadProgressMap[key]}%` }}
                            ></div>
                          </div>
                          <p className="text-xs mt-1 text-gray-500">
                            Uploading: {uploadProgressMap[key]}%
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {errors[`${key}_file`] && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors[`${key}_file`]}
                  </p>
                )}

                {/* Description + Links */}
                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Video Description"
                    value={video.description}
                    onChange={(e) =>
                      updateCourseVideo(sectionIndex, videoIndex, {
                        description: e.target.value,
                      })
                    }
                  />

                  {/* Resource Links */}
                  <div className="mt-2 space-y-2">
                    {video.links.map((link, linkIndex) => (
                      <div key={linkIndex} className="flex gap-2">
                        <Input
                          value={link.title}
                          onChange={(e) =>
                            updateLink(sectionIndex, videoIndex, linkIndex, "title", e.target.value)
                          }
                          placeholder="Link title"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            updateLink(sectionIndex, videoIndex, linkIndex, "url", e.target.value)
                          }
                          placeholder="https://..."
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500"
                          onClick={() =>
                            removeLink(sectionIndex, videoIndex, linkIndex)
                          }
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => addLink(sectionIndex, videoIndex)}
                      variant="outline"
                      size="sm"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Add Resource Link
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            onClick={() => addVideoToSection(sectionIndex)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Video to This Section
          </Button>
        </div>
      ))}

      <Button
        onClick={addCourseSection}
        className="w-full bg-green-900 text-white hover:bg-green-800"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add New Section
      </Button>
    </div>
  );
}