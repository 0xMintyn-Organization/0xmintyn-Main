'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, DollarSign, Clock, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface SimpleOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  buyerId: string;
  buyerName: string;
  serviceTitle?: string;
  serviceId?: string;
  productId?: string;
  onOfferCreated: () => void;
}

export default function SimpleOfferModal({
  isOpen,
  onClose,
  conversationId,
  buyerId,
  buyerName,
  serviceTitle,
  serviceId,
  productId,
  onOfferCreated
}: SimpleOfferModalProps) {
  const [formData, setFormData] = useState({
    offerTitle: '',
    offerDescription: '',
    price: '',
    deliveryTime: '3 Days',
    revisions: '2',
    deliverables: '',
    additionalTerms: ''
  });
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        offerTitle: serviceTitle ? `Custom ${serviceTitle}` : 'Custom Offer',
        offerDescription: '',
        price: '',
        deliveryTime: '3 Days',
        revisions: '2',
        deliverables: '',
        additionalTerms: ''
      });
      setErrors({});
    }
  }, [isOpen, serviceTitle]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.offerTitle.trim()) {
      newErrors.offerTitle = 'Offer title is required';
    } else if (formData.offerTitle.length > 200) {
      newErrors.offerTitle = 'Title cannot exceed 200 characters';
    }

    if (!formData.offerDescription.trim()) {
      newErrors.offerDescription = 'Offer description is required';
    } else if (formData.offerDescription.length > 2000) {
      newErrors.offerDescription = 'Description cannot exceed 2000 characters';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.deliveryTime) {
      newErrors.deliveryTime = 'Delivery time is required';
    }

    if (!formData.revisions) {
      newErrors.revisions = 'Number of revisions is required';
    } else if (isNaN(parseInt(formData.revisions)) || parseInt(formData.revisions) < 0) {
      newErrors.revisions = 'Please enter a valid number of revisions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSending(true);
    try {
      const offerData = {
        conversationId,
        buyerId,
        serviceId: serviceId || undefined,
        productId: productId || undefined,
        offerTitle: formData.offerTitle.trim(),
        offerDescription: formData.offerDescription.trim(),
        deliverables: formData.deliverables.trim() ? [formData.deliverables.trim()] : [],
        price: parseFloat(formData.price),
        deliveryTime: formData.deliveryTime,
        revisions: parseInt(formData.revisions),
        additionalTerms: formData.additionalTerms.trim(),
        expiresInDays: 7 // Offers expire in 7 days
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/offers/create`,
        offerData,
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "🎉 Offer Sent Successfully!",
          description: `Your custom offer has been sent to ${buyerName}. They'll be notified immediately.`,
        });
        onOfferCreated();
        onClose();
      }
    } catch (error: any) {
      console.error('Error creating offer:', error);
      toast({
        variant: "destructive",
        title: "Failed to Send Offer",
        description: error.response?.data?.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6 text-blue-600" />
            Send Custom Offer to {buyerName}
          </DialogTitle>
          <p className="text-gray-600">
            Create a personalized offer with pricing and terms for this project.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="offerTitle" className="text-sm font-semibold">
              Offer Title *
            </Label>
            <Input
              id="offerTitle"
              value={formData.offerTitle}
              onChange={(e) => handleInputChange('offerTitle', e.target.value)}
              placeholder="e.g., Custom Logo Design Package"
              className={errors.offerTitle ? 'border-red-500' : ''}
              maxLength={200}
            />
            {errors.offerTitle && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.offerTitle}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="offerDescription" className="text-sm font-semibold">
              What's included in this offer? *
            </Label>
            <Textarea
              id="offerDescription"
              value={formData.offerDescription}
              onChange={(e) => handleInputChange('offerDescription', e.target.value)}
              placeholder="Describe what you'll deliver, the scope of work, timeline, and any special requirements..."
              rows={4}
              className={errors.offerDescription ? 'border-red-500' : ''}
              maxLength={2000}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formData.offerDescription.length}/2000 characters</span>
              {errors.offerDescription && (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.offerDescription}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-semibold">
              Price (USD) *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="150"
                className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                min="0"
                step="0.01"
              />
            </div>
            {errors.price && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.price}
              </p>
            )}
          </div>

          {/* Delivery Time & Revisions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryTime" className="text-sm font-semibold">
                Delivery Time *
              </Label>
              <Select value={formData.deliveryTime} onValueChange={(value) => handleInputChange('deliveryTime', value)}>
                <SelectTrigger className={errors.deliveryTime ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 Day">1 Day</SelectItem>
                  <SelectItem value="2 Days">2 Days</SelectItem>
                  <SelectItem value="3 Days">3 Days</SelectItem>
                  <SelectItem value="5 Days">5 Days</SelectItem>
                  <SelectItem value="1 Week">1 Week</SelectItem>
                  <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                  <SelectItem value="3 Weeks">3 Weeks</SelectItem>
                  <SelectItem value="1 Month">1 Month</SelectItem>
                </SelectContent>
              </Select>
              {errors.deliveryTime && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.deliveryTime}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="revisions" className="text-sm font-semibold">
                Revisions *
              </Label>
              <Select value={formData.revisions} onValueChange={(value) => handleInputChange('revisions', value)}>
                <SelectTrigger className={errors.revisions ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 Revisions</SelectItem>
                  <SelectItem value="1">1 Revision</SelectItem>
                  <SelectItem value="2">2 Revisions</SelectItem>
                  <SelectItem value="3">3 Revisions</SelectItem>
                  <SelectItem value="5">5 Revisions</SelectItem>
                  <SelectItem value="Unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
              {errors.revisions && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.revisions}
                </p>
              )}
            </div>
          </div>

          {/* Deliverables */}
          <div className="space-y-2">
            <Label htmlFor="deliverables" className="text-sm font-semibold">
              Key Deliverables (Optional)
            </Label>
            <Input
              id="deliverables"
              value={formData.deliverables}
              onChange={(e) => handleInputChange('deliverables', e.target.value)}
              placeholder="e.g., Logo in PNG, JPG, and SVG formats"
            />
          </div>

          {/* Additional Terms */}
          <div className="space-y-2">
            <Label htmlFor="additionalTerms" className="text-sm font-semibold">
              Additional Terms (Optional)
            </Label>
            <Textarea
              id="additionalTerms"
              value={formData.additionalTerms}
              onChange={(e) => handleInputChange('additionalTerms', e.target.value)}
              placeholder="Any special terms, requirements, or conditions..."
              rows={2}
              maxLength={1000}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Offer...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Send Offer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
