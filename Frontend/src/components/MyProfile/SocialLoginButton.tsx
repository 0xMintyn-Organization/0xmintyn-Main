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
            
            // Extract token from message if available (passed from backend via URL)
            const token = event.data.token;
            const userId = event.data.userId;
            
            console.log("=== Auth0 Success Handler ===");
            console.log("Token in message:", !!token, "UserId:", userId);
            
            // If we have token from URL, use it immediately (fastest path)
            if (token && userId) {
              console.log("✅ Using token from popup message for immediate login");
              
              try {
                // Fetch user data using the token
                const userResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_SERVER_URI}me`,
                  {
                    method: "GET",
                    credentials: "include",
                    headers: {
                      'Accept': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                  }
                );

                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  console.log("✅ User data fetched with token:", userData.user?.email);
                  
                  if (userData.user && userData.accessToken) {
                    // Update Redux immediately
                    dispatch(userLoggedIn({
                      accessToken: userData.accessToken,
                      user: userData.user
                    }));
                    
                    // Update localStorage
                    localStorage.setItem('user', JSON.stringify(userData.user));
                    localStorage.setItem('accessToken', userData.accessToken);
                    localStorage.setItem('loginTimestamp', Date.now().toString());
                    
                    console.log("✅ User logged in, redirecting to dashboard");
                    // Small delay to ensure state propagates
                    setTimeout(() => {
                      router.push(redirectTo);
                    }, 300);
                    return;
                  }
                } else {
                  console.warn("⚠️ Token-based fetch failed, falling back to cookie-based");
                }
              } catch (error) {
                console.error("❌ Error with token-based fetch:", error);
                // Fall through to cookie-based approach
              }
            }
            
            // Fallback: Wait for cookies to be set, then fetch using RTK Query
            console.log("Using cookie-based authentication (fallback)");
            setTimeout(async () => {
              try {
                console.log("Fetching user session using RTK Query (cookies)");
                
                // Use RTK Query's refetch - this properly handles cookies and updates Redux
                const result = await refetchUser();
                
                console.log("Refetch result:", {
                  isSuccess: result.isSuccess,
                  isError: result.isError,
                  hasData: !!result.data,
                });
                
                if (result.isSuccess && result.data?.user && result.data?.accessToken) {
                  console.log("✅ User session fetched successfully:", result.data.user.email);
                  
                  // RTK Query's onQueryStarted already updates Redux and localStorage
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  console.log("Redirecting to dashboard");
                  router.push(redirectTo);
                  return;
                }
                
                // Final fallback: manual fetch with cookies
                console.log("Trying manual fetch with cookies...");
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

                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  if (userData.user && userData.accessToken) {
                    dispatch(userLoggedIn({
                      accessToken: userData.accessToken,
                      user: userData.user
                    }));
                    
                    localStorage.setItem('user', JSON.stringify(userData.user));
                    localStorage.setItem('accessToken', userData.accessToken);
                    localStorage.setItem('loginTimestamp', Date.now().toString());
                    
                    setTimeout(() => {
                      router.push(redirectTo);
                    }, 500);
                    return;
                  }
                }
                
                // Ultimate fallback: reload page
                console.log("🔄 All methods failed, reloading page");
                window.location.reload();
              } catch (error) {
                console.error("❌ Error in cookie-based fetch:", error);
                window.location.reload();
              }
            }, 1500); // Shorter delay since we tried token first
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


