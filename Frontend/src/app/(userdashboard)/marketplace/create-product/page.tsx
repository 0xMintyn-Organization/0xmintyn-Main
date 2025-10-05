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
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  ImageIcon, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  DollarSign,
  FileText,
  Settings,
  Tag,
  Info
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const categories = [
  "Website Templates",
  "Design Assets", 
  "Code Templates",
  "E-books & Guides",
  "Software & Tools",
  "Stock Media",
  "Fonts & Typography",
  "3D Assets"
];

const fileFormats = [
  "HTML/CSS",
  "Figma/Sketch", 
  "JPG/PNG",
  "PDF",
  "React Native",
  "TTF/OTF",
  "MP4",
  "MP3",
  "ZIP",
  "PSD",
  "AI",
  "SVG"
];

const licenses = ["Personal", "Commercial", "Extended", "Standard", "Premium", "Lifetime"];
const accessDurations = ["24 Hours", "7 Days", "30 Days", "90 Days", "1 Year", "Lifetime"];

export default function CreateProduct() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    subcategory: "",
    fileFormat: "",
    fileSize: "",
    fileUrl: "",
    previewUrl: "",
    license: "Standard",
    downloadLimit: "5",
    accessDuration: "Lifetime",
    tags: [] as string[],
    images: [] as File[],
    imagePreviews: [] as string[],
    features: [""],
    whatIncluded: [""],
    requirements: [""],
    specifications: {} as Record<string, string>,
    instantDownload: true,
    lifetimeUpdates: false,
    supportIncluded: false,
    supportDuration: "No Support",
    supportType: "Email",
    documentation: false,
    digitalDelivery: {
      instant: true,
      downloadLimit: 5,
      accessDuration: "Lifetime",
      returnPolicy: "30-day return policy"
    },
    updates: {
      lifetime: false,
      duration: "1 Year"
    },
    support: {
      included: false,
      duration: "No Support",
      type: "Email"
    }
  });

  const [newTag, setNewTag] = useState("");

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleArrayFieldChange = (field: "features" | "whatIncluded" | "requirements", index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const addArrayField = (field: "features" | "whatIncluded" | "requirements") => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayField = (field: "features" | "whatIncluded" | "requirements", index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        setUploadProgress(0);
        
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
        console.log('Upload URL:', `${process.env.NEXT_PUBLIC_SERVER_URI}upload/file`);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}upload/file`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        console.log('Upload response status:', response.status);
        console.log('Upload response headers:', response.headers);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Upload success:', data);
          setFormData(prev => ({
            ...prev,
            fileUrl: data.url
          }));
        } else {
          const errorData = await response.text();
          console.error('Upload failed:', response.status, errorData);
          throw new Error(`Upload failed: ${response.status} - ${errorData}`);
        }
      } catch (error) {
        console.error('File upload error:', error);
        setErrors(prev => ({
          ...prev,
          fileUrl: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      } finally {
        setLoading(false);
        setUploadProgress(0);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.fileFormat) newErrors.fileFormat = "File format is required";
    if (!formData.fileSize.trim()) newErrors.fileSize = "File size is required";
    if (!formData.fileUrl.trim()) newErrors.fileUrl = "File URL is required";
    if (formData.images.length < 3) newErrors.images = "At least 3 images are required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCurrentTab = () => {
    const newErrors: Record<string, string> = {};

    if (currentTab === "basic") {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      if (!formData.description.trim()) newErrors.description = "Description is required";
      if (!formData.category) newErrors.category = "Category is required";
    } else if (currentTab === "pricing") {
      if (!formData.price) newErrors.price = "Price is required";
    } else if (currentTab === "details") {
      if (!formData.fileFormat) newErrors.fileFormat = "File format is required";
      if (!formData.fileSize.trim()) newErrors.fileSize = "File size is required";
      if (!formData.fileUrl.trim()) newErrors.fileUrl = "File URL is required";
    } else if (currentTab === "media") {
      if (formData.images.length < 3) newErrors.images = "At least 3 images are required";
    }

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

    // Simulate upload progress
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
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append text fields
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("price", formData.price);
      submitData.append("originalPrice", formData.originalPrice);
      submitData.append("category", formData.category);
      submitData.append("subcategory", formData.subcategory);
      submitData.append("fileFormat", formData.fileFormat);
      submitData.append("fileSize", formData.fileSize);
      submitData.append("fileUrl", formData.fileUrl);
      submitData.append("previewUrl", formData.previewUrl);
      submitData.append("license", formData.license);
      submitData.append("downloadLimit", formData.downloadLimit);
      submitData.append("accessDuration", formData.accessDuration);
      
      // Append arrays as JSON strings
      submitData.append("tags", JSON.stringify(formData.tags));
      submitData.append("features", JSON.stringify(formData.features.filter(f => f.trim())));
      submitData.append("whatIncluded", JSON.stringify(formData.whatIncluded.filter(w => w.trim())));
      submitData.append("requirements", JSON.stringify(formData.requirements.filter(r => r.trim())));
      
      // Append booleans
      submitData.append("instantDownload", String(formData.instantDownload));
      submitData.append("documentation", String(formData.documentation));
      
      // Append complex objects as JSON strings
      submitData.append("specifications", JSON.stringify(formData.specifications));
      submitData.append("digitalDelivery", JSON.stringify(formData.digitalDelivery));
      submitData.append("updates", JSON.stringify(formData.updates));
      submitData.append("support", JSON.stringify(formData.support));
      
      // Append images
      formData.images.forEach((image) => {
        submitData.append("images", image);
      });

      // Make API call to create product
      console.log('Submitting product data:', {
        title: formData.title,
        category: formData.category,
        price: formData.price,
        imagesCount: formData.images.length,
        fileUrl: formData.fileUrl
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/products/create`, {
        method: 'POST',
        body: submitData,
        credentials: 'include'
      });

      console.log('Product creation response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Product created successfully:', result);
        
        setUploadProgress(100);
        clearInterval(progressInterval);

        // Success - redirect to products page
        setTimeout(() => {
          router.push("/marketplace");
        }, 500);
      } else {
        const errorData = await response.text();
        console.error('Product creation failed:', response.status, errorData);
        throw new Error(`Failed to create product: ${response.status} - ${errorData}`);
      }

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Error creating product:", error);
      setErrors({ submit: error.message || "Failed to create product" });
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
              <Package className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              Create Digital Product
            </h1>
            <p className="text-muted-foreground mt-1">
              List your digital product on the marketplace
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        {loading && (
          <Card className="mb-6 border-green-200 dark:border-green-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                <span className="font-medium">Creating your product...</span>
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
          <Tabs value={currentTab} onValueChange={(value) => {
            // Allow tab change without validation for better UX
            setCurrentTab(value);
          }} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Basic Info</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Pricing</span>
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
                    Tell us about your digital product
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Product Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="e.g., Premium Website Template Pack"
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
                        placeholder="e.g., Business Templates, UI Kits"
                      />
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
                      placeholder="Describe your product in detail..."
                      rows={6}
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & License</CardTitle>
                  <CardDescription>
                    Set your product pricing and license terms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="price">
                        Price (USD) <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => handleInputChange("price", e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className={`pl-10 ${errors.price ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.price && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.price}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Original Price (Optional)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="originalPrice"
                          type="number"
                          value={formData.originalPrice}
                          onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Show discount from original price
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="license">License Type</Label>
                      <Select 
                        value={formData.license} 
                        onValueChange={(value) => handleInputChange("license", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {licenses.map((license) => (
                            <SelectItem key={license} value={license}>
                              {license}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="downloadLimit">Download Limit</Label>
                      <Input
                        id="downloadLimit"
                        type="number"
                        value={formData.downloadLimit}
                        onChange={(e) => handleInputChange("downloadLimit", e.target.value)}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accessDuration">Access Duration</Label>
                      <Select 
                        value={formData.accessDuration} 
                        onValueChange={(value) => handleInputChange("accessDuration", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {accessDurations.map((duration) => (
                            <SelectItem key={duration} value={duration}>
                              {duration}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Instant Download</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow immediate download after purchase
                        </p>
                      </div>
                      <Switch
                        checked={formData.instantDownload}
                        onCheckedChange={(checked) => handleInputChange("instantDownload", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Lifetime Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Provide free updates forever
                        </p>
                      </div>
                      <Switch
                        checked={formData.lifetimeUpdates}
                        onCheckedChange={(checked) => handleInputChange("lifetimeUpdates", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Support Included</Label>
                        <p className="text-sm text-muted-foreground">
                          Offer customer support
                        </p>
                      </div>
                      <Switch
                        checked={formData.supportIncluded}
                        onCheckedChange={(checked) => handleInputChange("supportIncluded", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Documentation Included</Label>
                        <p className="text-sm text-muted-foreground">
                          Includes usage documentation
                        </p>
                      </div>
                      <Switch
                        checked={formData.documentation}
                        onCheckedChange={(checked) => handleInputChange("documentation", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Product Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                  <CardDescription>
                    Technical specifications and features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fileFormat">
                        File Format <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={formData.fileFormat} 
                        onValueChange={(value) => handleInputChange("fileFormat", value)}
                      >
                        <SelectTrigger className={errors.fileFormat ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select file format" />
                        </SelectTrigger>
                        <SelectContent>
                          {fileFormats.map((format) => (
                            <SelectItem key={format} value={format}>
                              {format}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.fileFormat && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.fileFormat}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fileSize">
                        File Size <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fileSize"
                        value={formData.fileSize}
                        onChange={(e) => handleInputChange("fileSize", e.target.value)}
                        placeholder="e.g., 25.4 MB"
                        className={errors.fileSize ? "border-red-500" : ""}
                      />
                      {errors.fileSize && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.fileSize}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <Label>Features</Label>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => handleArrayFieldChange("features", index, e.target.value)}
                            placeholder="e.g., Responsive Design"
                          />
                          {formData.features.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeArrayField("features", index)}
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
                        onClick={() => addArrayField("features")}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Feature
                      </Button>
                    </div>
                  </div>

                  {/* What's Included */}
                  <div className="space-y-2">
                    <Label>What's Included</Label>
                    <div className="space-y-2">
                      {formData.whatIncluded.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={item}
                            onChange={(e) => handleArrayFieldChange("whatIncluded", index, e.target.value)}
                            placeholder="e.g., Source Files"
                          />
                          {formData.whatIncluded.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeArrayField("whatIncluded", index)}
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
                        onClick={() => addArrayField("whatIncluded")}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-2">
                    <Label>Requirements</Label>
                    <div className="space-y-2">
                      {formData.requirements.map((req, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={req}
                            onChange={(e) => handleArrayFieldChange("requirements", index, e.target.value)}
                            placeholder="e.g., Basic HTML knowledge"
                          />
                          {formData.requirements.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeArrayField("requirements", index)}
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
                        onClick={() => addArrayField("requirements")}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Requirement
                      </Button>
                    </div>
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

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>
                    Upload high-quality images of your product (Max 5 images)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div 
                      className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-green-500', 'bg-green-50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                          const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                          if (fileInput) {
                            fileInput.files = files;
                            handleImageUpload({ target: { files } } as any);
                          }
                        }
                      }}
                    >
                      <div className="cursor-pointer" onClick={() => document.getElementById('image-upload')?.click()}>
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Drag and drop images here, or click to select
                        </p>
                        <Button type="button" variant="outline" disabled={formData.images.length >= 5}>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Choose Images
                        </Button>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={formData.images.length >= 5}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG up to 5MB each • {formData.images.length}/5 images
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

              {/* Product File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Product File</CardTitle>
                  <CardDescription>
                    Upload the actual product file that customers will download
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* File Upload Section */}
                    <div className="space-y-2">
                      <Label>Upload Product File</Label>
                      <div 
                        className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-6 text-center hover:border-green-500 transition-colors"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('border-green-500', 'bg-green-50');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                          const files = e.dataTransfer.files;
                          if (files.length > 0) {
                            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                            if (fileInput) {
                              fileInput.files = files;
                              handleFileUpload({ target: { files } } as any);
                            }
                          }
                        }}
                      >
                        <div className="cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag and drop your file here, or click to select
                          </p>
                          <Button type="button" variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Choose File
                          </Button>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".zip,.pdf,.figma,.sketch,.psd,.ai,.html,.css,.js,.ts,.jsx,.tsx,.mp4,.mp3,.ttf,.otf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          ZIP, PDF, Figma, Sketch, PSD, AI, HTML, CSS, JS, TS, MP4, MP3, TTF, OTF up to 100MB
                        </p>
                      </div>
                      {errors.fileUrl && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.fileUrl}
                        </p>
                      )}
                      {formData.fileUrl && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            ✓ File uploaded successfully: {formData.fileUrl.split('/').pop()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Manual URL Input (Alternative) */}
                    <div className="space-y-2">
                      <Label htmlFor="fileUrl">Or Enter File URL Manually</Label>
                      <Input
                        id="fileUrl"
                        value={formData.fileUrl}
                        onChange={(e) => handleInputChange("fileUrl", e.target.value)}
                        placeholder="https://example.com/product-file.zip"
                        className={errors.fileUrl ? "border-red-500" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="previewUrl">Preview URL (Optional)</Label>
                      <Input
                        id="previewUrl"
                        value={formData.previewUrl}
                        onChange={(e) => handleInputChange("previewUrl", e.target.value)}
                        placeholder="https://example.com/preview"
                      />
                      <p className="text-xs text-muted-foreground">
                        Link to preview or demo of your product
                      </p>
                    </div>
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
                    const tabs = ["basic", "pricing", "details", "media"];
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
                    console.log('Next button clicked, current tab:', currentTab);
                    if (validateCurrentTab()) {
                      const tabs = ["basic", "pricing", "details", "media"];
                      const currentIndex = tabs.indexOf(currentTab);
                      console.log('Current index:', currentIndex, 'Next tab:', tabs[currentIndex + 1]);
                      if (currentIndex < tabs.length - 1) setCurrentTab(tabs[currentIndex + 1]);
                    } else {
                      console.log('Validation failed for current tab:', currentTab);
                    }
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
                      Create Product
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
