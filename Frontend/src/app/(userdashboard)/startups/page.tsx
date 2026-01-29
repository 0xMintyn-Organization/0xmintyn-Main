"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Building2,
  Users,
  DollarSign,
  Target,
  Eye,
  Briefcase,
  CheckCircle2,
  MapPin,
  Calendar,
  Globe,
  Search,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

// Static startup data
const staticStartups = [
  {
    id: "startup-1",
    companyName: "TechVenture AI",
    logo: "/logo.png",
    description: "Revolutionizing artificial intelligence solutions for businesses. We develop cutting-edge AI tools that help companies automate processes and make data-driven decisions.",
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
  },
  {
    id: "startup-2",
    companyName: "GreenTech Solutions",
    logo: "/logo.png",
    description: "Building sustainable technology solutions for a greener future. Our platform connects renewable energy providers with consumers, making clean energy accessible to everyone.",
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
  },
];

// Startup Card Component (matching educationhub card style)
function StartupCard({ startup }: { startup: typeof staticStartups[0] }) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-400 to-indigo-400">
        {startup.logo ? (
          <Image
            src={startup.logo}
            alt={startup.companyName}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-16 h-16 text-white opacity-80" />
          </div>
        )}
        <div className="absolute top-2 left-2 bg-green-900 text-white px-2 py-1 rounded-full text-xs font-semibold">
          {startup.stage}
        </div>
        {startup.fundingStatus === "Active" && (
          <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {startup.fundingStatus}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-white line-clamp-2">
            {startup.companyName}
          </h3>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {startup.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{startup.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{startup.teamSize} members</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {startup.industry}
          </Badge>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold">{startup.completedMilestones} milestones</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-700 dark:text-green-400">
              ${(startup.totalFunding / 1000000).toFixed(1)}M
            </span>
            <span className="text-sm text-gray-500">funding</span>
            <Badge className="bg-green-100 text-green-800 border-0">
              {startup.openPositions} open roles
            </Badge>
          </div>
          <Button
            size="sm"
            className="bg-green-900 hover:bg-green-800 text-white"
            onClick={() => router.push(`/startups/${startup.id}`)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StartupsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const filteredStartups = staticStartups.filter((startup) =>
    startup.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    startup.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    startup.industry.toLowerCase().includes(searchTerm.toLowerCase())
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
            <span className="font-medium text-gray-700 dark:text-gray-200">Startups</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                Startup Directory
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Discover innovative startups building the future
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
                placeholder="Search startups by name, description, or industry..."
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
            Showing <span className="font-semibold text-zinc-900 dark:text-white">{filteredStartups.length}</span> of{" "}
            <span className="font-semibold text-zinc-900 dark:text-white">{staticStartups.length}</span> startups
          </p>
        </div>

        {/* Startups Grid */}
        {filteredStartups.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredStartups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No startups found
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
                <Building2 className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{staticStartups.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Startups</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {staticStartups.reduce((sum, s) => sum + s.teamSize, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Team Members</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Briefcase className="w-8 h-8 mx-auto text-green-700 dark:text-green-400 mb-2" />
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {staticStartups.reduce((sum, s) => sum + s.openPositions, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Positions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
