'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Plus, 
  Trash2,
  Tag,
  Image as ImageIcon,
  Users,
  DollarSign,
  Clock,
  Settings,
  AlertCircle,
  Loader2,
  Star
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface ServicePackage {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  deliveryTime: string;
  revisions: number;
  features: string[];
  isPopular: boolean;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ServiceData {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  thumbnailImage: string;
  videoUrl: string;
  packages: ServicePackage[];
  whatYouGet: string[];
  requirements: string[];
  faqs: FAQ[];
  tags: string[];
  deliveryTime: string;
  revisions: string;
  responseTime: string;
  isActive: boolean;
  isFeatured: boolean;
}

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const serviceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<ServiceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    images: [] as string[],
    thumbnailImage: '',
    videoUrl: '',
    packages: [] as ServicePackage[],
    whatYouGet: [] as string[],
    requirements: [] as string[],
    faqs: [] as FAQ[],
    tags: [] as string[],
    deliveryTime: '',
    revisions: '',
    responseTime: '',
    isActive: true,
    isFeatured: false
  });

  // Dynamic form fields
  const [newWhatYouGet, setNewWhatYouGet] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' });

  // Package management
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [newPackage, setNewPackage] = useState<ServicePackage>({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    deliveryTime: '',
    revisions: 0,
    features: [],
    isPopular: false
  });
  const [newPackageFeature, setNewPackageFeature] = useState('');

  // File upload states
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user && !user.isSeller) {
      router.push('/marketplace');
      return;
    }
    fetchService();
  }, [user, serviceId]);

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/services/${serviceId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const serviceData = response.data.service;
        
        setService(serviceData);
        setFormData({
          title: serviceData.title || '',
          description: serviceData.description || '',
          category: serviceData.category || '',
          subcategory: serviceData.subcategory || '',
          images: serviceData.images || [],
          thumbnailImage: serviceData.thumbnailImage || '',
          videoUrl: serviceData.videoUrl || '',
          packages: serviceData.packages || [],
          whatYouGet: serviceData.whatYouGet || [],
          requirements: serviceData.requirements || [],
          faqs: serviceData.faqs || [],
          tags: serviceData.tags || [],
          deliveryTime: serviceData.deliveryTime || '',
          revisions: serviceData.revisions || '',
          responseTime: serviceData.responseTime || '',
          isActive: serviceData.isActive ?? true,
          isFeatured: serviceData.isFeatured ?? false
        });
      }
    } catch (error: any) {
      console.error('Error fetching service:', error);
      setError('Failed to load service data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Array management functions
  const addToArray = (field: keyof typeof formData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const removeFromArray = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addFAQ = () => {
    if (newFAQ.question.trim() && newFAQ.answer.trim()) {
      setFormData(prev => ({
        ...prev,
        faqs: [...prev.faqs, { ...newFAQ }]
      }));
      setNewFAQ({ question: '', answer: '' });
    }
  };

  const removeFAQ = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string): string => {
    if (!imagePath) {
      return '/placeholder-service.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Handle environment variable with trailing slash (same as ProductGrid/ServiceGrid)
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'https://appbackend.0xmintyn.com';
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Ensure imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  // Helper function to handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== '/placeholder-service.jpg') {
      target.src = '/placeholder-service.jpg';
    }
  };

  // Package management functions
  const addPackage = () => {
    if (newPackage.name.trim() && newPackage.description.trim()) {
      setFormData(prev => ({
        ...prev,
        packages: [...prev.packages, { ...newPackage }]
      }));
      setNewPackage({
        name: '',
        description: '',
        price: 0,
        originalPrice: 0,
        deliveryTime: '',
        revisions: 0,
        features: [],
        isPopular: false
      });
    }
  };

  const removePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }));
  };

  const updatePackage = (index: number, updatedPackage: ServicePackage) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => i === index ? updatedPackage : pkg)
    }));
    setEditingPackage(null);
  };

  const addPackageFeature = (packageIndex: number, feature: string) => {
    if (feature.trim()) {
      setFormData(prev => ({
        ...prev,
        packages: prev.packages.map((pkg, i) => 
          i === packageIndex 
            ? { ...pkg, features: [...pkg.features, feature.trim()] }
            : pkg
        )
      }));
    }
  };

  const removePackageFeature = (packageIndex: number, featureIndex: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => 
        i === packageIndex 
          ? { ...pkg, features: pkg.features.filter((_, j) => j !== featureIndex) }
          : pkg
      )
    }));
  };

  // File upload functions
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}upload/file`,
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      if (response.data.success) {
        const imageUrl = response.data.url;
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl],
          thumbnailImage: prev.thumbnailImage || imageUrl
        }));
        
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Ensure images and thumbnailImage are always included (use original if not changed)
      const submitData = {
        ...formData,
        images: formData.images.length > 0 ? formData.images : service?.images || [],
        thumbnailImage: formData.thumbnailImage || service?.thumbnailImage || ''
      };
      
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/services/${serviceId}`,
        submitData,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Service updated successfully');
        router.push('/marketplace/seller-dashboard');
      }
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast.error(error.response?.data?.message || 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading service data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Service not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Service</h1>
            <p className="text-muted-foreground">Update your service information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Service Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter service title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Design & Creative">Design & Creative</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Writing & Translation">Writing & Translation</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Video & Animation">Video & Animation</option>
                    <option value="Music & Audio">Music & Audio</option>
                    <option value="Programming & Tech">Programming & Tech</option>
                    <option value="Business Services">Business Services</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Data Entry & Admin">Data Entry & Admin</option>
                    <option value="Tutoring & Education">Tutoring & Education</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your service"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime">Delivery Time</Label>
                  <Input
                    id="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                    placeholder="e.g., 3-5 days"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revisions">Revisions</Label>
                  <Input
                    id="revisions"
                    value={formData.revisions}
                    onChange={(e) => handleInputChange('revisions', e.target.value)}
                    placeholder="e.g., Unlimited, 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responseTime">Response Time</Label>
                  <Input
                    id="responseTime"
                    value={formData.responseTime}
                    onChange={(e) => handleInputChange('responseTime', e.target.value)}
                    placeholder="e.g., 2 hours"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Images & Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Service Images ({formData.images.length} images)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.length === 0 ? (
                    <div className="col-span-full text-center py-8 border-2 border-dashed rounded-lg">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No images uploaded yet</p>
                    </div>
                  ) : (
                    formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={getFullImageUrl(image)}
                          alt={`Service image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                          onError={handleImageError}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFromArray('images', index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Service Packages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.packages.map((pkg, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{pkg.name}</h4>
                      {pkg.isPopular && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPackage(pkg)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePackage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Price: </span>
                      ${pkg.price}
                    </div>
                    <div>
                      <span className="font-medium">Delivery: </span>
                      {pkg.deliveryTime}
                    </div>
                    <div>
                      <span className="font-medium">Revisions: </span>
                      {pkg.revisions}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Features:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pkg.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Package */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h4 className="font-medium mb-4">Add New Package</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Package Name</Label>
                      <Input
                        value={newPackage.name}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Basic, Standard, Premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        type="number"
                        value={newPackage.price}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newPackage.description}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what's included in this package"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Delivery Time</Label>
                      <Input
                        value={newPackage.deliveryTime}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, deliveryTime: e.target.value }))}
                        placeholder="e.g., 3 days"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Revisions</Label>
                      <Input
                        type="number"
                        value={newPackage.revisions}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, revisions: parseInt(e.target.value) || 0 }))}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Original Price ($)</Label>
                      <Input
                        type="number"
                        value={newPackage.originalPrice}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newPackageFeature}
                      onChange={(e) => setNewPackageFeature(e.target.value)}
                      placeholder="Add feature"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newPackageFeature.trim()) {
                          setNewPackage(prev => ({
                            ...prev,
                            features: [...prev.features, newPackageFeature.trim()]
                          }));
                          setNewPackageFeature('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {newPackage.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => setNewPackage(prev => ({
                            ...prev,
                            features: prev.features.filter((_, i) => i !== index)
                          }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPopular"
                      checked={newPackage.isPopular}
                      onChange={(e) => setNewPackage(prev => ({ ...prev, isPopular: e.target.checked }))}
                    />
                    <Label htmlFor="isPopular">Mark as Popular</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPackage}
                    className="w-full"
                  >
                    Add Package
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What You Get */}
          <Card>
            <CardHeader>
              <CardTitle>What You Get</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {formData.whatYouGet.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{item}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromArray('whatYouGet', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newWhatYouGet}
                  onChange={(e) => setNewWhatYouGet(e.target.value)}
                  placeholder="Enter what customer gets"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addToArray('whatYouGet', newWhatYouGet);
                    setNewWhatYouGet('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{requirement}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromArray('requirements', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Enter requirement"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addToArray('requirements', newRequirement);
                    setNewRequirement('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="font-medium">{faq.question}</p>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFAQ(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    value={newFAQ.question}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Enter question"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea
                    value={newFAQ.answer}
                    onChange={(e) => setNewFAQ(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Enter answer"
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFAQ}
                >
                  Add FAQ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => removeFromArray('tags', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addToArray('tags', newTag);
                    setNewTag('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this service visible to customers
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Featured</Label>
                  <p className="text-sm text-muted-foreground">
                    Highlight this service in featured sections
                  </p>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
