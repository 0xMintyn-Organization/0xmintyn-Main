"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    Play,
    Clock,
    Users,
    Star,
    Award,
    BookOpen,
    Video,
    FileText,
    Download,
    Globe,
    Calendar,
    CheckCircle,
    Lock,
    ShoppingCart,
    Heart,
    Share2,
    BarChart,
    Target,
    Zap,
    Shield,
    RefreshCw,
    ChevronDown
} from "lucide-react";

interface CourseSection {
    id: number;
    title: string;
    duration: string;
    lectures: {
        id: number;
        title: string;
        duration: string;
        isPreview: boolean;
        type: 'video' | 'article' | 'quiz';
    }[];
}

const courseSections: CourseSection[] = [
    {
        id: 1,
        title: "Introduction to React",
        duration: "45 min",
        lectures: [
            { id: 1, title: "Welcome to the Course", duration: "5:30", isPreview: true, type: 'video' },
            { id: 2, title: "What is React?", duration: "12:45", isPreview: true, type: 'video' },
            { id: 3, title: "Setting Up Development Environment", duration: "15:20", isPreview: false, type: 'video' },
            { id: 4, title: "Your First React App", duration: "11:30", isPreview: false, type: 'video' }
        ]
    },
    {
        id: 2,
        title: "React Fundamentals",
        duration: "2h 15min",
        lectures: [
            { id: 5, title: "Components and Props", duration: "18:45", isPreview: false, type: 'video' },
            { id: 6, title: "State Management", duration: "22:30", isPreview: false, type: 'video' },
            { id: 7, title: "Handling Events", duration: "15:10", isPreview: false, type: 'video' },
            { id: 8, title: "Practice Exercise", duration: "30 min", isPreview: false, type: 'quiz' }
        ]
    },
    {
        id: 3,
        title: "Advanced Concepts",
        duration: "3h 30min",
        lectures: [
            { id: 9, title: "React Hooks Deep Dive", duration: "45:00", isPreview: false, type: 'video' },
            { id: 10, title: "Context API", duration: "35:20", isPreview: false, type: 'video' },
            { id: 11, title: "Performance Optimization", duration: "28:15", isPreview: false, type: 'video' },
            { id: 12, title: "Best Practices Guide", duration: "15 min", isPreview: false, type: 'article' }
        ]
    }
];

