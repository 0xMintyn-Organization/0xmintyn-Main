'use client';

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, X, FileText, Image as ImageIcon, File, 
  AlertTriangle, Loader2, Paperclip, Trash2, Clock, User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import Image from 'next/image';

interface RevisionResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  revisionRequest: any;
  onResponseSuccess: () => void;
}

interface RevisionFile {
  file: File;
  preview?: string;
  id: string;
}

export default function RevisionResponseModal({
  isOpen,
  onClose,
  orderId,
  revisionRequest,
  onResponseSuccess
}: RevisionResponseModalProps) {
  const [responseMessage, setResponseMessage] = useState('');
  const [files, setFiles] = useState<RevisionFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [action, setAction] = useState<'accept' | 'reject'>('accept');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: RevisionFile[] = Array.from(selectedFiles).map(file => ({
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleResponse = async () => {
    if (action === 'accept' && files.length === 0) {
      toast({
        title: "Files Required",
        description: "Please upload revised files when accepting the revision request.",
        variant: "destructive"
      });
      return;
    }

    if (!responseMessage.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a response message.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('responseMessage', responseMessage);
      formData.append('action', action);
      
      // Add files only if accepting
      if (action === 'accept') {
        files.forEach((revisionFile) => {
          formData.append('revisionFiles', revisionFile.file);
        });
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/orders/${orderId}/respond-revision`,
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
          title: `🎉 Revision ${action === 'accept' ? 'Accepted' : 'Rejected'}!`,
          description: `Your response has been sent to the buyer.`,
        });
        
        // Clean up files
        files.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
        
        setFiles([]);
        setResponseMessage('');
        setUploadProgress(0);
        setAction('accept');
        onResponseSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Revision response error:', error);
      toast({
        title: "Response Failed",
        description: error.response?.data?.message || "Failed to respond to revision request. Please try again.",
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
      setResponseMessage('');
      setUploadProgress(0);
      setAction('accept');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Respond to Revision Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Revision Request Details */}
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Buyer's Revision Request
              </h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Reason:</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-800/30 p-2 rounded">
                    {revisionRequest?.revisionReason}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Details:</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-800/30 p-2 rounded">
                    {revisionRequest?.revisionDetails}
                  </p>
                </div>
                
                {revisionRequest?.requestedChanges && revisionRequest.requestedChanges.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Requested Changes:</p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-800/30 p-2 rounded space-y-1">
                      {revisionRequest.requestedChanges.map((change: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  <span>Requested on {formatDate(revisionRequest?.requestedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Selection */}
          <div className="space-y-3">
            <Label>Your Response</Label>
            <div className="flex gap-3">
              <Button
                variant={action === 'accept' ? 'default' : 'outline'}
                onClick={() => setAction('accept')}
                className={`flex-1 ${action === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                disabled={uploading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept & Upload Files
              </Button>
              <Button
                variant={action === 'reject' ? 'default' : 'outline'}
                onClick={() => setAction('reject')}
                className={`flex-1 ${action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Reject Request
              </Button>
            </div>
          </div>

          {/* Response Message */}
          <div className="space-y-2">
            <Label htmlFor="responseMessage">Response Message *</Label>
            <Textarea
              id="responseMessage"
              placeholder={
                action === 'accept' 
                  ? "Explain what changes you've made and any additional information for the buyer..."
                  : "Explain why you're rejecting this revision request..."
              }
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              className="min-h-[100px]"
              maxLength={2000}
            />
            <p className="text-sm text-gray-500">
              {responseMessage.length}/2000 characters
            </p>
          </div>

          {/* File Upload (only for accept) */}
          {action === 'accept' && (
            <div className="space-y-3">
              <Label>Revised Files *</Label>
              
              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-green-500 dark:hover:border-green-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Click to upload revised files or drag and drop
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
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
          )}

          {/* Guidelines */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Response Guidelines
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Be clear and professional in your response</li>
                <li>• If accepting, upload all revised files</li>
                <li>• If rejecting, explain your reasoning clearly</li>
                <li>• Ensure files match the requested changes</li>
                <li>• Buyer will be notified of your response</li>
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
              onClick={handleResponse}
              disabled={uploading || !responseMessage.trim() || (action === 'accept' && files.length === 0)}
              className={`flex-1 ${
                action === 'accept' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {action === 'accept' ? 'Uploading...' : 'Responding...'}
                </>
              ) : (
                <>
                  {action === 'accept' ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept & Upload
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Reject Request
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

