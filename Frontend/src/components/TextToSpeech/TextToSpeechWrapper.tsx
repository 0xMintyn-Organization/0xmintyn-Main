"use client";
import React, { ReactNode } from 'react';
import { useTextToSpeech } from '@/contexts/TextToSpeechContext';

interface TextToSpeechWrapperProps {
  children: ReactNode;
  className?: string;
}

export const TextToSpeechWrapper: React.FC<TextToSpeechWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  const { isEnabled, speak, stop, isSpeaking } = useTextToSpeech();

  const handleClick = () => {
    if (!isEnabled) {
      console.log('TTS: Not enabled, ignoring click');
      return;
    }
    
    // Stop any current speech
    if (isSpeaking) {
      console.log('TTS: Stopping current speech');
      stop();
      return;
    }

    // Get text content from the element
    const text = typeof children === 'string' 
      ? children 
      : (children as any)?.props?.children || 
        (children as any)?.toString() || 
        '';

    console.log('TTS: Clicked on text:', text);

    if (text && text.trim()) {
      speak(text);
    } else {
      console.log('TTS: No text found to speak');
    }
  };

  if (!isEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={`tts-enabled ${className}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </div>
  );
};
