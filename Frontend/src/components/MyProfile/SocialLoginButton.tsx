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
            console.log("=== AUTH0_SUCCESS MESSAGE RECEIVED ===");
            console.log("Full message data:", event.data);
            console.log("Message timestamp:", event.data.timestamp);
            
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
            console.log("Token in message:", !!token, token ? "Token present" : "Token missing");
            console.log("UserId in message:", userId || "Missing");
            console.log("Current localStorage:", {
              user: localStorage.getItem('user') ? "Present" : "Missing",
              accessToken: localStorage.getItem('accessToken') ? "Present" : "Missing",
              explicit_logout: sessionStorage.getItem('explicit_logout')
            });
            console.log("Current Redux state:", "Check Redux DevTools");
            
            // If we have token from URL, use it immediately (fastest path)
            let tokenLoginSuccess = false;
            
            if (token && userId) {
              console.log("=== Token-based Fetch Attempt (Primary Method) ===");
              console.log("✅ Using token from popup message for immediate login");
              console.log("Token length:", token.length);
              console.log("UserId:", userId);
              console.log("Fetch URL:", `${process.env.NEXT_PUBLIC_SERVER_URI}me`);
              
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
                
                console.log("Token-based fetch response status:", userResponse.status);
                console.log("Token-based fetch response headers:", Object.fromEntries(userResponse.headers.entries()));

                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  console.log("✅ User data fetched with token:", userData.user?.email);
                  console.log("Full response:", userData);
                  
                  // /me endpoint returns user but not accessToken
                  // Use the token from URL parameter instead
                  if (userData.user && userData.success) {
                    // Clear explicit logout flag
                    sessionStorage.removeItem('explicit_logout');
                    
                    // Use token from URL parameter (we already have it)
                    const accessTokenToUse = token; // Use token from message
                    
                    console.log("Using token from URL parameter for login");
                    
                    // Update Redux immediately
                    dispatch(userLoggedIn({
                      accessToken: accessTokenToUse,
                      user: userData.user
                    }));
                    
                    // Update localStorage
                    localStorage.setItem('user', JSON.stringify(userData.user));
                    localStorage.setItem('accessToken', accessTokenToUse);
                    localStorage.setItem('loginTimestamp', Date.now().toString());
                    
                    console.log("✅ User logged in successfully!");
                    console.log("User data:", userData.user);
                    console.log("Access token:", accessTokenToUse ? "Present (from URL)" : "Missing");
                    console.log("Redux state after dispatch:", "Check Redux DevTools");
                    console.log("LocalStorage:", {
                      user: localStorage.getItem('user') ? "Present" : "Missing",
                      accessToken: localStorage.getItem('accessToken') ? "Present" : "Missing"
                    });
                    
                    tokenLoginSuccess = true; // Mark as successful
                    
                    // TEMPORARILY DISABLED FOR DEBUGGING - Don't redirect yet
                    // setTimeout(() => {
                    //   router.push(redirectTo);
                    // }, 300);
                  } else {
                    console.error("❌ Response missing user or success flag:", userData);
                  }
                } else {
                  console.warn("⚠️ Token-based fetch failed with status:", userResponse.status);
                  const errorText = await userResponse.text();
                  console.warn("Error response:", errorText);
                }
              } catch (error) {
                console.error("❌ Error with token-based fetch:", error);
                console.error("Error details:", {
                  message: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined
                });
              }
            }
            
            // Only run cookie-based fallback if token-based login didn't succeed
            if (!tokenLoginSuccess) {
              console.log("Token-based login did not succeed, trying cookie-based authentication (fallback)");
              console.log("Available cookies:", document.cookie || "No cookies found");
              setTimeout(async () => {
              try {
                setIsFetchingUser(true);
                console.log("=== Cookie-based Fetch Attempt ===");
                console.log("Cookies available:", document.cookie || "No cookies");
                console.log("Fetching user session using manual fetch (cookies)");
                
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
                
                console.log("Cookie-based fetch response status:", userResponse.status);
                console.log("Cookie-based fetch response headers:", Object.fromEntries(userResponse.headers.entries()));
                
                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  console.log("✅ User session fetched successfully via cookies:", userData.user?.email);
                  console.log("Cookie fetch result:", userData);
                  
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
                    
                    console.log("✅ Cookie-based login successful!");
                    console.log("Redux state after cookie fetch:", "Check Redux DevTools");
                    console.log("LocalStorage after cookie fetch:", {
                      user: localStorage.getItem('user') ? "Present" : "Missing",
                      accessToken: localStorage.getItem('accessToken') ? "Present" : "Missing (using cookies)"
                    });
                    
                    // TEMPORARILY DISABLED FOR DEBUGGING - Don't redirect yet
                    // console.log("Redirecting to dashboard");
                    // router.push(redirectTo);
                    setIsFetchingUser(false);
                    return;
                  } else {
                    console.error("❌ Cookie fetch returned data but missing user or success flag:", userData);
                  }
                } else {
                  const errorText = await userResponse.text();
                  console.error("❌ Cookie-based fetch failed with status:", userResponse.status, errorText);
                }
                setIsFetchingUser(false);
                console.log("🔄 Cookie-based fetch completed. Check logs above for details.");
              } catch (error) {
                console.error("❌ Error in cookie-based fetch:", error);
                console.error("Error details:", {
                  message: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined
                });
                // TEMPORARILY DISABLED FOR DEBUGGING
                // window.location.reload();
                console.log("🔄 Cookie-based fetch failed. Check error above.");
              }
            }, 1500); // Shorter delay since we tried token first
            } // End of if (!tokenLoginSuccess) - only run cookie fallback if token failed
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


