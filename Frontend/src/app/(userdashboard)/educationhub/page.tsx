/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios"; 
import { AllRolesProtected } from "@/components/RoleProtected";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Search, 
    Plus, 
    BookOpen, 
    Filter,
    Grid3X3,
    List,
    TrendingUp,
    Users,
    Clock,
    Star,
    ChevronDown,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    PlayCircle,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import InstructorApplicationModal from "@/components/InstructorApplicationModal";
import { useToast } from "@/hooks/use-toast";

// Interfaces
interface Course {
    id: string;
    title: string;
    description: string;
    imagePath: string;
    imageAltText: string;
    category: string;
    price: number;
    originalPrice: number;
    rating: number;
    students: number;
    duration: string;
    level: string;
    instructor: string;
    isPurchased?: boolean;
    progress?: {
        totalLectures: number;
        completedLectures: number;
        progressPercentage: number;
    };
}

interface EnrolledCourse {
    orderId: string;
    courseId: string;
    courseName: string;
    courseThumbnail: string;
    coursePrice: number;
    instructor: {
        _id: string;
        firstName: string;
        lastName: string;
        username: string;
        avatar: string;
    };
    enrolledAt: string;
    status: string;
}

// Sort options
const sortOptions = [
    { label: "Most Popular", value: "popular" },
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Highest Rated", value: "rating" },
    { label: "Purchased First", value: "purchased" },
];



