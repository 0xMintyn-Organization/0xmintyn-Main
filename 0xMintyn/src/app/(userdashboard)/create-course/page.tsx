"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaCheckCircle } from "react-icons/fa";

function CreateCoursePage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: "",
        demoVideoUrl: "",
        description: "",
        price: "",
        discountedPrice: "",
        category: "",
        benefits: [""],
        prerequisites: [""],
        content: [
            {
                sectionTitle: "",
                videos: [{
                    title: "",
                    description: "",
                    videoUrl: "",
                    length: ""
                }],
            },
        ],
    });

    const handleChange = (e, field) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleArrayChange = (field, index, value) => {
        const updatedArray = [...formData[field]];
        updatedArray[index] = value;
        setFormData((prev) => ({ ...prev, [field]: updatedArray }));
    };

    const addArrayField = (field) => {
        setFormData((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
    };

    const addSection = () => {
        setFormData((prev) => ({
            ...prev,
            content: [
                ...prev.content,
                {
                    sectionTitle: "",
                    videos: [{ title: "", description: "", videoUrl: "", length: "" }],
                },
            ],
        }));
    };

    const addVideoToSection = (sectionIndex) => {
        const newContent = [...formData.content];
        newContent[sectionIndex].videos.push({ title: "", description: "", videoUrl: "", length: "" });
        setFormData({ ...formData, content: newContent });
    };

    const updateSectionField = (sectionIndex, field, value) => {
        const updatedContent = [...formData.content];
        updatedContent[sectionIndex][field] = value;
        setFormData({ ...formData, content: updatedContent });
    };

    const updateVideoField = (sectionIndex, videoIndex, field, value) => {
        const updatedContent = [...formData.content];
        updatedContent[sectionIndex].videos[videoIndex][field] = value;
        setFormData({ ...formData, content: updatedContent });
    };

    return (
        <div className="flex max-w-7xl mx-auto py-8 px-4 gap-6">
            {/* Course Form Left Side - 70% */}
            <div className="w-full lg:w-[70%] space-y-6">
                {step === 1 && (
                    <Card className="p-6 space-y-4 shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Course Information</h2>
                        <Input placeholder="Course Title" value={formData.title} onChange={(e) => handleChange(e, "title")} />
                        <Input placeholder="Demo Video URL" value={formData.demoVideoUrl} onChange={(e) => handleChange(e, "demoVideoUrl")} />
                        <Textarea placeholder="Course Description" value={formData.description} onChange={(e) => handleChange(e, "description")} rows={5} />
                        <div className="flex gap-4">
                            <Input placeholder="Price" type="number" value={formData.price} onChange={(e) => handleChange(e, "price")} />
                            <Input placeholder="Discounted Price" type="number" value={formData.discountedPrice} onChange={(e) => handleChange(e, "discountedPrice")} />
                        </div>
                        <Input placeholder="Category" value={formData.category} onChange={(e) => handleChange(e, "category")} />
                    </Card>
                )}

                {step === 2 && (
                    <Card className="p-6 space-y-6 shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Benefits & Prerequisites</h2>
                        <div>
                            <h4 className="font-semibold">Benefits</h4>
                            {formData.benefits.map((b, i) => (
                                <Input key={i} placeholder={`Benefit ${i + 1}`} value={b} onChange={(e) => handleArrayChange("benefits", i, e.target.value)} className="mb-2" />
                            ))}
                            <Button onClick={() => addArrayField("benefits")}>Add Benefit</Button>
                        </div>
                        <div>
                            <h4 className="font-semibold">Prerequisites</h4>
                            {formData.prerequisites.map((p, i) => (
                                <Input key={i} placeholder={`Prerequisite ${i + 1}`} value={p} onChange={(e) => handleArrayChange("prerequisites", i, e.target.value)} className="mb-2" />
                            ))}
                            <Button onClick={() => addArrayField("prerequisites")}>Add Prerequisite</Button>
                        </div>
                    </Card>
                )}

                {step === 3 && (
                    <Card className="p-6 space-y-6 shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Course Content</h2>
                        {formData.content.map((section, secIdx) => (
                            <div key={secIdx} className="space-y-4 border-b pb-6">
                                <Input placeholder="Section Title" value={section.sectionTitle} onChange={(e) => updateSectionField(secIdx, "sectionTitle", e.target.value)} />
                                {section.videos.map((video, vidIdx) => (
                                    <div key={vidIdx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input placeholder="Video Title" value={video.title} onChange={(e) => updateVideoField(secIdx, vidIdx, "title", e.target.value)} />
                                        <Input placeholder="Video URL" value={video.videoUrl} onChange={(e) => updateVideoField(secIdx, vidIdx, "videoUrl", e.target.value)} />
                                        <Textarea placeholder="Video Description" value={video.description} onChange={(e) => updateVideoField(secIdx, vidIdx, "description", e.target.value)} />
                                        <Input placeholder="Length (e.g., 5:30)" value={video.length} onChange={(e) => updateVideoField(secIdx, vidIdx, "length", e.target.value)} />
                                    </div>
                                ))}
                                <Button variant="outline" onClick={() => addVideoToSection(secIdx)}>Add Video</Button>
                            </div>
                        ))}
                        <Button onClick={addSection}>Add Section</Button>
                    </Card>
                )}

                {step === 4 && (
                    <Card className="p-6 space-y-4 shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Review & Submit</h2>
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">Title</h3>
                            <p>{formData.title}</p>

                            <h3 className="text-lg font-semibold">Demo Video</h3>
                            <a href={formData.demoVideoUrl} target="_blank" className="text-blue-600 underline">{formData.demoVideoUrl}</a>

                            <h3 className="text-lg font-semibold">Description</h3>
                            <p>{formData.description}</p>

                            <h3 className="text-lg font-semibold">Price</h3>
                            <p>${formData.price} (Discounted: ${formData.discountedPrice})</p>

                            <h3 className="text-lg font-semibold">Category</h3>
                            <p>{formData.category}</p>

                            <h3 className="text-lg font-semibold">Benefits</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {formData.benefits.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>

                            <h3 className="text-lg font-semibold">Prerequisites</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {formData.prerequisites.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>

                            <h3 className="text-lg font-semibold">Content</h3>
                            {formData.content.map((sec, secIdx) => (
                                <div key={secIdx} className="mb-4">
                                    <h4 className="font-medium">Section {secIdx + 1}: {sec.sectionTitle}</h4>
                                    <ul className="list-decimal pl-6">
                                        {sec.videos.map((v, vIdx) => (
                                            <li key={vIdx} className="mb-2">
                                                <strong>{v.title}</strong> - {v.length}<br />
                                                <em>{v.description}</em><br />
                                                <a href={v.videoUrl} target="_blank" className="text-blue-600 underline">Video Link</a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <Button className="mt-4">Create Course</Button>
                    </Card>
                )}
            </div>

            {/* Steps Sidebar Right Side - 30% */}
            <div className="hidden lg:flex lg:w-[30%] flex-col gap-4">
                {[1, 2, 3, 4].map((s) => (
                    <div
                        key={s}
                        className={`flex items-center justify-between cursor-pointer gap-3 p-4 rounded-lg border shadow-sm transition-all duration-200 ${step === s ? "bg-blue-100 border-blue-600" : "bg-muted border-muted"
                            }`}
                        onClick={() => setStep(s)}
                    >
                        <span className="text-lg font-medium">Step {s}</span>
                        {step > s && <FaCheckCircle className="text-green-500 text-xl" />}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CreateCoursePage;
