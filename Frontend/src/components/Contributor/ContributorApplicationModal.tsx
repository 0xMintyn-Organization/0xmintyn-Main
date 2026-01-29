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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Code, X, Plus, Upload, Link as LinkIcon } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import { useDispatch } from "react-redux";
import { userLoggedIn } from "@/redux/features/auth/authSlice";
import { useRouter } from "next/navigation";

interface ContributorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

interface PortfolioProject {
  title: string;
  description: string;
  images: File[];
  imageUrls: string[];
  link?: string;
  technologies: string[];
}

interface Certification {
  name: string;
  organization: string;
  url: string;
  issueDate: string;
}

export default function ContributorApplicationModal({
  isOpen,
  onClose,
}: ContributorApplicationModalProps) {
  const { refetchUser } = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: "",
    skills: [] as string[],
    hourlyRate: "",
    availability: "available" as "available" | "busy" | "unavailable",
  });
  
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([
    {
      title: "",
      description: "",
      images: [],
      imageUrls: [],
      link: "",
      technologies: [],
    },
  ]);
  
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  };

  const addPortfolioProject = () => {
    setPortfolio([
      ...portfolio,
      {
        title: "",
        description: "",
        images: [],
        imageUrls: [],
        link: "",
        technologies: [],
      },
    ]);
  };

  const removePortfolioProject = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const updatePortfolioProject = (
    index: number,
    field: string,
    value: string | File[] | string[]
  ) => {
    const updated = [...portfolio];
    if (field === "images") {
      updated[index].images = value as File[];
    } else if (field === "imageUrls") {
      updated[index].imageUrls = value as string[];
    } else if (field === "technologies") {
      updated[index].technologies = value as string[];
    } else {
      (updated[index] as any)[field] = value;
    }
    setPortfolio(updated);
  };

  const handleImageUpload = async (
    index: number,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files).slice(0, 5);
    const updated = [...portfolio];
    updated[index].images = [...updated[index].images, ...fileArray].slice(0, 5);
    setPortfolio(updated);
  };

  const removeImage = (projectIndex: number, imageIndex: number) => {
    const updated = [...portfolio];
    updated[projectIndex].images = updated[projectIndex].images.filter(
      (_, i) => i !== imageIndex
    );
    setPortfolio(updated);
  };

  const addCertification = () => {
    setCertifications([
      ...certifications,
      {
        name: "",
        organization: "",
        url: "",
        issueDate: "",
      },
    ]);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...certifications];
    (updated[index] as any)[field] = value;
    setCertifications(updated);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.bio.trim()) {
        newErrors.bio = "Bio is required";
      } else if (formData.bio.length < 50) {
        newErrors.bio = "Bio must be at least 50 characters";
      } else if (formData.bio.length > 500) {
        newErrors.bio = "Bio cannot exceed 500 characters";
      }

      if (formData.skills.length === 0) {
        newErrors.skills = "At least one skill is required";
      } else if (formData.skills.length > 10) {
        newErrors.skills = "Maximum 10 skills allowed";
      }
    }

    if (step === 2) {
      if (portfolio.length === 0) {
        newErrors.portfolio = "At least one portfolio project is required";
      } else {
        portfolio.forEach((project, index) => {
          if (!project.title.trim()) {
            newErrors[`portfolio_${index}_title`] = "Project title is required";
          }
          if (!project.description.trim()) {
            newErrors[`portfolio_${index}_description`] = "Project description is required";
          }
          if (project.images.length === 0 && project.imageUrls.length === 0) {
            newErrors[`portfolio_${index}_images`] = "At least one image is required";
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload portfolio images first
      const portfolioWithUrls = await Promise.all(
        portfolio.map(async (project) => {
          const imageUrls: string[] = [];
          
          for (const image of project.images) {
            const formData = new FormData();
            formData.append("file", image);
            
            const uploadResponse = await axiosInstance.post(
              "/upload/upload",
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
            
            if (uploadResponse.data.url) {
              imageUrls.push(uploadResponse.data.url);
            }
          }

          return {
            title: project.title,
            description: project.description,
            images: imageUrls,
            link: project.link || undefined,
            technologies: project.technologies,
          };
        })
      );

      const submitData = {
        bio: formData.bio,
        skills: formData.skills,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        availability: formData.availability,
        portfolio: portfolioWithUrls,
        certifications: certifications.filter(
          (c) => c.name && c.organization
        ),
      };

      const response = await axiosInstance.post(
        "/contributor/apply",
        submitData
      );

      if (response.data.success) {
        setShowSuccess(true);
        
        if (response.data.accessToken) {
          dispatch(
            userLoggedIn({
              accessToken: response.data.accessToken,
              user: response.data.user,
            })
          );
        }

        refetchUser();
        
        setTimeout(() => {
          onClose();
          router.push("/contributor/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to create contributor profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Become a Contributor
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Join our talent network and work with innovative startups
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step
                        ? "bg-green-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">
                    Bio & Experience *
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about your background, skills, and experience. What makes you a great contributor?"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    className="w-full min-h-[120px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.bio.length}/500 characters (minimum 50)
                  </p>
                  {errors.bio && (
                    <p className="text-xs text-red-500">{errors.bio}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Skills & Expertise * (Select at least 1, max 10)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS_OPTIONS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={
                          formData.skills.includes(skill)
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer ${
                          formData.skills.includes(skill)
                            ? "bg-green-600 hover:bg-green-700"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Selected: {formData.skills.length}/10
                  </p>
                  {errors.skills && (
                    <p className="text-xs text-red-500">{errors.skills}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-sm font-medium">
                      Hourly Rate (Optional)
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      placeholder="e.g., 50"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        handleInputChange("hourlyRate", e.target.value)
                      }
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500">USD per hour</p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="availability"
                      className="text-sm font-medium"
                    >
                      Availability *
                    </Label>
                    <select
                      id="availability"
                      value={formData.availability}
                      onChange={(e) =>
                        handleInputChange(
                          "availability",
                          e.target.value as "available" | "busy" | "unavailable"
                        )
                      }
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Portfolio */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Portfolio Projects * (At least 1 required)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPortfolioProject}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </div>

                {portfolio.map((project, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Project {index + 1}</h4>
                      {portfolio.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePortfolioProject(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Project Title *</Label>
                      <Input
                        value={project.title}
                        onChange={(e) =>
                          updatePortfolioProject(index, "title", e.target.value)
                        }
                        placeholder="e.g., E-commerce Platform"
                      />
                      {errors[`portfolio_${index}_title`] && (
                        <p className="text-xs text-red-500">
                          {errors[`portfolio_${index}_title`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Description *</Label>
                      <Textarea
                        value={project.description}
                        onChange={(e) =>
                          updatePortfolioProject(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Describe the project, your role, and key achievements"
                        className="min-h-[80px]"
                      />
                      {errors[`portfolio_${index}_description`] && (
                        <p className="text-xs text-red-500">
                          {errors[`portfolio_${index}_description`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Images * (Max 5)</Label>
                      <div className="flex flex-wrap gap-2">
                        {project.images.map((image, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="relative w-20 h-20 border rounded"
                          >
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${imgIndex + 1}`}
                              className="w-full h-full object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index, imgIndex)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {project.images.length < 5 && (
                          <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                            <Upload className="w-6 h-6 text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) =>
                                handleImageUpload(index, e.target.files)
                              }
                            />
                          </label>
                        )}
                      </div>
                      {errors[`portfolio_${index}_images`] && (
                        <p className="text-xs text-red-500">
                          {errors[`portfolio_${index}_images`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Live Link (Optional)</Label>
                      <div className="flex gap-2">
                        <LinkIcon className="w-4 h-4 mt-2 text-gray-400" />
                        <Input
                          value={project.link}
                          onChange={(e) =>
                            updatePortfolioProject(index, "link", e.target.value)
                          }
                          placeholder="https://example.com"
                          type="url"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Technologies Used</Label>
                      <Input
                        value={project.technologies.join(", ")}
                        onChange={(e) =>
                          updatePortfolioProject(
                            index,
                            "technologies",
                            e.target.value.split(",").map((t) => t.trim())
                          )
                        }
                        placeholder="React, Node.js, MongoDB (comma-separated)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Certifications (Optional) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Certifications (Optional)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCertification}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Certification
                  </Button>
                </div>

                {certifications.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No certifications added. This is optional.
                  </p>
                )}

                {certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        Certification {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertification(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Certificate Name</Label>
                        <Input
                          value={cert.name}
                          onChange={(e) =>
                            updateCertification(index, "name", e.target.value)
                          }
                          placeholder="e.g., AWS Certified Developer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Issuing Organization</Label>
                        <Input
                          value={cert.organization}
                          onChange={(e) =>
                            updateCertification(
                              index,
                              "organization",
                              e.target.value
                            )
                          }
                          placeholder="e.g., Amazon Web Services"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Certificate URL</Label>
                        <Input
                          value={cert.url}
                          onChange={(e) =>
                            updateCertification(index, "url", e.target.value)
                          }
                          placeholder="https://..."
                          type="url"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <Input
                          value={cert.issueDate}
                          onChange={(e) =>
                            updateCertification(
                              index,
                              "issueDate",
                              e.target.value
                            )
                          }
                          type="date"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    What happens next?
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Your profile will be automatically approved</li>
                    <li>• You'll be visible in the contributor directory</li>
                    <li>• Startups can invite you to join their teams</li>
                    <li>• Browse and apply to startup opportunities</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Code className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Notification */}
      {showSuccess && (
        <Dialog open={showSuccess} onOpenChange={() => {}}>
          <DialogContent>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">
                Application Submitted!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your contributor profile has been created. Redirecting to your dashboard...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
