"use client";

import { useParams } from "next/navigation";
import Protected from "@/hooks/useProtected";
import CourseForm from "@/components/course/CourseForm";

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;

  return (
    <Protected>
      <CourseForm mode="edit" courseId={courseId} />
    </Protected>
  );
}