// Enhanced Education Card Component
function EnhancedEducationCard({ course }: { course: Course }) {
    const router = useRouter();
    
    const discountPercentage = course.originalPrice > course.price 
        ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
        : 0;

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
                <img
                    src={course.imagePath || '/placeholder-course.jpg'}
                    alt={course.imageAltText}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {course.isPurchased && (
                    <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Purchased
                    </div>
                )}
                <div className="absolute top-2 left-2 bg-green-900 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {course.level}
                </div>
                {course.progress && course.progress.progressPercentage > 0 && (
                    <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
                            <div className="flex items-center justify-between text-white text-xs mb-1">
                                <span>Progress</span>
                                <span>{course.progress.progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-1">
                                <div 
                                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                                    style={{ width: `${course.progress.progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-white line-clamp-2">
                        {course.title}
                    </h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {course.description?.length > 100 ? `${course.description.substring(0, 100)}...` : course.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students.toLocaleString()}</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">{course.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">by {course.instructor}</span>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                            ${course.price}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                            ${course.originalPrice}
                        </span>
                        <Badge className="bg-green-100 text-green-800 border-0">
                            {discountPercentage}% OFF
                        </Badge>
                    </div>
                    <Button 
                        size="sm" 
                        className={course.isPurchased 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "bg-green-900 hover:bg-green-800 text-white"
                        }
                        onClick={() => {
                            if (course.isPurchased) {
                                router.push(`/educationhub/${course.id}`);
                            } else {
                                router.push(`/educationhub/${course.id}`);
                            }
                        }}
                    >
                        {course.isPurchased ? (
                            <>
                                <PlayCircle className="w-4 h-4 mr-1" />
                                Continue Learning
                            </>
                        ) : (
                            "Enroll Now"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EducationHub() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { toast } = useToast();
    
    // Check user role from AuthContext
    const isInstructor = user?.role === 'instructor';
    const isAdmin = user?.role === 'admin';
    
    // State management
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showInstructorModal, setShowInstructorModal] = useState(false);
    const [categories, setCategories] = useState<{name: string, count: number}[]>([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [coursesPerPage] = useState(12);

    // Fetch all courses
    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}course`, {
                withCredentials: true
            });
            
            if (res.data.success) {
                const courseData: Course[] = res.data.courses.map((course: any) => ({
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    imagePath: course.imagePath,
                    imageAltText: course.imageAltText,
                    category: course.category,
                    price: course.price,
                    originalPrice: course.originalPrice,
                    rating: course.rating,
                    students: course.students,
                    duration: course.duration,
                    level: course.level,
                    instructor: course.instructor,
                    isPurchased: false, // Will be updated after fetching enrolled courses
                }));

                setCourses(courseData);
                setError("");
                
                // Generate dynamic categories
                const categoryMap = new Map<string, number>();
                courseData.forEach(course => {
                    const category = course.category || 'Uncategorized';
                    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
                });
                
                const dynamicCategories = [
                    { name: "All", count: courseData.length },
                    ...Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }))
                ];
                setCategories(dynamicCategories);
                
            } else {
                setError("Failed to fetch courses");
            }
        } catch (err: any) {
            console.error("Error fetching courses:", err);
            setError("Something went wrong while fetching courses.");
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch user's enrolled courses
    const fetchEnrolledCourses = useCallback(async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}enrollment/my-courses`, {
                withCredentials: true
            });
            
            if (response.data.success) {
                const enrolledData: EnrolledCourse[] = response.data.courses;
                setEnrolledCourses(enrolledData);
                
                // Update courses with purchased status
                setCourses(prevCourses => 
                    prevCourses.map(course => {
                        const enrolledCourse = enrolledData.find(ec => ec.courseId === course.id);
                        return {
                            ...course,
                            isPurchased: !!enrolledCourse,
                            progress: enrolledCourse?.progress
                        };
                    })
                );
            }
        } catch (err: any) {
            console.error("Error fetching enrolled courses:", err);
            // Don't show error for enrolled courses as it's not critical
        }
    }, []);

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            await fetchCourses();
            await fetchEnrolledCourses();
        };
        
        fetchData();
    }, [fetchCourses, fetchEnrolledCourses]);

    // Search and filter handlers
    const handleSearch = useCallback((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page when searching
    }, []);

    const handleCategoryChange = useCallback((category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1); // Reset to first page when changing category
    }, []);

    const handleSortChange = useCallback((sort: string) => {
        setSortBy(sort);
        setCurrentPage(1); // Reset to first page when changing sort
    }, []);

    // Pagination handlers
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Refresh data function
    const handleRefresh = useCallback(async () => {
        await fetchCourses();
        await fetchEnrolledCourses();
        toast({
            title: "Success",
            description: "Courses refreshed successfully!",
        });
    }, [fetchCourses, fetchEnrolledCourses, toast]);

    // Clear filters function
    const clearFilters = useCallback(() => {
        setSearchTerm("");
        setSelectedCategory("All");
        setSortBy("newest");
        setCurrentPage(1);
    }, []);

    // Filter and sort courses
    const filteredCourses = courses.filter((course: Course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortBy) {
            case "newest":
                // Keep the original order from backend (already sorted by createdAt: -1)
                return 0;
            case "price-asc":
                return a.price - b.price;
            case "price-desc":
                return b.price - a.price;
            case "rating":
                return b.rating - a.rating;
            case "purchased":
                if (a.isPurchased && !b.isPurchased) return -1;
                if (!a.isPurchased && b.isPurchased) return 1;
                return 0;
            case "popular":
                return b.students - a.students;
            default:
                // Default to newest (backend order)
                return 0;
        }
    });

    // Paginate courses
    const startIndex = (currentPage - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const paginatedCourses = sortedCourses.slice(startIndex, endIndex);
    const totalPages = Math.ceil(sortedCourses.length / coursesPerPage);

    return (
        <AllRolesProtected>
            {loading ? (
                <Spinner fullScreen text="Loading courses..." />
            ) : error ? (
                <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                            Error Loading Courses
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {error}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={handleRefresh}
                                className="bg-green-900 hover:bg-green-800 text-white"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push("/dashboard")}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
                {/* Header Section */}
                <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                                    Course Marketplace
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Discover courses to advance your skills and career
                                </p>
                                {enrolledCourses.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-sm text-green-600 font-medium">
                                            {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} purchased
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleRefresh}
                                    className="border-gray-300 hover:border-green-900 hover:text-green-900"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Refresh
                                </Button>
                                
                                {isInstructor || isAdmin ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-green-900 text-green-900 hover:bg-green-50 dark:border-green-400 dark:text-green-400"
                                            onClick={() => router.push("/instructor/my_courses")}
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            My Courses
                                        </Button>
                                        <Button
                                            className="bg-green-900 hover:bg-green-800 text-white"
                                            onClick={() => router.push("/create-course")}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Course
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        className="bg-green-900 hover:bg-green-800 text-white"
                                        onClick={() => setShowInstructorModal(true)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Become Instructor
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* Search and Filters Bar */}
                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-4 mb-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <Input
                                    type="text"
                                    placeholder="Search courses by title, description, or instructor..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10 h-11"
                                />
                            </div>
                            
                            {/* Sort Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-11 min-w-[180px] justify-between">
                                        <span className="flex items-center gap-2">
                                            <Filter className="w-4 h-4" />
                                            {sortOptions.find(opt => opt.value === sortBy)?.label}
                                        </span>
                                        <ChevronDown className="w-4 h-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[180px]">
                                    {sortOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.value}
                                            onClick={() => handleSortChange(option.value)}
                                            className={sortBy === option.value ? "bg-green-50 text-green-900" : ""}
                                        >
                                            {option.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            {/* View Mode Toggle */}
                            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-700 p-1 rounded-lg">
                                <Button
                                    size="sm"
                                    variant={viewMode === "grid" ? "default" : "ghost"}
                                    className={viewMode === "grid" 
                                        ? "bg-green-900 hover:bg-green-800 text-white" 
                                        : "hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }
                                    onClick={() => setViewMode("grid")}
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    className={viewMode === "list" 
                                        ? "bg-green-900 hover:bg-green-800 text-white" 
                                        : "hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                                        {/* Category Pills */}
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                            {categories.map((category) => {
                                const Icon = category.name === "All" ? Grid3X3 : BookOpen;
                                return (
                                    <Button
                                        key={category.name}
                                        variant={selectedCategory === category.name ? "default" : "outline"}
                                        size="sm"
                                        className={
                                            selectedCategory === category.name
                                                ? "bg-green-900 hover:bg-green-800 text-white"
                                                : "border-gray-300 hover:border-green-900 hover:text-green-900"
                                        }
                                        onClick={() => handleCategoryChange(category.name)}
                                    >
                                        <Icon className="w-4 h-4 mr-1" />
                                        {category.name}
                                        <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">
                                            {category.count}
                                        </Badge>
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Showing <span className="font-semibold text-zinc-900 dark:text-white">{paginatedCourses.length}</span> of <span className="font-semibold text-zinc-900 dark:text-white">{sortedCourses.length}</span> courses
                                {selectedCategory !== "All" && (
                                    <span> in <span className="font-semibold text-green-900 dark:text-green-400">{selectedCategory}</span></span>
                                )}
                            </p>
                            {(searchTerm || selectedCategory !== "All" || sortBy !== "newest") && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-xs"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{sortedCourses.filter(c => c.isPurchased).length} purchased</span>
                            <span>•</span>
                            <span>{sortedCourses.filter(c => !c.isPurchased).length} available</span>
                        </div>
                    </div>

                    {/* Course Grid/List */}
                    {paginatedCourses.length > 0 ? (
                        <div className={
                            viewMode === "grid" 
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                                : "space-y-4"
                        }>
                            {paginatedCourses.map((course) => (
                                viewMode === "grid" ? (
                                    <EnhancedEducationCard key={course.id} course={course} />
                                ) : (
                                    // List View
                                    <div key={course.id} className="bg-white dark:bg-zinc-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4">
                                        <div className="flex gap-4">
                                            <img
                                                src={course.imagePath}
                                                alt={course.imageAltText}
                                                className="w-48 h-32 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                                            {course.title}
                                                        </h3>
                                                        <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                            {course.description?.length > 120 ? `${course.description.substring(0, 120)}...` : course.description}
                                                        </p>
                                                    </div>
                                                    {course.isPurchased && (
                                                        <Badge className="bg-green-100 text-green-800 border-0">
                                                            Purchased
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                    <div className="flex items-center gap-6 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                            <span className="font-semibold">{course.rating}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            <span>{course.duration}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            <span>{course.students.toLocaleString()} students</span>
                                                        </div>
                                                        {course.progress && course.progress.progressPercentage > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <TrendingUp className="w-4 h-4" />
                                                                <span>{course.progress.progressPercentage}% complete</span>
                                                            </div>
                                                        )}
                                                        <Badge variant="outline">{course.level}</Badge>
                                                    </div>
                                                
                                                <div className="flex items-center justify-between mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-500">by {course.instructor}</span>
                                                        <Badge variant="secondary">{course.category}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                                                                ${course.price}
                                                            </span>
                                                            <span className="text-sm text-gray-500 line-through">
                                                                ${course.originalPrice}
                                                            </span>
                                                        </div>
                                                        <Button 
                                                            className={course.isPurchased 
                                                                ? "bg-green-600 hover:bg-green-700 text-white" 
                                                                : "bg-green-900 hover:bg-green-800 text-white"
                                                            }
                                                            onClick={() => {
                                                                if (course.isPurchased) {
                                                                    router.push(`/courses/${course.id}`);
                                                                } else {
                                                                    router.push(`/educationhub/${course.id}`);
                                                                }
                                                            }}
                                                        >
                                                            {course.isPurchased ? (
                                                                <>
                                                                    <PlayCircle className="w-4 h-4 mr-1" />
                                                                    Continue Learning
                                                                </>
                                                            ) : (
                                                                "Enroll Now"
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                                {courses.length === 0 ? "No courses available" : "No courses found"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {courses.length === 0 
                                    ? "There are no courses available at the moment. Check back later!"
                                    : "Try adjusting your search or filters to find what you're looking for."
                                }
                            </p>
                            {courses.length > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="border-green-900 text-green-900 hover:bg-green-50"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center mt-8 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(pageNum)}
                                            className={currentPage === pageNum ? "bg-green-900 hover:bg-green-800 text-white" : ""}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-1"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Stats Section */}
                    {courses.length > 0 && (
                        <div className="mt-12 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-green-900 dark:text-green-400 mb-4">
                                Platform Statistics
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <BookOpen className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{courses.length}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <CheckCircle className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">{enrolledCourses.length}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Your Purchases</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <Star className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                            {courses.length > 0 
                                                ? (courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length).toFixed(1)
                                                : '0.0'
                                            }
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <TrendingUp className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                            {courses.length > 0 
                                                ? Math.round((enrolledCourses.length / courses.length) * 100)
                                                : 0
                                            }%
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Rate</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>)}
            
            {/* Instructor Application Modal */}
            <InstructorApplicationModal
                isOpen={showInstructorModal}
                onClose={() => setShowInstructorModal(false)}
            />
        </AllRolesProtected>
    );
}

export default EducationHub;