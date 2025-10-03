"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SellerSuccessModal from "../Marketplace/SellerSuccessModal";
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Store,
  ImageIcon,
  Package,
  Users,
  Briefcase
} from "lucide-react";
import axios from "axios";

interface BecomeSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const businessTypes = [
  "Individual",
  "Company", 
  "Partnership",
  "LLC",
  "Corporation"
];

const sellerTypes = [
  {
    id: "products",
    name: "Digital Products",
    description: "Sell digital products like templates, courses, software, etc.",
    icon: Package,
    color: "text-blue-600"
  },
  {
    id: "services",
    name: "Services",
    description: "Offer services like design, development, consulting, etc.",
    icon: Users,
    color: "text-green-600"
  },
  {
    id: "both",
    name: "Both Products & Services",
    description: "Sell digital products and offer services.",
    icon: Briefcase,
    color: "text-purple-600"
  }
];

export default function BecomeSellerModal({ isOpen, onClose, onSuccess }: BecomeSellerModalProps) {
  const [currentTab, setCurrentTab] = useState("type");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedSellerType, setSelectedSellerType] = useState<string>("");
  
  const [formData, setFormData] = useState({
    sellerType: "",
    sellerName: "",
    storeName: "",
    storeDescription: "",
    contactEmail: "",
    contactPhone: "",
    businessType: "",
    storeLogo: null as File | null
  });

  const handleInputChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSellerTypeSelect = (type: string) => {
    setSelectedSellerType(type);
    setFormData(prev => ({ ...prev, sellerType: type }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.sellerType) {
      newErrors.sellerType = "Please select a seller type";
    }
    if (!formData.sellerName.trim()) {
      newErrors.sellerName = "Seller name is required";
    }
    if (!formData.storeName.trim()) {
      newErrors.storeName = "Store name is required";
    }
    if (!formData.storeDescription.trim()) {
      newErrors.storeDescription = "Store description is required";
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "Contact email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email";
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "Contact phone is required";
    }
    if (!formData.businessType) {
      newErrors.businessType = "Business type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = new FormData();
      
      // Append only the fields that the backend expects
      submitData.append('sellerName', formData.sellerName);
      submitData.append('storeName', formData.storeName);
      submitData.append('storeDescription', formData.storeDescription);
      submitData.append('contactEmail', formData.contactEmail);
      submitData.append('contactPhone', formData.contactPhone);
      submitData.append('businessType', formData.businessType);
      submitData.append('sellerType', formData.sellerType);
      
      // Add required businessAddress fields (country is required)
      submitData.append('businessAddress[country]', 'Digital'); // Default for digital marketplace
      submitData.append('businessAddress[street]', '');
      submitData.append('businessAddress[city]', '');
      submitData.append('businessAddress[state]', '');
      submitData.append('businessAddress[zipCode]', '');
      
      // Add optional fields with defaults
      submitData.append('taxId', '');
      submitData.append('paymentDetails[paypalEmail]', '');
      submitData.append('paymentDetails[bankAccountNumber]', '');
      submitData.append('paymentDetails[bankName]', '');
      submitData.append('paymentDetails[bankIFSC]', '');
      submitData.append('paymentDetails[upiId]', '');
      
      // Only append storeLogo if it exists (backend expects single file upload)
      if (formData.storeLogo) {
        submitData.append('storeLogo', formData.storeLogo);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/sellers/create`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setShowSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: unknown) {
      console.error("Error creating seller:", error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : "Failed to create seller profile";
      setErrors({ 
        submit: errorMessage || "Failed to create seller profile"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        sellerType: "",
        sellerName: "",
        storeName: "",
        storeDescription: "",
        contactEmail: "",
        contactPhone: "",
        businessType: "",
        storeLogo: null
      });
      setSelectedSellerType("");
      setCurrentTab("type");
      setErrors({});
      setShowSuccess(false);
      onClose();
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    handleClose();
  };

  if (showSuccess) {
    return (
      <SellerSuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        sellerType={formData.sellerType}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Become a Seller
          </DialogTitle>
          <DialogDescription>
            Create your seller profile to start selling digital products and services on our marketplace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps - Only 3 steps */}
          <div className="flex items-center justify-between">
            {["Type", "Basic Info", "Media"].map((step, index) => {
              const stepNumber = index + 1;
              const isActive = 
                (step === "Type" && currentTab === "type") ||
                (step === "Basic Info" && currentTab === "basic") ||
                (step === "Media" && currentTab === "media");
              const isCompleted = 
                (step === "Type" && currentTab !== "type") ||
                (step === "Basic Info" && currentTab === "media");

              return (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    isActive 
                      ? 'bg-green-600 text-white' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
                  </div>
                  <span className={`ml-2 text-sm ${
                    isActive ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                  {index < 2 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-100' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            {/* Only 3 tabs - No Address or Payment */}
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="type">Seller Type</TabsTrigger>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            {/* Seller Type Selection */}
            <TabsContent value="type" className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">What do you want to sell?</h3>
                <p className="text-muted-foreground">Choose the type of marketplace you want to join.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sellerTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Card 
                      key={type.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedSellerType === type.id 
                          ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' 
                          : 'hover:border-green-300'
                      }`}
                      onClick={() => handleSellerTypeSelect(type.id)}
                    >
                      <CardHeader className="text-center">
                        <div className={`mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2`}>
                          <IconComponent className={`w-6 h-6 ${type.color}`} />
                        </div>
                        <CardTitle className="text-base">{type.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {type.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>

              {errors.sellerType && (
                <p className="text-sm text-red-600">{errors.sellerType}</p>
              )}
            </TabsContent>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sellerName">Your Name *</Label>
                    <Input
                      id="sellerName"
                      placeholder="Enter your full name"
                      value={formData.sellerName}
                      onChange={(e) => handleInputChange("sellerName", e.target.value)}
                      className={errors.sellerName ? "border-red-500" : ""}
                    />
                    {errors.sellerName && (
                      <p className="text-sm text-red-600">{errors.sellerName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      placeholder="Enter your store name"
                      value={formData.storeName}
                      onChange={(e) => handleInputChange("storeName", e.target.value)}
                      className={errors.storeName ? "border-red-500" : ""}
                    />
                    {errors.storeName && (
                      <p className="text-sm text-red-600">{errors.storeName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                      className={errors.contactEmail ? "border-red-500" : ""}
                    />
                    {errors.contactEmail && (
                      <p className="text-sm text-red-600">{errors.contactEmail}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Phone *</Label>
                    <Input
                      id="contactPhone"
                      placeholder="+1 (555) 123-4567"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                      className={errors.contactPhone ? "border-red-500" : ""}
                    />
                    {errors.contactPhone && (
                      <p className="text-sm text-red-600">{errors.contactPhone}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select 
                      value={formData.businessType} 
                      onValueChange={(value) => handleInputChange("businessType", value)}
                    >
                      <SelectTrigger className={errors.businessType ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.businessType && (
                      <p className="text-sm text-red-600">{errors.businessType}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="responseTime">Response Time</Label>
                    <Select 
                      value={formData.responseTime} 
                      onValueChange={(value) => handleInputChange("responseTime", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 hour">1 hour</SelectItem>
                        <SelectItem value="2 hours">2 hours</SelectItem>
                        <SelectItem value="4 hours">4 hours</SelectItem>
                        <SelectItem value="24 hours">24 hours</SelectItem>
                        <SelectItem value="48 hours">48 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="storeDescription">Store Description *</Label>
                    <Textarea
                      id="storeDescription"
                      placeholder="Describe your store and what you offer..."
                      value={formData.storeDescription}
                      onChange={(e) => handleInputChange("storeDescription", e.target.value)}
                      className={errors.storeDescription ? "border-red-500" : ""}
                      rows={4}
                    />
                    {errors.storeDescription && (
                      <p className="text-sm text-red-600">{errors.storeDescription}</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Media Upload */}
            <TabsContent value="media" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Store Logo (Optional)</Label>
                    <div className="mt-2">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-8 h-8 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> store logo
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleInputChange("storeLogo", e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </TabsContent>
          </Tabs>

          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {errors.submit}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <div className="flex gap-2">
              {currentTab !== "type" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentTab === "basic") setCurrentTab("type");
                    if (currentTab === "media") setCurrentTab("basic");
                  }}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
              
              {currentTab !== "media" ? (
                <Button
                  onClick={() => {
                    if (currentTab === "type") setCurrentTab("basic");
                    if (currentTab === "basic") setCurrentTab("media");
                  }}
                  disabled={loading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    "Become a Seller"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}