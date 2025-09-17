"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, CheckCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface InstructorSuccessNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  instructorHeadline?: string;
}

export default function InstructorSuccessNotification({
  isVisible,
  onClose,
  instructorHeadline,
}: InstructorSuccessNotificationProps) {
  const router = useRouter();
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-zinc-800 border-2 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  Welcome, Instructor!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  You're now part of our teaching community
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShow(false);
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {instructorHeadline && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                "{instructorHeadline}"
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Access to course creation tools</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Student management dashboard</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Earnings and analytics</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShow(false);
                onClose();
              }}
              className="flex-1"
            >
              Explore Dashboard
            </Button>
            <Button
              onClick={() => {
                setShow(false);
                onClose();
                router.push("/create-course");
              }}
              className="flex-1 bg-green-900 hover:bg-green-800 text-white"
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
