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
  // Don't use RTK Query here - we'll do manual fetches to avoid skip/refetch issues
  // const { refetch: refetchUser, isLoading: isFetchingUser } = useLoadUserQuery(undefined, { 
  //   skip: true,
  //   refetchOnMountOrArgChange: false,
  // });
  const [isFetchingUser, setIsFetchingUser] = useState(false);

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
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            }
          }
        }, 500);

        // Listen for messages from popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin || isProcessing) return;

          if (event.data.type === 'AUTH0_SUCCESS') {
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
            
            // If we have token from URL, use it immediately (fastest path)
            let tokenLoginSuccess = false;
            
            if (token && userId) {
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
                  
                  // /me endpoint returns user but not accessToken
                  // Use the token from URL parameter instead
                  if (userData.user && userData.success) {
                    // Clear explicit logout flag
                    sessionStorage.removeItem('explicit_logout');
                    
                    // Use token from URL parameter (we already have it)
                    const accessTokenToUse = token; // Use token from message
                    
                    // Update Redux immediately
                    dispatch(userLoggedIn({
                      accessToken: accessTokenToUse,
                      user: userData.user
                    }));
                    
                    // Update localStorage
                    localStorage.setItem('user', JSON.stringify(userData.user));
                    localStorage.setItem('accessToken', accessTokenToUse);
                    localStorage.setItem('loginTimestamp', Date.now().toString());
                    
                    tokenLoginSuccess = true; // Mark as successful
                    // Check if user has wallet, redirect to connect-wallet if not
                    setTimeout(() => {
                      if (!userData.user.walletAddress) {
                        router.push("/connect-wallet");
                      } else {
                        router.push(redirectTo);
                      }
                    }, 300);
                  } else {
                  }
                } else {
                  await userResponse.text();
                }
              } catch (error) {
              }
            }
            
            // Only run cookie-based fallback if token-based login didn't succeed
            if (!tokenLoginSuccess) {
              setTimeout(async () => {
              try {
                setIsFetchingUser(true);
                
                // Manual fetch with cookies - this properly handles cookies
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
                  
                  // /me endpoint returns user but not accessToken
                  // When using cookie-based auth, cookies handle authentication
                  // We can use a placeholder token or check if token exists in response
                  if (userData.user && userData.success) {
                    // Clear explicit logout flag
                    sessionStorage.removeItem('explicit_logout');
                    
                    // For cookie-based auth, accessToken might not be in response
                    // Check if it's in the response, otherwise use empty string
                    // (cookies will handle auth, but Redux might need a token value)
                    const accessTokenToUse = userData.accessToken || 'cookie-auth'; // Placeholder for cookie-based auth
                    
                    // Update Redux and localStorage manually
                    dispatch(userLoggedIn({
                      accessToken: accessTokenToUse,
                      user: userData.user
                    }));
                    
                    localStorage.setItem('user', JSON.stringify(userData.user));
                    // Only store accessToken if we have it, otherwise rely on cookies
                    if (userData.accessToken) {
                      localStorage.setItem('accessToken', userData.accessToken);
                    }
                    localStorage.setItem('loginTimestamp', Date.now().toString());
                    
                    // Check if user has wallet, redirect to connect-wallet if not
                    setIsFetchingUser(false);
                    setTimeout(() => {
                      if (!userData.user.walletAddress) {
                        router.push("/connect-wallet");
                      } else {
                        router.push(redirectTo);
                      }
                    }, 300);
                    return;
                  } else {
                  }
                } else {
                  await userResponse.text();
                }
                setIsFetchingUser(false);
              } catch (error) {
              }
            }, 1500); // Shorter delay since we tried token first
            } // End of if (!tokenLoginSuccess) - only run cookie fallback if token failed
          } else if (event.data.type === 'AUTH0_ERROR') {
            setIsProcessing(true);
            clearInterval(checkPopup);
            setIsLoading(false);
            // Don't show error toast - just refresh page
            setTimeout(() => {
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
      setIsLoading(false);
      // Don't show error toast - just refresh page
      setTimeout(() => {
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


