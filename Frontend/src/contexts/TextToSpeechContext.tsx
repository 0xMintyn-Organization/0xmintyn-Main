"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TextToSpeechContextType {
  isEnabled: boolean;
  isSpeaking: boolean;
  currentText: string;
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  toggleTTS: () => void;
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  voices: SpeechSynthesisVoice[];
}

const TextToSpeechContext = createContext<TextToSpeechContextType | undefined>(undefined);

export const useTextToSpeech = () => {
  const context = useContext(TextToSpeechContext);
  if (!context) {
    throw new Error('useTextToSpeech must be used within a TextToSpeechProvider');
  }
  return context;
};

interface TextToSpeechProviderProps {
  children: ReactNode;
}

export const TextToSpeechProvider: React.FC<TextToSpeechProviderProps> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load settings from localStorage
  useEffect(() => {
    if (!isClient) return;
    
    const savedSettings = localStorage.getItem('tts-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setIsEnabled(settings.isEnabled || false);
      setRate(settings.rate || 1);
      setPitch(settings.pitch || 1);
      setVolume(settings.volume || 1);
    }
  }, [isClient]);

  // Load available voices
  useEffect(() => {
    if (!isClient) return;
    
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find a preferred voice (English, female if available)
      const preferredVoice = availableVoices.find(
        voice => voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || availableVoices.find(voice => voice.lang.startsWith('en')) || availableVoices[0];
      
      if (preferredVoice && !voice) {
        setVoice(preferredVoice);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isClient, voice]);

  const toggleTTS = () => {
    if (!isClient) return;
    
    const newEnabled = !isEnabled;
    console.log('TTS: Toggling TTS to:', newEnabled); // Debug log
    setIsEnabled(newEnabled);
    
    // Save to localStorage
    const settings = {
      isEnabled: newEnabled,
      rate,
      pitch,
      volume
    };
    localStorage.setItem('tts-settings', JSON.stringify(settings));

    // Stop current speech if disabling
    if (!newEnabled && isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text: string) => {
    if (!isClient || !isEnabled || !text.trim()) return;

    console.log('TTS: Starting to speak:', text); // Debug log

    // Stop any current speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voice) {
      utterance.voice = voice;
      console.log('TTS: Using voice:', voice.name); // Debug log
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      console.log('TTS: Speech started'); // Debug log
      setIsSpeaking(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      console.log('TTS: Speech ended'); // Debug log
      setIsSpeaking(false);
      setCurrentText('');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      setCurrentText('');
    };

    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (!isClient) return;
    
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentText('');
  };

  const pause = () => {
    speechSynthesis.pause();
  };

  const resume = () => {
    speechSynthesis.resume();
  };

  const handleSetVoice = (selectedVoice: SpeechSynthesisVoice) => {
    setVoice(selectedVoice);
    const settings = {
      isEnabled,
      rate,
      pitch,
      volume,
      voiceName: selectedVoice.name
    };
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  };

  const handleSetRate = (newRate: number) => {
    setRate(newRate);
    const settings = {
      isEnabled,
      rate: newRate,
      pitch,
      volume
    };
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  };

  const handleSetPitch = (newPitch: number) => {
    setPitch(newPitch);
    const settings = {
      isEnabled,
      rate,
      pitch: newPitch,
      volume
    };
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  };

  const handleSetVolume = (newVolume: number) => {
    setVolume(newVolume);
    const settings = {
      isEnabled,
      rate,
      pitch,
      volume: newVolume
    };
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  };

  const value: TextToSpeechContextType = {
    isEnabled,
    isSpeaking,
    currentText,
    voice,
    rate,
    pitch,
    volume,
    toggleTTS,
    speak,
    stop,
    pause,
    resume,
    setVoice: handleSetVoice,
    setRate: handleSetRate,
    setPitch: handleSetPitch,
    setVolume: handleSetVolume,
    voices
  };

  return (
    <TextToSpeechContext.Provider value={value}>
      {children}
    </TextToSpeechContext.Provider>
  );
};
