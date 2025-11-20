/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Link as LinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { userLoggedIn } from "@/redux/features/auth/authSlice";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";

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
  // Use RTK Query to fetch user - this handles cookies properly
  // We skip the automatic query but can still call refetch manually
  const { refetch: refetchUser, isLoading: isFetchingUser } = useLoadUserQuery(undefined, { 
    skip: true,
    // Don't refetch on mount or reconnect
    refetchOnMountOrArgChange: false,
  });

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
            
            // Wait a bit for cookies to be set, then fetch user session using RTK Query
            setTimeout(async () => {
              try {
                console.log("=== Auth0 Success Handler ===");
                console.log("Checking for cookies...");
                console.log("Document cookies:", document.cookie);
                console.log("Fetching user session after Auth0 success using RTK Query");
                
                // Use RTK Query's refetch - this properly handles cookies and updates Redux
                const result = await refetchUser();
                
                console.log("Refetch result:", {
                  data: result.data,
                  error: result.error,
                  isSuccess: result.isSuccess,
                  isError: result.isError,
                });
                
                if (result.isSuccess && result.data?.user && result.data?.accessToken) {
                  console.log("✅ User session fetched successfully:", result.data.user.email);
                  
                  // RTK Query's onQueryStarted already updates Redux and localStorage
                  // Wait a moment for state to propagate
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  console.log("Redirecting to dashboard");
                  // Use router.push for client-side navigation (faster, no reload)
                  router.push(redirectTo);
                  return;
                } else if (result.isError) {
                  console.error("❌ RTK Query refetch error:", result.error);
                } else {
                  console.warn("⚠️ No user data in RTK Query response");
                }
                
                // Fallback: try manual fetch
                console.log("Trying manual fetch as fallback...");
                try {
                  const userResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_SERVER_URI}me`,
                    {
                      method: "GET",
                      credentials: "include",
                      headers: {
                        'Accept': 'application/json',
                      },
                    }
                  );

                  console.log("Manual fetch response status:", userResponse.status);
                  
                  if (userResponse.ok) {
                    const userData = await userResponse.json();
                    console.log("✅ Manual fetch successful:", userData);
                    
                    if (userData.user && userData.accessToken) {
                      dispatch(userLoggedIn({
                        accessToken: userData.accessToken,
                        user: userData.user
                      }));
                      
                      localStorage.setItem('user', JSON.stringify(userData.user));
                      localStorage.setItem('accessToken', userData.accessToken);
                      localStorage.setItem('loginTimestamp', Date.now().toString());
                      
                      await new Promise(resolve => setTimeout(resolve, 500));
                      console.log("Redirecting to dashboard (manual fetch)");
                      router.push(redirectTo);
                      return;
                    }
                  } else {
                    const errorText = await userResponse.text();
                    console.error("❌ Manual fetch failed:", userResponse.status, errorText);
                  }
                } catch (fetchError) {
                  console.error("❌ Manual fetch exception:", fetchError);
                }
                
                // Final fallback: full page reload to let AuthContext handle it
                console.log("🔄 All fetch methods failed, doing full page reload");
                toast({
                  title: "Session detected",
                  description: "Reloading to complete login...",
                });
                window.location.reload();
              } catch (error) {
                console.error("❌ Error in Auth0 success handler:", error);
                // Final fallback: reload page
                console.log("🔄 Error occurred, reloading page");
                window.location.reload();
              }
            }, 2000); // Increased delay to ensure cookies are set
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
      disabled={isLoading || isProcessing || isFetchingUser || isConnected}
      variant={isConnected ? "outline" : "default"}
      className={`w-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isConnected
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          : "bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
      }`}
      aria-label={isConnected ? `Connected to ${label}` : `Login with ${label}`}
      aria-disabled={isLoading || isProcessing || isFetchingUser || isConnected}
      tabIndex={isConnected ? -1 : 0}
    >
      {isLoading || isProcessing || isFetchingUser ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isFetchingUser ? "Loading session..." : isProcessing ? "Processing..." : "Connecting..."}
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


