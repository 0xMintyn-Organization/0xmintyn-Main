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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Briefcase, X, Plus } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { useRouter } from "next/navigation";

interface CreateJobPostingModalProps {
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

export default function CreateJobPostingModal({
  isOpen,
  onClose,
}: CreateJobPostingModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: [] as string[],
    compensationType: "milestone-based" as "milestone-based" | "fixed" | "hourly",
    compensationAmount: "",
    expectedDuration: "",
    applicationDeadline: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
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
      const skills = prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill];
      return { ...prev, requiredSkills: skills };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Job title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Job description is required";
    } else if (formData.description.length < 50) {
      newErrors.description = "Description must be at least 50 characters";
    }

    if (formData.requiredSkills.length === 0) {
      newErrors.requiredSkills = "At least one skill is required";
    }

    if (!formData.compensationAmount) {
      newErrors.compensationAmount = "Compensation amount is required";
    } else if (parseFloat(formData.compensationAmount) <= 0) {
      newErrors.compensationAmount = "Amount must be greater than 0";
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
      const response = await axiosInstance.post("/startup/jobs", {
        title: formData.title,
        description: formData.description,
        requiredSkills: formData.requiredSkills,
        compensationType: formData.compensationType,
        compensationAmount: parseFloat(formData.compensationAmount),
        expectedDuration: formData.expectedDuration || undefined,
        applicationDeadline: formData.applicationDeadline || undefined,
      });

      if (response.data.success) {
        toast({
          title: "Job Posted",
          description: "Your job posting has been created and is now visible to contributors",
        });
        onClose();
        router.push("/startup/applications");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create job posting",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Create Job Posting
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Post a job opening to attract contributors
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Senior Frontend Developer"
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Job Description * <span className="text-xs text-gray-500">(min 50 chars)</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              className="min-h-[120px]"
            />
            <p className="text-xs text-gray-500">
              {formData.description.length} characters
            </p>
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Required Skills * (Select at least 1)
            </Label>
            <div className="flex flex-wrap gap-2 border rounded-lg p-4 min-h-[100px]">
              {SKILLS_OPTIONS.map((skill) => (
                <Badge
                  key={skill}
                  variant={
                    formData.requiredSkills.includes(skill)
                      ? "default"
                      : "outline"
                  }
                  className={`cursor-pointer ${
                    formData.requiredSkills.includes(skill)
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
              Selected: {formData.requiredSkills.length}
            </p>
            {errors.requiredSkills && (
              <p className="text-xs text-red-500">{errors.requiredSkills}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="compensationType">Compensation Type *</Label>
              <Select
                value={formData.compensationType}
                onValueChange={(value) =>
                  handleInputChange("compensationType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="milestone-based">
                    Milestone-Based
                  </SelectItem>
                  <SelectItem value="fixed">Fixed Project Fee</SelectItem>
                  <SelectItem value="hourly">Hourly Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensationAmount">
                Amount * <span className="text-xs text-gray-500">(USD)</span>
              </Label>
              <Input
                id="compensationAmount"
                type="number"
                value={formData.compensationAmount}
                onChange={(e) =>
                  handleInputChange("compensationAmount", e.target.value)
                }
                placeholder="e.g., 5000"
                min="0"
                step="0.01"
              />
              {errors.compensationAmount && (
                <p className="text-xs text-red-500">
                  {errors.compensationAmount}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedDuration">Expected Duration</Label>
              <Input
                id="expectedDuration"
                value={formData.expectedDuration}
                onChange={(e) =>
                  handleInputChange("expectedDuration", e.target.value)
                }
                placeholder="e.g., 3 months, 6 weeks"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">Application Deadline</Label>
              <Input
                id="applicationDeadline"
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) =>
                  handleInputChange("applicationDeadline", e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              What happens next?
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Job posting will be visible to all contributors</li>
              <li>• Contributors can apply to your position</li>
              <li>• You'll receive applications in your dashboard</li>
              <li>• Review and accept the best candidates</li>
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                <>
                  <Briefcase className="w-4 h-4 mr-2" />
                  Post Job
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
