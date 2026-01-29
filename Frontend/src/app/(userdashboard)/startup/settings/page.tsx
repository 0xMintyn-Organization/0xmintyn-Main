"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Rocket,
  Save,
  Upload,
  Settings,
  Building2,
  Globe,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axiosInstance";
import Spinner from "@/components/Spinner";
import Protected from "@/hooks/useProtected";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "E-commerce",
  "SaaS",
  "AI/ML",
  "Blockchain",
  "Gaming",
  "Media & Entertainment",
  "Real Estate",
  "Food & Beverage",
  "Transportation",
  "Energy",
  "Other",
];

export default function StartupSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    description: "",
    industry: "",
    stage: "ideation" as "ideation" | "execute" | "scale",
    websiteUrl: "",
    socialMedia: {
      twitter: "",
      linkedin: "",
      github: "",
    },
    businessPlan: {
      problem: "",
      solution: "",
      targetMarket: "",
      competitiveAdvantage: "",
    },
  });

  useEffect(() => {
    if (user?.role !== "startup") {
      router.push("/startup/apply");
      return;
    }

    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/startup/profile/me");
      if (response.data.success) {
        const startup = response.data.startup;
        setFormData({
          companyName: startup.companyName || "",
          description: startup.description || "",
          industry: startup.industry || "",
          stage: startup.stage || "ideation",
          websiteUrl: startup.websiteUrl || "",
          socialMedia: startup.socialMedia || {
            twitter: "",
            linkedin: "",
            github: "",
          },
          businessPlan: startup.businessPlan || {
            problem: "",
            solution: "",
            targetMarket: "",
            competitiveAdvantage: "",
          },
        });
        if (startup.logo) {
          setLogoPreview(startup.logo);
        }
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
      const submitData = new FormData();
      
      submitData.append("companyName", formData.companyName);
      submitData.append("description", formData.description);
      submitData.append("industry", formData.industry);
      submitData.append("stage", formData.stage);
      
      if (formData.websiteUrl) {
        submitData.append("websiteUrl", formData.websiteUrl);
      }
      
      if (formData.socialMedia.twitter) {
        submitData.append("socialMedia[twitter]", formData.socialMedia.twitter);
      }
      if (formData.socialMedia.linkedin) {
        submitData.append("socialMedia[linkedin]", formData.socialMedia.linkedin);
      }
      if (formData.socialMedia.github) {
        submitData.append("socialMedia[github]", formData.socialMedia.github);
      }
      
      if (formData.businessPlan.problem) {
        submitData.append("businessPlan[problem]", formData.businessPlan.problem);
      }
      if (formData.businessPlan.solution) {
        submitData.append("businessPlan[solution]", formData.businessPlan.solution);
      }
      if (formData.businessPlan.targetMarket) {
        submitData.append("businessPlan[targetMarket]", formData.businessPlan.targetMarket);
      }
      if (formData.businessPlan.competitiveAdvantage) {
        submitData.append("businessPlan[competitiveAdvantage]", formData.businessPlan.competitiveAdvantage);
      }

      const response = await axiosInstance.put(
        "/startup/profile/me",
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        router.push("/startup/profile");
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
              <Settings className="w-8 h-8 text-purple-600" />
              Startup Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your startup profile and information
            </p>
          </div>

          <Tabs defaultValue="company" className="space-y-6">
            <TabsList>
              <TabsTrigger value="company">Company Info</TabsTrigger>
              <TabsTrigger value="business">Business Plan</TabsTrigger>
              <TabsTrigger value="social">Social Links</TabsTrigger>
            </TabsList>

            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Update your company details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                      placeholder="e.g., TechStart Inc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logo">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <div className="relative w-20 h-20 border rounded-lg overflow-hidden">
                          <Image
                            src={logoPreview}
                            alt="Logo preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setLogoPreview(reader.result as string);
                              };
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                          <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {logoPreview ? "Change Logo" : "Upload Logo"}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="min-h-[120px]"
                      maxLength={2000}
                    />
                    <p className="text-xs text-gray-500">
                      {formData.description.length}/2000 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select
                        value={formData.industry}
                        onValueChange={(value) =>
                          setFormData({ ...formData, industry: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((industry) => (
                            <SelectItem key={industry} value={industry.toLowerCase()}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stage">Stage *</Label>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            stage: value as "ideation" | "execute" | "scale",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ideation">Ideation</SelectItem>
                          <SelectItem value="execute">Execute</SelectItem>
                          <SelectItem value="scale">Scale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, websiteUrl: e.target.value })
                      }
                      placeholder="https://yourcompany.com"
                      type="url"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <CardTitle>Business Plan</CardTitle>
                  <CardDescription>
                    Describe your business strategy and vision
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="problem">Problem Statement</Label>
                    <Textarea
                      id="problem"
                      value={formData.businessPlan.problem}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessPlan: {
                            ...formData.businessPlan,
                            problem: e.target.value,
                          },
                        })
                      }
                      className="min-h-[100px]"
                      placeholder="What problem are you solving?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="solution">Solution</Label>
                    <Textarea
                      id="solution"
                      value={formData.businessPlan.solution}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessPlan: {
                            ...formData.businessPlan,
                            solution: e.target.value,
                          },
                        })
                      }
                      className="min-h-[100px]"
                      placeholder="How does your product/service solve this problem?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetMarket">Target Market</Label>
                    <Textarea
                      id="targetMarket"
                      value={formData.businessPlan.targetMarket}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessPlan: {
                            ...formData.businessPlan,
                            targetMarket: e.target.value,
                          },
                        })
                      }
                      className="min-h-[100px]"
                      placeholder="Who is your target audience?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competitiveAdvantage">Competitive Advantage</Label>
                    <Textarea
                      id="competitiveAdvantage"
                      value={formData.businessPlan.competitiveAdvantage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessPlan: {
                            ...formData.businessPlan,
                            competitiveAdvantage: e.target.value,
                          },
                        })
                      }
                      className="min-h-[100px]"
                      placeholder="What makes you different from competitors?"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Links</CardTitle>
                  <CardDescription>
                    Add your social media profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2">
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      value={formData.socialMedia.twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: {
                            ...formData.socialMedia,
                            twitter: e.target.value,
                          },
                        })
                      }
                      placeholder="https://twitter.com/yourcompany"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      value={formData.socialMedia.linkedin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: {
                            ...formData.socialMedia,
                            linkedin: e.target.value,
                          },
                        })
                      }
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github" className="flex items-center gap-2">
                      <Github className="w-4 h-4" />
                      GitHub
                    </Label>
                    <Input
                      id="github"
                      value={formData.socialMedia.github}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialMedia: {
                            ...formData.socialMedia,
                            github: e.target.value,
                          },
                        })
                      }
                      placeholder="https://github.com/yourcompany"
                    />
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
              className="flex-1 bg-purple-600 hover:bg-purple-700"
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
