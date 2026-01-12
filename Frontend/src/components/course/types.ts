// components/course/types.ts

export interface CourseLink {
  title: string;
  url: string;
}

export interface CourseVideo {
  title: string;
  videoUrl: string | null; // Changed from File | null to string | null (YouTube URL)
  videoLength: number;
  videoPlayer: string;
  links: CourseLink[];
  description: string;
}

export interface CourseSection {
  title: string;
  description: string;
  videos: CourseVideo[];
  videoSection: string;
}

export interface CourseData {
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice: number;
  thumbnail: File | null;
  thumbnailPreview: string;
  tags: string[];
  level: string;
  demoUrl: string | null; // Changed from File | null to string | null (YouTube URL)
  demoUrlPreview: string;
  benefits: string[];
  prerequisites: string[];
  courseData: CourseSection[];
}