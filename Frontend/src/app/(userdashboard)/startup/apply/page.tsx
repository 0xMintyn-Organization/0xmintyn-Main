"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import StartupApplicationModal from "@/components/Startup/StartupApplicationModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, CheckCircle2, ArrowRight, DollarSign, Users, Target } from "lucide-react";
import Protected from "@/hooks/useProtected";

export default function ApplyAsStartupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Redirect if already startup
  if (user?.role === "startup") {
    router.push("/startup/dashboard");
    return null;
  }

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Apply as Startup
              </CardTitle>
              <CardDescription className="text-lg">
                Join our milestone-based funding program and build your startup with our talent network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-4">
                  What you'll get as a Startup:
                </h3>
                <ul className="space-y-2 text-purple-700 dark:text-purple-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Apply for milestone-based funding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Access to our global contributor network</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Hire skilled contributors (developers, designers, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Funding released as you achieve milestones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Transparent accountability and verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Build your team and scale your startup</span>
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold mb-2">Get Funded</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Apply for milestone-based funding
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold mb-2">Hire Talent</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access our contributor network
                  </p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-semibold mb-2">Achieve Milestones</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get funding as you progress
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setShowModal(true)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/startups")}
                  className="flex-1"
                  size="lg"
                >
                  Browse Startups
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <StartupApplicationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </Protected>
  );
}
