/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Loader2, CheckCircle, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CryptoUtils } from "@/utils/walletUtils";

interface PhantomProvider {
  isPhantom?: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: any }>;
  disconnect: () => Promise<void>;
  publicKey: any;
  isConnected: boolean;
}

interface WalletConnectionStepProps {
  onWalletConnected: (walletAddress: string, walletProvider: string) => void;
  onError?: (error: string) => void;
}

export function WalletConnectionStep({ onWalletConnected, onError }: WalletConnectionStepProps) {
  const { toast } = useToast();
  const [phantomInstalled, setPhantomInstalled] = useState(false);
  const [phantomProvider, setPhantomProvider] = useState<PhantomProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingInstructions, setOnboardingInstructions] = useState(false);
  const [needsManualWakeUp, setNeedsManualWakeUp] = useState(false);
  const [friendlyMessage, setFriendlyMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Check for Phantom wallet on mount and detect onboarding
  useEffect(() => {
    const checkPhantom = () => {
      if (typeof window !== 'undefined') {
        const provider = (window as any).solana;
        
        if (provider?.isPhantom) {
          setPhantomInstalled(true);
          setPhantomProvider(provider);
          setIsOnboarding(false); // Onboarding complete
          setOnboardingInstructions(false);
          
          // Don't auto-connect during registration - user must click button
          // This prevents infinite loops and unwanted auto-connections
        } else {
          setPhantomInstalled(false);
          setPhantomProvider(null);
        }
      }
    };

    // Initial check with a small delay to ensure window.solana is available
    const initialTimeout = setTimeout(() => {
      checkPhantom();
    }, 100);

    // Aggressive polling for Phantom after installation (onboarding detection)
    let checkCount = 0;
    const maxChecks = 60; // Check for 60 seconds (enough time for onboarding)
    const interval = setInterval(() => {
      checkCount++;
      if (typeof window !== 'undefined' && checkCount < maxChecks) {
        const provider = (window as any).solana;
        if (provider?.isPhantom) {
          if (!phantomInstalled) {
            checkPhantom();
            setIsOnboarding(false);
            setOnboardingInstructions(false);
          }
          // Clear interval once Phantom is found and stable
          if (checkCount > 3) {
            clearInterval(interval);
          }
        } else {
          // Phantom extension might be installed but onboarding not complete
          // Check if extension is installed by checking for extension ID in URL
          // This is a heuristic - if we've been checking for a while and no provider,
          // user might be in onboarding
          if (checkCount > 5 && checkCount < 50 && !phantomInstalled) {
            setIsOnboarding(true);
            setOnboardingInstructions(true);
          }
        }
      } else if (checkCount >= maxChecks) {
        clearInterval(interval);
        // If still not found after max checks, assume onboarding might be needed
        if (!phantomInstalled) {
          setIsOnboarding(false);
        }
      }
    }, 1000); // Check every second

    // Listen for window focus (user returns from onboarding tab)
    const handleFocus = () => {
      // Wait a bit for Phantom to initialize after tab focus
      setTimeout(() => {
        checkPhantom();
        // If Phantom is now available, onboarding is complete
        if ((window as any).solana?.isPhantom) {
          setIsOnboarding(false);
          setOnboardingInstructions(false);
        }
      }, 500);
    };
    window.addEventListener('focus', handleFocus);

    // Listen for visibility change (user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - check if Phantom is ready
        setTimeout(() => {
          checkPhantom();
          if ((window as any).solana?.isPhantom) {
            setIsOnboarding(false);
            setOnboardingInstructions(false);
          }
        }, 500);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for Phantom provider injection events
    const handleMessage = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'PHANTOM_READY' || event.data.source === 'phantom-extension')) {
        setTimeout(() => {
          checkPhantom();
        }, 500);
      }
    };
    window.addEventListener('message', handleMessage);

    // Also listen for storage events (Phantom might update localStorage)
    const handleStorageChange = () => {
      setTimeout(() => {
        checkPhantom();
      }, 300);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount

  // Listen for window focus when manual wake-up is needed
  useEffect(() => {
    if (!needsManualWakeUp || isConnecting) return;

    const handleFocusRetry = async () => {
      // Wait a bit for Phantom to wake up after user interaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if Phantom is now responsive
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        try {
          // Test if service worker is responsive
          void provider.isPhantom;
          void provider.isConnected;
          
          // If we get here, service worker might be awake
          setNeedsManualWakeUp(false);
          setError(null); // Clear any errors
          setFriendlyMessage("Great! Phantom wallet is detected. Please click on the Phantom extension icon in your browser toolbar, sign in to your wallet (or create a new wallet if you don't have one), then click 'Connect Phantom Wallet' below.");
        } catch (e) {
          // Service worker still not ready
        }
      }
    };

    window.addEventListener('focus', handleFocusRetry);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocusRetry();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocusRetry);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsManualWakeUp, isConnecting]);

  const handleConnectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setStatusMessage(null); // Clear status message when starting
    setFriendlyMessage(null); // Clear friendly message when connecting
    setNeedsManualWakeUp(false); // Reset manual wake-up flag when retrying

    // Helper function to wait for Phantom to be ready
    const waitForPhantom = async (maxWait = 5000): Promise<any> => {
      const startTime = Date.now();
      while (Date.now() - startTime < maxWait) {
        const provider = (window as any).solana;
        if (provider?.isPhantom) {
          return provider;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      return null;
    };

    // Helper to wake up service worker by accessing properties multiple times
    const wakeUpServiceWorker = async (provider: any, attempts = 5): Promise<boolean> => {
      for (let i = 0; i < attempts; i++) {
        try {
          // Access properties to wake up service worker
          void provider.isPhantom;
          void provider.isConnected;
          // Small delay between attempts
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (e) {
          // Service worker might be sleeping, continue trying
        }
      }
      return true;
    };

    // Helper to test if service worker is actually responsive
    const testServiceWorkerResponsive = async (provider: any): Promise<boolean> => {
      try {
        // Try to access multiple properties to ensure service worker is awake
        const isPhantom = provider.isPhantom;
        const isConnected = provider.isConnected;
        const hasConnect = typeof provider.connect === 'function';
        
        // If we can access these without error, service worker is likely responsive
        return isPhantom && hasConnect;
      } catch (e) {
        return false;
      }
    };

    try {
      // Step 1: Wait for Phantom to be ready (handles newly installed wallets)
      let provider = (window as any).solana;
      if (!provider?.isPhantom) {
        setStatusMessage("Waiting for Phantom wallet to be ready...");
        provider = await waitForPhantom(5000);
        if (!provider?.isPhantom) {
          setStatusMessage(null);
          throw new Error("Phantom wallet not detected. Please make sure Phantom is installed and unlocked.");
        }
        setPhantomInstalled(true);
        setPhantomProvider(provider);
        setStatusMessage(null);
      }

      // Step 2: Wake up the service worker (it might be sleeping)
      setStatusMessage("Initializing connection...");
      await wakeUpServiceWorker(provider, 8);
      
      // Step 3: Wait longer for service worker to fully initialize
      // Service workers can take 3-5 seconds to wake up after being idle
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 4: Verify service worker is responsive before attempting connection
      let finalProvider = (window as any).solana;
      if (!finalProvider?.isPhantom) {
        // Provider disappeared, try to get it again
        setStatusMessage("Reconnecting...");
        finalProvider = await waitForPhantom(5000);
        if (!finalProvider?.isPhantom) {
          setStatusMessage(null);
          throw new Error("Phantom wallet disconnected. Please ensure it's unlocked and try again.");
        }
      }

      // Step 5: Test if service worker is actually responsive
      setStatusMessage("Verifying connection...");
      let isResponsive = await testServiceWorkerResponsive(finalProvider);
      
      // If not responsive, wait and retry multiple times
      if (!isResponsive) {
        for (let attempt = 0; attempt < 6; attempt++) {
          setStatusMessage(`Initializing... (${attempt + 1}/6)`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Wake up service worker again
          finalProvider = (window as any).solana;
          if (finalProvider?.isPhantom) {
            await wakeUpServiceWorker(finalProvider, 3);
            isResponsive = await testServiceWorkerResponsive(finalProvider);
            
            if (isResponsive) {
              setPhantomProvider(finalProvider);
              setStatusMessage(null);
              break;
            }
          }
        }
        
        if (!isResponsive) {
          setStatusMessage(null);
          throw new Error("Phantom wallet service worker is not responding. Please ensure Phantom is unlocked, wait 5-10 seconds, then click 'Try Again'.");
        }
      }
      
      // Final check before connecting
      if (!finalProvider?.isPhantom || typeof finalProvider.connect !== 'function') {
        setStatusMessage(null);
        throw new Error("Phantom wallet is not ready. Please ensure it's unlocked and try again.");
      }
      
      setPhantomProvider(finalProvider);
      setStatusMessage(null);
      setError(null);

      // Check if already connected
      if (finalProvider.isConnected && finalProvider.publicKey) {
        const address = finalProvider.publicKey.toString();
        if (CryptoUtils.isValidSolanaAddress(address)) {
          setWalletAddress(address);
          setIsConnected(true);
          onWalletConnected(address, 'phantom');
          setIsConnecting(false);
          return;
        }
      }

      // Step 6: Connect to Phantom wallet with automatic recovery
      let response;
      let retries = 0;
      const maxRetries = 4; // Reduced retries but with longer waits

      while (retries <= maxRetries) {
        try {
          // Re-check provider before each attempt
          let attemptProvider = (window as any).solana;
          if (!attemptProvider?.isPhantom) {
            // Wait and retry provider detection
            setStatusMessage(`Reconnecting... (${retries + 1}/${maxRetries + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attemptProvider = await waitForPhantom(5000);
            if (!attemptProvider?.isPhantom) {
              setStatusMessage(null);
              throw new Error("Phantom wallet disconnected. Please ensure it's unlocked and try again.");
            }
            setPhantomProvider(attemptProvider);
            // Wake up service worker before continuing
            await wakeUpServiceWorker(attemptProvider, 5);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Test if service worker is responsive before attempting connection
          const isServiceWorkerReady = await testServiceWorkerResponsive(attemptProvider);
          if (!isServiceWorkerReady) {
            // Service worker not ready, wait longer and wake it up
            setStatusMessage(`Initializing... (${retries + 1}/${maxRetries + 1})`);
            
            // Progressive wait: 4s, 6s, 8s, 10s
            const waitTime = 4000 + (retries * 2000);
            await wakeUpServiceWorker(attemptProvider, 8);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Re-check provider after waiting
            attemptProvider = (window as any).solana;
            if (attemptProvider?.isPhantom) {
              const stillNotReady = !(await testServiceWorkerResponsive(attemptProvider));
              if (stillNotReady) {
                retries++;
                continue;
              }
            } else {
              retries++;
              continue;
            }
          }

          // Add timeout wrapper (longer timeout to account for service worker wake-up)
          // First attempt gets longer timeout since service worker might be waking up
          const timeout = retries === 0 ? 30000 : 20000;
          setStatusMessage(`Connecting... (${retries + 1}/${maxRetries + 1})`);
          
          const connectPromise = attemptProvider.connect({ onlyIfTrusted: false });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Connection is taking longer than expected. The service worker might be waking up. Please wait and try again.")), timeout)
          );

          response = await Promise.race([connectPromise, timeoutPromise]) as any;
          
          if (response && response.publicKey) {
            setStatusMessage(null); // Clear status on success
            break; // Success, exit retry loop
          }
        } catch (connectError: any) {
          retries++;
          
          // Don't retry on user rejection
          if (connectError.code === 4001 || connectError.code === -32002) {
            throw new Error("Please approve the connection request in your Phantom wallet popup.");
          }
          
          // Check for service worker errors - try to recover automatically
          const errorString = JSON.stringify(connectError).toLowerCase();
          const errorMessage = connectError.message?.toLowerCase() || '';
          const errorName = connectError.name?.toLowerCase() || '';
          const errorStack = connectError.stack?.toLowerCase() || '';
          
          const isServiceWorkerError = errorString.includes("disconnected port") || 
              errorString.includes("service worker") ||
              errorMessage.includes("disconnected port") ||
              errorMessage.includes("service worker") ||
              errorMessage.includes("attempting to use a disconnected port") ||
              errorName.includes("disconnected") ||
              errorStack.includes("disconnected port") ||
              errorStack.includes("service worker");

          // Handle Phantom's "Unexpected error" (often means service worker issue)
          const isUnexpectedError = errorMessage.includes("unexpected error") || 
              errorMessage.includes("oe:") ||
              errorString.includes("unexpected error") ||
              errorMessage.includes("failed to send message") ||
              errorMessage.includes("retrying");

          if (isServiceWorkerError || isUnexpectedError) {
            if (retries < maxRetries) {
              // Service worker is disconnected - wait much longer for it to wake up
              // Progressive wait: 5s, 7s, 9s, 11s
              const waitTime = 5000 + (retries * 2000);
              setStatusMessage(`Initializing... (${retries + 1}/${maxRetries + 1})`);
              
              // Aggressively wake up the service worker
              let currentProvider = (window as any).solana;
              if (currentProvider?.isPhantom) {
                await wakeUpServiceWorker(currentProvider, 10);
              }
              
              // Wait for service worker to fully wake up
              await new Promise(resolve => setTimeout(resolve, waitTime));
              
              // Force re-initialization by checking window.solana again
              // Sometimes the provider object becomes stale
              let recoveredProvider = null;
              for (let i = 0; i < 10; i++) {
                await new Promise(resolve => setTimeout(resolve, 600));
                const freshProvider = (window as any).solana;
                if (freshProvider?.isPhantom) {
                  // Test if provider is actually functional
                  const isReady = await testServiceWorkerResponsive(freshProvider);
                  if (isReady) {
                    recoveredProvider = freshProvider;
                    break;
                  }
                }
              }
              
              if (recoveredProvider?.isPhantom) {
                setPhantomProvider(recoveredProvider);
                setPhantomInstalled(true);
                setStatusMessage(null);
                // Wait longer before retrying connection to ensure service worker is stable
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries++;
                continue; // Retry connection with fresh provider
              } else {
                // Provider still not ready, but continue retrying
                setStatusMessage(`Waiting... (${retries + 1}/${maxRetries + 1})`);
                retries++;
                continue;
              }
            }
            // If we've exhausted retries, set manual wake-up flag and clear generic error
            setNeedsManualWakeUp(true);
            setStatusMessage(null); // Clear status message
            setError(null); // Clear generic error, we'll show manual wake-up instructions instead
            throw new Error("Manual wake-up required");
          }

          // Handle timeout errors
          if (connectError.message?.includes("timeout") || connectError.message?.includes("taking longer")) {
            if (retries <= maxRetries) {
              setStatusMessage(`Retrying... (${retries + 1}/${maxRetries + 1})`);
              await new Promise(resolve => setTimeout(resolve, 1500));
              continue;
            }
            setStatusMessage(null);
            throw new Error("Connection timed out. Please ensure your Phantom wallet is unlocked and try again.");
          }

          // If last retry, throw the error
          if (retries > maxRetries) {
            setStatusMessage(null);
            throw new Error("Unable to connect after multiple attempts. Please ensure Phantom wallet is unlocked and try again.");
          }

          // Wait before retry (exponential backoff)
          setStatusMessage(`Retrying... (${retries + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
      
      if (!response || !response.publicKey) {
        throw new Error("Failed to get wallet address. Please try again.");
      }

      const address = response.publicKey.toString();

      // Validate Solana address format
      if (!CryptoUtils.isValidSolanaAddress(address)) {
        throw new Error("Invalid wallet address received. Please try connecting again.");
      }

      setWalletAddress(address);
      setIsConnected(true);
      setError(null);
      setStatusMessage(null); // Clear status message on success
      setFriendlyMessage(null); // Clear friendly message on success
      setNeedsManualWakeUp(false); // Reset manual wake-up flag on success
      
      // Notify parent component
      onWalletConnected(address, 'phantom');

      toast({
        title: "Wallet Connected!",
        description: `Phantom wallet connected successfully`,
        variant: "default",
      });

    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setStatusMessage(null); // Clear status message on error
      
      // Don't set error message if manual wake-up is already triggered
      if (err.message?.includes("Manual wake-up required")) {
        // Error already handled by manual wake-up instructions, just show informational toast
        toast({
          title: "Service Worker Issue",
          description: "Please follow the instructions below to wake up Phantom wallet.",
          variant: "default",
        });
        return; // Early return, don't set error message
      }
      
      let errorMessage = "Unable to connect to Phantom wallet.";
      
      // Handle specific error codes
      if (err.code === 4001 || err.code === -32002) {
        errorMessage = "Please approve the connection request in your Phantom wallet popup.";
      } else if (err.message?.includes("timeout") || err.message?.includes("taking longer")) {
        errorMessage = "Connection timed out. Please ensure your Phantom wallet is unlocked and try again.";
      } else if (err.message?.includes("unlocked")) {
        errorMessage = err.message;
      } else if (err.message?.includes("not detected") || err.message?.includes("not ready")) {
        errorMessage = "Phantom wallet is not ready. Please ensure it's installed and unlocked, then try again.";
      } else if (err.message?.includes("disconnected") || err.message?.includes("disconnected port") || err.message?.includes("service worker")) {
        errorMessage = "Phantom wallet service worker is not responding. Please ensure Phantom is unlocked, wait a few seconds, then click 'Try Again'.";
      } else if (err.message?.includes("failed to send message") || err.message?.includes("retrying")) {
        errorMessage = "Phantom wallet service is initializing. Please wait a moment and click 'Try Again'.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      if (onError) onError(errorMessage);

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [phantomProvider, onWalletConnected, onError, toast]);

  const handleInstallPhantom = () => {
    // Set onboarding state immediately when user clicks install
    setIsOnboarding(true);
    setOnboardingInstructions(true);
    
    window.open("https://phantom.app/", "_blank");
    toast({
      title: "Installing Phantom Wallet",
      description: "Complete the setup in the new tab, then return here",
      variant: "default",
    });

    // Start checking for Phantom after a delay (to allow installation)
    setTimeout(() => {
      let checkCount = 0;
      const maxChecks = 30; // Check for 30 seconds
      const checkInterval = setInterval(() => {
        checkCount++;
        const provider = (window as any).solana;
        if (provider?.isPhantom) {
          setPhantomInstalled(true);
          setPhantomProvider(provider);
          setIsOnboarding(false);
          setOnboardingInstructions(false);
          clearInterval(checkInterval);
          toast({
            title: "Phantom Detected!",
            description: "Phantom wallet is ready. Click 'Connect' to continue.",
            variant: "default",
          });
        } else if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          // Keep onboarding state so user knows to check again
        }
      }, 1000);
    }, 2000); // Wait 2 seconds before starting checks
  };

  if (isConnected && walletAddress) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">Wallet Connected</h3>
        </div>
        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Wallet Address:</span>
          <span className="text-sm font-mono text-slate-900 dark:text-slate-100">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        </div>
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          ✓ Proceeding with registration...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && !needsManualWakeUp && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {friendlyMessage && !isConnecting && (
        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Next Steps</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
            {friendlyMessage}
          </AlertDescription>
        </Alert>
      )}

      {statusMessage && isConnecting && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-slate-700 dark:text-slate-300">{statusMessage}</p>
        </div>
      )}

      {!phantomInstalled ? (
        <div className="space-y-4">
          {isOnboarding || onboardingInstructions ? (
            <>
              <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">Complete Phantom Setup</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-300">
                  A new tab has opened for Phantom wallet setup. Please:
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Complete wallet creation or sign in the Phantom tab</li>
                    <li>Return to this tab when done</li>
                    <li>Click "Check Again" below</li>
                  </ol>
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={() => {
                  setIsOnboarding(false);
                  setOnboardingInstructions(false);
                  // Force re-check
                  const provider = (window as any).solana;
                  if (provider?.isPhantom) {
                    setPhantomInstalled(true);
                    setPhantomProvider(provider);
                  } else {
                    // Start aggressive polling
                    let attempts = 0;
                    const checkInterval = setInterval(() => {
                      attempts++;
                      const checkProvider = (window as any).solana;
                      if (checkProvider?.isPhantom) {
                        setPhantomInstalled(true);
                        setPhantomProvider(checkProvider);
                        setIsOnboarding(false);
                        setOnboardingInstructions(false);
                        clearInterval(checkInterval);
                      } else if (attempts >= 10) {
                        clearInterval(checkInterval);
                        setError("Phantom wallet not detected. Please ensure you completed the setup and try again.");
                      }
                    }, 1000);
                  }
                }}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                We'll automatically detect when Phantom is ready. You can also click "Check Again" after completing setup.
              </p>
            </>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Phantom Wallet Required</AlertTitle>
                <AlertDescription>
                  You need to install Phantom wallet to continue with registration.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={handleInstallPhantom}
                className="w-full"
                variant="default"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Install Phantom Wallet
              </Button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                After installing, a setup tab will open. Complete the setup and return here.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Phantom Wallet</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Detected and ready to connect</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Phantom Wallet
              </>
            )}
          </Button>

          {!friendlyMessage && !error && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                💡 Before connecting:
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Click the <strong>Phantom extension icon</strong> in your browser toolbar</li>
                <li><strong>Sign in</strong> to your wallet or <strong>create a new one</strong></li>
                <li>Make sure Phantom is <strong>unlocked</strong></li>
              </ul>
            </div>
          )}

          {error && !isConnecting && (
            <div className="space-y-3 mt-2">
              {(needsManualWakeUp || error.includes("service worker") || error.includes("not responding")) ? (
                <>
                  <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <AlertTitle className="text-orange-900 dark:text-orange-100 text-base font-bold">⚠️ Wake Up Phantom Wallet</AlertTitle>
                    <AlertDescription className="text-orange-700 dark:text-orange-300 text-sm">
                      <p className="mb-3 font-semibold">Phantom's service worker is disconnected. This requires manual intervention:</p>
                      <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg mb-3">
                        <ol className="list-decimal list-inside space-y-2 text-xs">
                          <li className="font-semibold">Locate the <strong>Phantom wallet extension icon</strong> in your browser toolbar
                            <span className="block text-orange-600 dark:text-orange-400 mt-1">📍 Usually in the top-right corner (puzzle piece icon → Phantom)</span>
                          </li>
                          <li className="font-semibold"><strong>Click on the Phantom icon</strong> to open the extension popup</li>
                          <li className="font-semibold">Make sure Phantom is <strong>unlocked</strong> (enter your password if needed)</li>
                          <li className="font-semibold">Wait <strong>5-10 seconds</strong> after unlocking</li>
                          <li className="font-semibold">Return here and click <strong>"Try Again"</strong> or <strong>"Refresh Page"</strong></li>
                        </ol>
                      </div>
                      <p className="text-xs font-medium mt-2 p-2 bg-orange-200 dark:bg-orange-900/50 rounded">
                        💡 <strong>Alternative:</strong> If clicking the extension doesn't work, try refreshing the page after unlocking Phantom.
                      </p>
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConnectWallet}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      disabled={isConnecting}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.location.reload();
                        }
                      }}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      disabled={isConnecting}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Page
                    </Button>
                  </div>
                  <p className="text-xs text-center text-orange-600 dark:text-orange-400 font-medium">
                    After waking up Phantom, use either button above
                  </p>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleConnectWallet}
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={isConnecting}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                    Make sure Phantom wallet is unlocked, then click "Try Again"
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


