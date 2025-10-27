/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { userLoggedIn } from "@/redux/features/auth/authSlice";

interface SocialLoginButtonProps {
  provider: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isConnected: boolean;
  onConnect?: () => void;
  redirectTo?: string; // Where to redirect after successful login
}

export function SocialLoginButton({
  provider,
  icon: Icon,
  label,
  isConnected,
  onConnect,
  redirectTo = "/dashboard",
}: SocialLoginButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAuth0Login = async () => {
    try {
      setIsLoading(true);

      // Get Auth0 login URL from backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}auth0/login?provider=${provider.toLowerCase()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success && data.authUrl) {
        // Open Auth0 login in popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          data.authUrl,
          "Auth0 Login",
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for popup close
        const checkPopup = setInterval(() => {
          if (popup && popup.closed) {
            clearInterval(checkPopup);
            setIsLoading(false);
            
            // If popup closed without sending success message, just refresh page
            if (!isProcessing) {
              console.log("Popup closed, refreshing page as fallback");
              setTimeout(() => {
                console.log("Refreshing page after popup closed");
                window.location.reload();
              }, 2000);
            }
          }
        }, 500);

        // Listen for messages from popup
        const handleMessage = async (event: MessageEvent) => {
          console.log("Received message:", event.data, "from origin:", event.origin);
          
          if (event.origin !== window.location.origin || isProcessing) return;

          if (event.data.type === 'AUTH0_SUCCESS') {
            console.log("Processing AUTH0_SUCCESS message");
            setIsProcessing(true);
            clearInterval(checkPopup);
            setIsLoading(false);
            
            // Tell popup to close
            if (popup && !popup.closed) {
              popup.postMessage({ type: 'CLOSE_POPUP' }, window.location.origin);
            }
            
            // Simply refresh the page after a short delay
            setTimeout(() => {
              console.log("Refreshing page after Auth0 success");
              window.location.reload();
            }, 1000);
          } else if (event.data.type === 'AUTH0_ERROR') {
            console.log("Processing AUTH0_ERROR message");
            setIsProcessing(true);
            clearInterval(checkPopup);
            setIsLoading(false);
            // Don't show error toast - just refresh page
            setTimeout(() => {
              console.log("Refreshing page after Auth0 error");
              window.location.reload();
            }, 1000);
          }
        };

        window.addEventListener('message', handleMessage);

        // Also add a global listener for any missed messages
        const globalMessageHandler = (event: MessageEvent) => {
          if (event.origin === window.location.origin && 
              event.data.type === 'AUTH0_SUCCESS' && 
              !isProcessing) {
            console.log("Global message handler caught AUTH0_SUCCESS");
            handleMessage(event);
          }
        };
        
        window.addEventListener('message', globalMessageHandler);

        // Cleanup function
        const cleanup = () => {
          window.removeEventListener('message', handleMessage);
          window.removeEventListener('message', globalMessageHandler);
          clearInterval(checkPopup);
        };

        // Set timeout to cleanup after 5 minutes
        setTimeout(cleanup, 5 * 60 * 1000);
      } else {
        throw new Error("Failed to get Auth0 login URL");
      }
    } catch (error: any) {
      console.error("Auth0 login error:", error);
      setIsLoading(false);
      // Don't show error toast - just refresh page
      setTimeout(() => {
        console.log("Refreshing page after Auth0 login error");
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <Button
      onClick={handleAuth0Login}
      disabled={isLoading || isProcessing || isConnected}
      variant={isConnected ? "outline" : "default"}
      className={`w-full transition-all duration-200 ${
        isConnected
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
      }`}
    >
      {isLoading || isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isProcessing ? "Processing..." : "Connecting..."}
        </>
      ) : isConnected ? (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Connected to {label}
        </>
      ) : (
        <>
          <Icon className="w-4 h-4 mr-2" />
          Connect {label}
        </>
      )}
    </Button>
  );
}


