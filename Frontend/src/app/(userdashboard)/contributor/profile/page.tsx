"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Star,
  Clock,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  Edit,
  Settings,
  Briefcase,
  Award,
  ExternalLink,
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";
import Image from "next/image";

export default function ContributorProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contributor, setContributor] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== "contributor") {
      router.push("/contributor/apply");
      return;
    }

    fetchContributor();
  }, [user, router]);

  const fetchContributor = async () => {
    try {
      setLoading(true);
      // Fetch own profile
      const response = await axiosInstance.get("/contributor/profile/me");
      if (response.data.success) {
        setContributor(response.data.contributor);
      }
    } catch (error: any) {
      console.error("Error fetching contributor:", error);
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

  if (!contributor) {
    return (
      <Protected>
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Profile not found
              </p>
              <Button onClick={() => router.push("/contributor/apply")}>
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
                onClick={() => router.push(`/contributors/${contributor._id}`)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Profile
              </Button>
              <Button
                onClick={() => router.push("/contributor/settings")}
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
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {contributor.userId?.avatar || user?.avatar ? (
                    <Image
                      src={contributor.userId?.avatar || user?.avatar}
                      alt={`${contributor.userId?.firstName || user?.firstName} ${contributor.userId?.lastName || user?.lastName}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Code className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {contributor.isVerified && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">
                        {contributor.userId?.firstName || user?.firstName} {contributor.userId?.lastName || user?.lastName}
                      </h1>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold text-lg">
                            {contributor.ratings?.average?.toFixed(1) || "0.0"}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({contributor.ratings?.count || 0} reviews)
                          </span>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {contributor.availability || "available"}
                        </Badge>
                        {contributor.isVerified && (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                    {contributor.bio}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {contributor.skills?.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    {contributor.hourlyRate && (
                      <div>
                        <div className="text-gray-500 flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Hourly Rate
                        </div>
                        <div className="font-semibold text-lg">
                          ${contributor.hourlyRate}/hr
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        Projects
                      </div>
                      <div className="font-semibold text-lg">
                        {contributor.completedProjects || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Availability
                      </div>
                      <div className="font-semibold text-lg capitalize">
                        {contributor.availability || "available"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Rating
                      </div>
                      <div className="font-semibold text-lg">
                        {contributor.ratings?.average?.toFixed(1) || "0.0"}/5
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="portfolio" className="space-y-6">
            <TabsList>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>

            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Portfolio Projects</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/contributor/settings")}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Portfolio
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {contributor.portfolio && contributor.portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {contributor.portfolio.map((project: any, index: number) => (
                        <div
                          key={index}
                          className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <h4 className="text-xl font-semibold mb-2">
                            {project.title}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {project.description}
                          </p>
                          {project.images && project.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {project.images.slice(0, 4).map((img: string, i: number) => (
                                <div
                                  key={i}
                                  className="relative w-full h-32 rounded overflow-hidden bg-gray-200"
                                >
                                  <Image
                                    src={img}
                                    alt={`${project.title} ${i + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                            >
                              View Project
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {project.technologies.map((tech: string) => (
                                <Badge key={tech} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No portfolio projects yet</p>
                      <Button onClick={() => router.push("/contributor/settings")}>
                        Add Portfolio Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Certifications</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/contributor/settings")}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Certifications
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {contributor.certifications && contributor.certifications.length > 0 ? (
                    <div className="space-y-4">
                      {contributor.certifications.map((cert: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-semibold text-lg">{cert.name}</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {cert.organization}
                          </p>
                          {cert.issueDate && (
                            <p className="text-sm text-gray-500 mt-1">
                              Issued: {new Date(cert.issueDate).toLocaleDateString()}
                            </p>
                          )}
                          {cert.url && (
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-2"
                            >
                              View Certificate
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No certifications added</p>
                      <Button onClick={() => router.push("/contributor/settings")}>
                        Add Certification
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      View all your applications
                    </p>
                    <Button onClick={() => router.push("/contributor/applications")}>
                      View All Applications
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Protected>
  );
}
