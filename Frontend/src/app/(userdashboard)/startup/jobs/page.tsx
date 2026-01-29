"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Briefcase, Clock, DollarSign, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/utils/axiosInstance";
import { toast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";
import CreateJobPostingModal from "@/components/Startup/CreateJobPostingModal";

interface JobPosting {
  _id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  compensationType: string;
  compensationAmount: number;
  expectedDuration?: string;
  applicationDeadline?: string;
  status: string;
  applicantCount: number;
  postedAt: string;
}

export default function StartupJobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user?.role !== "startup") {
      router.push("/startup/apply");
      return;
    }

    fetchJobs();
  }, [user, router]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/startup/jobs");
      if (response.data.success) {
        setJobs(response.data.jobs);
      }
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load job postings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/startup/jobs/${jobId}`);
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Job posting deleted",
        });
        fetchJobs();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete job posting",
        variant: "destructive",
      });
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

  const filteredJobs = jobs.filter((job) =>
    searchQuery
      ? job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8">
        <div className="w-full px-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
                  <Briefcase className="w-8 h-8 text-purple-600" />
                  Job Postings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Create and manage job postings to attract contributors
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Job Posting
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search job postings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery
                    ? "No job postings found matching your search"
                    : "No job postings created yet"}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Job Posting
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold">{job.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                          <Badge
                            variant={
                              job.status === "open" ? "default" : "secondary"
                            }
                          >
                            {job.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.requiredSkills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${job.compensationAmount.toLocaleString()}
                            <span className="capitalize ml-1">
                              ({job.compensationType.replace("-", " ")})
                            </span>
                          </span>
                          {job.expectedDuration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.expectedDuration}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {job.applicantCount} applicants
                          </span>
                          <span>
                            Posted: {new Date(job.postedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/startup/jobs/${job._id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job._id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateJobPostingModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchJobs();
        }}
      />
    </Protected>
  );
}
