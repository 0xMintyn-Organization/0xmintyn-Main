'use client';

import React from 'react';
import { CheckCheck, Check } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

export interface MessageAttachment {
  originalName: string;
  fileSize: number;
  mimeType: string;
}

export interface MessageBubbleProps {
  message: string;
  isMine: boolean;
  timestamp: string;
  isRead: boolean;
  attachments?: MessageAttachment[];
}

export default function MessageBubble({
  message,
  isMine,
  timestamp,
  isRead,
  attachments,
}: MessageBubbleProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isMine
            ? 'bg-green-600 text-white rounded-br-none'
            : 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        
        {attachments && attachments.length > 0 && (
          <div className={`mt-3 pt-3 border-t ${
            isMine ? 'border-green-500' : 'border-gray-200 dark:border-zinc-700'
          }`}>
            <p className={`text-xs font-semibold ${
              isMine ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
            }`}>
              Attachments
            </p>
            <div className="mt-2 space-y-2">
              {attachments.map((attachment, idx) => (
                <div
                  key={idx}
                  className={`text-xs ${
                    isMine ? 'text-green-50' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {attachment.originalName} • {formatFileSize(attachment.fileSize)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end mt-2 gap-1">
          <span className={`text-xs ${
            isMine ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formattedTime}
          </span>
          {isMine && (
            isRead ? (
              <CheckCheck className="w-4 h-4 text-blue-200" />
            ) : (
              <Check className="w-4 h-4 text-green-100" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

