/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Protected from "@/hooks/useProtected";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MuxPlayer  from '@mux/mux-player-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Play, Clock, Users, Star, Award, BookOpen, Video, FileText, Download, Globe,
  Calendar, CheckCircle, Lock, ShoppingCart, Heart, Share2, BarChart, Target, Shield,
  ChevronDown,
  Edit
} from "lucide-react";
import Spinner from "@/components/Spinner";

export default function CoursePreviewPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [course, setCourse] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [isCourseInstructor, setIsCourseInstructor] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isInstructor, isAdmin } = useRole();
  const courseId = params ? params["courseId"] : undefined;

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}course/${courseId}`,
          { withCredentials: true }
        );
        const result = res.data;

        if (result.success) {
          const data = result.course;

          // Patch paths
          data.demoUrl = `https://appbackend.0xmintyn.com/api/v1/stream/${data.demoUrl?.split("uploads/videos/")[1]}`;
          data.thumbnail = data.thumbnail?.replace("https://appbackend.0xmintyn.com", process.env.NEXT_PUBLIC_SERVER_URI || "");
         

          setCourse(data);
          setExpandedSections(data.courseData?.map((_: any, idx: number) => idx) || []);
          setError("");
          
          // Check if current user is the course instructor
          if (user && data.createdBy && data.createdBy._id === user._id) {
            setIsCourseInstructor(true);
          }
          
          console.log(data);
        } else {
          setError("Unable to fetch course details.");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching course details.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
      checkEnrollment();
      checkBookmarkStatus();
    }
  }, [courseId]);

  const checkEnrollment = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/check/${courseId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setIsEnrolled(response.data.isEnrolled);
      }
    } catch (error) {
      console.error("Error checking enrollment:", error);
    } finally {
      setEnrollmentChecked(true);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/enroll/${courseId}`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Success!",
          description: "You have been enrolled in this course!",
        });
        setIsEnrolled(true);
        // Redirect to course content after enrollment
        router.push(`/courses/${courseId}`);
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast({
        title: "Enrollment Failed",
        description: error.response?.data?.message || "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!courseId) return;
    
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}bookmark/status/${courseId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setIsBookmarked(response.data.isBookmarked);
      }
    } catch (error: any) {
      console.error("Error checking bookmark status:", error);
    }
  };

  const toggleBookmark = async () => {
    if (!courseId || bookmarkLoading) return;
    
    setBookmarkLoading(true);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_SERVER_URI}bookmark/remove/${courseId}`,
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
          { courseId: courseId },
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

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return `${hours > 0 ? hours + "h " : ""}${minutes} mins`;
  };

  if (loading) return <Spinner fullScreen text="Loading course details..." />;
  if (error) return (
    <Protected>
      <div className="p-10 text-center text-red-600">{error}</div>
    </Protected>
  );

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Hero Section */}
      <div className="bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{course?.categories}</span>
                <span>/</span>
                <span>{course?.level}</span>
              </div>

              <h1 className="text-4xl font-bold">{course?.name}</h1>
              <p className="text-lg text-gray-300">{course?.description}</p>

              <div className="flex items-center gap-4 flex-wrap">
                <Badge className="bg-yellow-500 text-black">Bestseller</Badge>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  {course?.averageRating || 0}
                  <span className="text-gray-400">({course?.totalReviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  {course?.students || 0} students
                </div>
              </div>

              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Updated {new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>English</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={course?.createdBy?.avatar} />
                  <AvatarFallback>
                    {course?.createdBy?.firstName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {course?.createdBy?.firstName} {course?.createdBy?.lastName}
                  </p>
                  <p className="text-sm text-gray-400">{course?.createdBy?.username}</p>
                </div>
              </div>
            </div>

            {/* Pricing + Preview */}
            <div>
              <Card className="sticky top-4 bg-white dark:bg-zinc-800">
               <MuxPlayer
  src={course?.demoUrl}
  streamType="on-demand"
  metadata={{
    video_id: courseId,
    video_title: course?.name,
  }}
  autoPlay={false}
  className="w-full aspect-video rounded-lg"
/>

                <CardContent className="p-6 space-y-4">
                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-green-700 dark:text-green-400">${course?.price}</span>
                    <span className="text-xl text-gray-500 line-through">${course?.estimatedPrice}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {Math.round(((course?.estimatedPrice - course?.price) / course?.estimatedPrice) * 100)}% OFF
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {isCourseInstructor || isAdmin() ? (
                      <Button 
                        size="lg" 
                        className="w-full bg-green-600 text-white"
                        onClick={() => router.push(`/instructor/courses/${courseId}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Manage Course
                      </Button>
                    ) : isEnrolled ? (
                      <Button 
                        size="lg" 
                        className="w-full bg-green-600 text-white"
                        onClick={() => router.push(`/courses/${courseId}`)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Enter Course
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        className="w-full bg-green-900 text-white"
                        onClick={handleEnroll}
                        disabled={enrolling || !enrollmentChecked}
                      >
                        {enrolling ? (
                          <>
                            <Spinner />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Enroll Now
                          </>
                        )}
                      </Button>
                    )}
                    
                    {!isCourseInstructor && !isAdmin() && (
                      <Button variant="outline" size="lg" className="w-full border-green-900 text-green-900">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Now
                      </Button>
                    )}

                    {/* Bookmark Button */}
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className={`w-full ${
                        isBookmarked 
                          ? "border-green-500 text-green-500 bg-green-50 dark:bg-green-900/20" 
                          : "border-gray-300 text-gray-600"
                      }`}
                      onClick={toggleBookmark}
                      disabled={bookmarkLoading}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                      {bookmarkLoading ? (
                        <>
                          <Spinner size="sm" inline />
                          <span className="ml-2">Loading...</span>
                        </>
                      ) : isBookmarked ? "Bookmarked" : "Bookmark"}
                    </Button>
                  </div>

                  {/* Wishlist & Share */}
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

                  {/* Features list */}
                  <div className="pt-4 border-t text-sm space-y-3">
                    <h4 className="font-semibold">This course includes:</h4>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-gray-600" />
                      <span>On-demand HD video</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-gray-600" />
                      <span>Downloadable resources</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-600" />
                      <span>Full lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-600" />
                      <span>Certificate of completion</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Tabs defaultValue="overview" className="space-y-12">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="instructor">Instructor</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* What you'll learn */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">What you&apos;ll learn</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course?.benefits?.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {course?.prerequisites?.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Target className="w-5 h-5 text-gray-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Curriculum */}
          <TabsContent value="curriculum" className="space-y-4">
            {course?.courseData?.map((section: any, i: number) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleSection(i)}
                    className="flex justify-between w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-gray-500">{section.videos?.length} lectures</p>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${expandedSections.includes(i) ? "rotate-180" : ""}`}
                    />
                  </button>
                  {expandedSections.includes(i) && (
                    <div className="border-t">
                      {section.videos?.map((video: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <div className="flex items-center gap-3">
                            <Video className="w-4 h-4 text-gray-600" />
                            <span>{video.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{formatDuration(video.videoLength)}</span>
                            <Lock className="w-4 h-4 text-gray-400" />
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
                                        <AvatarImage src={course.createdBy?.avatar} />
                                        <AvatarFallback>JD</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold mb-2">{course.createdBy?.firstName} {course.createdBy?.lastName}</h2>
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
                                            I&apos;m a passionate developer with over 10 years of experience in web development. 
                                            I&apos;ve worked with companies like Google, Facebook, and Microsoft, and now I&apos;m 
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
    </Protected>
  );
}