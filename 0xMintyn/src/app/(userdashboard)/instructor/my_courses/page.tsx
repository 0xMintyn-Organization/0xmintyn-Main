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
    Edit,
    Trash2,
    Eye,
    MoreVertical,
    Filter,
    Download,
    TrendingUp,
    Users,
    DollarSign,
    BookOpen,
    ChevronDown,
    Calendar,
    Clock,
    Star,
    AlertCircle,
    CheckCircle2,
    XCircle,
    BarChart3
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";



// Sort options
const sortOptions = [
    { label: "Newest First", value: "newest" },
    { label: "Oldest First", value: "oldest" },
    { label: "Most Students", value: "students" },
    { label: "Highest Revenue", value: "revenue" },
    { label: "Best Rated", value: "rating" },
];

// Dummy data for courses
const dummyCourses = [
    {
        id: 1,
        title: "Complete Web Development Bootcamp 2024",
        description: "Learn HTML, CSS, JavaScript, React, Node.js and more",
        category: "Technology",
        price: 89.99,
        originalPrice: 199.99,
        rating: 4.8,
        students: 1234,
        duration: "42 hours",
        level: "Beginner",
        status: "published",
        createdAt: "2024-01-15",
        updatedAt: "2024-03-10",
        totalLessons: 156,
        enrollmentsThisMonth: 45,
    },
    {
        id: 2,
        title: "Advanced React Patterns and Best Practices",
        description: "Master advanced React concepts and patterns",
        category: "Technology",
        price: 129.99,
        originalPrice: 249.99,
        rating: 4.9,
        students: 856,
        duration: "28 hours",
        level: "Advanced",
        status: "published",
        createdAt: "2024-02-20",
        updatedAt: "2024-03-12",
        totalLessons: 98,
        enrollmentsThisMonth: 32,
    },
    {
        id: 3,
        title: "UI/UX Design Fundamentals",
        description: "Learn the principles of great user interface and experience design",
        category: "Design",
        price: 79.99,
        originalPrice: 149.99,
        rating: 4.7,
        students: 567,
        duration: "24 hours",
        level: "Beginner",
        status: "draft",
        createdAt: "2024-03-01",
        updatedAt: "2024-03-14",
        totalLessons: 72,
        enrollmentsThisMonth: 0,
    },
    {
        id: 4,
        title: "Digital Marketing Masterclass",
        description: "Complete guide to digital marketing strategies",
        category: "Marketing",
        price: 99.99,
        originalPrice: 199.99,
        rating: 4.6,
        students: 2341,
        duration: "36 hours",
        level: "Intermediate",
        status: "published",
        createdAt: "2023-12-10",
        updatedAt: "2024-02-28",
        totalLessons: 124,
        enrollmentsThisMonth: 78,
    },
    {
        id: 5,
        title: "Python for Data Science",
        description: "Learn Python programming for data analysis and machine learning",
        category: "Technology",
        price: 119.99,
        originalPrice: 259.99,
        rating: 4.8,
        students: 1876,
        duration: "48 hours",
        level: "Intermediate",
        status: "archived",
        createdAt: "2023-10-05",
        updatedAt: "2024-01-20",
        totalLessons: 186,
        enrollmentsThisMonth: 0,
    },
];

