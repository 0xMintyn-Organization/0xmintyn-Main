"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  User,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  CheckCircle2,
  Award,
  Briefcase,
  Search,
  Grid3X3,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

// Static contributor data
const staticContributors = [
  {
    id: "contributor-1",
    name: "Alex Johnson",
    avatar: "/assets/images/dashboard/profile_images/user_1.jpg",
    title: "Senior Full Stack Developer",
    bio: "Passionate full-stack developer with 8+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure.",
    location: "New York, NY",
    skills: ["React", "Node.js", "TypeScript", "AWS", "Docker"],
    hourlyRate: 85,
    availability: "Available",
    rating: 4.9,
    reviewCount: 47,
    completedProjects: 32,
    isVerified: true,
    experience: "8+ years",
    tags: ["Full Stack", "Web Development", "Cloud"],
  },
  {
    id: "contributor-2",
    name: "Sarah Chen",
    avatar: "/assets/images/dashboard/profile_images/user_2.jpg",
    title: "DevOps & Cloud Engineer",
    bio: "Expert in cloud infrastructure, CI/CD pipelines, and containerization. Helping startups scale their infrastructure efficiently and securely.",
    location: "Seattle, WA",
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Linux"],
    hourlyRate: 95,
    availability: "Available",
    rating: 5.0,
    reviewCount: 28,
    completedProjects: 19,
    isVerified: true,
    experience: "6+ years",
    tags: ["DevOps", "Cloud", "Infrastructure"],
  },
];

// Contributor Card Component (matching educationhub card style)
function ContributorCard({ contributor }: { contributor: typeof staticContributors[0] }) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-400">
        {contributor.avatar ? (
          <Image
            src={contributor.avatar}
            alt={contributor.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-16 h-16 text-white opacity-80" />
          </div>
        )}
        <div className="absolute top-2 left-2 bg-green-900 text-white px-2 py-1 rounded-full text-xs font-semibold">
          {contributor.experience}
        </div>
        {contributor.isVerified && (
          <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </div>
        )}
        {contributor.availability === "Available" && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2">
              <div className="flex items-center justify-between text-white text-xs">
                <span>Status</span>
                <Badge className="bg-green-500 text-white border-0 text-xs">
                  {contributor.availability}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-white line-clamp-2">
            {contributor.name}
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {contributor.title}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {contributor.bio}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{contributor.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span>{contributor.completedProjects} projects</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-sm">{contributor.rating}</span>
            <span className="text-xs text-gray-500">({contributor.reviewCount})</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {contributor.skills[0]}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-700 dark:text-green-400">
              ${contributor.hourlyRate}
            </span>
            <span className="text-sm text-gray-500">/hr</span>
          </div>
          <Button
            size="sm"
            className="bg-green-900 hover:bg-green-800 text-white"
            onClick={() => router.push(`/contributors/${contributor.id}`)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ContributorsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const filteredContributors = staticContributors.filter(
    (contributor) =>
      contributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contributor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contributor.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contributor.skills.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
        <div className="w-full px-6 py-6 space-y-3">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-1">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 rounded px-1"
            >
              Home
            </button>
            <span className="text-gray-400 dark:text-gray-500">/</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">Contributors</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                Contributor Directory
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Connect with talented developers, designers, and engineers
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-6">
        {/* Search and Filters Bar */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search contributors by name, skills, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 dark:bg-zinc-700 p-1 rounded-lg">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className={
                  viewMode === "grid"
                    ? "bg-green-900 hover:bg-green-800 text-white"
                    : "hover:bg-gray-200 dark:hover:bg-gray-600"
                }
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className={
                  viewMode === "list"
                    ? "bg-green-900 hover:bg-green-800 text-white"
                    : "hover:bg-gray-200 dark:hover:bg-gray-600"
                }
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-zinc-900 dark:text-white">{filteredContributors.length}</span> of{" "}
            <span className="font-semibold text-zinc-900 dark:text-white">{staticContributors.length}</span> contributors
          </p>
        </div>

        {/* Contributors Grid */}
        {filteredContributors.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredContributors.map((contributor) => (
              <ContributorCard key={contributor.id} contributor={contributor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No contributors found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search to find what you're looking for.
            </p>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-12 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-400 mb-4">
            Platform Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <User className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{staticContributors.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Contributors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {staticContributors.reduce((sum, c) => sum + c.completedProjects, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {(
                    staticContributors.reduce((sum, c) => sum + c.rating, 0) /
                    staticContributors.length
                  ).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