export default function CoursePreviewPage() {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [expandedSections, setExpandedSections] = useState<number[]>([1]);

    const toggleSection = (sectionId: number) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
            {/* Hero Section */}
            <div className="bg-zinc-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Course Info - Left Side */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>Development</span>
                                <span>/</span>
                                <span>Web Development</span>
                                <span>/</span>
                                <span>React</span>
                            </div>

                            <div>
                                <h1 className="text-4xl font-bold mb-4">
                                    Complete React Developer Course 2024
                                </h1>
                                <p className="text-xl text-gray-300 mb-6">
                                    Master React 18 with Redux, Hooks, and Context API. Build 10+ real projects including e-commerce platform.
                                </p>
                            </div>

                            <div className="flex items-center gap-6 flex-wrap">
                                <Badge className="bg-yellow-500 text-black px-3 py-1">Bestseller</Badge>
                                <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">4.8</span>
                                    <span className="text-gray-400">(2,345 ratings)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-5 h-5" />
                                    <span>12,456 students</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Last updated 11/2024</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    <span>English</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">Created by John Doe</p>
                                    <p className="text-sm text-gray-400">Senior React Developer at Tech Corp</p>
                                </div>
                            </div>
                        </div>

                        {/* Course Card - Right Side */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4 bg-white dark:bg-zinc-800 shadow-xl">
                                <CardContent className="p-0">
                                    {/* Video Preview */}
                                    <div className="relative aspect-video">
                                        <iframe
                                            className="w-full h-full rounded-t-lg"
                                            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                            title="Course Preview"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-t-lg">
                                            <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                                                <Play className="w-6 h-6 mr-2" />
                                                Preview Course
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                                                $49.99
                                            </span>
                                            <span className="text-xl text-gray-500 line-through">$199.99</span>
                                            <Badge className="bg-green-100 text-green-800">75% OFF</Badge>
                                        </div>

                                        <div className="text-red-600 text-sm font-semibold">
                                            ⏰ 2 days left at this price!
                                        </div>

                                        <div className="space-y-2">
                                            <Button className="w-full bg-green-900 hover:bg-green-800 text-white" size="lg">
                                                <ShoppingCart className="w-5 h-5 mr-2" />
                                                Add to Cart
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="w-full border-green-900 text-green-900 hover:bg-green-50"
                                                size="lg"
                                            >
                                                Buy Now
                                            </Button>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => setIsWishlisted(!isWishlisted)}
                                            >
                                                <Heart className={`w-4 h-4 mr-1 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                                                Wishlist
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Share2 className="w-4 h-4 mr-1" />
                                                Share
                                            </Button>
                                        </div>

                                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                            30-Day Money-Back Guarantee
                                        </div>

                                        <div className="space-y-3 pt-4 border-t">
                                            <h4 className="font-semibold">This course includes:</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-3">
                                                    <Video className="w-4 h-4 text-gray-500" />
                                                    <span>22 hours on-demand video</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-4 h-4 text-gray-500" />
                                                    <span>15 articles</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Download className="w-4 h-4 text-gray-500" />
                                                    <span>85 downloadable resources</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Shield className="w-4 h-4 text-gray-500" />
                                                    <span>Full lifetime access</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Award className="w-4 h-4 text-gray-500" />
                                                    <span>Certificate of completion</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content Section */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                        <TabsTrigger value="instructor">Instructor</TabsTrigger>
                        <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8">
                        {/* What you'll learn */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold mb-6">What you'll learn</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        "Build 10+ real world React applications",
                                        "Master React Hooks and functional components",
                                        "Implement Redux for state management",
                                        "Deploy React apps to production",
                                        "Work with REST APIs and GraphQL",
                                        "Implement authentication and authorization",
                                        "Write clean, maintainable code",
                                        "Master modern JavaScript ES6+"
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Requirements */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold mb-6">Requirements</h2>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-3">
                                        <Target className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                        <span>Basic understanding of HTML, CSS, and JavaScript</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Target className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                        <span>A computer with internet access</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Target className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                        <span>Willingness to learn and practice</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold mb-6">Description</h2>
                                <div className="prose dark:prose-invert max-w-none">
                                    <p>
                                        Welcome to the most comprehensive React course on the platform! This course has been designed 
                                        to take you from a complete beginner to a professional React developer.
                                    </p>
                                    <p>
                                                                        Throughout this course, you'll build 10+ real-world projects including a full-featured e-commerce 
                                        platform, a social media dashboard, and a project management tool. Each project has been carefully 
                                        selected to teach you the skills that employers are looking for.
                                    </p>
                                    <h3 className="text-xl font-semibold mt-4">Why This Course?</h3>
                                    <ul>
                                        <li>Up-to-date with React 18 and all the latest features</li>
                                        <li>Practical, hands-on learning with real projects</li>
                                        <li>Clear explanations of complex concepts</li>
                                        <li>Active Q&A support from the instructor</li>
                                        <li>Regular updates and new content</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Who this course is for */}
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold mb-6">Who this course is for</h2>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Developers who want to learn React from scratch</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>JavaScript developers looking to expand their skillset</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Anyone interested in modern web development</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="curriculum" className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">Course Content</h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    12 sections • 67 lectures • 22h 15m total length
                                </p>
                            </div>
                            <Button variant="outline" size="sm">
                                Expand All Sections
                            </Button>
                        </div>

                        {courseSections.map((section) => (
                            <Card key={section.id}>
                                <CardContent className="p-0">
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-5 h-5 text-gray-500" />
                                            <div className="text-left">
                                                <h3 className="font-semibold">{section.title}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {section.lectures.length} lectures • {section.duration}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 transition-transform ${
                                            expandedSections.includes(section.id) ? 'rotate-180' : ''
                                        }`} />
                                    </button>

                                    {expandedSections.includes(section.id) && (
                                        <div className="border-t">
                                            {section.lectures.map((lecture) => (
                                                <div
                                                    key={lecture.id}
                                                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {lecture.type === 'video' && <Video className="w-4 h-4 text-gray-500" />}
                                                        {lecture.type === 'article' && <FileText className="w-4 h-4 text-gray-500" />}
                                                        {lecture.type === 'quiz' && <BarChart className="w-4 h-4 text-gray-500" />}
                                                        <span className="text-sm">{lecture.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {lecture.isPreview && (
                                                            <Button variant="ghost" size="sm" className="text-green-600">
                                                                Preview
                                                            </Button>
                                                        )}
                                                        <span className="text-sm text-gray-500">{lecture.duration}</span>
                                                        {!lecture.isPreview && <Lock className="w-4 h-4 text-gray-400" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value="instructor" className="space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-6">
                                    <Avatar className="w-24 h-24">
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>JD</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold mb-2">John Doe</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                                            Senior React Developer & Instructor
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Star className="w-4 h-4" />
                                                    <span className="font-semibold">4.7</span>
                                                </div>
                                                <p className="text-sm text-gray-500">Instructor Rating</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Award className="w-4 h-4" />
                                                    <span className="font-semibold">15,234</span>
                                                </div>
                                                <p className="text-sm text-gray-500">Reviews</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Users className="w-4 h-4" />
                                                    <span className="font-semibold">45,678</span>
                                                </div>
                                                <p className="text-sm text-gray-500">Students</p>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Video className="w-4 h-4" />
                                                    <span className="font-semibold">12</span>
                                                </div>
                                                <p className="text-sm text-gray-500">Courses</p>
                                            </div>
                                        </div>
                                        <p className="text-zinc-700 dark:text-gray-300">
                                            I'm a passionate developer with over 10 years of experience in web development. 
                                            I've worked with companies like Google, Facebook, and Microsoft, and now I'm 
                                            dedicated to teaching the next generation of developers.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-2xl font-bold mb-6">Student Reviews</h2>
                                
                                {/* Rating Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-green-600">4.8</div>
                                        <div className="flex justify-center gap-1 my-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                        <p className="text-gray-600">Course Rating</p>
                                    </div>
                                    
                                    <div className="col-span-2 space-y-2">
                                        {[
                                            { stars: 5, percentage: 75 },
                                            { stars: 4, percentage: 15 },
                                            { stars: 3, percentage: 7 },
                                            { stars: 2, percentage: 2 },
                                            { stars: 1, percentage: 1 }
                                        ].map((rating) => (
                                            <div key={rating.stars} className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 w-20">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${
                                                                i < rating.stars
                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                    : 'text-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <Progress value={rating.percentage} className="flex-1" />
                                                <span className="text-sm text-gray-600 w-10">{rating.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Individual Reviews */}
                                <div className="space-y-4">
                                    {[1, 2, 3].map((review) => (
                                        <div key={review} className="border-t pt-4">
                                            <div className="flex items-start gap-4">
                                                <Avatar>
                                                    <AvatarFallback>U{review}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">User {review}</span>
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-gray-500">2 weeks ago</span>
                                                    </div>
                                                    <p className="text-zinc-700 dark:text-gray-300">
                                                        This course is amazing! The instructor explains everything clearly and the 
                                                        projects are really helpful for understanding the concepts.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}