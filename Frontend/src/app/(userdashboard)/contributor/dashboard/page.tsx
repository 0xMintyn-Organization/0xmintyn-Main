"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  Briefcase,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";

interface ContributorStats {
  activeProjects: number;
  completedProjects: number;
  totalEarnings: number;
  pendingEarnings: number;
  applicationsSent: number;
  invitationsReceived: number;
  averageRating: number;
  totalReviews: number;
}

interface ActiveProject {
  _id: string;
  startupName: string;
  startupLogo: string;
  role: string;
  status: string;
  startDate: string;
  milestones: {
    total: number;
    completed: number;
    pending: number;
  };
}

export default function ContributorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContributorStats | null>(null);
  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([]);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role !== "contributor") {
      router.push("/dashboard");
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch contributor stats
      const statsResponse = await axiosInstance.get("/contributor/dashboard/stats");
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch active projects
      const projectsResponse = await axiosInstance.get("/contributor/projects/active");
      if (projectsResponse.data.success) {
        setActiveProjects(projectsResponse.data.projects);
      }

      // Fetch recent applications
      const applicationsResponse = await axiosInstance.get("/contributor/applications?limit=5");
      if (applicationsResponse.data.success) {
        setRecentApplications(applicationsResponse.data.applications);
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <Spinner />
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="w-full px-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Code className="w-8 h-8 text-green-600" />
                  Contributor Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage your projects, applications, and earnings
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/contributor/profile")}
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  My Profile
                </Button>
                <Button
                  onClick={() => router.push("/startups")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Browse Opportunities
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently working
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.totalEarnings?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${stats?.pendingEarnings || 0} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.averageRating?.toFixed(1) || "0.0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalReviews || 0} reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.applicationsSent || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.invitationsReceived || 0} invitations
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Projects</CardTitle>
                    <CardDescription>
                      Projects you're currently working on
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/contributor/projects")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeProjects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active projects</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/startups")}
                    >
                      Browse Opportunities
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeProjects.map((project) => (
                      <div
                        key={project._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() =>
                          router.push(`/contributor/projects/${project._id}`)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                              {project.startupLogo ? (
                                <img
                                  src={project.startupLogo}
                                  alt={project.startupName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Briefcase className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{project.startupName}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {project.role}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              project.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {project.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {project.milestones.completed}/{project.milestones.total} milestones
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Started {new Date(project.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>
                      Your recent job applications and invitations
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/contributor/applications")}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentApplications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No applications yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/startups")}
                    >
                      Browse Startups
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentApplications.map((application) => (
                      <div
                        key={application._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/contributor/applications/${application._id}`
                          )
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">
                              {application.startupName || application.jobTitle}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {application.role}
                            </p>
                          </div>
                          <Badge
                            variant={
                              application.status === "hired"
                                ? "default"
                                : application.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {application.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          {application.status === "invited" && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <AlertCircle className="w-3 h-3" />
                              Invitation received
                            </span>
                          )}
                          {application.status === "applied" && (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <Clock className="w-3 h-3" />
                              Pending review
                            </span>
                          )}
                          {application.status === "hired" && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              Hired
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => router.push("/contributor/settings")}
                >
                  <Code className="w-6 h-6 mb-2" />
                  Profile Settings
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => router.push("/contributor/portfolio")}
                >
                  <Plus className="w-6 h-6 mb-2" />
                  Add Portfolio
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => router.push("/contributor/earnings")}
                >
                  <DollarSign className="w-6 h-6 mb-2" />
                  View Earnings
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => router.push("/startups")}
                >
                  <Briefcase className="w-6 h-6 mb-2" />
                  Find Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Protected>
  );
}
