"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ContributorApplicationModal from "@/components/Contributor/ContributorApplicationModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, CheckCircle2, ArrowRight } from "lucide-react";
import Protected from "@/hooks/useProtected";

export default function ApplyAsContributorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Redirect if already contributor
  if (user?.role === "contributor") {
    router.push("/contributor/dashboard");
    return null;
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Become a Contributor
              </CardTitle>
              <CardDescription className="text-lg">
                Join our talent network and work with innovative startups on milestone-based projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-4">
                  What you'll get as a Contributor:
                </h3>
                <ul className="space-y-2 text-blue-700 dark:text-blue-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Access to startup opportunities and projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Get hired by startups looking for your skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Work on milestone-based projects with clear deliverables</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Get paid when milestones are verified and completed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Build your portfolio and reputation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Connect with innovative startups and founders</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
                  <h4 className="font-semibold mb-2">Create Profile</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add your skills, portfolio, and experience
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">2</div>
                  <h4 className="font-semibold mb-2">Get Discovered</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Startups browse and invite you to join
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
                  <h4 className="font-semibold mb-2">Start Working</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Work on milestones and get paid
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setShowModal(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Code className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/contributors")}
                  className="flex-1"
                  size="lg"
                >
                  Browse Contributors
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ContributorApplicationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </Protected>
  );
}
