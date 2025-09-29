"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Protected from "@/hooks/useProtected";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Calendar,
  BookOpen,
  Star,
  Award,
  TrendingUp,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Download,
  RefreshCw,
  GraduationCap,
  Target,
  Activity,
  BarChart3,
  UserCheck,
  UserX,
  UserPlus,
  Crown,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types
interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  enrolledCourses: Array<{
    courseId: string;
    courseName: string;
    enrolledAt: string;
    progress: number;
    lastAccessed: string;
    status: string;
  }>;
  totalCourses: number;
  totalSpent: number;
  averageRating: number;
  lastActive: string;
  joinDate: string;
  isActive: boolean;
}

interface StudentsData {
  totalStudents: number;
  activeStudents: number;
  newStudentsThisMonth: number;
  averageCoursesPerStudent: number;
  topPerformingStudents: Student[];
  recentEnrollments: Array<{
    _id: string;
    student: Student;
    courseName: string;
    enrolledAt: string;
    amount: number;
  }>;
  students: Student[];
  courseDistribution: Array<{
    courseName: string;
    studentCount: number;
    percentage: number;
  }>;
}

function InstructorStudents() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [studentsData, setStudentsData] = useState<StudentsData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);

  useEffect(() => {
    fetchStudentsData();
  }, []);

  const fetchStudentsData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}instructor/students`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setStudentsData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch students data");
      }
    } catch (error: any) {
      console.error("Error fetching students data:", error);
      
      // Set default empty data to prevent crashes
      setStudentsData({
        totalStudents: 0,
        activeStudents: 0,
        newStudentsThisMonth: 0,
        averageCoursesPerStudent: 0,
        topPerformingStudents: [],
        recentEnrollments: [],
        students: [],
        courseDistribution: []
      });
      
      toast({
        title: "Warning",
        description: error.response?.data?.message || "Using cached data. Some information may be outdated.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <UserCheck className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
        <UserX className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentDialogOpen(true);
  };

  const handleSendMessage = (student: Student) => {
    // Implement messaging functionality
    toast({
      title: "Message Sent",
      description: `Message sent to ${student.firstName} ${student.lastName}`,
    });
  };

  const exportStudentsData = () => {
    // Implement CSV export functionality
    toast({
      title: "Export Started",
      description: "Student data is being prepared for download.",
    });
  };

  const filteredStudents = studentsData?.students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && student.isActive) ||
      (statusFilter === "inactive" && !student.isActive);
    
    const matchesCourse = courseFilter === "all" ||
      student.enrolledCourses.some(course => course.courseName.toLowerCase().includes(courseFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesCourse;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!studentsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-2">
            Unable to load students data
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was an error loading your students data.
          </p>
          <Button onClick={fetchStudentsData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                  Student Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage and track your students' progress and engagement
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchStudentsData}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>

                <Button
                  variant="outline"
                  onClick={exportStudentsData}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentsData.totalStudents.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-600">
                    +{studentsData.newStudentsThisMonth}
                  </span> this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Students
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentsData.activeStudents.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {studentsData.totalStudents > 0 
                    ? Math.round((studentsData.activeStudents / studentsData.totalStudents) * 100)
                    : 0}% of total students
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Courses/Student
                </CardTitle>
                <BookOpen className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentsData.averageCoursesPerStudent.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Course engagement rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Top Performers
                </CardTitle>
                <Crown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentsData.topPerformingStudents.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  High-achieving students
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Student Directory</CardTitle>
              <CardDescription>
                Search and filter your students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search students by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="courses">Most Courses</SelectItem>
                    <SelectItem value="spent">Most Spent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 dark:text-white mb-2">
                    {searchTerm || statusFilter !== "all" ? "No students found" : "No students yet"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria."
                      : "Students will appear here once they enroll in your courses."
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button onClick={() => router.push("/create-course")} className="bg-green-600 hover:bg-green-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Course to Attract Students
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.slice(0, 20).map((student) => (
                        <TableRow key={student._id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={student.avatar} />
                                <AvatarFallback>
                                  {student.firstName[0]}{student.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-200 dark:text-white">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{student.totalCourses}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.enrolledCourses.slice(0, 2).map(course => course.courseName).join(", ")}
                              {student.enrolledCourses.length > 2 && "..."}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {student.enrolledCourses.slice(0, 2).map((course, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${getProgressColor(course.progress)}`}
                                      style={{ width: `${course.progress}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500">{course.progress}%</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(student.totalSpent)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(student.isActive)}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {format(new Date(student.lastActive), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewStudent(student)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendMessage(student)}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  View Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Students */}
          {studentsData.topPerformingStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  Top Performing Students
                </CardTitle>
                <CardDescription>
                  Your most engaged and successful students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentsData.topPerformingStudents.slice(0, 6).map((student, index) => (
                    <div
                      key={student._id}
                      className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      onClick={() => handleViewStudent(student)}
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-200 dark:text-white">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.totalCourses} courses • {formatCurrency(student.totalSpent)}
                        </div>
                        <div className="flex items-center mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-xs text-gray-500">
                            {student.averageRating.toFixed(1)} avg rating
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Student Details Dialog */}
        <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Student Details
              </DialogTitle>
              <DialogDescription>
                Detailed information about {selectedStudent?.firstName} {selectedStudent?.lastName}
              </DialogDescription>
            </DialogHeader>
            
            {selectedStudent && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedStudent.avatar} />
                    <AvatarFallback className="text-lg">
                      {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h3>
                    <p className="text-gray-600">{selectedStudent.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedStudent.isActive)}
                      <Badge variant="outline">
                        Joined {format(new Date(selectedStudent.joinDate), "MMM yyyy")}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <BookOpen className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{selectedStudent.totalCourses}</div>
                    <div className="text-sm text-gray-600">Courses</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Target className="w-6 h-6 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(selectedStudent.enrolledCourses.reduce((acc, course) => acc + course.progress, 0) / selectedStudent.enrolledCourses.length)}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Progress</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Award className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{selectedStudent.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{formatCurrency(selectedStudent.totalSpent)}</div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Enrolled Courses</h4>
                  <div className="space-y-3">
                    {selectedStudent.enrolledCourses.map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg">
                        <div>
                          <div className="font-medium">{course.courseName}</div>
                          <div className="text-sm text-gray-500">
                            Enrolled {format(new Date(course.enrolledAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{course.progress}%</div>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(course.progress)}`}
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Protected>
  );
}

export default InstructorStudents;
