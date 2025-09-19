"use client";
import CreateCoursePage from "@/components/course/CreateCoursePage";
import { AdminOrInstructorProtected } from "@/components/RoleProtected";

export default function Page() {
  return (
    <AdminOrInstructorProtected>
      <CreateCoursePage />
    </AdminOrInstructorProtected>
  );
}