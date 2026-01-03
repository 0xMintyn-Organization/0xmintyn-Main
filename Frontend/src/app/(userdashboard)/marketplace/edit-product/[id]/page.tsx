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
  Image as ImageIcon,
  FileText,
  Coins,
  Tag,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

interface ProductData {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  thumbnailImage: string;
  fileFormat: string;
  fileSize: string;
  fileUrl: string;
  previewUrl: string;
  features: string[];
  specifications: { [key: string]: string };
  whatIncluded: string[];
  requirements: string[];
  tags: string[];
  license: string;
  downloadLimit: number;
  accessDuration: string;
  instantDownload: boolean;
  digitalDelivery: {
    instant: boolean;
    downloadLimit: number;
    accessDuration: string;
    returnPolicy: string;
  };
  updates: {
    lifetime: boolean;
    duration: string;
  };
  support: {
    included: boolean;
    duration: string;
    type: string;
  };
  documentation: boolean;
  isActive: boolean;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    price: 0,
    originalPrice: 0,
    discount: 0,
    images: [] as string[],
    thumbnailImage: '',
    fileFormat: '',
    fileSize: '',
    fileUrl: '',
    previewUrl: '',
    features: [] as string[],
    specifications: {} as { [key: string]: string },
    whatIncluded: [] as string[],
    requirements: [] as string[],
    tags: [] as string[],
    license: '',
    downloadLimit: 5,
    accessDuration: 'lifetime',
    instantDownload: true,
    digitalDelivery: {
      instant: true,
      downloadLimit: 5,
      accessDuration: 'lifetime',
      returnPolicy: ''
    },
    updates: {
      lifetime: true,
      duration: 'lifetime'
    },
    support: {
      included: true,
      duration: '30 days',
      type: 'email'
    },
    documentation: true,
    isActive: true
  });

  // Dynamic form fields
  const [newFeature, setNewFeature] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [newIncluded, setNewIncluded] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');

  // File upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (user && !user.isSeller) {
      router.push('/marketplace');
      return;
    }
    fetchProduct();
  }, [user, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/products/${productId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const productData = response.data.product;
        setProduct(productData);
        setFormData({
          title: productData.title || '',
          description: productData.description || '',
          category: productData.category || '',
          subcategory: productData.subcategory || '',
          price: productData.price || 0,
          originalPrice: productData.originalPrice || 0,
          discount: productData.discount || 0,
          images: productData.images || [],
          thumbnailImage: productData.thumbnailImage || '',
          fileFormat: productData.fileFormat || '',
          fileSize: productData.fileSize || '',
          fileUrl: productData.fileUrl || '',
          previewUrl: productData.previewUrl || '',
          features: productData.features || [],
          specifications: productData.specifications || {},
          whatIncluded: productData.whatIncluded || [],
          requirements: productData.requirements || [],
          tags: productData.tags || [],
          license: productData.license || '',
          downloadLimit: productData.downloadLimit || 5,
          accessDuration: productData.accessDuration || 'lifetime',
          instantDownload: productData.instantDownload ?? true,
          digitalDelivery: productData.digitalDelivery || {
            instant: true,
            downloadLimit: 5,
            accessDuration: 'lifetime',
            returnPolicy: ''
          },
          updates: productData.updates || {
            lifetime: true,
            duration: 'lifetime'
          },
          support: productData.support || {
            included: true,
            duration: '30 days',
            type: 'email'
          },
          documentation: productData.documentation ?? true,
          isActive: productData.isActive ?? true
        });
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      setError('Failed to load product data');
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

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [field]: value
      }
    }));
  };

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string): string => {
    if (!imagePath) {
      return '/placeholder-product.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Handle environment variable with trailing slash (same as ProductGrid/ServiceGrid)
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
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
    if (target.src !== '/placeholder-product.jpg') {
      target.src = '/placeholder-product.jpg';
    }
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

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpecKey.trim()]: newSpecValue.trim()
        }
      }));
      setNewSpecKey('');
      setNewSpecValue('');
    }
  };

  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
  };

  // File upload functions
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}upload/image`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      if (response.data.success) {
        const imageUrl = response.data.imageUrl;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, imageUrl],
          thumbnailImage: prev.thumbnailImage || imageUrl
        }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}upload/file`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          fileUrl: response.data.fileUrl,
          fileFormat: response.data.fileFormat,
          fileSize: response.data.fileSize
        }));
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Ensure fileUrl is always included (use original if not changed)
      const submitData = {
        ...formData,
        fileUrl: formData.fileUrl || product?.fileUrl || ''
      };
      
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/products/${productId}`,
        submitData,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Product updated successfully');
        router.push('/marketplace/seller-dashboard');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product data...</p>
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Product not found</AlertDescription>
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
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">Update your product information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter product title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Enter category"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your product"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (0XM) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    step="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Original Price (0XM)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    step="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    max="100"
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
                Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Product Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={getFullImageUrl(image)}
                        alt={`Product image ${index + 1}`}
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
                  ))}
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
                <Label htmlFor="thumbnailImage">Thumbnail Image URL</Label>
                <Input
                  id="thumbnailImage"
                  value={formData.thumbnailImage}
                  onChange={(e) => handleInputChange('thumbnailImage', e.target.value)}
                  placeholder="Enter thumbnail image URL"
                />
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{feature}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromArray('features', index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Enter feature"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addToArray('features', newFeature);
                    setNewFeature('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Digital Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Digital Delivery Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Instant Download</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to download immediately after purchase
                  </p>
                </div>
                <Switch
                  checked={formData.digitalDelivery.instant}
                  onCheckedChange={(checked) => 
                    handleNestedInputChange('digitalDelivery', 'instant', checked)
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="downloadLimit">Download Limit</Label>
                  <Input
                    id="downloadLimit"
                    type="number"
                    value={formData.digitalDelivery.downloadLimit}
                    onChange={(e) => 
                      handleNestedInputChange('digitalDelivery', 'downloadLimit', parseInt(e.target.value) || 0)
                    }
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessDuration">Access Duration</Label>
                  <Input
                    id="accessDuration"
                    value={formData.digitalDelivery.accessDuration}
                    onChange={(e) => 
                      handleNestedInputChange('digitalDelivery', 'accessDuration', e.target.value)
                    }
                    placeholder="e.g., lifetime, 30 days"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnPolicy">Return Policy</Label>
                <Textarea
                  id="returnPolicy"
                  value={formData.digitalDelivery.returnPolicy}
                  onChange={(e) => 
                    handleNestedInputChange('digitalDelivery', 'returnPolicy', e.target.value)
                  }
                  placeholder="Describe your return policy"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this product visible to customers
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
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
