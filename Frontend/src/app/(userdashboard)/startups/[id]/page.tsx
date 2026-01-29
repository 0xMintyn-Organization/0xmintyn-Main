"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Building2,
  Users,
  DollarSign,
  Target,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  MapPin,
  Calendar,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Award,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

// Static startup data
const startupData: Record<string, any> = {
  "startup-1": {
    id: "startup-1",
    companyName: "TechVenture AI",
    logo: "/logo.png",
    description: "Revolutionizing artificial intelligence solutions for businesses. We develop cutting-edge AI tools that help companies automate processes and make data-driven decisions.",
    fullDescription: "TechVenture AI is at the forefront of artificial intelligence innovation. We specialize in developing enterprise-grade AI solutions that transform how businesses operate. Our platform combines machine learning, natural language processing, and computer vision to create intelligent systems that automate complex workflows, analyze vast amounts of data, and provide actionable insights. With a team of world-class engineers and data scientists, we're building the future of business intelligence.",
    industry: "Artificial Intelligence",
    stage: "Scale",
    location: "San Francisco, CA",
    founded: "2020",
    website: "https://techventure.ai",
    fundingStatus: "Active",
    totalFunding: 2500000,
    teamSize: 25,
    openPositions: 5,
    completedMilestones: 12,
    tags: ["AI", "Machine Learning", "Enterprise"],
    socialMedia: {
      linkedin: "https://linkedin.com/company/techventure-ai",
      twitter: "https://twitter.com/techventureai",
      github: "https://github.com/techventure-ai",
    },
    milestones: [
      { title: "Product Launch", date: "2020 Q2", status: "completed" },
      { title: "First 100 Customers", date: "2020 Q4", status: "completed" },
      { title: "Series A Funding", date: "2021 Q1", status: "completed" },
      { title: "International Expansion", date: "2022 Q1", status: "completed" },
    ],
    openRoles: [
      { title: "Senior AI Engineer", type: "Full-time", location: "Remote" },
      { title: "DevOps Engineer", type: "Full-time", location: "San Francisco" },
      { title: "Product Manager", type: "Full-time", location: "Hybrid" },
      { title: "Data Scientist", type: "Full-time", location: "Remote" },
      { title: "Frontend Developer", type: "Full-time", location: "Remote" },
    ],
  },
  "startup-2": {
    id: "startup-2",
    companyName: "GreenTech Solutions",
    logo: "/logo.png",
    description: "Building sustainable technology solutions for a greener future. Our platform connects renewable energy providers with consumers, making clean energy accessible to everyone.",
    fullDescription: "GreenTech Solutions is revolutionizing the renewable energy sector by creating an innovative platform that bridges the gap between clean energy providers and consumers. Our mission is to make sustainable energy accessible, affordable, and easy to adopt for everyone. We leverage cutting-edge technology to optimize energy distribution, reduce costs, and maximize the use of renewable resources. Our platform enables real-time monitoring, smart grid integration, and personalized energy management solutions that help users reduce their carbon footprint while saving money.",
    industry: "Clean Energy",
    stage: "Execute",
    location: "Austin, TX",
    founded: "2021",
    website: "https://greentech.io",
    fundingStatus: "Active",
    totalFunding: 1800000,
    teamSize: 18,
    openPositions: 3,
    completedMilestones: 8,
    tags: ["Sustainability", "Energy", "Platform"],
    socialMedia: {
      linkedin: "https://linkedin.com/company/greentech-solutions",
      twitter: "https://twitter.com/greentechio",
      github: "https://github.com/greentech-solutions",
    },
    milestones: [
      { title: "Platform Launch", date: "2021 Q3", status: "completed" },
      { title: "First 50 Partners", date: "2021 Q4", status: "completed" },
      { title: "Seed Funding", date: "2022 Q1", status: "completed" },
      { title: "Regional Expansion", date: "2022 Q3", status: "completed" },
    ],
    openRoles: [
      { title: "Energy Systems Engineer", type: "Full-time", location: "Austin" },
      { title: "Full Stack Developer", type: "Full-time", location: "Remote" },
      { title: "Sustainability Analyst", type: "Full-time", location: "Hybrid" },
    ],
  },
};

export default function StartupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const startupId = params.id as string;
  const startup = startupData[startupId];

  if (!startup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <p className="text-xl mb-4">Startup not found</p>
            <Button className="bg-green-900 hover:bg-green-800 text-white" onClick={() => router.push("/startups")}>
              Back to Startups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="bg-zinc-900 text-white py-12">
        <div className="w-full px-6">
          <Button
            variant="ghost"
            className="mb-6 text-white hover:bg-white/20"
            onClick={() => router.push("/startups")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Startups
          </Button>
          <div className="flex items-start gap-6">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              {startup.logo ? (
                <Image
                  src={startup.logo}
                  alt={startup.companyName}
                  fill
                  className="object-cover"
                />
              ) : (
                <Building2 className="w-12 h-12 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">{startup.companyName}</h1>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {startup.fundingStatus}
                </Badge>
              </div>
              <p className="text-xl text-gray-300 mb-4">{startup.industry}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {startup.location}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Founded {startup.founded}
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <a
                    href={startup.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-gray-300"
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-white" />
                    About
                  </h2>
                  <p className="leading-relaxed">{startup.fullDescription}</p>
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6" />
                    Key Milestones
                  </h2>
                  <div className="space-y-4">
                    {startup.milestones.map((milestone: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-zinc-900"
                      >
                        <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{milestone.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Open Roles */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Briefcase className="w-6 h-6" />
                    Open Positions ({startup.openPositions})
                  </h2>
                  <div className="space-y-3">
                    {startup.openRoles.map((role: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border-2 border-gray-200 dark:border-zinc-700 hover:border-green-500 transition-colors bg-gray-50 dark:bg-zinc-900"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{role.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{role.type}</span>
                              <span>•</span>
                              <span>{role.location}</span>
                            </div>
                          </div>
                          <Button size="sm" className="bg-green-900 hover:bg-green-800 text-white">
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Company Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Total Funding</span>
                      </div>
                      <span className="font-semibold">
                        ${(startup.totalFunding / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Team Size</span>
                      </div>
                      <span className="font-semibold">{startup.teamSize}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Milestones</span>
                      </div>
                      <span className="font-semibold">{startup.completedMilestones}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Open Roles</span>
                      </div>
                      <span className="font-semibold">{startup.openPositions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {startup.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Connect</h3>
                  <div className="space-y-2">
                    {startup.socialMedia.linkedin && (
                      <a
                        href={startup.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-600 dark:text-gray-300"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {startup.socialMedia.twitter && (
                      <a
                        href={startup.socialMedia.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-600 dark:text-gray-300"
                      >
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </a>
                    )}
                    {startup.socialMedia.github && (
                      <a
                        href={startup.socialMedia.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-600 dark:text-gray-300"
                      >
                        <Github className="w-4 h-4" />
                        GitHub
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}
