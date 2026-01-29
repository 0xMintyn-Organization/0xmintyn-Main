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
import { Users, Send, DollarSign, Clock } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { useRouter } from "next/navigation";

interface HireContributorModalProps {
  isOpen: boolean;
  onClose: () => void;
  contributor: {
    _id: string;
    userId: {
      firstName: string;
      lastName: string;
      avatar: string;
    };
    skills: string[];
    hourlyRate?: number;
  };
}

export default function HireContributorModal({
  isOpen,
  onClose,
  contributor,
}: HireContributorModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    projectDescription: "",
    compensationType: "milestone-based" as "milestone-based" | "fixed" | "hourly",
    compensationAmount: "",
    startDate: "",
    expectedDuration: "",
    additionalNotes: "",
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.role.trim()) {
      newErrors.role = "Role/position is required";
    }

    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = "Project description is required";
    } else if (formData.projectDescription.length < 50) {
      newErrors.projectDescription = "Description must be at least 50 characters";
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
      const response = await axiosInstance.post(
        `/hiring/contributors/${contributor._id}/invite`,
        {
          role: formData.role,
          projectDescription: formData.projectDescription,
          compensationType: formData.compensationType,
          compensationAmount: parseFloat(formData.compensationAmount),
          startDate: formData.startDate || undefined,
          expectedDuration: formData.expectedDuration || undefined,
          additionalNotes: formData.additionalNotes || undefined,
        }
      );

      if (response.data.success) {
        toast({
          title: "Invitation Sent",
          description: `Hiring invitation sent to ${contributor.userId.firstName} ${contributor.userId.lastName}`,
        });
        onClose();
        router.push("/startup/applications");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to send hiring invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Send Hiring Invitation
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Invite {contributor.userId.firstName} {contributor.userId.lastName} to join your team
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="role">
              Role/Position Title *
            </Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              placeholder="e.g., Frontend Developer, DevOps Engineer"
            />
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription">
              Project Description *
            </Label>
            <Textarea
              id="projectDescription"
              value={formData.projectDescription}
              onChange={(e) => handleInputChange("projectDescription", e.target.value)}
              placeholder="Describe the project, responsibilities, and what you're looking for..."
              className="min-h-[120px]"
            />
            <p className="text-xs text-gray-500">
              {formData.projectDescription.length} characters (minimum 50)
            </p>
            {errors.projectDescription && (
              <p className="text-xs text-red-500">{errors.projectDescription}</p>
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
                onChange={(e) => handleInputChange("compensationAmount", e.target.value)}
                placeholder="e.g., 5000"
                min="0"
                step="0.01"
              />
              {errors.compensationAmount && (
                <p className="text-xs text-red-500">{errors.compensationAmount}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Expected Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedDuration">Expected Duration</Label>
              <Input
                id="expectedDuration"
                value={formData.expectedDuration}
                onChange={(e) => handleInputChange("expectedDuration", e.target.value)}
                placeholder="e.g., 3 months, 6 weeks"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
              placeholder="Any additional information, requirements, or expectations..."
              className="min-h-[80px]"
            />
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              What happens next?
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Contributor will receive your invitation</li>
              <li>• They can accept or decline</li>
              <li>• If accepted, they'll be added to your team</li>
              <li>• You can assign milestones to them</li>
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
