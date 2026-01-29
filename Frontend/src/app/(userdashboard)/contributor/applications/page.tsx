"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  Rocket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";
import Image from "next/image";

interface Application {
  _id: string;
  startupId: {
    _id: string;
    companyName: string;
    logo: string;
  };
  role: string;
  status: string;
  projectDescription: string;
  compensationType: string;
  compensationAmount: number;
  invitedAt?: string;
  appliedAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  rejectedAt?: string;
}

export default function ContributorApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [invitations, setInvitations] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (user?.role !== "contributor") {
      router.push("/contributor/apply");
      return;
    }

    fetchApplications();
  }, [user, router]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch all applications
      const response = await axiosInstance.get("/contributor/applications");
      if (response.data.success) {
        const allApps = response.data.applications;
        setApplications(allApps.filter((app: Application) => app.status === "applied" || app.status === "hired" || app.status === "rejected"));
        setInvitations(allApps.filter((app: Application) => app.status === "invited" || app.status === "declined"));
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

  const handleAcceptInvitation = async (applicationId: string) => {
    try {
      const response = await axiosInstance.post(
        `/hiring/contributor/applications/${applicationId}/accept`
      );
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Invitation accepted! You've been added to the team.",
        });
        fetchApplications();
        router.push("/contributor/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to accept invitation",
        variant: "destructive",
      });
    }
  };

  const handleDeclineInvitation = async (applicationId: string) => {
    try {
      const response = await axiosInstance.post(
        `/hiring/contributor/applications/${applicationId}/decline`
      );
      if (response.data.success) {
        toast({
          title: "Invitation Declined",
          description: "You've declined the invitation",
        });
        fetchApplications();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to decline invitation",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "invited":
        return <Badge className="bg-blue-600">Invited</Badge>;
      case "applied":
        return <Badge className="bg-yellow-600">Pending</Badge>;
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

  const allApplications = [...invitations, ...applications];
  const filteredApplications =
    activeTab === "all"
      ? allApplications
      : activeTab === "invitations"
      ? invitations
      : applications;

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="w-full px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
              <Briefcase className="w-8 h-8 text-blue-600" />
              My Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your job applications and hiring invitations
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">
                All ({allApplications.length})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Invitations ({invitations.length})
              </TabsTrigger>
              <TabsTrigger value="applications">
                Applications ({applications.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {activeTab === "invitations"
                    ? "No invitations received yet"
                    : activeTab === "applications"
                    ? "No applications submitted yet"
                    : "No applications or invitations"}
                </p>
                <Button onClick={() => router.push("/startups")}>
                  Browse Opportunities
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card
                  key={application._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {application.startupId.logo ? (
                          <Image
                            src={application.startupId.logo}
                            alt={application.startupId.companyName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Rocket className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold">
                              {application.startupId.companyName}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                              {application.role}
                            </p>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {application.projectDescription}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <span>
                            Compensation: ${application.compensationAmount.toLocaleString()}
                          </span>
                          <span className="capitalize">
                            Type: {application.compensationType.replace("-", " ")}
                          </span>
                          {application.invitedAt && (
                            <span>
                              Invited: {new Date(application.invitedAt).toLocaleDateString()}
                            </span>
                          )}
                          {application.appliedAt && (
                            <span>
                              Applied: {new Date(application.appliedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/startups/${application.startupId._id}`)
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Startup
                          </Button>
                          {application.status === "invited" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAcceptInvitation(application._id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeclineInvitation(application._id)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Decline
                              </Button>
                            </>
                          )}
                          {application.status === "applied" && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Awaiting response
                            </Badge>
                          )}
                          {application.status === "hired" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(`/contributor/projects/${application._id}`)
                              }
                            >
                              <Briefcase className="w-4 h-4 mr-2" />
                              View Project
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
