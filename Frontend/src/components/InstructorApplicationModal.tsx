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
import { toast } from "@/hooks/use-toast";
import { GraduationCap, X } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import { useAuth } from "@/contexts/AuthContext";
import InstructorSuccessNotification from "./InstructorSuccessNotification";
import { useDispatch } from "react-redux";
import { userLoggedIn } from "@/redux/features/auth/authSlice";

interface InstructorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructorApplicationModal({ 
  isOpen, 
  onClose 
}: InstructorApplicationModalProps) {
  const { refetchUser } = useAuth();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    headline: "",
    bio: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [instructorHeadline, setInstructorHeadline] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.headline.trim() || !formData.bio.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.headline.length < 10 || formData.headline.length > 100) {
      toast({
        title: "Error",
        description: "Headline must be between 10 and 100 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.bio.length < 50 || formData.bio.length > 500) {
      toast({
        title: "Error",
        description: "Bio must be between 50 and 500 characters",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post("/apply-instructor", {
        headline: formData.headline,
        bio: formData.bio,
      });

      if (response.data.success) {
        // Store the headline for success notification
        setInstructorHeadline(formData.headline);
        
        // Close modal and reset form
        onClose();
        setFormData({ headline: "", bio: "" });
        
        // Show success notification
        setShowSuccessNotification(true);
        
        // Update Redux store with new user data if accessToken is provided
        if (response.data.accessToken) {
          dispatch(userLoggedIn({
            accessToken: response.data.accessToken,
            user: response.data.user
          }));
        }
        
        // Refresh user data to get updated role
        refetchUser();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to apply for instructor role",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                Become an Instructor
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Share your knowledge and start teaching on Equalmint
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="headline" className="text-sm font-medium">
              Professional Headline *
            </Label>
            <Input
              id="headline"
              placeholder="e.g., Senior React Developer & Instructor"
              value={formData.headline}
              onChange={(e) => handleInputChange("headline", e.target.value)}
              className="w-full"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              A brief title that describes your expertise ({formData.headline.length}/100)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              Bio & Experience *
            </Label>
            <Textarea
              id="bio"
              placeholder="I'm a passionate developer with over 10 years of experience in web development. I've worked with companies like Google, Facebook, and Microsoft, and now I'm dedicated to teaching the next generation of developers."
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              className="w-full min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              Tell us about your background, experience, and what you'd like to teach ({formData.bio.length}/500)
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              What happens next?
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <li>• Your application will be reviewed instantly</li>
              <li>• You'll gain access to course creation tools</li>
              <li>• Start building and publishing your courses</li>
              <li>• Earn from your teaching expertise</li>
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
              className="flex-1 bg-green-900 hover:bg-green-800 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Apply Now
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Success Notification */}
      <InstructorSuccessNotification
        isVisible={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        instructorHeadline={instructorHeadline}
      />
    </Dialog>
  );
}
