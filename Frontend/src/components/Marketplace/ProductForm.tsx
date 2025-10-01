"use client";

import { useState, useEffect } from "react";
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
  Upload, 
  X, 
  Plus, 
  ImageIcon, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Tag,
  Info,
  FileText,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";

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
  "HTML/CSS", "Figma/Sketch", "JPG/PNG", "PDF", "React Native",
  "TTF/OTF", "MP4", "MP3", "ZIP", "PSD", "AI", "SVG"
];

const licenses = ["Personal", "Commercial", "Extended", "Standard", "Premium", "Lifetime"];
const accessDurations = ["24 Hours", "7 Days", "30 Days", "90 Days", "1 Year", "Lifetime"];

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialData?: any;
  onSuccess?: () => void;
}

export default function ProductForm({ mode, productId, initialData, onSuccess }: ProductFormProps) {
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
    license: "Standard",
    downloadLimit: "5",
    accessDuration: "Lifetime",
    tags: [] as string[],
    images: [] as File[],
    imagePreviews: [] as string[],
    existingImages: [] as string[],
    features: [""],
    whatIncluded: [""],
    requirements: [""],
    instantDownload: true,
    lifetimeUpdates: false,
    supportIncluded: false,
    supportDuration: "No Support",
    documentation: false
  });

  const [newTag, setNewTag] = useState("");

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        price: initialData.price?.toString() || "",
        originalPrice: initialData.originalPrice?.toString() || "",
        category: initialData.category || "",
        subcategory: initialData.subcategory || "",
        fileFormat: initialData.fileFormat || "",
        fileSize: initialData.fileSize || "",
        license: initialData.license || "Standard",
        downloadLimit: initialData.downloadLimit?.toString() || "5",
        accessDuration: initialData.accessDuration || "Lifetime",
        tags: initialData.tags || [],
        images: [],
        imagePreviews: [],
        existingImages: initialData.images || [],
        features: initialData.features?.length > 0 ? initialData.features : [""],
        whatIncluded: initialData.whatIncluded?.length > 0 ? initialData.whatIncluded : [""],
        requirements: initialData.requirements?.length > 0 ? initialData.requirements : [""],
        instantDownload: initialData.digitalDelivery?.instant ?? true,
        lifetimeUpdates: initialData.updates?.lifetime ?? false,
        supportIncluded: initialData.support?.included ?? false,
        supportDuration: initialData.support?.duration || "No Support",
        documentation: initialData.documentation ?? false
      });
    }
  }, [mode, initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleArrayFieldChange = (field: "features" | "whatIncluded" | "requirements", index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field: "features" | "whatIncluded" | "requirements") => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ""] }));
  };

  const removeArrayField = (field: "features" | "whatIncluded" | "requirements", index: number) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
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

  const handleRemoveExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.fileFormat) newErrors.fileFormat = "File format is required";
    if (!formData.fileSize.trim()) newErrors.fileSize = "File size is required";
    
    if (mode === "create" && formData.images.length === 0) {
      newErrors.images = "At least one image is required";
    }
    
    if (mode === "edit" && formData.images.length === 0 && formData.existingImages.length === 0) {
      newErrors.images = "At least one image is required";
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
      
      // Append text fields
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("price", formData.price);
      submitData.append("originalPrice", formData.originalPrice);
      submitData.append("category", formData.category);
      submitData.append("subcategory", formData.subcategory);
      submitData.append("fileFormat", formData.fileFormat);
      submitData.append("fileSize", formData.fileSize);
      submitData.append("license", formData.license);
      submitData.append("downloadLimit", formData.downloadLimit);
      submitData.append("accessDuration", formData.accessDuration);
      
      // Append arrays
      submitData.append("tags", JSON.stringify(formData.tags));
      submitData.append("features", JSON.stringify(formData.features.filter(f => f.trim())));
      submitData.append("whatIncluded", JSON.stringify(formData.whatIncluded.filter(w => w.trim())));
      submitData.append("requirements", JSON.stringify(formData.requirements.filter(r => r.trim())));
      
      // Append digital delivery settings
      submitData.append("instantDownload", String(formData.instantDownload));
      submitData.append("documentation", String(formData.documentation));
      submitData.append("lifetimeUpdates", String(formData.lifetimeUpdates));
      submitData.append("supportIncluded", String(formData.supportIncluded));
      submitData.append("supportDuration", formData.supportDuration);
      
      // Append existing images for edit mode
      if (mode === "edit") {
        submitData.append("existingImages", JSON.stringify(formData.existingImages));
      }
      
      // Append new images
      formData.images.forEach((image) => {
        submitData.append("images", image);
      });

      // API call
      const url = mode === "create" 
        ? `${process.env.NEXT_PUBLIC_SERVER_URI}/marketplace/products/create`
        : `${process.env.NEXT_PUBLIC_SERVER_URI}/marketplace/products/${productId}`;
      
      const method = mode === "create" ? "post" : "put";
      
      const response = await axios[method](url, submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      setUploadProgress(100);
      clearInterval(progressInterval);

      if (response.data.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            router.push("/marketplace");
          }, 500);
        }
      }

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error(`Error ${mode}ing product:`, error);
      setErrors({ 
        submit: error.response?.data?.message || `Failed to ${mode} product` 
      });
    } finally {
      setLoading(false);
    }
  };

  const totalImages = formData.existingImages.length + formData.images.length;

  return (
    <form onSubmit={handleSubmit}>
      {/* Progress Indicator */}
      {loading && (
        <Card className="mb-6 border-green-200 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
              <span className="font-medium">{mode === "create" ? "Creating" : "Updating"} your product...</span>
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

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
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
              <CardDescription>Tell us about your digital product</CardDescription>
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
              <CardDescription>Set your product pricing and license terms</CardDescription>
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
              <CardDescription>Technical specifications and features</CardDescription>
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
                <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop images here, or click to select
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={totalImages >= 5}
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" disabled={totalImages >= 5}>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Choose Images
                    </Button>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG up to 5MB each • {totalImages}/5 images
                  </p>
                </div>
                {errors.images && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.images}
                  </p>
                )}
              </div>

              {(formData.existingImages.length > 0 || formData.imagePreviews.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Existing Images */}
                  {formData.existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-zinc-700">
                        <Image
                          src={image}
                          alt={`Existing ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        onClick={() => handleRemoveExistingImage(index)}
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

                  {/* New Image Previews */}
                  {formData.imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-green-500">
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
                      <Badge className="absolute bottom-2 left-2 bg-blue-600">
                        New
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
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
              const tabs = ["basic", "pricing", "details", "media"];
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
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {mode === "create" ? "Create Product" : "Update Product"}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
