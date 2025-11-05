'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, DollarSign, Clock, RefreshCw, FileText, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  buyerId: string;
  buyerName: string;
  serviceId?: string;
  serviceTitle?: string;
  productId?: string;
  productTitle?: string;
  onOfferCreated?: () => void;
}

export default function CreateOfferModal({ 
  isOpen, 
  onClose, 
  conversationId,
  buyerId,
  buyerName,
  serviceId,
  serviceTitle,
  productId,
  productTitle,
  onOfferCreated
}: CreateOfferModalProps) {
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('3 Days');
  const [revisions, setRevisions] = useState('2');
  const [deliverables, setDeliverables] = useState<string[]>(['']);
  const [additionalTerms, setAdditionalTerms] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('3');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (serviceTitle && !offerTitle) {
      setOfferTitle(`Custom offer for: ${serviceTitle}`);
    } else if (productTitle && !offerTitle) {
      setOfferTitle(`Custom offer for: ${productTitle}`);
    }
  }, [serviceTitle, productTitle, offerTitle]);

  const addDeliverable = () => {
    if (deliverables.length < 10) {
      setDeliverables([...deliverables, '']);
    }
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const updateDeliverable = (index: number, value: string) => {
    const newDeliverables = [...deliverables];
    newDeliverables[index] = value;
    setDeliverables(newDeliverables);
  };

  const handleCreateOffer = async () => {
    // Validation
    if (!offerTitle.trim()) {
      setError('Please enter an offer title');
      return;
    }

    if (!offerDescription.trim()) {
      setError('Please enter an offer description');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }

    const validDeliverables = deliverables.filter(d => d.trim());
    if (validDeliverables.length === 0) {
      setError('Please add at least one deliverable');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/offers/create`,
        {
          conversationId,
          buyerId,
          serviceId: serviceId || null,
          productId: productId || null,
          offerTitle: offerTitle.trim(),
          offerDescription: offerDescription.trim(),
          deliverables: validDeliverables,
          price: parseFloat(price),
          deliveryTime,
          revisions: parseInt(revisions) || 0,
          additionalTerms: additionalTerms.trim(),
          expiresInDays: parseInt(expiresInDays)
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setCreated(true);
        if (onOfferCreated) {
          onOfferCreated();
        }
        setTimeout(() => {
          resetForm();
          setCreated(false);
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error creating offer:', error);
      setError(error.response?.data?.message || error.response?.data?.error || 'Failed to create offer. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setOfferTitle('');
    setOfferDescription('');
    setPrice('');
    setDeliveryTime('3 Days');
    setRevisions('2');
    setDeliverables(['']);
    setAdditionalTerms('');
    setExpiresInDays('3');
    setError(null);
  };

  const handleClose = () => {
    if (!creating) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-base">Create Custom Offer</DialogTitle>
          <DialogDescription className="text-xs mt-1">
            For {buyerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Success State */}
          {created && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Offer created successfully!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    The buyer can now review and accept your offer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!created && (
            <div className="space-y-3">
              {/* Service/Product Context */}
              {(serviceTitle || productTitle) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-xs">
                      {serviceId ? '🎯 Service' : '📦 Product'}
                    </Badge>
                    <span className="text-xs font-medium truncate">{serviceTitle || productTitle}</span>
                  </div>
                </div>
              )}

              {/* Offer Title */}
              <div className="space-y-1.5">
                <Label htmlFor="offerTitle" className="text-xs font-semibold">Offer Title *</Label>
                <Input
                  id="offerTitle"
                  placeholder="e.g., Custom Website Design Package"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  disabled={creating}
                  maxLength={200}
                />
              </div>

              {/* Offer Description */}
              <div className="space-y-1.5">
                <Label htmlFor="offerDescription" className="text-xs font-semibold">Description *</Label>
                <Textarea
                  id="offerDescription"
                  placeholder="What you'll deliver, scope, timeline..."
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  disabled={creating}
                  rows={3}
                  className="text-sm min-h-[80px] max-h-[100px] resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">{offerDescription.length}/2000</p>
              </div>

              {/* Pricing and Timeline */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-semibold">Price (USD) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={creating}
                      className="pl-10"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deliveryTime" className="text-xs font-semibold">Delivery Time *</Label>
                  <Select value={deliveryTime} onValueChange={setDeliveryTime} disabled={creating}>
                    <SelectTrigger>
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="revisions" className="text-xs font-semibold">Revisions</Label>
                  <div className="relative">
                    <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="revisions"
                      type="number"
                      value={revisions}
                      onChange={(e) => setRevisions(e.target.value)}
                      disabled={creating}
                      className="pl-10"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expiresIn" className="text-xs font-semibold">Expires In</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays} disabled={creating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="2">2 Days</SelectItem>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="7">1 Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Deliverables */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Deliverables *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={addDeliverable}
                    disabled={creating || deliverables.length >= 10}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {deliverables.map((deliverable, index) => (
                    <div key={index} className="flex gap-1.5">
                      <Input
                        placeholder={`Item ${index + 1}`}
                        value={deliverable}
                        onChange={(e) => updateDeliverable(index, e.target.value)}
                        disabled={creating}
                        className="text-sm h-8"
                      />
                      {deliverables.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => removeDeliverable(index)}
                          disabled={creating}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Terms */}
              <div className="space-y-1.5">
                <Label htmlFor="additionalTerms" className="text-xs font-semibold">Additional Terms (Optional)</Label>
                <Textarea
                  id="additionalTerms"
                  placeholder="Special terms or conditions..."
                  value={additionalTerms}
                  onChange={(e) => setAdditionalTerms(e.target.value)}
                  disabled={creating}
                  rows={2}
                  className="text-sm min-h-[60px] max-h-[80px] resize-none"
                  maxLength={1000}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!created && (
            <div className="flex justify-end gap-2 px-5 py-3 border-t bg-background flex-shrink-0">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOffer}
                disabled={creating}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Custom Offer
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

