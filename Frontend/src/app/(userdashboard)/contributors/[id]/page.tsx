"use client";

import React from "react";
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
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Award,
  Briefcase,
  Mail,
  Linkedin,
  Github,
  Code2,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

// Static contributor data
const contributorData: Record<string, any> = {
  "contributor-1": {
    id: "contributor-1",
    name: "Alex Johnson",
    avatar: "/assets/images/dashboard/profile_images/user_1.jpg",
    title: "Senior Full Stack Developer",
    bio: "Passionate full-stack developer with 8+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure.",
    fullBio: "I'm a passionate full-stack developer with over 8 years of experience in building scalable, high-performance web applications. My expertise spans across modern JavaScript frameworks, cloud infrastructure, and DevOps practices. I've worked with startups and enterprises to deliver products that make a real impact. I specialize in React, Node.js, TypeScript, AWS, and Docker, and I'm always eager to take on challenging projects that push the boundaries of what's possible.",
    location: "New York, NY",
    skills: ["React", "Node.js", "TypeScript", "AWS", "Docker", "PostgreSQL", "MongoDB", "GraphQL"],
    hourlyRate: 85,
    availability: "Available",
    rating: 4.9,
    reviewCount: 47,
    completedProjects: 32,
    isVerified: true,
    experience: "8+ years",
    tags: ["Full Stack", "Web Development", "Cloud"],
    socialMedia: {
      linkedin: "https://linkedin.com/in/alexjohnson",
      github: "https://github.com/alexjohnson",
      email: "alex.johnson@example.com",
    },
    portfolio: [
      { title: "E-commerce Platform", description: "Built a scalable e-commerce platform serving 100K+ users", tech: ["React", "Node.js", "AWS"] },
      { title: "Real-time Chat App", description: "Developed a real-time messaging application with WebSocket", tech: ["React", "Socket.io", "MongoDB"] },
      { title: "Analytics Dashboard", description: "Created a comprehensive analytics dashboard for SaaS product", tech: ["TypeScript", "D3.js", "PostgreSQL"] },
    ],
    certifications: [
      { name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", year: "2022" },
      { name: "React Advanced Patterns", issuer: "Frontend Masters", year: "2023" },
    ],
    reviews: [
      { author: "John Smith", rating: 5, comment: "Excellent developer, delivered on time and exceeded expectations!" },
      { author: "Sarah Williams", rating: 5, comment: "Great communication and technical skills. Highly recommended!" },
    ],
  },
  "contributor-2": {
    id: "contributor-2",
    name: "Sarah Chen",
    avatar: "/assets/images/dashboard/profile_images/user_2.jpg",
    title: "DevOps & Cloud Engineer",
    bio: "Expert in cloud infrastructure, CI/CD pipelines, and containerization. Helping startups scale their infrastructure efficiently and securely.",
    fullBio: "I'm a DevOps and Cloud Engineer with 6+ years of experience helping startups and enterprises build robust, scalable infrastructure. My expertise includes Kubernetes, AWS, Terraform, CI/CD pipelines, and containerization. I've helped multiple companies reduce infrastructure costs by 40% while improving reliability and deployment speed. I'm passionate about automation, infrastructure as code, and best practices in cloud architecture.",
    location: "Seattle, WA",
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Linux", "Docker", "Jenkins", "Ansible"],
    hourlyRate: 95,
    availability: "Available",
    rating: 5.0,
    reviewCount: 28,
    completedProjects: 19,
    isVerified: true,
    experience: "6+ years",
    tags: ["DevOps", "Cloud", "Infrastructure"],
    socialMedia: {
      linkedin: "https://linkedin.com/in/sarahchen",
      github: "https://github.com/sarahchen",
      email: "sarah.chen@example.com",
    },
    portfolio: [
      { title: "Kubernetes Migration", description: "Migrated legacy infrastructure to Kubernetes, reducing costs by 40%", tech: ["Kubernetes", "AWS", "Terraform"] },
      { title: "CI/CD Pipeline", description: "Built automated CI/CD pipeline reducing deployment time by 80%", tech: ["Jenkins", "Docker", "GitHub Actions"] },
      { title: "Multi-cloud Setup", description: "Designed and implemented multi-cloud infrastructure for high availability", tech: ["AWS", "GCP", "Terraform"] },
    ],
    certifications: [
      { name: "AWS Certified DevOps Engineer", issuer: "Amazon Web Services", year: "2023" },
      { name: "Certified Kubernetes Administrator", issuer: "CNCF", year: "2022" },
    ],
    reviews: [
      { author: "Mike Davis", rating: 5, comment: "Sarah transformed our infrastructure. Highly professional and knowledgeable!" },
      { author: "Emily Brown", rating: 5, comment: "Best DevOps engineer we've worked with. Infrastructure is now rock solid!" },
    ],
  },
};

export default function ContributorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contributorId = params.id as string;
  const contributor = contributorData[contributorId];

  if (!contributor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <p className="text-xl mb-4">Contributor not found</p>
            <Button className="bg-green-900 hover:bg-green-800 text-white" onClick={() => router.push("/contributors")}>
              Back to Contributors
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
            onClick={() => router.push("/contributors")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contributors
          </Button>
          <div className="flex items-start gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white/20 backdrop-blur-sm border-2 border-white/30">
              {contributor.avatar ? (
                <Image
                  src={contributor.avatar}
                  alt={contributor.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              {contributor.isVerified && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-white">{contributor.name}</h1>
                {contributor.isVerified && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xl text-gray-300 mb-4">{contributor.title}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {contributor.location}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {contributor.experience} experience
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-purple-400 text-purple-200 bg-purple-500/20"
                  >
                    {contributor.availability}
                  </Badge>
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
                    <User className="w-6 h-6" />
                    About
                  </h2>
                  <p className="leading-relaxed">{contributor.fullBio}</p>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Code2 className="w-6 h-6" />
                    Skills & Technologies
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {contributor.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-sm py-1 px-3 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Briefcase className="w-6 h-6" />
                    Portfolio
                  </h2>
                  <div className="space-y-4">
                    {contributor.portfolio.map((project: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700"
                      >
                        <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {project.tech.map((tech: string) => (
                            <Badge key={tech} variant="outline" className="text-xs border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6" />
                    Certifications
                  </h2>
                  <div className="space-y-3">
                    {contributor.certifications.map((cert: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-lg bg-zinc-900/80"
                      >
                        <Award className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{cert.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {cert.issuer} • {cert.year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Star className="w-6 h-6" />
                    Reviews ({contributor.reviewCount})
                  </h2>
                  <div className="space-y-4">
                    {contributor.reviews.map((review: any, index: number) => (
                      <div key={index} className="p-4 rounded-lg border-2 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{review.author}</h3>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-500"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{review.comment}</p>
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
                  <h3 className="text-lg font-bold mb-4">Profile Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Rating</span>
                      </div>
                      <span className="font-semibold">
                        {contributor.rating} ({contributor.reviewCount})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Projects</span>
                      </div>
                      <span className="font-semibold">{contributor.completedProjects}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Hourly Rate</span>
                      </div>
                      <span className="font-semibold">${contributor.hourlyRate}/hr</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Experience</span>
                      </div>
                      <span className="font-semibold">{contributor.experience}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Contact</h3>
                  <div className="space-y-3">
                    <Button className="w-full bg-green-900 hover:bg-green-800 text-white">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="bg-white dark:bg-zinc-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">Connect</h3>
                  <div className="space-y-2">
                    {contributor.socialMedia.linkedin && (
                      <a
                        href={contributor.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-gray-600 dark:text-gray-300"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                    {contributor.socialMedia.github && (
                      <a
                        href={contributor.socialMedia.github}
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
