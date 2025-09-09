"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Maximize,
    CheckCircle,
    Circle,
    Lock,
    FileText,
    Download,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    BookOpen,
    Clock,
    Award,
    HelpCircle,
    Flag,
    Bookmark,
    Share2,
    Settings,
    RefreshCw
} from "lucide-react";

interface Lecture {
    id: number;
    title: string;
    duration: string;
    isCompleted: boolean;
    type: 'video' | 'article' | 'quiz';
    videoUrl?: string;
    content?: string;
}

interface Section {
    id: number;
    title: string;
    lectures: Lecture[];
}

const courseSections: Section[] = [
    {
        id: 1,
        title: "Introduction to React",
        lectures: [
            { 
                id: 1, 
                title: "Welcome to the Course", 
                duration: "5:30", 
                isCompleted: true, 
                type: 'video',
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            },
            { 
                id: 2, 
                title: "What is React?", 
                duration: "12:45", 
                isCompleted: true, 
                type: 'video',
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            },
            { 
                id: 3, 
                title: "Setting Up Development Environment", 
                duration: "15:20", 
                isCompleted: false, 
                type: 'video',
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            },
            { 
                id: 4, 
                title: "Your First React App", 
                duration: "11:30", 
                isCompleted: false, 
                type: 'video',
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            }
        ]
    },
    {
        id: 2,
        title: "React Fundamentals",
        lectures: [
            { id: 5, title: "Components and Props", duration: "18:45", isCompleted: false, type: 'video' },
           { id: 6, title: "State Management", duration: "22:30", isCompleted: false, type: 'video' },
            { id: 7, title: "Handling Events", duration: "15:10", isCompleted: false, type: 'video' },
            { id: 8, title: "Practice Exercise", duration: "30 min", isCompleted: false, type: 'quiz' }
        ]
    }
];

