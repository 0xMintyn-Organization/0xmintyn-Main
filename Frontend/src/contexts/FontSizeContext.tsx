"use client";
import { createContext, useContext, useEffect, useState } from "react";

interface FontSizeContextProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  resetFontSize: () => void;
}

const FontSizeContext = createContext<FontSizeContextProps | undefined>(undefined);

export const FontSizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [fontSize, setFontSizeState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fontSize");
      return saved ? parseInt(saved) : 100; // Default 100% (normal size)
    }
    return 100;
  });

  const [mounted, setMounted] = useState(false);

  // Only access localStorage on the client
  useEffect(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    if (savedFontSize) {
      setFontSizeState(parseInt(savedFontSize));
    }
    setMounted(true);
  }, []);

  const setFontSize = (size: number) => {
    setFontSizeState(size);
    localStorage.setItem("fontSize", size.toString());
    
    // Apply professional scaling to entire frontend with smooth transitions
    if (typeof window !== "undefined") {
      const multiplier = size / 100;
      document.documentElement.style.setProperty("--font-size-multiplier", `${multiplier}`);
      document.documentElement.style.setProperty("--scale-multiplier", `${multiplier}`);
      
      // Add smooth transition to body
      document.body.style.transition = "all 0.2s ease-in-out";
    }
  };

  const resetFontSize = () => {
    setFontSize(100); // Reset to normal size
  };

  useEffect(() => {
    if (mounted) {
      const multiplier = fontSize / 100;
      document.documentElement.style.setProperty("--font-size-multiplier", `${multiplier}`);
      document.documentElement.style.setProperty("--scale-multiplier", `${multiplier}`);
    }
  }, [fontSize, mounted]);

  // Prevent rendering until after hydration
  if (!mounted) {
    return null;
  }

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, resetFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error("useFontSize must be used within a FontSizeProvider");
  }
  return context;
};
