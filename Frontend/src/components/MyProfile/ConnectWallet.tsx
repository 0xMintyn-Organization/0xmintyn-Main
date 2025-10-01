/* eslint-disable @typescript-eslint/no-explicit-any */
import { setWalletAddress } from "@/redux/features/auth/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Loader2, RefreshCw } from "lucide-react";

const ConnectAccount = () => {
    const {
        connected,
        connecting,
        publicKey,
        balance,
        error,
        connectWallet,
        disconnectWallet,
        updateBalance
    } = usePhantomWallet();
    
    const dispatch = useDispatch();

    // Update Redux store when wallet state changes
    useEffect(() => {
        if (connected && publicKey) {
            dispatch(setWalletAddress({ walletAddress: publicKey.toString() }));
        } else {
            dispatch(setWalletAddress({ walletAddress: null }));
        }
    }, [connected, publicKey, dispatch]);

    const handleConnect = async () => {
        try {
            await connectWallet();
        } catch (error) {
            console.error('Connection failed:', error);
        }
    };

    const handleDisconnect = async () => {
        try {
            await disconnectWallet();
        } catch (error) {
            console.error('Disconnect failed:', error);
        }
    };

    const handleRefreshBalance = async () => {
        try {
            await updateBalance();
        } catch (error) {
            console.error('Balance refresh failed:', error);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Phantom Wallet
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!connected ? (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Connect your Phantom wallet to access blockchain features including governance, UBI, and token operations.
                        </p>
                        <Button 
                            onClick={handleConnect} 
                            disabled={connecting}
                            className="w-full"
                        >
                            {connecting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Connect Phantom Wallet
                                </>
                            )}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Connected
                            </Badge>
                            <Button variant="outline" size="sm" onClick={handleDisconnect}>
                                Disconnect
                            </Button>
                        </div>
                        
                        <div className="space-y-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Address</p>
                                <p className="font-mono text-sm">
                                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                                </p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">SOL Balance</p>
                                    <p className="font-mono text-sm">{balance.toFixed(4)} SOL</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleRefreshBalance}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default ConnectAccount;