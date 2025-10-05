"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  ImageIcon, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  DollarSign,
  FileText,
  Package as PackageIcon,
  Tag,
  Info,
  Sparkles,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const categories = [
  "Design & Creative",
  "Web Development",
  "Mobile Development",
  "Writing & Translation",
  "Digital Marketing",
  "Video & Animation",
  "Music & Audio",
  "Programming & Tech",
  "Business Services",
  "Lifestyle",
  "Data Entry & Admin",
  "Tutoring & Education"
];

const deliveryTimes = [
  "1 Day", "2 Days", "3 Days", "5 Days", "1 Week", "2 Weeks", "3 Weeks", "1 Month", "2 Months"
];

interface Package {
  name: "Basic" | "Standard" | "Premium";
  description: string;
  price: string;
  originalPrice: string;
  deliveryTime: string;
  revisions: string;
  features: string[];
}

export default function CreateService() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    responseTime: "24 hours",
    tags: [] as string[],
    images: [] as File[],
    imagePreviews: [] as string[],
    videoUrl: "",
    packages: [
      {
        name: "Basic" as const,
        description: "",
        price: "",
        originalPrice: "",
        deliveryTime: "3 Days",
        revisions: "1",
        features: [""]
      },
      {
        name: "Standard" as const,
        description: "",
        price: "",
        originalPrice: "",
        deliveryTime: "5 Days",
        revisions: "2",
        features: [""]
      },
      {
        name: "Premium" as const,
        description: "",
        price: "",
        originalPrice: "",
        deliveryTime: "1 Week",
        revisions: "3",
        features: [""]
      }
    ] as Package[],
    requirements: [""],
    whatYouGet: [""],
    faqs: [{ question: "", answer: "" }]
  });

  const [newTag, setNewTag] = useState("");

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePackageChange = (packageIndex: number, field: string, value: any) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex] = {
      ...newPackages[packageIndex],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      packages: newPackages
    }));
  };

  const handlePackageFeatureChange = (packageIndex: number, featureIndex: number, value: string) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features[featureIndex] = value;
    setFormData(prev => ({
      ...prev,
      packages: newPackages
    }));
  };

  const addPackageFeature = (packageIndex: number) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features.push("");
    setFormData(prev => ({
      ...prev,
      packages: newPackages
    }));
  };

  const removePackageFeature = (packageIndex: number, featureIndex: number) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].features = newPackages[packageIndex].features.filter((_, i) => i !== featureIndex);
    setFormData(prev => ({
      ...prev,
      packages: newPackages
    }));
  };

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...formData.requirements];
    newRequirements[index] = value;
    setFormData(prev => ({
      ...prev,
      requirements: newRequirements
    }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ""]
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleWhatYouGetChange = (index: number, value: string) => {
    const newWhatYouGet = [...formData.whatYouGet];
    newWhatYouGet[index] = value;
    setFormData(prev => ({
      ...prev,
      whatYouGet: newWhatYouGet
    }));
  };

  const addWhatYouGet = () => {
    setFormData(prev => ({
      ...prev,
      whatYouGet: [...prev.whatYouGet, ""]
    }));
  };

  const removeWhatYouGet = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whatYouGet: prev.whatYouGet.filter((_, i) => i !== index)
    }));
  };

  const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index][field] = value;
    setFormData(prev => ({
      ...prev,
      faqs: newFaqs
    }));
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }]
    }));
  };

  const removeFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...fileArray],
        imagePreviews: [...prev.imagePreviews, ...newPreviews]
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (formData.images.length < 3) newErrors.images = "At least 3 images are required";

    // Validate at least one package has a price
    const hasValidPackage = formData.packages.some(pkg => pkg.price && parseFloat(pkg.price) > 0);
    if (!hasValidPackage) newErrors.packages = "At least one package must have a price";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setCurrentTab("basic");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const submitData = new FormData();
      
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("category", formData.category);
      submitData.append("subcategory", formData.subcategory);
      submitData.append("responseTime", formData.responseTime);
      submitData.append("videoUrl", formData.videoUrl);
      submitData.append("tags", JSON.stringify(formData.tags));
      
      // Filter and append packages
      const validPackages = formData.packages.filter(pkg => pkg.price && parseFloat(pkg.price) > 0);
      submitData.append("packages", JSON.stringify(validPackages));
      
      submitData.append("requirements", JSON.stringify(formData.requirements.filter(r => r.trim())));
      submitData.append("whatYouGet", JSON.stringify(formData.whatYouGet.filter(w => w.trim())));
      submitData.append("faqs", JSON.stringify(formData.faqs.filter(faq => faq.question.trim() && faq.answer.trim())));
      
      formData.images.forEach((image) => {
        submitData.append("images", image);
      });

      // Make API call to create service
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/services/create`, {
        method: 'POST',
        body: submitData,
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Service created successfully:', result);
        
        setUploadProgress(100);
        clearInterval(progressInterval);

        setTimeout(() => {
          router.push("/marketplace");
        }, 500);
      } else {
        const errorData = await response.text();
        console.error('Service creation failed:', response.status, errorData);
        throw new Error(`Failed to create service: ${response.status} - ${errorData}`);
      }

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Error creating service:", error);
      setErrors({ submit: error.message || "Failed to create service" });
      setCurrentTab("basic"); // Go to first tab on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/marketplace">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              Create Service
            </h1>
            <p className="text-muted-foreground mt-1">
              Offer your professional services on the marketplace
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        {loading && (
          <Card className="mb-6 border-green-200 dark:border-green-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                <span className="font-medium">Creating your service...</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">{uploadProgress}% complete</p>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {errors.submit && (
          <Card className="mb-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{errors.submit}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Basic</span>
              </TabsTrigger>
              <TabsTrigger value="packages" className="gap-2">
                <PackageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Packages</span>
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Details</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Media</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Describe your service offering
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Service Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., I will create a professional logo design"
                      className={errors.title ? "border-red-500" : ""}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => handleInputChange("category", value)}
                      >
                        <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subcategory">Subcategory</Label>
                      <Input
                        id="subcategory"
                        value={formData.subcategory}
                        onChange={(e) => handleInputChange("subcategory", e.target.value)}
                        placeholder="e.g., Logo Design, Brand Identity"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responseTime">Response Time</Label>
                      <Select
                        value={formData.responseTime}
                        onValueChange={(value) => handleInputChange("responseTime", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select response time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1 hour">1 hour</SelectItem>
                          <SelectItem value="2 hours">2 hours</SelectItem>
                          <SelectItem value="4 hours">4 hours</SelectItem>
                          <SelectItem value="8 hours">8 hours</SelectItem>
                          <SelectItem value="12 hours">12 hours</SelectItem>
                          <SelectItem value="24 hours">24 hours</SelectItem>
                          <SelectItem value="2 days">2 days</SelectItem>
                          <SelectItem value="3 days">3 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        How quickly will you respond to messages?
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe your service, what you offer, your experience, and what makes you unique..."
                      rows={8}
                      className={errors.description ? "border-red-500" : ""}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formData.description.length}/3000 characters
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Packages Tab */}
            <TabsContent value="packages" className="space-y-6">
              {formData.packages.map((pkg, packageIndex) => (
                <Card key={packageIndex} className={pkg.name === "Standard" ? "border-green-500" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {pkg.name === "Basic" && <PackageIcon className="h-5 w-5 text-blue-500" />}
                        {pkg.name === "Standard" && <Sparkles className="h-5 w-5 text-green-500" />}
                        {pkg.name === "Premium" && <Sparkles className="h-5 w-5 text-purple-500" />}
                        {pkg.name} Package
                      </CardTitle>
                      {pkg.name === "Standard" && (
                        <Badge className="bg-green-600">Most Popular</Badge>
                      )}
                    </div>
                    <CardDescription>
                      Define what's included in the {pkg.name.toLowerCase()} tier
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Package Description</Label>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) => handlePackageChange(packageIndex, "description", e.target.value)}
                        placeholder="Brief description of what's included"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price (USD) {packageIndex === 0 && <span className="text-red-500">*</span>}</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => handlePackageChange(packageIndex, "price", e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Original Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={pkg.originalPrice}
                            onChange={(e) => handlePackageChange(packageIndex, "originalPrice", e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Delivery Time</Label>
                        <Select 
                          value={pkg.deliveryTime} 
                          onValueChange={(value) => handlePackageChange(packageIndex, "deliveryTime", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryTimes.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Revisions</Label>
                        <Input
                          type="number"
                          value={pkg.revisions}
                          onChange={(e) => handlePackageChange(packageIndex, "revisions", e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Features Included</Label>
                      <div className="space-y-2">
                        {pkg.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex gap-2">
                            <Input
                              value={feature}
                              onChange={(e) => handlePackageFeatureChange(packageIndex, featureIndex, e.target.value)}
                              placeholder="e.g., 3 Logo concepts"
                            />
                            {pkg.features.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePackageFeature(packageIndex, featureIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addPackageFeature(packageIndex)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Feature
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {errors.packages && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.packages}
                </p>
              )}
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Requirements & FAQs</CardTitle>
                  <CardDescription>
                    What you need from buyers and common questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Requirements */}
                  <div className="space-y-2">
                    <Label>Requirements from Buyer</Label>
                    <p className="text-sm text-muted-foreground">
                      What information do you need from the buyer to get started?
                    </p>
                    <div className="space-y-2">
                      {formData.requirements.map((req, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={req}
                            onChange={(e) => handleRequirementChange(index, e.target.value)}
                            placeholder="e.g., Company name and tagline"
                          />
                          {formData.requirements.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeRequirement(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addRequirement}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Requirement
                      </Button>
                    </div>
                  </div>

                  {/* What You Get */}
                  <div className="space-y-2">
                    <Label>What You'll Get</Label>
                    <p className="text-sm text-muted-foreground">
                      What deliverables will the buyer receive?
                    </p>
                    <div className="space-y-2">
                      {formData.whatYouGet.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) => handleWhatYouGetChange(index, e.target.value)}
                            placeholder="e.g., High-quality logo files in multiple formats"
                          />
                          {formData.whatYouGet.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeWhatYouGet(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addWhatYouGet}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deliverable
                      </Button>
                    </div>
                  </div>

                  {/* FAQs */}
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Frequently Asked Questions
                    </Label>
                    {formData.faqs.map((faq, index) => (
                      <Card key={index}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">FAQ {index + 1}</span>
                            {formData.faqs.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFaq(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <Input
                            value={faq.question}
                            onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                            placeholder="Question"
                          />
                          <Textarea
                            value={faq.answer}
                            onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                            placeholder="Answer"
                            rows={2}
                          />
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFaq}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add FAQ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Images</CardTitle>
                  <CardDescription>
                    Showcase your work with service images (Max 5 images)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                      <label htmlFor="image-upload" className="cursor-pointer block">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Drag and drop images here, or click to select
                        </p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          disabled={formData.images.length >= 5}
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Choose Images
                        </Button>
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={formData.images.length >= 5}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG up to 5MB each • {formData.images.length}/5 images (minimum 3 required)
                      </p>
                    </div>
                    {errors.images && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.images}
                      </p>
                    )}
                  </div>

                  {formData.imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {formData.imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-zinc-700">
                            <Image
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {index === 0 && (
                            <Badge className="absolute bottom-2 left-2 bg-green-600">
                              Thumbnail
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Video Introduction (Optional)</CardTitle>
                  <CardDescription>
                    Add a video URL to showcase your service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">YouTube URL</Label>
                    <Input
                      id="videoUrl"
                      value={formData.videoUrl}
                      onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <p className="text-sm text-muted-foreground">
                      Optional: Add a YouTube video to showcase your service
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t">
            <Link href="/marketplace">
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </Link>
            <div className="flex gap-3">
              {currentTab !== "basic" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "packages", "details", "media"];
                    const currentIndex = tabs.indexOf(currentTab);
                    if (currentIndex > 0) setCurrentTab(tabs[currentIndex - 1]);
                  }}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
              {currentTab !== "media" ? (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ["basic", "packages", "details", "media"];
                    const currentIndex = tabs.indexOf(currentTab);
                    if (currentIndex < tabs.length - 1) setCurrentTab(tabs[currentIndex + 1]);
                  }}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Create Service
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
