'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Send, X, CheckCircle, AlertCircle, Loader2, Paperclip, File, FileText, FileImage, Download } from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: {
    _id: string;
    sellerName: string;
    storeName?: string;
    storeLogo?: string;
    sellerLevel?: string;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
    responseTime?: string;
  };
  serviceTitle?: string;
  serviceId?: string;
}

export default function ContactSellerModal({ 
  isOpen, 
  onClose, 
  seller,
  serviceTitle,
  serviceId 
}: ContactSellerModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Pre-fill subject if service is provided
  React.useEffect(() => {
    if (serviceTitle && !subject) {
      setSubject(`Inquiry about: ${serviceTitle}`);
    }
  }, [serviceTitle, subject]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > 5) {
      setError('You can only attach up to 5 files');
      return;
    }

    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Each file must be less than 10MB');
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleSendMessage = async () => {
    // Validation
    if (!message.trim() && selectedFiles.length === 0) {
      setError('Please enter a message or attach a file');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!isAuthenticated) {
      setError('You must be logged in to send messages');
      return;
    }

    try {
      setSending(true);
      setError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('sellerId', seller._id);
      formData.append('subject', subject.trim());
      formData.append('message', message.trim() || '(File attachment)');
      
      if (serviceId) {
        formData.append('serviceId', serviceId);
      }

      // Append files
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      // API call to send message
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/send`,
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSent(true);
        // Reset form and redirect to messenger
        setTimeout(() => {
          setMessage('');
          setSubject('');
          setSelectedFiles([]);
          setSent(false);
          onClose();
          // Redirect to messenger with conversation parameter
          window.location.href = `/marketplace/messages?conversation=${response.data.data._id}`;
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setMessage('');
      setSubject('');
      setSelectedFiles([]);
      setError(null);
      setSent(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Contact Seller</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={sending}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Send a message to the seller. They typically respond within their stated response time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seller Info Card */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12">
                {seller.storeLogo ? (
                  <Image
                    src={seller.storeLogo}
                    alt={seller.sellerName}
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {seller.sellerName?.charAt(0) || 'S'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold">{seller.sellerName}</h4>
                  {seller.verified && (
                    <Badge className="bg-blue-500 text-white text-xs">Verified</Badge>
                  )}
                  {seller.sellerLevel && (
                    <Badge className="bg-green-500 text-white text-xs">{seller.sellerLevel}</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-1">
                  {seller.rating !== undefined && (
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                      {seller.rating} ({seller.reviewCount || 0})
                    </div>
                  )}
                  {seller.responseTime && (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      ⚡ Responds in {seller.responseTime}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Success State */}
          {sent && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Message sent successfully!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    The seller will respond to your message soon.
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

          {/* Message Form */}
          {!sent && (
            <div className="space-y-4">
              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="What is your message about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground">
                  {subject.length}/150 characters
                </p>
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Write your message here... Be specific about your requirements."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending}
                  rows={6}
                  maxLength={1000}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {message.length}/1000 characters
                </p>
              </div>

              {/* File Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.zip,.rar"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || selectedFiles.length >= 5}
                  className="w-full"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach Files ({selectedFiles.length}/5)
                </Button>
                
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Message Templates */}
              <div className="space-y-2">
                <Label className="text-xs">Quick templates:</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setMessage('Hi, I would like to discuss the project requirements. Can you please share more details about your process?')}
                    disabled={sending}
                  >
                    Ask about process
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setMessage('Hello, I am interested in your service. Can we discuss pricing and timeline for my specific needs?')}
                    disabled={sending}
                  >
                    Discuss pricing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setMessage('Hi, I have reviewed your portfolio. Can we schedule a call to discuss my project in detail?')}
                    disabled={sending}
                  >
                    Request call
                  </Button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Tips for better responses:</strong> Be clear about your requirements, 
                  budget, and timeline. The more details you provide, the better the seller can help you.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!sent && (
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={sending || (!message.trim() && selectedFiles.length === 0) || !subject.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                    {selectedFiles.length > 0 && ` (${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})`}
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

