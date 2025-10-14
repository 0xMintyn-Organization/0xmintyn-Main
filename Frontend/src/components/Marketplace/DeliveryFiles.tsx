'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, FileText, Image as ImageIcon, File, 
  Package, Calendar, MessageSquare, Loader2,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import Image from 'next/image';

interface DeliveryFilesProps {
  orderId: string;
  orderStatus: string;
}

interface DeliveryFile {
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

export default function DeliveryFiles({ orderId, orderStatus }: DeliveryFilesProps) {
  const [deliveryFiles, setDeliveryFiles] = useState<DeliveryFile[]>([]);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (orderStatus === 'delivered' || orderStatus === 'completed') {
      fetchDeliveryFiles();
    }
  }, [orderId, orderStatus]);

  const fetchDeliveryFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}/delivery-files`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setDeliveryFiles(response.data.deliveryFiles || []);
        setDeliveryMessage(response.data.deliveryMessage || '');
        setDeliveryDate(response.data.deliveryDate || '');
      }
    } catch (error: any) {
      console.error('Error fetching delivery files:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery files.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: DeliveryFile) => {
    try {
      setDownloading(file.filename);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}/download/${file.filename}`,
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `${file.originalName} is being downloaded.`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloading(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!['delivered', 'completed'].includes(orderStatus)) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading delivery files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-600" />
          Delivery Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery Info */}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Order Delivered Successfully!
              </h4>
              {deliveryDate && (
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-2 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Delivered on {formatDate(deliveryDate)}
                </p>
              )}
              {deliveryMessage && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Seller's Message:
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 bg-white dark:bg-orange-800/30 p-3 rounded border">
                    {deliveryMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Files List */}
        {deliveryFiles.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Delivered Files ({deliveryFiles.length})
            </h4>
            <div className="space-y-2">
              {deliveryFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  {/* File Icon */}
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file.mimeType)}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {file.originalName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <Button
                    size="sm"
                    onClick={() => handleDownload(file)}
                    disabled={downloading === file.filename}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {downloading === file.filename ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No delivery files available yet.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {deliveryFiles.length > 0 && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Download all files
                deliveryFiles.forEach(file => {
                  setTimeout(() => handleDownload(file), 100);
                });
              }}
              disabled={downloading !== null}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                toast({
                  title: "Request Revision",
                  description: "Revision request functionality coming soon!",
                });
              }}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Request Revision
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
