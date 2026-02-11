"use client";

import CourseForm from "./CourseForm";
import { StripeGateForInstructor } from "./StripeGateForInstructor";

export default function CreateCoursePage() {
  return (
    <StripeGateForInstructor
      gateTitle="Connect your bank account to create courses"
      gateDescription="You must complete Stripe onboarding before you can create courses. This ensures you can receive payments from students."
    >
      <CourseForm mode="create" />
    </StripeGateForInstructor>
  );
}