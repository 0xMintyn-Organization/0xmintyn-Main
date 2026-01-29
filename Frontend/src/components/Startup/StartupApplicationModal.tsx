"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Rocket, Upload, X, Building2 } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

interface StartupApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const STAGES = [
  { value: "ideation", label: "Ideation", description: "Early stage, validating idea" },
  { value: "execute", label: "Execute", description: "Building MVP, early traction" },
  { value: "scale", label: "Scale", description: "Growing, scaling operations" },
];

export default function StartupApplicationModal({
  isOpen,
  onClose,
}: StartupApplicationModalProps) {
  const { user, refetchUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    companyName: "",
    logo: null as File | null,
    description: "",
    industry: "",
    stage: "ideation" as "ideation" | "execute" | "scale",
    websiteUrl: "",
    socialMedia: {
      twitter: "",
      linkedin: "",
      github: "",
    },
    founderBio: "",
    previousExperience: "",
    businessPlan: {
      problem: "",
      solution: "",
      targetMarket: "",
      competitiveAdvantage: "",
    },
    initialFundingNeeds: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    field: string,
    value: string | File | { [key: string]: string }
  ) => {
    if (field === "logo") {
      setFormData((prev) => ({ ...prev, logo: value as File }));
      if (value instanceof File) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(value);
      }
    } else if (field === "socialMedia") {
      setFormData((prev) => ({
        ...prev,
        socialMedia: { ...prev.socialMedia, ...(value as { [key: string]: string }) },
      }));
    } else if (field === "businessPlan") {
      setFormData((prev) => ({
        ...prev,
        businessPlan: { ...prev.businessPlan, ...(value as { [key: string]: string }) },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    } else if (formData.companyName.length > 100) {
      newErrors.companyName = "Company name cannot exceed 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Company description is required";
    } else if (formData.description.length < 100) {
      newErrors.description = "Description must be at least 100 characters";
    } else if (formData.description.length > 2000) {
      newErrors.description = "Description cannot exceed 2000 characters";
    }

    if (!formData.industry) {
      newErrors.industry = "Industry is required";
    }

    if (!formData.founderBio.trim()) {
      newErrors.founderBio = "Founder bio is required";
    } else if (formData.founderBio.length < 50) {
      newErrors.founderBio = "Founder bio must be at least 50 characters";
    } else if (formData.founderBio.length > 500) {
      newErrors.founderBio = "Founder bio cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      
      submitData.append("companyName", formData.companyName);
      submitData.append("description", formData.description);
      submitData.append("industry", formData.industry);
      submitData.append("stage", formData.stage);
      submitData.append("founderBio", formData.founderBio);
      
      if (formData.logo) {
        submitData.append("logo", formData.logo);
      }
      
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
      
      if (formData.previousExperience) {
        submitData.append("previousExperience", formData.previousExperience);
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
      
      if (formData.initialFundingNeeds) {
        submitData.append("initialFundingNeeds", formData.initialFundingNeeds);
      }

      const response = await axiosInstance.post(
        "/startup/apply",
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setShowSuccess(true);
        refetchUser();
        
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to submit startup application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Apply as Startup
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Join our milestone-based funding program and build your startup
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="companyName">
                  Company Name * <span className="text-xs text-gray-500">(Unique)</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="e.g., TechStart Inc."
                  maxLength={100}
                />
                {errors.companyName && (
                  <p className="text-xs text-red-500">{errors.companyName}</p>
                )}
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
                          handleInputChange("logo", e.target.files[0]);
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
                <Label htmlFor="description">
                  Company Description * <span className="text-xs text-gray-500">(100-2000 chars)</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your company, mission, and vision..."
                  className="min-h-[120px]"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500">
                  {formData.description.length}/2000 characters
                </p>
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange("industry", value)}
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
                  {errors.industry && (
                    <p className="text-xs text-red-500">{errors.industry}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) =>
                      handleInputChange("stage", value as "ideation" | "execute" | "scale")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div>
                            <div className="font-medium">{stage.label}</div>
                            <div className="text-xs text-gray-500">
                              {stage.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                  placeholder="https://yourcompany.com"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label>Social Media Links (Optional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Twitter"
                    value={formData.socialMedia.twitter}
                    onChange={(e) =>
                      handleInputChange("socialMedia", {
                        twitter: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="LinkedIn"
                    value={formData.socialMedia.linkedin}
                    onChange={(e) =>
                      handleInputChange("socialMedia", {
                        linkedin: e.target.value,
                      })
                    }
                  />
                  <Input
                    placeholder="GitHub"
                    value={formData.socialMedia.github}
                    onChange={(e) =>
                      handleInputChange("socialMedia", {
                        github: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Founder Information */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Founder Information</h3>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Name:</strong> {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> {user?.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="founderBio">
                  Founder Bio * <span className="text-xs text-gray-500">(50-500 chars)</span>
                </Label>
                <Textarea
                  id="founderBio"
                  value={formData.founderBio}
                  onChange={(e) => handleInputChange("founderBio", e.target.value)}
                  placeholder="Tell us about your background, experience, and why you started this company..."
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {formData.founderBio.length}/500 characters
                </p>
                {errors.founderBio && (
                  <p className="text-xs text-red-500">{errors.founderBio}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousExperience">Previous Experience</Label>
                <Textarea
                  id="previousExperience"
                  value={formData.previousExperience}
                  onChange={(e) =>
                    handleInputChange("previousExperience", e.target.value)
                  }
                  placeholder="Previous companies, roles, achievements..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            {/* Business Plan (Optional) */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">
                Business Plan <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </h3>

              <div className="space-y-2">
                <Label htmlFor="problem">Problem Statement</Label>
                <Textarea
                  id="problem"
                  value={formData.businessPlan.problem}
                  onChange={(e) =>
                    handleInputChange("businessPlan", {
                      problem: e.target.value,
                    })
                  }
                  placeholder="What problem are you solving?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution">Solution</Label>
                <Textarea
                  id="solution"
                  value={formData.businessPlan.solution}
                  onChange={(e) =>
                    handleInputChange("businessPlan", {
                      solution: e.target.value,
                    })
                  }
                  placeholder="How does your product/service solve this problem?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetMarket">Target Market</Label>
                <Textarea
                  id="targetMarket"
                  value={formData.businessPlan.targetMarket}
                  onChange={(e) =>
                    handleInputChange("businessPlan", {
                      targetMarket: e.target.value,
                    })
                  }
                  placeholder="Who is your target audience?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitiveAdvantage">Competitive Advantage</Label>
                <Textarea
                  id="competitiveAdvantage"
                  value={formData.businessPlan.competitiveAdvantage}
                  onChange={(e) =>
                    handleInputChange("businessPlan", {
                      competitiveAdvantage: e.target.value,
                    })
                  }
                  placeholder="What makes you different from competitors?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialFundingNeeds">Initial Funding Needs (Optional)</Label>
                <Input
                  id="initialFundingNeeds"
                  type="number"
                  value={formData.initialFundingNeeds}
                  onChange={(e) =>
                    handleInputChange("initialFundingNeeds", e.target.value)
                  }
                  placeholder="e.g., 50000"
                  min="0"
                />
                <p className="text-xs text-gray-500">USD. You can apply for funding later.</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                What happens next?
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Your application will be reviewed by our admin team</li>
                <li>• You'll receive an email notification with the decision</li>
                <li>• If approved, you can apply for milestone-based funding</li>
                <li>• Start hiring contributors from our talent network</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Notification */}
      {showSuccess && (
        <Dialog open={showSuccess} onOpenChange={() => {}}>
          <DialogContent>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Application Submitted!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your startup application has been submitted and is pending admin review.
                You'll receive an email notification once it's reviewed.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
