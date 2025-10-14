'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, X, FileText, Image as ImageIcon, File, CheckCircle, 
  AlertCircle, Loader2, Paperclip, Trash2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import Image from 'next/image';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItems: any[];
  onDeliverySuccess: () => void;
}

interface DeliveryFile {
  file: File;
  preview?: string;
  id: string;
}

export default function DeliveryModal({
  isOpen,
  onClose,
  orderId,
  orderItems,
  onDeliverySuccess
}: DeliveryModalProps) {
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [files, setFiles] = useState<DeliveryFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: DeliveryFile[] = Array.from(selectedFiles).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelivery = async () => {
    if (!deliveryMessage.trim() && files.length === 0) {
      toast({
        title: "Delivery Required",
        description: "Please add a delivery message or upload files.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('orderId', orderId);
      formData.append('deliveryMessage', deliveryMessage);
      
      // Add files
      files.forEach((deliveryFile, index) => {
        formData.append(`deliveryFiles`, deliveryFile.file);
      });

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}/deliver`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "🎉 Delivery Successful!",
          description: "Your order has been delivered to the buyer.",
        });
        
        // Clean up files
        files.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
        
        setFiles([]);
        setDeliveryMessage('');
        setUploadProgress(0);
        onDeliverySuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Delivery error:', error);
      toast({
        title: "Delivery Failed",
        description: error.response?.data?.message || "Failed to deliver order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      // Clean up files
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setFiles([]);
      setDeliveryMessage('');
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Deliver Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Items Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Order Items to Deliver:</h4>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.itemTitle}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.itemType === 'service' ? 'Service' : 'Product'}
                        {item.packageDetails?.packageName && ` • ${item.packageDetails.packageName}`}
                      </p>
                    </div>
                    <Badge variant="outline">${item.itemPrice}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Message */}
          <div className="space-y-2">
            <Label htmlFor="deliveryMessage">Delivery Message *</Label>
            <Textarea
              id="deliveryMessage"
              placeholder="Add a message for the buyer about the delivery, instructions, or any additional information..."
              value={deliveryMessage}
              onChange={(e) => setDeliveryMessage(e.target.value)}
              className="min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-sm text-gray-500">
              {deliveryMessage.length}/1000 characters
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label>Delivery Files (Optional)</Label>
            
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Click to upload files or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Images, PDFs, ZIP files, etc. (Max 10MB per file)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept="image/*,.pdf,.zip,.rar,.doc,.docx,.txt,.psd,.ai,.sketch,.figma"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading files... {uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Files:</p>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {file.preview ? (
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={file.preview}
                            alt="Preview"
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                          {getFileIcon(file.file)}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={uploading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delivery Guidelines */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Delivery Guidelines
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Include all completed work files</li>
                <li>• Provide clear instructions if needed</li>
                <li>• Ensure files are properly named and organized</li>
                <li>• Buyer has 3 days to review and request revisions</li>
                <li>• Order will be marked as "Delivered" after submission</li>
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelivery}
              disabled={uploading || (!deliveryMessage.trim() && files.length === 0)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Delivering...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Deliver Order
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
