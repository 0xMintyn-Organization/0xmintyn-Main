"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";

interface StartupStats {
  totalFunding: number;
  currentBalance: number;
  activeMilestones: number;
  completedMilestones: number;
  teamSize: number;
  pendingApplications: number;
  fundingStatus: string;
}

interface TeamMember {
  _id: string;
  contributorName: string;
  contributorAvatar: string;
  role: string;
  status: string;
  joinedDate: string;
}

interface ActiveMilestone {
  _id: string;
  title: string;
  fundingAmount: number;
  dueDate: string;
  status: string;
  assignedContributors: number;
}

export default function StartupDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StartupStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeMilestones, setActiveMilestones] = useState<ActiveMilestone[]>([]);

  useEffect(() => {
    if (user?.role !== "startup") {
      router.push("/dashboard");
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch startup stats
      const statsResponse = await axiosInstance.get("/startup/dashboard/stats");
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }

      // Fetch team members
      const teamResponse = await axiosInstance.get("/startup/team");
      if (teamResponse.data.success) {
        setTeamMembers(teamResponse.data.teamMembers);
      }

      // Fetch active milestones (placeholder - milestone model not yet created)
      // const milestonesResponse = await axiosInstance.get("/startup/milestones?status=active");
      // if (milestonesResponse.data.success) {
      //   setActiveMilestones(milestonesResponse.data.milestones);
      // }
      setActiveMilestones([]); // Placeholder until milestone model is created
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
                  <Rocket className="w-8 h-8 text-purple-600" />
                  Startup Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage your funding, team, and milestones
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/startup/profile")}
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  My Profile
                </Button>
                <Button
                  onClick={() => router.push("/contributors")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Hire Contributors
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.totalFunding?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${stats?.currentBalance?.toLocaleString() || "0"} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.teamSize || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingApplications || 0} pending applications
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Milestones</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeMilestones || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.completedMilestones || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Funding Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {stats?.fundingStatus || "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current status
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Milestones */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Milestones</CardTitle>
                    <CardDescription>
                      Milestones currently in progress
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/startup/milestones")}
                    >
                      View All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push("/startup/milestones/create")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeMilestones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No active milestones</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/startup/milestones/create")}
                    >
                      Create Milestone
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeMilestones.map((milestone) => (
                      <div
                        key={milestone._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() =>
                          router.push(`/startup/milestones/${milestone._id}`)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{milestone.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              ${milestone.fundingAmount.toLocaleString()} funding
                            </p>
                          </div>
                          <Badge
                            variant={
                              milestone.status === "in-progress"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {milestone.status}
                          </Badge>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {milestone.assignedContributors} contributors
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Due {new Date(milestone.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Contributors working with you
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/startup/team")}
                    >
                      View All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push("/contributors")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Hire
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No team members yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/contributors")}
                    >
                      Hire Contributors
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div
                        key={member._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() =>
                          router.push(`/contributors/${member._id}`)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                              {member.contributorAvatar ? (
                                <img
                                  src={member.contributorAvatar}
                                  alt={member.contributorName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Users className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{member.contributorName}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {member.role}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              member.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {member.status}
                          </Badge>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Joined {new Date(member.joinedDate).toLocaleDateString()}
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
                  onClick={() => router.push("/startup/settings")}
                >
                  <Rocket className="w-6 h-6 mb-2" />
                  Profile Settings
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => router.push("/startup/funding/apply")}
                >
                  <DollarSign className="w-6 h-6 mb-2" />
                  Apply for Funding
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => router.push("/contributors")}
                >
                  <Users className="w-6 h-6 mb-2" />
                  Hire Contributors
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col py-4"
                  onClick={() => router.push("/startup/milestones/create")}
                >
                  <Target className="w-6 h-6 mb-2" />
                  Create Milestone
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Protected>
  );
}
