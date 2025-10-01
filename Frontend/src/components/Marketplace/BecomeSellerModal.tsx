"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SellerSuccessModal from "./SellerSuccessModal";
import { 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  User,
  Store,
  MapPin,
  CreditCard,
  Building,
  Phone,
  Mail,
  ImageIcon,
  Package,
  Users,
  Briefcase
} from "lucide-react";
import Image from "next/image";
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
    color: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300"
  },
  {
    id: "services",
    name: "Services",
    description: "Offer services like design, development, consulting, etc.",
    icon: Briefcase,
    color: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-300"
  },
  {
    id: "both",
    name: "Both Products & Services",
    description: "Sell digital products and offer services",
    icon: Store,
    color: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-300"
  }
];

export default function BecomeSellerModal({ isOpen, onClose, onSuccess }: BecomeSellerModalProps) {
  const [currentTab, setCurrentTab] = useState("type");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedSellerType, setSelectedSellerType] = useState<string>("");

  const [formData, setFormData] = useState({
    // Seller Type
    sellerType: "",
    
    // Basic Information
    sellerName: "",
    storeName: "",
    storeDescription: "",
    contactEmail: "",
    contactPhone: "",
    businessType: "Individual",
    
    // Business Address
    businessAddress: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: ""
    },
    
    // Tax Information
    taxId: "",
    
    // Payment Details
    paymentDetails: {
      paypalEmail: "",
      bankAccountNumber: "",
      bankName: "",
      bankIFSC: "",
      upiId: ""
    }
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Seller Type validation
    if (!formData.sellerType.trim()) newErrors.sellerType = "Please select what you want to sell";
    
    // Basic Information validation
    if (!formData.sellerName.trim()) newErrors.sellerName = "Seller name is required";
    if (!formData.storeName.trim()) newErrors.storeName = "Store name is required";
    if (!formData.storeDescription.trim()) newErrors.storeDescription = "Store description is required";
    if (!formData.contactEmail.trim()) newErrors.contactEmail = "Contact email is required";
    if (!formData.contactPhone.trim()) newErrors.contactPhone = "Contact phone is required";
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email address";
    }

    // Business Address validation
    if (!formData.businessAddress.country.trim()) newErrors.country = "Country is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setCurrentTab("type");
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Append seller type
      submitData.append("sellerType", formData.sellerType);
      
      // Append basic information
      submitData.append("sellerName", formData.sellerName);
      submitData.append("storeName", formData.storeName);
      submitData.append("storeDescription", formData.storeDescription);
      submitData.append("contactEmail", formData.contactEmail);
      submitData.append("contactPhone", formData.contactPhone);
      submitData.append("businessType", formData.businessType);
      
      // Append business address
      submitData.append("businessAddress", JSON.stringify(formData.businessAddress));
      
      // Append tax information
      submitData.append("taxId", formData.taxId);
      
      // Append payment details
      submitData.append("paymentDetails", JSON.stringify(formData.paymentDetails));
      
      // Append logo if uploaded
      if (logoFile) {
        submitData.append("storeLogo", logoFile);
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/marketplace/sellers/create`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setShowSuccessModal(true);
      }

    } catch (error: any) {
      console.error("Error creating seller profile:", error);
      setErrors({ 
        submit: error.response?.data?.message || "Failed to create seller profile" 
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
        businessType: "Individual",
        businessAddress: {
          street: "",
          city: "",
          state: "",
          country: "",
          zipCode: ""
        },
        taxId: "",
        paymentDetails: {
          paypalEmail: "",
          bankAccountNumber: "",
          bankName: "",
          bankIFSC: "",
          upiId: ""
        }
      });
      setErrors({});
      setLogoPreview(null);
      setLogoFile(null);
      setCurrentTab("type");
      setShowSuccessModal(false);
      onClose();
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Store className="h-6 w-6 text-green-600" />
            Become a Seller
          </DialogTitle>
          <DialogDescription>
            Create your seller profile to start selling digital products and services on our marketplace.
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {errors.submit && (
          <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="type" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Type</span>
            </TabsTrigger>
            <TabsTrigger value="basic" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Basic Info</span>
            </TabsTrigger>
            <TabsTrigger value="address" className="gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Address</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
          </TabsList>

            {/* Seller Type Selection Tab */}
            <TabsContent value="type" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>What do you want to sell?</CardTitle>
                  <CardDescription>
                    Choose the type of marketplace you want to join
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sellerTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <div
                          key={type.id}
                          className={`relative cursor-pointer rounded-lg border-2 p-6 transition-all hover:shadow-md ${
                            formData.sellerType === type.id
                              ? `border-green-500 bg-green-50 dark:bg-green-950/20 ${type.color}`
                              : "border-gray-200 dark:border-zinc-700 hover:border-green-300"
                          }`}
                          onClick={() => {
                            handleInputChange("sellerType", type.id);
                            setSelectedSellerType(type.id);
                          }}
                        >
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className={`p-3 rounded-full ${
                              formData.sellerType === type.id 
                                ? "bg-green-100 dark:bg-green-900/30" 
                                : "bg-gray-100 dark:bg-zinc-800"
                            }`}>
                              <IconComponent className={`h-6 w-6 ${
                                formData.sellerType === type.id 
                                  ? "text-green-600 dark:text-green-400" 
                                  : "text-gray-600 dark:text-gray-400"
                              }`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {type.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {type.description}
                              </p>
                            </div>
                            {formData.sellerType === type.id && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {errors.sellerType && (
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{errors.sellerType}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sellerName">
                        Seller Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="sellerName"
                        value={formData.sellerName}
                        onChange={(e) => handleInputChange("sellerName", e.target.value)}
                        placeholder="Your full name"
                        className={errors.sellerName ? "border-red-500" : ""}
                      />
                      {errors.sellerName && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.sellerName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeName">
                        Store Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="storeName"
                        value={formData.storeName}
                        onChange={(e) => handleInputChange("storeName", e.target.value)}
                        placeholder="Your store name"
                        className={errors.storeName ? "border-red-500" : ""}
                      />
                      {errors.storeName && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.storeName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">
                      Store Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="storeDescription"
                      value={formData.storeDescription}
                      onChange={(e) => handleInputChange("storeDescription", e.target.value)}
                      placeholder="Describe your store and what you offer..."
                      rows={4}
                      className={errors.storeDescription ? "border-red-500" : ""}
                    />
                    {errors.storeDescription && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.storeDescription}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">
                        Contact Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contactEmail"
                          type="email"
                          value={formData.contactEmail}
                          onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                          placeholder="your@email.com"
                          className={`pl-10 ${errors.contactEmail ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.contactEmail && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.contactEmail}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">
                        Contact Phone <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="contactPhone"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className={`pl-10 ${errors.contactPhone ? "border-red-500" : ""}`}
                        />
                      </div>
                      {errors.contactPhone && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.contactPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select 
                      value={formData.businessType} 
                      onValueChange={(value) => handleInputChange("businessType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Address Tab */}
            <TabsContent value="address" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.businessAddress.street}
                      onChange={(e) => handleInputChange("businessAddress.street", e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.businessAddress.city}
                        onChange={(e) => handleInputChange("businessAddress.city", e.target.value)}
                        placeholder="New York"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={formData.businessAddress.state}
                        onChange={(e) => handleInputChange("businessAddress.state", e.target.value)}
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="country">
                        Country <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="country"
                        value={formData.businessAddress.country}
                        onChange={(e) => handleInputChange("businessAddress.country", e.target.value)}
                        placeholder="United States"
                        className={errors.country ? "border-red-500" : ""}
                      />
                      {errors.country && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.country}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.businessAddress.zipCode}
                        onChange={(e) => handleInputChange("businessAddress.zipCode", e.target.value)}
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID (Optional)</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange("taxId", e.target.value)}
                      placeholder="Tax identification number"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Details Tab */}
            <TabsContent value="payment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="paypalEmail">PayPal Email</Label>
                    <Input
                      id="paypalEmail"
                      type="email"
                      value={formData.paymentDetails.paypalEmail}
                      onChange={(e) => handleInputChange("paymentDetails.paypalEmail", e.target.value)}
                      placeholder="paypal@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                      <Input
                        id="bankAccountNumber"
                        value={formData.paymentDetails.bankAccountNumber}
                        onChange={(e) => handleInputChange("paymentDetails.bankAccountNumber", e.target.value)}
                        placeholder="Account number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={formData.paymentDetails.bankName}
                        onChange={(e) => handleInputChange("paymentDetails.bankName", e.target.value)}
                        placeholder="Bank name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="bankIFSC">Bank IFSC Code</Label>
                      <Input
                        id="bankIFSC"
                        value={formData.paymentDetails.bankIFSC}
                        onChange={(e) => handleInputChange("paymentDetails.bankIFSC", e.target.value)}
                        placeholder="IFSC code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        value={formData.paymentDetails.upiId}
                        onChange={(e) => handleInputChange("paymentDetails.upiId", e.target.value)}
                        placeholder="yourname@upi"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Store Logo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                      {logoPreview ? (
                        <div className="space-y-4">
                          <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden border-2 border-green-500">
                            <Image
                              src={logoPreview}
                              alt="Logo preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="text-sm text-green-600">Logo uploaded successfully</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground mb-4">
                            Upload your store logo
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Label htmlFor="logo-upload" className="cursor-pointer">
                        <Button type="button" variant="outline">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Choose Logo
                        </Button>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG up to 5MB • Recommended: 300x300px
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            {currentTab !== "type" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const tabs = ["type", "basic", "address", "payment", "media"];
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
                  const tabs = ["type", "basic", "address", "payment", "media"];
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
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Become a Seller
                  </>
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Success Modal */}
        <SellerSuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessClose}
          sellerType={formData.sellerType}
        />
      </DialogContent>
    </Dialog>
  );
}
