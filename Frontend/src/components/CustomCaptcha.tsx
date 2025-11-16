"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomCaptchaProps {
  onVerify: (isValid: boolean) => void;
  onTokenChange?: (token: string | null) => void;
}

export default function CustomCaptcha({ onVerify, onTokenChange }: CustomCaptchaProps) {
  const [codeNumber, setCodeNumber] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState("");
  const captchaToken = useRef<string | null>(null);

  // Generate new CAPTCHA challenge
  const generateCaptcha = () => {
    // Generate a single-digit number between 1 and 9
    const n = Math.floor(Math.random() * 9) + 1;
    setCodeNumber(n);
    setAnswer("");
    setIsValid(false);
    setError("");
    captchaToken.current = null;
    onVerify(false);
    if (onTokenChange) {
      onTokenChange(null);
    }
  };

  // Generate initial CAPTCHA on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Validate answer
  const validateAnswer = (userAnswer: string) => {
    const correctAnswer = codeNumber;
    const userAnswerNum = parseInt(userAnswer, 10);

    if (isNaN(userAnswerNum)) {
      setError("Please enter a valid number");
      setIsValid(false);
      onVerify(false);
      if (onTokenChange) {
        onTokenChange(null);
      }
      return;
    }

    if (userAnswerNum === correctAnswer) {
      setError("");
      setIsValid(true);
      // Generate a simple token (timestamp + random)
      captchaToken.current = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      onVerify(true);
      if (onTokenChange) {
        onTokenChange(captchaToken.current);
      }
    } else {
      setError("Incorrect number. Try again or refresh.");
      setIsValid(false);
      onVerify(false);
      if (onTokenChange) {
        onTokenChange(null);
      }
    }
  };

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    setError("");
    
    // Auto-validate when user finishes typing
    if (value.trim() !== "") {
      validateAnswer(value);
    } else {
      setIsValid(false);
      onVerify(false);
      if (onTokenChange) {
        onTokenChange(null);
      }
    }
  };

  const handleRefresh = () => {
    generateCaptcha();
  };

  return (
    <div className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Verify you're human
        </label>
        <button
          type="button"
          onClick={handleRefresh}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Refresh CAPTCHA"
          title="Refresh CAPTCHA"
        >
          <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded border border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">Enter this number:</span>
          <span className="text-lg font-bold text-gray-800 dark:text-gray-200 select-none" aria-label="CAPTCHA number">
            {codeNumber}
          </span>
        </div>
        <Input
          type="number"
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Type it here"
          className="w-32 text-center text-lg font-semibold"
          min="0"
          max="9"
          aria-label="CAPTCHA answer input"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2" role="alert">
          {error}
        </p>
      )}

      {isValid && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
          <span>✓</span> Verified
        </p>
      )}

      {!isValid && !error && answer === "" && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Type the number shown above
        </p>
      )}
    </div>
  );
}

