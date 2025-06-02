"use client";

import { useState } from "react";
import Protected from "@/hooks/useProtected";
import EducationCard from "@/components/EducationHub/EducationCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dummy categories
const courseCategories = [
    "All",
    "Technology",
    "Business",
    "Design",
    "Health",
    "Marketing",
    "Finance",
];

// Dummy course data
const eduCardDetails = [
    {
        title: "React for Beginners",
        description: "Learn the basics of React.js and start building modern UIs.",
        imagePath: "https://picsum.photos/200/300",
        imageAltText: "React course image",
        category: "Technology",
    },
    {
        title: "Graphic Design Fundamentals",
        description: "Master visual storytelling and design principles.",
        imagePath: "https://picsum.photos/200/300",
        imageAltText: "Design course image",
        category: "Design",
    },
    {
        title: "Financial Literacy 101",
        description: "Understand how to budget, invest, and manage finances.",
        imagePath: "https://picsum.photos/200/300",
        imageAltText: "Finance course image",
        category: "Finance",
    },
    {
        title: "Startup Basics",
        description: "Launch your own business with expert guidance.",
        imagePath: "https://picsum.photos/200/300",
        imageAltText: "Business course image",
        category: "Business",
    },
    {
        title: "Social Media Marketing",
        description: "Promote brands and grow audiences on social platforms.",
        imagePath: "https://picsum.photos/200/300",
        imageAltText: "Marketing course image",
        category: "Marketing",
    },
    {
        title: "Wellness and Nutrition",
        description: "Stay healthy with diet, exercise, and mindfulness tips.",
        imagePath: "https://picsum.photos/200/300",
        imageAltText: "Health course image",
        category: "Health",
    },
];

function EducationHub() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const filteredCourses = eduCardDetails.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            selectedCategory === "All" || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <Protected>
            <div className="flex flex-col mx-auto space-y-6 max-w-7xl px-4 py-6">
                {/* Header */}
                <div className="space-y-2 dark:bg-zinc-800 p-6 rounded-xl">
                    <h2 className="text-2xl font-semibold text-heading">
                        Explore Courses
                    </h2>
                    <p className="text-muted-foreground">
                        Discover a variety of courses designed to elevate your knowledge and
                        skills across different fields.
                    </p>
                </div>

                {/* Search and Categories */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Input
                        type="text"
                        placeholder="Search for a course..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="md:w-1/2"
                    />

                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                        <TabsList className="overflow-x-auto whitespace-nowrap max-w-full rounded-md bg-muted">
                            {courseCategories.map((cat) => (
                                <TabsTrigger key={cat} value={cat}>
                                    {cat}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCourses.length > 0 ? (
                        filteredCourses.map((course, idx) => (
                            <EducationCard
                                key={idx}
                                imagePath={course.imagePath}
                                imageAltText={course.imageAltText}
                                title={course.title}
                                description={course.description}
                                buttonName={course.buttonName}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center text-muted-foreground">
                            No courses found.
                        </div>
                    )}
                </div>
            </div>
        </Protected>
    );
}

export default EducationHub;