export default function CoursePlayerPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentLecture, setCurrentLecture] = useState(courseSections[0].lectures[0]);
    const [expandedSections, setExpandedSections] = useState<number[]>([1, 2]);
    const [activeTab, setActiveTab] = useState("overview");
    const [notes, setNotes] = useState("");
    const [isBookmarked, setIsBookmarked] = useState(false);

    const toggleSection = (sectionId: number) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const calculateProgress = () => {
        const totalLectures = courseSections.reduce((acc, section) => acc + section.lectures.length, 0);
        const completedLectures = courseSections.reduce(
            (acc, section) => acc + section.lectures.filter(lecture => lecture.isCompleted).length,
            0
        );
        return (completedLectures / totalLectures) * 100;
    };

    const handleLectureClick = (lecture: Lecture) => {
        setCurrentLecture(lecture);
    };

    const handleNextLecture = () => {
        let foundCurrent = false;
        for (const section of courseSections) {
            for (const lecture of section.lectures) {
                if (foundCurrent) {
                    setCurrentLecture(lecture);
                    return;
                }
                if (lecture.id === currentLecture.id) {
                    foundCurrent = true;
                }
            }
        }
    };

    const handlePreviousLecture = () => {
        let previousLecture = null;
        for (const section of courseSections) {
            for (const lecture of section.lectures) {
                if (lecture.id === currentLecture.id && previousLecture) {
                    setCurrentLecture(previousLecture);
                    return;
                }
                previousLecture = lecture;
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex">
            {/* Sidebar */}
            <div className={`${
                sidebarOpen ? 'w-96' : 'w-0'
            } transition-all duration-300 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 overflow-hidden`}>
                <div className="h-full flex flex-col">
                    {/* Course Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-lg">Course Content</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                                <span className="font-semibold text-green-600">{Math.round(calculateProgress())}%</span>
                            </div>
                            <Progress value={calculateProgress()} className="h-2" />
                        </div>
                    </div>

                    {/* Sections List */}
                    <div className="flex-1 overflow-y-auto">
                        {courseSections.map((section) => (
                            <div key={section.id} className="border-b border-gray-200 dark:border-zinc-700">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <BookOpen className="w-5 h-5 text-gray-500" />
                                        <div>
                                            <h3 className="font-semibold">{section.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {section.lectures.filter(l => l.isCompleted).length}/{section.lectures.length} completed
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${
                                        expandedSections.includes(section.id) ? 'rotate-90' : ''
                                    }`} />
                                </button>

                                {expandedSections.includes(section.id) && (
                                    <div className="bg-gray-50 dark:bg-zinc-900">
                                        {section.lectures.map((lecture) => (
                                            <button
                                                key={lecture.id}
                                                onClick={() => handleLectureClick(lecture)}
                                                className={`w-full p-3 px-4 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
                                                    currentLecture.id === lecture.id ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600' : ''
                                                }`}
                                            >
                                                {lecture.isCompleted ? (
                                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 text-left">
                                                    <p className={`text-sm ${
                                                        currentLecture.id === lecture.id ? 'font-semibold' : ''
                                                    }`}>
                                                        {lecture.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        {lecture.type === 'video' && <Play className="w-3 h-3" />}
                                                        {lecture.type === 'article' && <FileText className="w-3 h-3" />}
                                                        {lecture.type === 'quiz' && <HelpCircle className="w-3 h-3" />}
                                                        <span>{lecture.duration}</span>
                                                    </div>
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
                {/* Top Bar */}
                <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                <Menu className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-semibold">{currentLecture.title}</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Complete React Developer Course 2024
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsBookmarked(!isBookmarked)}
                            >
                                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Video/Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto p-6">
                        {/* Video Player */}
                        {currentLecture.type === 'video' && (
                            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                                <video
                                    key={"video-player"} 
                                    src={"http://localhost:8000/api/v1/stream/video-1757442695314-10712736.mp4"}
                                    controls
                                    preload="metadata"
                                    className="w-full h-full object-cover"
                                   
                                />
                            </div>
                        )}

                        {/* Article Content */}
                        {currentLecture.type === 'article' && (
                            <Card className="mb-6">
                                <CardContent className="p-6">
                                    <h2 className="text-2xl font-bold mb-4">{currentLecture.title}</h2>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p>Article content would go here...</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quiz Content */}
                        {currentLecture.type === 'quiz' && (
                            <Card className="mb-6">
                                <CardContent className="p-6">
                                    <h2 className="text-2xl font-bold mb-4">Quiz: {currentLecture.title}</h2>
                                    <p className="text-gray-600 dark:text-gray-400">Quiz questions would appear here...</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mb-6">
                            <Button
                                variant="outline"
                                onClick={handlePreviousLecture}
                                className="flex items-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous Lecture
                            </Button>
                            
                            <Button
                                className="bg-green-900 hover:bg-green-800 text-white"
                            >
                                Mark as Complete
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleNextLecture}
                                className="flex items-center gap-2"
                            >
                                Next Lecture
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Tabs Section */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid grid-cols-5 w-full">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="notes">Notes</TabsTrigger>
                                <TabsTrigger value="resources">Resources</TabsTrigger>
                                <TabsTrigger value="qa">Q&A</TabsTrigger>
                                <TabsTrigger value="announcements">Announcements</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="mt-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">About this lecture</h3>
                                        <p className="text-zinc-700 dark:text-gray-300 mb-4">
                                            In this lecture, we'll cover the fundamentals of React and understand why it's 
                                            become one of the most popular JavaScript libraries for building user interfaces.
                                        </p>
                                        
                                        <h4 className="font-semibold mb-2">Key Topics:</h4>
                                        <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-gray-300">
                                            <li>What is React and why use it?</li>
                                            <li>Virtual DOM explained</li>
                                            <li>Component-based architecture</li>
                                            <li>React ecosystem overview</li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="notes" className="mt-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">Your Notes</h3>
                                        <Textarea
                                            placeholder="Take notes while watching the lecture..."
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="min-h-[200px] mb-4"
                                        />
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-gray-500">
                                                Notes are automatically saved
                                            </p>
                                            <Button className="bg-green-900 hover:bg-green-800">
                                                Save Notes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="resources" className="mt-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">Downloadable Resources</h3>
                                        <div className="space-y-3">
                                            {[
                                                { name: "React Cheat Sheet.pdf", size: "2.3 MB" },
                                                { name: "Source Code.zip", size: "15.7 MB" },
                                                { name: "Slides.pptx", size: "8.1 MB" }
                                            ].map((resource, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="w-5 h-5 text-gray-500" />
                                                        <div>
                                                            <p className="font-medium">{resource.name}</p>
                                                            <p className="text-sm text-gray-500">{resource.size}</p>
                                                        </div>
                                                    </div>
                                                                                         <Button variant="outline" size="sm">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="qa" className="mt-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold">Questions & Answers</h3>
                                            <Button className="bg-green-900 hover:bg-green-800">
                                                Ask a Question
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {[1, 2, 3].map((q) => (
                                                <div key={q} className="border rounded-lg p-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                                            <span className="text-sm font-semibold">S{q}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-semibold">Student {q}</span>
                                                                <span className="text-sm text-gray-500">2 days ago</span>
                                                            </div>
                                                            <p className="text-zinc-700 dark:text-gray-300 mb-3">
                                                                How do I handle state management in larger React applications?
                                                            </p>
                                                            
                                                            {/* Instructor Reply */}
                                                            <div className="ml-6 mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge className="bg-green-100 text-green-800">Instructor</Badge>
                                                                    <span className="text-sm text-gray-500">1 day ago</span>
                                                                </div>
                                                                <p className="text-sm text-zinc-700 dark:text-gray-300">
                                                                    Great question! For larger applications, I recommend using Redux or Context API...
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center gap-4 mt-3">
                                                                <Button variant="ghost" size="sm">
                                                                    <MessageSquare className="w-4 h-4 mr-1" />
                                                                    Reply
                                                                </Button>
                                                                <Button variant="ghost" size="sm">
                                                                    <Flag className="w-4 h-4 mr-1" />
                                                                    Report
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="announcements" className="mt-6">
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="text-lg font-semibold mb-4">Course Announcements</h3>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    title: "New Section Added: React Hooks Advanced Patterns",
                                                    date: "3 days ago",
                                                    content: "I've just added a new section covering advanced React Hooks patterns..."
                                                },
                                                {
                                                    title: "Live Q&A Session This Friday",
                                                    date: "1 week ago",
                                                    content: "Join me this Friday at 3 PM EST for a live Q&A session..."
                                                }
                                            ].map((announcement, index) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-semibold">{announcement.title}</h4>
                                                        <span className="text-sm text-gray-500">{announcement.date}</span>
                                                    </div>
                                                    <p className="text-zinc-700 dark:text-gray-300">{announcement.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        {/* Course Completion Certificate Preview */}
                        {calculateProgress() === 100 && (
                            <Card className="mt-6 bg-green-50 dark:bg-green-900/20 border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4">
                                        <Award className="w-12 h-12 text-green-600" />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-green-900 dark:text-green-400">
                                                Congratulations! You've completed the course
                                            </h3>
                                            <p className="text-zinc-700 dark:text-gray-300 mt-1">
                                                You can now download your certificate of completion
                                            </p>
                                        </div>
                                        <Button className="bg-green-900 hover:bg-green-800">
                                            <Download className="w-4 h-4 mr-2" />
                                            Get Certificate
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 p-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousLecture}
                        >
                            <SkipBack className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                className="bg-green-900 hover:bg-green-800"
                            >
                                Complete & Continue
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextLecture}
                        >
                            <SkipForward className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}