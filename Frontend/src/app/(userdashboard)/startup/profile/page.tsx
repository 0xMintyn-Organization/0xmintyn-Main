"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Rocket,
  Building2,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  ArrowLeft,
  Edit,
  Settings,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Briefcase,
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";
import Image from "next/image";

export default function StartupProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [startup, setStartup] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [openPositions, setOpenPositions] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role !== "startup") {
      router.push("/startup/apply");
      return;
    }

    fetchStartup();
  }, [user, router]);

  const fetchStartup = async () => {
    try {
      setLoading(true);
      // Fetch own profile
      const response = await axiosInstance.get("/startup/profile/me");
      if (response.data.success) {
        setStartup(response.data.startup);
        setTeamMembers(response.data.teamMembers || []);
        setOpenPositions(response.data.openPositions || []);
      }
    } catch (error: any) {
      console.error("Error fetching startup:", error);
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

  if (!startup) {
    return (
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Profile not found
              </p>
              <Button onClick={() => router.push("/startup/apply")}>
                Create Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/startups/${startup._id}`)}
              >
                <Globe className="w-4 h-4 mr-2" />
                View Public Profile
              </Button>
              <Button
                onClick={() => router.push("/startup/settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Settings
              </Button>
            </div>
          </div>

          {/* Profile Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {startup.logo ? (
                    <Image
                      src={startup.logo}
                      alt={startup.companyName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">{startup.companyName}</h1>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {startup.industry}
                        </Badge>
                        <Badge
                          variant={
                            startup.fundingStatus === "approved"
                              ? "default"
                              : "secondary"
                          }
                          className="capitalize"
                        >
                          {startup.fundingStatus}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {startup.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                    {startup.description}
                  </p>

                  <div className="grid grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Team Size
                      </div>
                      <div className="font-semibold text-lg">
                        {startup.teamSize || teamMembers.length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Total Funding
                      </div>
                      <div className="font-semibold text-lg">
                        ${startup.totalFunding?.toLocaleString() || "0"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        Milestones
                      </div>
                      <div className="font-semibold text-lg">
                        {startup.completedMilestones || 0} completed
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        Open Positions
                      </div>
                      <div className="font-semibold text-lg">
                        {openPositions.length}
                      </div>
                    </div>
                  </div>

                  {(startup.websiteUrl || startup.socialMedia) && (
                    <div className="flex items-center gap-4">
                      {startup.websiteUrl && (
                        <a
                          href={startup.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          Website
                        </a>
                      )}
                      {startup.socialMedia?.twitter && (
                        <a
                          href={startup.socialMedia.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Twitter className="w-4 h-4" />
                          Twitter
                        </a>
                      )}
                      {startup.socialMedia?.linkedin && (
                        <a
                          href={startup.socialMedia.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Linkedin className="w-4 h-4" />
                          LinkedIn
                        </a>
                      )}
                      {startup.socialMedia?.github && (
                        <a
                          href={startup.socialMedia.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Github className="w-4 h-4" />
                          GitHub
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="about" className="space-y-6">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="team">Team ({teamMembers.length})</TabsTrigger>
              <TabsTrigger value="positions">
                Open Positions ({openPositions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>About {startup.companyName}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/startup/settings")}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {startup.businessPlan && (
                    <>
                      {startup.businessPlan.problem && (
                        <div>
                          <h4 className="font-semibold mb-2">Problem Statement</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {startup.businessPlan.problem}
                          </p>
                        </div>
                      )}
                      {startup.businessPlan.solution && (
                        <div>
                          <h4 className="font-semibold mb-2">Solution</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {startup.businessPlan.solution}
                          </p>
                        </div>
                      )}
                      {startup.businessPlan.targetMarket && (
                        <div>
                          <h4 className="font-semibold mb-2">Target Market</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {startup.businessPlan.targetMarket}
                          </p>
                        </div>
                      )}
                      {startup.businessPlan.competitiveAdvantage && (
                        <div>
                          <h4 className="font-semibold mb-2">Competitive Advantage</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {startup.businessPlan.competitiveAdvantage}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {!startup.businessPlan && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No business plan details added</p>
                      <Button onClick={() => router.push("/startup/settings")}>
                        Add Business Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Team Members</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/contributors")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Hire More
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {teamMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamMembers.map((member: any) => (
                        <div
                          key={member._id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                              {member.contributorAvatar ? (
                                <Image
                                  src={member.contributorAvatar}
                                  alt={member.contributorName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{member.contributorName}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {member.role}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No team members yet</p>
                      <Button onClick={() => router.push("/contributors")}>
                        Hire Contributors
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="positions">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Open Positions</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/startup/jobs")}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Manage Jobs
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {openPositions.length > 0 ? (
                    <div className="space-y-4">
                      {openPositions.map((position: any) => (
                        <div
                          key={position._id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-semibold">{position.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {position.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {position.requiredSkills?.map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              Compensation: ${position.compensationAmount?.toLocaleString()}
                            </span>
                            <span className="capitalize">
                              {position.compensationType?.replace("-", " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No open positions</p>
                      <Button onClick={() => router.push("/startup/jobs")}>
                        Create Job Posting
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Protected>
  );
}
