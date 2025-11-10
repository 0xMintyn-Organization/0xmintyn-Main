"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import MuxPlayer from "@mux/mux-player-react";
import CourseAccessGuard from "@/components/CourseAccessGuard";

import {
  BookOpen,
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronLeft,
  Play,
  Menu,
  X,
  Award,
  Bookmark,
  Share2,
  Settings,
  Download,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import NotesSection from "@/components/NotesSection";
import Spinner from "@/components/Spinner";

interface Lecture {
  id: string;
  title: string;
  videoUrl: string;
  type: "video";
  isCompleted: boolean;
  duration: string;
  description?: string;
}

interface Section {
  id: string;
  title: string;
  lectures: Lecture[];
}

export default function CoursePlayerPage() {
 const params = useParams();
  const id = params ? params["courseId"] : undefined;
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [completedLectures, setCompletedLectures] = useState<string[]>([]);
  const [progress, setProgress] = useState({ totalLectures: 0, completedLectures: 0, progressPercentage: 0 });
  const [certificateEligible, setCertificateEligible] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const calculateProgress = () => {
    return progress.progressPercentage || 0;
  };

  const handleLectureClick = (lecture: Lecture) => {
    setCurrentLecture(lecture);
  };

  const fetchCourseProgress = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/progress/${id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        const progressData = response.data.progress;
        setProgress(progressData);
        setCompletedLectures(progressData.completedLectureIds || []);
      }
    } catch (error: any) {
      console.error("Error fetching course progress:", error);
      // Don't show toast for progress fetch errors as it's not critical
    }
  }, [id]);

  const checkCertificateEligibility = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}certificate/eligibility/${id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setCertificateEligible(response.data.eligible);
      }
    } catch (error: any) {
      console.error("Error checking certificate eligibility:", error);
    }
  }, [id]);

  const downloadCertificate = async () => {
    if (!id) return;
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}certificate/generate/${id}`,
        { 
          withCredentials: true,
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `0xMintyn-Certificate-${courseName.replace(/[^a-zA-Z0-9]/g, '-')}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Certificate Downloaded!",
        description: "Your certificate has been downloaded successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error downloading certificate:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to download certificate",
        variant: "destructive",
      });
    }
  };

  const checkBookmarkStatus = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}bookmark/status/${id}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setIsBookmarked(response.data.isBookmarked);
      }
    } catch (error: any) {
      console.error("Error checking bookmark status:", error);
    }
  }, [id]);

  const toggleBookmark = async () => {
    if (!id || bookmarkLoading) return;
    
    setBookmarkLoading(true);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_SERVER_URI}bookmark/remove/${id}`,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          setIsBookmarked(false);
          toast({
            title: "Bookmark Removed",
            description: "Course removed from your bookmarks.",
            variant: "default",
          });
        }
      } else {
        // Add bookmark
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URI}bookmark/add`,
          { courseId: id },
          { withCredentials: true }
        );
        
        if (response.data.success) {
          setIsBookmarked(true);
          toast({
            title: "Bookmark Added",
            description: "Course added to your bookmarks.",
            variant: "default",
          });
        }
      }
    } catch (error: any) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookmarkLoading(false);
    }
  };

  const markLectureAsComplete = async (lectureId: string) => {
    if (!id) return;
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/progress/${id}/${lectureId}/complete`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Update local state
        setCompletedLectures(prev => [...prev, lectureId]);
        
        // Update sections to reflect completion
        setSections(prevSections => 
          prevSections.map(section => ({
            ...section,
            lectures: section.lectures.map(lecture => 
              lecture.id === lectureId 
                ? { ...lecture, isCompleted: true }
                : lecture
            )
          }))
        );
        
        // Update current lecture if it's the one being marked complete
        if (currentLecture?.id === lectureId) {
          setCurrentLecture(prev => prev ? { ...prev, isCompleted: true } : null);
        }
        
        // Refresh progress
        fetchCourseProgress();
        
        // Check certificate eligibility
        checkCertificateEligibility();
        
        // Show success toast
        toast({
          title: "Lecture Completed!",
          description: "Great job! This lecture has been marked as complete.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error marking lecture as complete:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to mark lecture as complete",
        variant: "destructive",
      });
    }
  };

  const handleNextLecture = () => {
    if (!currentLecture) return;
    let found = false;
    for (const section of sections) {
      for (const lecture of section.lectures) {
        if (found) return setCurrentLecture(lecture);
        if (lecture.id === currentLecture.id) found = true;
      }
    }
  };

  const handlePreviousLecture = () => {
    let previous: Lecture | null = null;
    for (const section of sections) {
      for (const lecture of section.lectures) {
        if (lecture.id === currentLecture?.id && previous) {
          return setCurrentLecture(previous);
        }
        previous = lecture;
      }
    }
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}course/enrolled-course/${id}`,
        { withCredentials: true }
      );

      const courseData = res.data.course;

      setCourseName(courseData.name);

      const formattedSections: Section[] = courseData.courseData.map((section: any) => ({
        id: section._id,
        title: section.title,
        lectures: section.videos.map((video: any) => ({
          id: video._id,
          title: video.title,
          videoUrl: video.videoUrl,
          type: "video",
          isCompleted: completedLectures.includes(video._id),
          duration: "10:30",
          description: video.description || "",
        }))
      }));

      setSections(formattedSections);
      setExpandedSections(formattedSections.map(sec => sec.id)); // expand all
      if (formattedSections[0]?.lectures[0]) {
        setCurrentLecture(formattedSections[0].lectures[0]);
      }

    } catch (err) {
      console.error("Error fetching course:", err);
    }
  }, [id, completedLectures]);

  // ✅ Fetch course data
  useEffect(() => {
    if (id) {
      fetchCourseProgress();
      checkCertificateEligibility();
      checkBookmarkStatus();
    }
  }, [id, fetchCourseProgress, checkCertificateEligibility, checkBookmarkStatus]);

  // Fetch course data after progress is loaded
  useEffect(() => {
    if (id && completedLectures.length >= 0) {
      fetchData();
    }
  }, [id, completedLectures, fetchData]);

  return (
    <CourseAccessGuard requiredAccess={['student', 'instructor', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-96" : "w-0"} transition-all duration-300 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 overflow-hidden`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Course Content</h2>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-5 h-5" />
              </Button>
            </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                  <span className="font-semibold text-green-600">{progress.progressPercentage}%</span>
                </div>
                <Progress value={progress.progressPercentage} className="h-2" />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {progress.completedLectures} of {progress.totalLectures} lectures completed
                </div>
              </div>
              
              {/* Bookmark Button */}
              <div className="mt-4">
                <Button 
                  onClick={toggleBookmark}
                  disabled={bookmarkLoading}
                  className={`w-full ${
                    isBookmarked 
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white" 
                      : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white"
                  } font-semibold`}
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                  {bookmarkLoading ? (
                    <>
                      <Spinner size="sm" inline />
                      <span className="ml-2">Loading...</span>
                    </>
                  ) : isBookmarked ? "Bookmarked" : "Bookmark Course"}
                </Button>
              </div>

              {/* Certificate Download Button */}
              {certificateEligible && (
                <div className="mt-4">
                  <Button 
                    onClick={downloadCertificate}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Download Certificate
                  </Button>
                </div>
              )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {sections.map(section => (
              <div key={section.id} className="border-b border-gray-200 dark:border-zinc-700">
                <button className="w-full p-4 flex items-center justify-between" onClick={() => toggleSection(section.id)}>
                  <div className="flex gap-3 text-left items-start">
                    <BookOpen className="w-5 h-5 text-gray-500 mt-1" />
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-gray-500">
                        {section.lectures.filter(l => l.isCompleted).length}/{section.lectures.length} completed
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${expandedSections.includes(section.id) ? "rotate-90" : ""}`} />
                </button>

                {expandedSections.includes(section.id) && (
                  <div className="bg-gray-50 dark:bg-zinc-900">
                    {section.lectures.map(lecture => (
                      <button
                        key={lecture.id}
                        onClick={() => handleLectureClick(lecture)}
                        className={`w-full p-3 px-4 flex items-center gap-3 ${
                          currentLecture?.id === lecture.id ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600" : ""
                        } hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors`}
                      >
                        {lecture.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex-1 text-left">
                          <p className={`text-sm ${currentLecture?.id === lecture.id ? "font-semibold" : ""}`}>
                            {lecture.title}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-2">
                            <Play className="w-3 h-3" /> {lecture.duration}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{currentLecture?.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{courseName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsBookmarked(!isBookmarked)}>
                <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon"><Share2 className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>

        {/* Video */}
        <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto">
          {currentLecture?.type === "video" && currentLecture.videoUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
              <MuxPlayer
                src={currentLecture.videoUrl}
                streamType="on-demand"
                metadata={{
                  video_title: currentLecture.title,
                  viewer_user_id: "user-123"
                }}
                autoPlay={false}
                onEnded={() => {
                  console.log("Video ended for:", currentLecture?.title);
                  if (currentLecture && !currentLecture.isCompleted) {
                    console.log("Auto-marking lecture as complete:", currentLecture.id);
                    markLectureAsComplete(currentLecture.id);
                  } else {
                    console.log("Lecture already completed or no current lecture");
                  }
                }}
              />
            </div>
          )}

          {/* Manual Mark as Complete Button */}
          {currentLecture && !currentLecture.isCompleted && (
            <div className="mb-6">
              <Button 
                onClick={() => markLectureAsComplete(currentLecture.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          )}

          {/* Completion Status */}
          {currentLecture && currentLecture.isCompleted && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">This lecture is completed!</span>
              </div>
            </div>
          )}

          {/* Course Completion Certificate */}
          {certificateEligible && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <div className="text-center">
                <Award className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                  🎉 Congratulations!
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                  You have successfully completed this course! Download your certificate to showcase your achievement.
                </p>
                <Button 
                  onClick={downloadCertificate}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold px-8 py-3"
                >
                  <Award className="w-5 h-5 mr-2" />
                  Download Your Certificate
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mb-6">
            <Button onClick={handlePreviousLecture} variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Lecture
            </Button>
            <Button onClick={handleNextLecture} variant="outline">
              Next Lecture
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            {/* Tab: Overview */}
            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">About this lecture</h3>
                  <p className="text-zinc-700 dark:text-gray-300">{currentLecture?.description}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Notes */}
            <TabsContent value="notes" className="mt-6">
              <NotesSection />
            </TabsContent>

            {/* Tab: Resources */}
            <TabsContent value="resources" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Downloadable Resources</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border p-3 rounded-lg">
                      <span>React Cheat Sheets.pdf</span>
                      <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Download</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Completion Certificate */}
          {calculateProgress() === 100 && (
            <Card className="mt-6 bg-green-50 dark:bg-green-900/20 border-green-200">
              <CardContent className="p-6 flex items-center gap-4">
                <Award className="w-12 h-12 text-green-600" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-400">Congratulations!</h3>
                  <p className="text-sm">Download your certificate of completion</p>
                </div>
                <Button className="bg-green-900 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Certificate
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </CourseAccessGuard>
  );
}