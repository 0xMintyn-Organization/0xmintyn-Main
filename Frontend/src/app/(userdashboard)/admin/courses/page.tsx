"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AdminProtected } from "@/components/RoleProtected";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  DollarSign,
  Clock,
  Star,
  Filter,
  Grid,
  List,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  GraduationCap,
  BarChart3,
  Settings,
  Plus,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";

interface Course {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  level: string;
  duration: string;
  thumbnail: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  courseData: Array<{
    videos: Array<{
      _id: string;
      title: string;
      duration: string;
    }>;
  }>;
  enrolledStudents: number;
  totalRevenue: number;
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
}

interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  pendingCourses: number;
  totalRevenue: number;
  totalStudents: number;
  averageRating: number;
}

export default function AdminCourseManagement() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalCourses: 0,
    activeCourses: 0,
    pendingCourses: 0,
    totalRevenue: 0,
    totalStudents: 0,
    averageRating: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, statusFilter, categoryFilter, levelFilter, searchTerm]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (levelFilter !== "all") {
        params.append("level", levelFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}course/admin/all?${params}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setCourses(response.data.courses);
        setCourseStats(response.data.stats);
        setTotalPages(response.data.pagination.totalPages);
        setCategories(response.data.categories || []);
        setLevels(response.data.levels || []);
      }
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (course: Course) => {
    setSelectedCourse(course);
    setNewStatus(course.status);
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedCourse) return;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_URI}course/admin/${selectedCourse._id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Course status updated successfully!",
        });
        fetchCourses();
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setStatusDialogOpen(false);
      setSelectedCourse(null);
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_URI}course/admin/${selectedCourse._id}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Course deleted successfully!",
        });
        fetchCourses();
      }
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete course",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'inactive':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case 'pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case 'rejected':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-zinc-900 dark:text-gray-300";
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'intermediate':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case 'advanced':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-zinc-900 dark:text-gray-300";
    }
  };

  const formatDuration = (duration: string) => {
    if (!duration) return "N/A";
    return duration;
  };

  const calculateTotalLectures = (courseData: any[]) => {
    return courseData.reduce((total, section) => total + (section.videos?.length || 0), 0);
  };

  if (loading) {
    return <Spinner fullScreen text="Loading course management..." />;
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="w-full px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 dark:text-white">
                  Course Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage all courses on the platform
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={fetchCourses}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button
                  onClick={() => router.push("/create-course")}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courseStats.totalCourses}</div>
                <p className="text-xs text-muted-foreground">
                  {courseStats.activeCourses} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(courseStats.totalStudents || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Enrolled across all courses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(courseStats.totalRevenue || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  From course sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(courseStats.averageRating || 0).toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Out of 5 stars
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2 flex-wrap">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Courses Content */}
          {viewMode === "list" ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                              {course.thumbnail ? (
                                <img
                                  src={course.thumbnail}
                                  alt={course.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{course.name}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {calculateTotalLectures(course.courseData)} lectures • {formatDuration(course.duration)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {course.createdBy.firstName} {course.createdBy.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{course.createdBy.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {course.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getLevelBadgeColor(course.level)}`}>
                            {course.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{course.enrolledStudents || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">${course.totalRevenue || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">{(course.rating || 0).toFixed(1)}</span>
                            <span className="text-xs text-gray-500">({course.reviews || 0})</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getStatusBadgeColor(course.status)}`}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{new Date(course.createdAt).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/courses/${course._id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Course
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/instructor/courses/${course._id}/edit`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Course
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(course)}>
                                <Settings className="w-4 h-4 mr-2" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCourse(course)}
                                className="text-red-600"
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
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course._id} className="group hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <Badge className={`text-xs ${getStatusBadgeColor(course.status)}`}>
                          {course.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                        <Badge className={`text-xs ${getLevelBadgeColor(course.level)}`}>
                          {course.level}
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {course.name}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.enrolledStudents || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {(course.rating || 0).toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(course.duration)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {course.createdBy.firstName} {course.createdBy.lastName}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-green-600">
                          ${course.price || 0}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/courses/${course._id}`)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(course)}
                          className="flex-1"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Status
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}

          {/* Status Change Dialog */}
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Course Status</DialogTitle>
                <DialogDescription>
                  Change the status for "{selectedCourse?.name}"
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmStatusChange}>
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Course Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Course</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedCourse?.name}"? This action cannot be undone and will affect all enrolled students.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteCourse}>
                  Delete Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminProtected>
  );
}
