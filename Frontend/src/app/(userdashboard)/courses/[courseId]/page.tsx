"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  FileText,
  HelpCircle,
  Menu,
  X,
  Award,
  Bookmark,
  Share2,
  Settings,
  Download,
  SkipBack,
  SkipForward
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentLecture, setCurrentLecture] = useState<Lecture | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [instructorName, setInstructorName] = useState("");

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const calculateProgress = () => {
    const totalLectures = sections.reduce((acc, sec) => acc + sec.lectures.length, 0);
    const completedLectures = sections.reduce((acc, sec) => acc + sec.lectures.filter(l => l.isCompleted).length, 0);
    return totalLectures ? (completedLectures / totalLectures) * 100 : 0;
  };

  const handleLectureClick = (lecture: Lecture) => {
    setCurrentLecture(lecture);
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

  // ✅ Fetch course data
  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}course/enrolled-course/${id}`,
          { withCredentials: true }
        );

        const courseData = res.data.course;

        setCourseName(courseData.name);
        setInstructorName(`${courseData.createdBy.firstName} ${courseData.createdBy.lastName}`);

        const formattedSections: Section[] = courseData.courseData.map((section: any, secIdx: number) => ({
          id: section._id,
          title: section.title,
          lectures: section.videos.map((video: any, vidIdx: number) => ({
            id: video._id,
            title: video.title,
            videoUrl: video.videoUrl,
            type: "video",
            isCompleted: false, // Optional: replace with real progress
            duration: "N/A",
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
    }

    fetchData();
  }, [id]);

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
                <span className="font-semibold text-green-600">{Math.round(calculateProgress())}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
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
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mb-6">
            <Button onClick={handlePreviousLecture} variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Lecture
            </Button>
            <Button className="bg-green-900 text-white">Mark as Complete</Button>
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
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Notes</h3>
                  <Textarea
                    placeholder="Type your notes here..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[200px] mb-4"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Auto-saving...</span>
                    <Button className="bg-green-900 text-white">Save Notes</Button>
                  </div>
                </CardContent>
              </Card>
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