import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  Wallet,
  Github,
  Twitter
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa6";
import { SocialLoginButton } from "./SocialLoginButton";
import { useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";

function SecurityAuth() {
  const { user } = useSelector((state: { auth: { user: { socialAccounts?: { platform: string }[] } } }) => state.auth);
  const { toast } = useToast();
  const [sessions] = useState([
    { device: "Chrome on Windows", location: "New York, USA", lastActive: "2 mins ago", current: true },
    { device: "Safari on iPhone", location: "Los Angeles, USA", lastActive: "1 hour ago", current: false },
    { device: "Firefox on MacOS", location: "London, UK", lastActive: "3 days ago", current: false },
  ]);

  // Check if user has connected social accounts
  const getConnectedAccounts = () => {
    if (!user?.socialAccounts) return [];
    return user.socialAccounts.map((account: { platform: string }) => account.platform.toLowerCase());
  };

  const connectedAccounts = getConnectedAccounts();

  return (
    <div className="space-y-6">

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Security Score</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">85%</p>
              </div>
              <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-xl">
                <Shield className="w-8 h-8 text-slate-700 dark:text-slate-300" />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Good security level</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Sessions</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{sessions.length}</p>
              </div>
              <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-xl">
                <Monitor className="w-8 h-8 text-slate-700 dark:text-slate-300" />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">Across all devices</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Last Login</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">2m</p>
              </div>
              <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-xl">
                <Clock className="w-8 h-8 text-slate-700 dark:text-slate-300" />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">2 minutes ago</p>
          </CardContent>
        </Card>
      </div>

      {/* Web3 & Multi-Sig Login */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Wallet className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Web3 & Multi-Signature Wallet</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">Connect your blockchain wallets</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet connection handled via backend; UI wallet prompts removed */}
          <div className="mb-2 text-sm text-slate-600 dark:text-slate-400">Wallet connection UI removed. Connect wallets via platform integrations.</div>
          
          {/* Multi-Sig Wallet Button (Placeholder for future implementation) */}
          <Button 
            disabled
            variant="outline" 
            className="w-full opacity-50 cursor-not-allowed"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Multi-Sig Wallet (Coming Soon)
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <SocialLoginButton
              provider="Google"
              icon={FcGoogle}
              label="Google"
              isConnected={connectedAccounts.includes('google')}
              redirectTo="/myprofile"
              onConnect={() => {
                toast({
                  title: "Success!",
                  description: "Google account linked successfully",
                });
                // No page refresh needed - state updates automatically
              }}
            />
            <SocialLoginButton
              provider="GitHub"
              icon={Github}
              label="GitHub"
              isConnected={connectedAccounts.includes('github')}
              redirectTo="/myprofile"
              onConnect={() => {
                toast({
                  title: "Success!",
                  description: "GitHub account linked successfully",
                });
                // No page refresh needed - state updates automatically
              }}
            />
            <SocialLoginButton
              provider="Twitter"
              icon={Twitter}
              label="Twitter"
              isConnected={connectedAccounts.includes('twitter')}
              redirectTo="/myprofile"
              onConnect={() => {
                toast({
                  title: "Success!",
                  description: "Twitter account linked successfully",
                });
                // No page refresh needed - state updates automatically
              }}
            />
            <SocialLoginButton
              provider="Discord"
              icon={FaDiscord}
              label="Discord"
              isConnected={connectedAccounts.includes('discord')}
              redirectTo="/myprofile"
              onConnect={() => {
                toast({
                  title: "Success!",
                  description: "Discord account linked successfully",
                });
                // No page refresh needed - state updates automatically
              }}
            />
          </div>
          </CardContent>
        </Card>

      {/* Security Recommendations */}
      <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Security Recommendations</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">Improve your account security</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Strong password enabled</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Your password meets security requirements</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium">Enable two-factor authentication</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Add an extra layer of security to your account</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Email verified</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Your email address has been verified</p>
            </div>
      </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecurityAuth;
