"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  BarChart3,
  Crown,
  GraduationCap,
  TrendingUp,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import roleService from "@/services/roleService";
import EnhancedDashboard from "./EnhancedDashboard";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";

interface DashboardData {
  totalUsers?: number;
  totalInstructors?: number;
  totalAdmins?: number;
  totalCourses?: number;
  recentUsers?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
  recentCourses?: Array<{
    _id: string;
    name: string;
    createdBy: string;
  }>;
}

export default function RoleBasedDashboard() {
  const { user, isAdmin, isInstructor, isUser } = useRole();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  
  // Load user data on component mount
  const { isLoading: userLoading } = useLoadUserQuery(undefined, {
    skip: false, // Always try to load user data
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await roleService.getRoleDashboard();
      if (response.success) {
        setDashboardData(response.dashboard);
      }
    } catch (error: unknown) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Show loading while user data is being loaded
  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Only admin gets a different dashboard
  if (isAdmin()) {
    return <AdminDashboard data={dashboardData} />;
  }

  // Route contributors to their specific dashboard
  if (user?.role === 'contributor') {
    router.push('/contributor/dashboard');
    return null;
  }

  // Route startups to their specific dashboard
  if (user?.role === 'startup') {
    router.push('/startup/dashboard');
    return null;
  }

  // All other roles (user and instructor) get the same unified dashboard
  return <EnhancedDashboard />;
}

// Admin Dashboard Component
function AdminDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Platform overview and user management
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/admin")}>
            <Crown className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="outline" onClick={() => router.push("/analytics")}>
            <BarChart3 className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalInstructors || 0}</div>
            <p className="text-xs text-muted-foreground">Course creators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalAdmins || 0}</div>
            <p className="text-xs text-muted-foreground">Administrators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push("/admin")}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => router.push("/analytics")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentUsers?.slice(0, 3).map((user) => (
                <div key={user._id} className="flex items-center justify-between text-sm">
                  <span>{user.firstName} {user.lastName}</span>
                  <span className="text-gray-500">{user.role}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

