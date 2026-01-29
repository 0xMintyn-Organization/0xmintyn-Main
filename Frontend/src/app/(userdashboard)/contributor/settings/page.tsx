"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Save,
  Upload,
  Plus,
  X,
  Settings,
  DollarSign,
  Clock,
  Award,
  Link as LinkIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axiosInstance";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";
import Image from "next/image";

const SKILLS_OPTIONS = [
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "DevOps",
  "UI/UX Design",
  "Graphic Design",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "Blockchain Development",
  "Marketing",
  "Content Writing",
  "Project Management",
  "QA Testing",
  "Cybersecurity",
];

export default function ContributorSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    skills: [] as string[],
    hourlyRate: "",
    availability: "available" as "available" | "busy" | "unavailable",
  });
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role !== "contributor") {
      router.push("/contributor/apply");
      return;
    }

    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/contributor/profile/me");
      if (response.data.success) {
        const profile = response.data.contributor;
        setFormData({
          bio: profile.bio || "",
          skills: profile.skills || [],
          hourlyRate: profile.hourlyRate?.toString() || "",
          availability: profile.availability || "available",
        });
        setPortfolio(profile.portfolio || []);
        setCertifications(profile.certifications || []);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axiosInstance.put("/contributor/profile/me", {
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        portfolio,
        certifications,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        router.push("/contributor/profile");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-blue-600" />
              Contributor Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your contributor profile and preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your bio, skills, and availability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio & Experience *</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="min-h-[120px]"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">
                      {formData.bio.length}/500 characters (minimum 50)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Skills & Expertise *</Label>
                    <div className="flex flex-wrap gap-2 border rounded-lg p-4 min-h-[100px]">
                      {SKILLS_OPTIONS.map((skill) => (
                        <Badge
                          key={skill}
                          variant={
                            formData.skills.includes(skill) ? "default" : "outline"
                          }
                          className={`cursor-pointer ${
                            formData.skills.includes(skill)
                              ? "bg-blue-600 hover:bg-blue-700"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                          onClick={() => {
                            if (formData.skills.includes(skill)) {
                              setFormData({
                                ...formData,
                                skills: formData.skills.filter((s) => s !== skill),
                              });
                            } else if (formData.skills.length < 10) {
                              setFormData({
                                ...formData,
                                skills: [...formData.skills, skill],
                              });
                            }
                          }}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Selected: {formData.skills.length}/10
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (Optional)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={formData.hourlyRate}
                        onChange={(e) =>
                          setFormData({ ...formData, hourlyRate: e.target.value })
                        }
                        placeholder="e.g., 50"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability *</Label>
                      <select
                        id="availability"
                        value={formData.availability}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            availability: e.target.value as "available" | "busy" | "unavailable",
                          })
                        }
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Portfolio Projects</CardTitle>
                      <CardDescription>
                        Showcase your work and projects
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPortfolio([
                          ...portfolio,
                          {
                            title: "",
                            description: "",
                            images: [],
                            link: "",
                            technologies: [],
                          },
                        ]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Project
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolio.map((project, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Project {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPortfolio(portfolio.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Project Title"
                          value={project.title || ""}
                          onChange={(e) => {
                            const updated = [...portfolio];
                            updated[index].title = e.target.value;
                            setPortfolio(updated);
                          }}
                        />
                        <Textarea
                          placeholder="Project Description"
                          value={project.description || ""}
                          onChange={(e) => {
                            const updated = [...portfolio];
                            updated[index].description = e.target.value;
                            setPortfolio(updated);
                          }}
                        />
                        <Input
                          placeholder="Live Link (optional)"
                          value={project.link || ""}
                          onChange={(e) => {
                            const updated = [...portfolio];
                            updated[index].link = e.target.value;
                            setPortfolio(updated);
                          }}
                        />
                      </div>
                    ))}
                    {portfolio.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No portfolio projects. Click "Add Project" to get started.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certifications">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Certifications</CardTitle>
                      <CardDescription>
                        Add your professional certifications
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCertifications([
                          ...certifications,
                          {
                            name: "",
                            organization: "",
                            url: "",
                            issueDate: "",
                          },
                        ]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Certification
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {certifications.map((cert, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">Certification {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCertifications(
                                certifications.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Certificate Name"
                            value={cert.name || ""}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[index].name = e.target.value;
                              setCertifications(updated);
                            }}
                          />
                          <Input
                            placeholder="Issuing Organization"
                            value={cert.organization || ""}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[index].organization = e.target.value;
                              setCertifications(updated);
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="Certificate URL"
                            value={cert.url || ""}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[index].url = e.target.value;
                              setCertifications(updated);
                            }}
                          />
                          <Input
                            type="date"
                            placeholder="Issue Date"
                            value={cert.issueDate || ""}
                            onChange={(e) => {
                              const updated = [...certifications];
                              updated[index].issueDate = e.target.value;
                              setCertifications(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {certifications.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No certifications added. Click "Add Certification" to get started.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Protected>
  );
}
