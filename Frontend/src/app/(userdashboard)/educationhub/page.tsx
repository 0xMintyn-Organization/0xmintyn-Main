/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import axios from "axios"; 
import Protected from "@/hooks/useProtected";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    ChevronDown
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

// Enhanced course categories
const courseCategories = [
    { name: "All", icon: Grid3X3, count: 156 },
    { name: "Technology", icon: BookOpen, count: 45 },
    { name: "Business", icon: TrendingUp, count: 32 },
    { name: "Design", icon: BookOpen, count: 28 },
    { name: "Health", icon: BookOpen, count: 18 },
    { name: "Marketing", icon: BookOpen, count: 22 },
    { name: "Finance", icon: BookOpen, count: 11 },
];

// Sort options
const sortOptions = [
    { label: "Most Popular", value: "popular" },
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Highest Rated", value: "rating" },
];



// Enhanced Education Card Component
function EnhancedEducationCard({ course }: { course: any }) {
    const router = useRouter();
    
    const discountPercentage = Math.round(
        ((course.originalPrice - course.price) / course.originalPrice) * 100
    );

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
                <img
                    src={course.imagePath}
                    alt={course.imageAltText}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {course.isPurchased && (
                    <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Purchased
                    </div>
                )}
                <div className="absolute top-2 left-2 bg-green-900 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {course.level}
                </div>
            </div>
        
            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-white line-clamp-2">
                        {course.title}
                    </h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {course.description}
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
                            ? "bg-gray-500 hover:bg-gray-600" 
                            : "bg-green-900 hover:bg-green-800 text-white"
                        }
                        onClick={() => {
                            if (!course.isPurchased) {
                                // Handle enrollment logic
                                router.push(`/educationhub/${course.id}`);
                            } else {
                                // Navigate to course content
                                router.push(`/courses/${course.id}`);
                            }}}
                    >
                        {course.isPurchased ? "View Course" : "Enroll Now"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function EducationHub() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    
    // Check user role from AuthContext
    const isInstructor = user?.role === 'instructor';
    const isAdmin = user?.role === 'admin';
    
    // Force re-render when user role changes
    useEffect(() => {
        // User role changed, component will re-render
    }, [user?.role]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("popular");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showInstructorModal, setShowInstructorModal] = useState(false);

useEffect(() => {
    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}course`,
                {
                    withCredentials: true
                }
            );
            
            if (res.data.success) {
                const courseData = res.data.courses.map((course: any) => ({
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
                    isPurchased: false, // default, update based on backend user state
                }));

                setCourses(courseData);
                setError("");
            } else {
                setError("Failed to fetch courses");
            }
        } catch (err: any) {
            console.error(err);
            setError("Something went wrong while fetching courses.");
        } finally {
            setLoading(false);
        }
    };

    fetchCourses();
}, []);

    const filteredCourses = courses.filter((course:any) => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return b.id - a.id;
            case "price-asc":
                return a.price - b.price;
            case "price-desc":
                return b.price - a.price;
            case "rating":
                return b.rating - a.rating;
            case "popular":
            default:
                return b.students - a.students;
        }
    });

    return (
        <Protected>
            {loading ? (
                    <Spinner fullScreen text="Loading courses..." />
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
                            </div>
                            
                            {/* Action Buttons */}
                            <div key={user?.role} className="flex gap-3">
                                
                                {isInstructor || isAdmin ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-green-900 text-green-900 hover:bg-green-50 dark:border-green-400 dark:text-green-400"
                                            onClick={() => router.push("/instructor/courses")}
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
                                    placeholder="Search courses by title or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
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
                                            onClick={() => setSortBy(option.value)}
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
                            {courseCategories.map((category) => {
                                const Icon = category.icon;
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
                                        onClick={() => setSelectedCategory(category.name)}
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
                        <p className="text-gray-600 dark:text-gray-400">
                            Showing <span className="font-semibold text-zinc-900 dark:text-white">{sortedCourses.length}</span> courses
                            {selectedCategory !== "All" && (
                                <span> in <span className="font-semibold text-green-900 dark:text-green-400">{selectedCategory}</span></span>
                            )}
                        </p>
                    </div>

                    {/* Course Grid/List */}
                    {sortedCourses.length > 0 ? (
                        <div className={
                            viewMode === "grid" 
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                                : "space-y-4"
                        }>
                            {sortedCourses.map((course) => (
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
                                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                            {course.description}
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
                                                                ? "bg-gray-500 hover:bg-gray-600" 
                                                                : "bg-green-900 hover:bg-green-800 text-white"
                                                            }
                                                            onClick={() => {
                                                                if (!course.isPurchased) {
                                                                    // Handle enrollment logic
                                                                    router.push(`/educationhub/${course.id}`);
                                                                } else {
                                                                    // Navigate to course content
                                                                    router.push(`/courses/${course.id}`);
                                                                }
                                                            }}
                                                        >
                                                            {course.isPurchased ? "View Course" : "Enroll Now"}
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
                                No courses found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Try adjusting your search or filters to find what you're looking for.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSelectedCategory("All");
                                }}
                                className="border-green-900 text-green-900 hover:bg-green-50"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}

                    {/* Stats Section */}
                    {sortedCourses.length > 0 && (
                        <div className="mt-12 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-green-900 dark:text-green-400 mb-4">
                                Platform Statistics
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center">
                                    <BookOpen className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">156</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center">
                                    <Users className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">12.5K</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Students</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center">
                                    <Star className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">4.7</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
                                </div>
                                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 text-center">
                                    <TrendingUp className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">95%</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                                </div>
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
        </Protected>
    );
}

export default EducationHub;