function InstructorCourses() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<any>(null);

    // Statistics calculation
    const stats = {
        totalCourses: courses.length,
        totalStudents: courses.reduce((sum, course) => sum + course.students, 0),
        totalRevenue: courses.reduce((sum, course) => sum + course.revenue, 0),
        averageRating: courses.length > 0 
            ? (courses.reduce((sum, course) => sum + course.rating, 0) / courses.length).toFixed(1)
            : 0,
        publishedCourses: courses.filter(course => course.status === "published").length,
        draftCourses: courses.filter(course => course.status === "draft").length,
    };

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                // Simulating API call with dummy data
                setTimeout(() => {
                    setCourses(dummyCourses);
                    setError("");
                    setLoading(false);
                }, 1000);

                // Actual API call (commented out for now)
                /*
                const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}instructor/courses`, {
                    withCredentials: true
                });
                
                if (res.data.success) {
                    setCourses(res.data.courses);
                    setError("");
                } else {
                    setError("Failed to fetch courses");
                }
                */
            } catch (err: any) {
                console.error(err);
                setError("Something went wrong while fetching courses.");
            } finally {
                // setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const handleDeleteCourse = async (courseId: number) => {
        try {
            // Simulating API call
            console.log("Deleting course:", courseId);
            
            // Actual API call (commented out for now)
            /*
            const res = await axios.delete(`${process.env.NEXT_PUBLIC_SERVER_URI}course/${courseId}`, {
                withCredentials: true
            });
            
            if (res.data.success) {
                setCourses(courses.filter(course => course.id !== courseId));
            }
            */
            
            // For demo, just remove from state
            setCourses(courses.filter(course => course.id !== courseId));
            setDeleteDialogOpen(false);
            setCourseToDelete(null);
        } catch (err) {
            console.error("Error deleting course:", err);
        }
    };

    const filteredCourses = courses.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || course.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortBy) {
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "students":
                return b.students - a.students;
            case "revenue":
                return b.revenue - a.revenue;
            case "rating":
                return b.rating - a.rating;
            case "newest":
            default:
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "published":
                return <CheckCircle2 className="w-4 h-4" />;
            case "draft":
                return <AlertCircle className="w-4 h-4" />;
            case "archived":
                return <XCircle className="w-4 h-4" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "published":
                return "bg-green-100 text-green-800 border-green-200";
            case "draft":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "archived":
                return "bg-gray-100 text-gray-800 border-gray-200";
            default:
                return "";
        }
    };

    return (
        <Protected>
            {loading ? (
                <Spinner />
            ) : (
                <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
                    {/* Header Section */}
                    <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                        <div className="max-w-7xl mx-auto px-4 py-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                                        My Courses
                                    </h1>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                                        Manage and track your course performance
                                    </p>
                                </div>
                                
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="border-green-900 text-green-900 hover:bg-green-50 dark:border-green-400 dark:text-green-400"
                                        onClick={() => router.push("/instructor/analytics")}
                                    >
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        Analytics
                                    </Button>
                                    <Button
                                        className="bg-green-900 hover:bg-green-800 text-white"
                                        onClick={() => router.push("/create-course")}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create New Course
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="max-w-7xl mx-auto px-4 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                            {stats.totalCourses}
                                        </p>
                                       
                                    </div>
                                    <BookOpen className="w-8 h-8 text-green-600" />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                            {stats.totalStudents.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-green-600 mt-1 flex items-center">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                            +12% this month
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                            ${stats.totalRevenue.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-green-600 mt-1 flex items-center">
                                            <TrendingUp className="w-3 h-3 mr-1" />
                                                                                        +8% this month
                                        </p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-green-600" />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                            {stats.averageRating}
                                        </p>
                                        <div className="flex items-center mt-1">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            <Star className="w-3 h-3 text-gray-300" />
                                        </div>
                                    </div>
                                    <Star className="w-8 h-8 text-yellow-500" />
                                </div>
                            </div>
                        </div>

                        {/* Filters and Search */}
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
                                        <Button variant="outline" className="h-11 min-w-[160px] justify-between">
                                            <span className="flex items-center gap-2">
                                                Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}
                                            </span>
                                            <ChevronDown className="w-4 h-4 ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[160px]">
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

                             
                            </div>
                        </div>

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        {/* Courses Table */}
                        {sortedCourses.length > 0 ? (
                            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b border-gray-200 dark:border-zinc-700">
                                            <TableHead className="w-[40%]">Course</TableHead>
                                            <TableHead className="text-center">Students</TableHead>
                                            <TableHead className="text-center">Rating</TableHead>
                                            <TableHead className="text-center">Last Updated</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedCourses.map((course) => (
                                            <TableRow 
                                                key={course.id} 
                                                className="border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                       
                                                        <div>
                                                            <h3 className="font-semibold text-zinc-900 dark:text-white">
                                                                {course.title}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                                                {course.description}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {course.duration}
                                                                </span>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {course.category}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {course.level}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                              
                                                <TableCell className="text-center">
                                                    <div>
                                                        <p className="font-semibold">{course.students.toLocaleString()}</p>
                                                        <p className="text-xs text-gray-500">
                                                            +{course.enrollmentsThisMonth} this month
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="font-semibold">{course.rating}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="text-sm">
                                                        <p>{new Date(course.updatedAt).toLocaleDateString()}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Created {new Date(course.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => router.push(`/courses/${course.id}`)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Course
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => router.push(`/instructor/courses/${course.id}/edit`)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="w-4 h-4 mr-2" />
                                                                Edit Course
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setCourseToDelete(course);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                className="cursor-pointer text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Delete Course
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            // Empty State
                            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-12 text-center">
                                <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                                    No courses found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    {searchTerm || statusFilter !== "all" 
                                        ? "Try adjusting your filters to find courses."
                                        : "Start creating your first course to share your knowledge with students."}
                                </p>
                                {searchTerm || statusFilter !== "all" ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStatusFilter("all");
                                        }}
                                        className="border-green-900 text-green-900 hover:bg-green-50"
                                    >
                                        Clear Filters
                                    </Button>
                                ) : (
                                    <Button
                                        className="bg-green-900 hover:bg-green-800 text-white"
                                        onClick={() => router.push("/create-course")}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Your First Course
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Course</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete &quot;{courseToDelete?.title}&quot;? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setDeleteDialogOpen(false);
                                            setCourseToDelete(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleDeleteCourse(courseToDelete?.id)}
                                    >
                                        Delete Course
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            )}
        </Protected>
    );
}

export default InstructorCourses;