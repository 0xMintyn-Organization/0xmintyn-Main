"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Code,
  Mail,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";
import Image from "next/image";

interface Application {
  _id: string;
  contributorId: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
      avatar: string;
    };
    skills: string[];
    ratings: {
      average: number;
      count: number;
    };
  };
  role: string;
  status: string;
  coverLetter?: string;
  appliedAt?: string;
  invitedAt?: string;
}

export default function StartupApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [invitations, setInvitations] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("applications");

  useEffect(() => {
    if (user?.role !== "startup") {
      router.push("/startup/apply");
      return;
    }

    fetchApplications();
  }, [user, router]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch received applications
      const appsResponse = await axiosInstance.get("/hiring/startup/applications");
      if (appsResponse.data.success) {
        setApplications(appsResponse.data.applications);
      }

      // Fetch sent invitations
      const invitesResponse = await axiosInstance.get("/hiring/startup/invitations");
      if (invitesResponse.data.success) {
        setInvitations(invitesResponse.data.invitations);
      }
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      const response = await axiosInstance.post(
        `/hiring/startup/applications/${applicationId}/accept`
      );
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Application accepted! Contributor added to your team.",
        });
        fetchApplications();
        router.push("/startup/team");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to accept application",
        variant: "destructive",
      });
    }
  };

  const handleRejectApplication = async (applicationId: string, reason?: string) => {
    try {
      const response = await axiosInstance.post(
        `/hiring/startup/applications/${applicationId}/reject`,
        { reason }
      );
      if (response.data.success) {
        toast({
          title: "Application Rejected",
          description: "The application has been rejected",
        });
        fetchApplications();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reject application",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "invited":
        return <Badge className="bg-blue-600">Invited</Badge>;
      case "applied":
        return <Badge className="bg-yellow-600">Pending Review</Badge>;
      case "hired":
        return <Badge className="bg-green-600">Hired</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "declined":
        return <Badge variant="outline">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  const filteredApplications = applications.filter((app) =>
    searchQuery
      ? app.contributorId.userId.firstName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        app.contributorId.userId.lastName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        app.role.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="w-full px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-purple-600" />
              Hiring Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review applications and manage your hiring invitations
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="applications">
                Applications ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Sent Invitations ({invitations.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === "applications" && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by contributor name or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {activeTab === "applications" && filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery
                    ? "No applications found matching your search"
                    : "No applications received yet"}
                </p>
                <Button onClick={() => router.push("/contributors")}>
                  Browse Contributors
                </Button>
              </CardContent>
            </Card>
          ) : activeTab === "invitations" && invitations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No invitations sent yet
                </p>
                <Button onClick={() => router.push("/contributors")}>
                  Hire Contributors
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(activeTab === "applications"
                ? filteredApplications
                : invitations
              ).map((application) => (
                <Card
                  key={application._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {application.contributorId.userId.avatar ? (
                          <Image
                            src={application.contributorId.userId.avatar}
                            alt={`${application.contributorId.userId.firstName} ${application.contributorId.userId.lastName}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Code className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold">
                              {application.contributorId.userId.firstName}{" "}
                              {application.contributorId.userId.lastName}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {application.role}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 text-sm">
                                <span className="font-medium">
                                  {application.contributorId.ratings.average.toFixed(1)}
                                </span>
                                <span className="text-gray-500">
                                  ({application.contributorId.ratings.count} reviews)
                                </span>
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>

                        {application.coverLetter && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                            {application.coverLetter}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                          {application.contributorId.skills.slice(0, 5).map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {application.appliedAt && (
                            <span>
                              Applied: {new Date(application.appliedAt).toLocaleDateString()}
                            </span>
                          )}
                          {application.invitedAt && (
                            <span>
                              Invited: {new Date(application.invitedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/contributors/${application.contributorId._id}`
                              )
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </Button>
                          {application.status === "applied" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  handleAcceptApplication(application._id)
                                }
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleRejectApplication(application._id)
                                }
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          {application.status === "invited" && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Awaiting response
                            </Badge>
                          )}
                          {application.status === "hired" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(`/startup/team/${application._id}`)
                              }
                            >
                              <Users className="w-4 h-4 mr-2" />
                              View Team Member
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Protected>
  );
}
