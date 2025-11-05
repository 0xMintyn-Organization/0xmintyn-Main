"use client";
import React, { useEffect, useState } from 'react';
import { useTextToSpeech } from '@/contexts/TextToSpeechContext';

export const GlobalTextSelection: React.FC = () => {
  const { isEnabled, speak, stop, isSpeaking } = useTextToSpeech();
  const [selectedText, setSelectedText] = useState('');
  const [showControls, setShowControls] = useState(false);
  const [selectionPosition, setSelectionPosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !isEnabled) return;

    const handleTextSelection = (e: MouseEvent | TouchEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        setSelectedText(text);
        
        // Get selection position
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
        }
        
        setShowControls(true);
        
        // Auto-speak the selected text
        speak(text);
      } else {
        setShowControls(false);
        setSelectedText('');
      }
    };

    const handleClickOutside = () => {
      setShowControls(false);
      setSelectedText('');
    };

    // Add event listeners
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isClient, isEnabled, speak]);

  if (!isClient || !isEnabled || !showControls || !selectedText) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 flex items-center gap-2"
      style={{
        left: `${Math.min(selectionPosition.x, window.innerWidth - 200)}px`,
        top: `${Math.max(selectionPosition.y, 10)}px`,
      }}
    >
      <button
        onClick={() => speak(selectedText)}
        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
        disabled={isSpeaking}
      >
        🔊 Speak
      </button>
      <button
        onClick={stop}
        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        disabled={!isSpeaking}
      >
        ⏹️ Stop
      </button>
      <span className="text-xs text-gray-600 dark:text-gray-400 max-w-32 truncate">
        "{selectedText.substring(0, 20)}{selectedText.length > 20 ? '...' : ''}"
      </span>
    </div>
  );
};
