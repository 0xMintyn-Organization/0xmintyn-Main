"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { userLoggedIn } from "@/redux/features/auth/authSlice";
import { toast } from "react-hot-toast";

export default function Auth0SuccessPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    const handleAuth0Success = async () => {
      try {
        // Extract token and userId from URL (passed by backend)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userId = urlParams.get('userId');
        
        // Remove token from URL for security (after extracting)
        if (token) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
        
        console.log("Auth0 success - token in URL:", !!token, "userId:", userId);
        
        // Check if we're in a popup
        if (window.opener) {
          console.log("Auth0 success page loaded in popup");
          
          // Send success signal with token to parent window
          const message = {
            type: 'AUTH0_SUCCESS',
            token: token || null, // Pass token if available
            userId: userId || null,
            timestamp: Date.now(),
          };
          
          console.log("Sending success signal to parent window with token:", !!message.token);
          
          // Send message immediately and multiple times
          window.opener.postMessage(message, window.location.origin);
          setMessageSent(true);
          
          // Send multiple times to ensure delivery
          const sendMessage = () => {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage(message, window.location.origin);
            }
          };
          
          // Send messages at intervals
          setTimeout(sendMessage, 50);
          setTimeout(sendMessage, 100);
          setTimeout(sendMessage, 200);
          setTimeout(sendMessage, 500);
          setTimeout(sendMessage, 1000);

          // Don't close immediately - let parent window handle it
          console.log("Message sent, waiting for parent to close popup");
          
        } else {
          // We're not in a popup - if we have token, save it and redirect
          if (token && userId) {
            // Fetch full user data with token
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URI}me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (response.ok) {
                const userData = await response.json();
                if (userData.user && userData.accessToken) {
                  dispatch(userLoggedIn({
                    accessToken: userData.accessToken,
                    user: userData.user
                  }));
                  localStorage.setItem('user', JSON.stringify(userData.user));
                  localStorage.setItem('accessToken', userData.accessToken);
                  localStorage.setItem('loginTimestamp', Date.now().toString());
                  
                  // Check if user has wallet, if not redirect to connect-wallet page
                  if (!userData.user.walletAddress) {
                    router.push("/connect-wallet");
                    return;
                  }
                }
              }
              // Default redirect to dashboard
              router.push("/dashboard");
            } catch (error) {
              console.error("Error fetching user:", error);
              router.push("/dashboard"); // Fallback redirect
            }
          } else {
            router.push("/dashboard"); // Fallback if no token
          }
        }
      } catch (error) {
        console.error("Auth0 success handling error:", error);
        if (window.opener) {
          window.opener.postMessage({
            type: 'AUTH0_ERROR',
            error: 'Authentication failed'
          }, window.location.origin);
        }
      }
    };

    // Send message immediately
    handleAuth0Success();
  }, [router, dispatch]);

  // Listen for close message from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data.type === 'CLOSE_POPUP') {
        console.log("Received close signal from parent");
        window.close();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          {messageSent ? "Authentication Successful!" : "Completing Authentication..."}
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {messageSent ? "You can close this window." : "Please wait while we finish setting up your account."}
        </p>
      </div>
    </div>
  );
}
