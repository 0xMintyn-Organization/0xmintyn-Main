/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import ProfileInformation from "@/components/MyProfile/ProfileInformation";
import SecurityAuth from "@/components/MyProfile/SecurityAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Protected from "@/hooks/useProtected";
import { useSelector } from "react-redux";
import { 
  User, 
  Shield, 
  Users, 
  Star,
  Globe,
  MessageCircle,
  Lock
} from "lucide-react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

function MyProfile() {
  const { user } = useSelector((state: any) => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle Auth0 success callback
  useEffect(() => {
    const authSuccess = searchParams.get('auth');
    if (authSuccess === 'success') {
      toast.success('🎉 Successfully logged in with social account!');
      // Remove the auth parameter from URL
      router.replace('/myprofile');
    }
  }, [searchParams, router]);

  return (
    <Protected>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-grid-slate-200 dark:bg-grid-slate-700 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))]"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-200/50 dark:bg-slate-800/50 rounded-full mb-6 border border-slate-300 dark:border-slate-700">
                <Star className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile Dashboard</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-slate-900 dark:text-white">
                My Profile
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Manage your account, showcase your work, and connect with the community
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6 md:space-y-8">
            
            {/* Profile Information */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <User className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                        Profile Information
                      </CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Manage your personal details</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="hidden sm:flex border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ProfileInformation isOwnProfile={true} userData={user} />
              </CardContent>
            </Card>


            {/* Security & Authentication */}
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <Shield className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                        Security & Authentication
                      </CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Protect your account</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="hidden sm:flex border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                    <Lock className="w-3 h-3 mr-1" />
                    Secured 
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <SecurityAuth />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Protected>
  );
}

export default MyProfile;
