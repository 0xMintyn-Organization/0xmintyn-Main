'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, X, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

export interface ChatInputProps {
  onSend: (message: string, files: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  maxFiles?: number;
}

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 1000,
  maxFiles = 5,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check file count limit
    if (selectedFiles.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Check file size (10MB per file)
    const invalidFiles = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert('Some files exceed 10MB limit');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || disabled || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await onSend(message.trim(), selectedFiles);
      setMessage('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-white dark:bg-zinc-950 p-4">
      {selectedFiles.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments ({selectedFiles.length}/{maxFiles})
            </span>
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(idx)}
                  className="h-7 w-7 p-0"
                  disabled={isSending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
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
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending || selectedFiles.length >= maxFiles}
          className="rounded-full h-12 w-12 p-0"
          title="Attach files (max 5)"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <div className="flex-1">
          <Textarea
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="resize-none rounded-2xl"
            maxLength={maxLength}
            disabled={disabled || isSending}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {message.length}/{maxLength}
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && selectedFiles.length === 0)}
          size="lg"
          className="bg-green-600 hover:bg-green-700 rounded-full h-12 w-12 p-0"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}

