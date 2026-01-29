"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import HireContributorModal from "@/components/Startup/HireContributorModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Star, Clock, DollarSign, CheckCircle2, ArrowLeft } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";
import Image from "next/image";

export default function HireContributorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const contributorId = params.contributorId as string;
  
  const [loading, setLoading] = useState(true);
  const [contributor, setContributor] = useState<any>(null);
  const [showHireModal, setShowHireModal] = useState(false);

  useEffect(() => {
    if (user?.role !== "startup") {
      router.push("/startup/apply");
      return;
    }

    fetchContributor();
  }, [contributorId, user, router]);

  const fetchContributor = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/contributor/${contributorId}`);
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
              <p className="text-gray-600 dark:text-gray-400">
                Contributor not found
              </p>
            </CardContent>
          </Card>
        </div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {contributor.userId.avatar ? (
                    <Image
                      src={contributor.userId.avatar}
                      alt={`${contributor.userId.firstName} ${contributor.userId.lastName}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Code className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {contributor.isVerified && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1.5">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold">
                        {contributor.userId.firstName} {contributor.userId.lastName}
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">
                            {contributor.ratings.average.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({contributor.ratings.count} reviews)
                          </span>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {contributor.availability}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowHireModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Send Hiring Invitation
                    </Button>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {contributor.bio}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {contributor.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {contributor.hourlyRate && (
                      <div>
                        <div className="text-gray-500">Hourly Rate</div>
                        <div className="font-semibold">
                          ${contributor.hourlyRate}/hr
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-gray-500">Projects Completed</div>
                      <div className="font-semibold">
                        {contributor.completedProjects}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Response Time</div>
                      <div className="font-semibold">Within 24h</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Section */}
          {contributor.portfolio && contributor.portfolio.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Portfolio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contributor.portfolio.map((project: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <h4 className="font-semibold mb-2">{project.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {project.description}
                      </p>
                      {project.images && project.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {project.images.slice(0, 4).map((img: string, i: number) => (
                            <div
                              key={i}
                              className="relative w-full h-24 rounded overflow-hidden bg-gray-200"
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
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Project →
                        </a>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
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
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {contributor.certifications && contributor.certifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contributor.certifications.map((cert: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold">{cert.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cert.organization}
                      </p>
                      {cert.issueDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Issued: {new Date(cert.issueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showHireModal && contributor && (
        <HireContributorModal
          isOpen={showHireModal}
          onClose={() => setShowHireModal(false)}
          contributor={contributor}
        />
      )}
    </Protected>
  );
}
