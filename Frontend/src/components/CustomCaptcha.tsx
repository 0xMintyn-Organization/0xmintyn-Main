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
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const captchaToken = useRef<string | null>(null);

  // Generate new CAPTCHA challenge
  const generateCaptcha = () => {
    // Generate two random numbers between 1 and 20
    const n1 = Math.floor(Math.random() * 20) + 1;
    const n2 = Math.floor(Math.random() * 20) + 1;
    setNum1(n1);
    setNum2(n2);
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
    const correctAnswer = num1 + num2;
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
      setError("Incorrect answer. Please try again.");
      setIsValid(false);
      setAttempts((prev) => prev + 1);
      onVerify(false);
      if (onTokenChange) {
        onTokenChange(null);
      }
      
      // Regenerate CAPTCHA after 3 failed attempts
      if (attempts >= 2) {
        setTimeout(() => {
          generateCaptcha();
          setAttempts(0);
        }, 500);
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
    setAttempts(0);
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
          <span className="text-lg font-bold text-gray-800 dark:text-gray-200 select-none">
            {num1}
          </span>
          <span className="text-lg text-gray-600 dark:text-gray-400">+</span>
          <span className="text-lg font-bold text-gray-800 dark:text-gray-200 select-none">
            {num2}
          </span>
          <span className="text-lg text-gray-600 dark:text-gray-400">=</span>
        </div>
        <Input
          type="number"
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="?"
          className="w-20 text-center text-lg font-semibold"
          min="0"
          max="100"
          aria-label="CAPTCHA answer"
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
          Solve the math problem above
        </p>
      )}
    </div>
  );
}

