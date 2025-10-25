/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";
import {
  useUpdateSocialAccountMutation,
  useRemoveSocialAccountMutation,
} from "@/redux/features/user/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  X,
  Check,
  Edit,
  Trash2,
  ExternalLink,
  Twitter,
  MessageCircle,
  Send,
  Github,
  Linkedin,
  Instagram,
  Facebook,
  Youtube,
} from "lucide-react";
import { FaDiscord, FaTelegram, FaReddit } from "react-icons/fa";
import { SiLens, SiFarcaster } from "react-icons/si";

// Predefined social platforms with their URLs and icons
const SOCIAL_PLATFORMS = [
  {
    name: "Twitter",
    icon: Twitter,
    baseUrl: "https://twitter.com/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "Discord",
    icon: FaDiscord,
    baseUrl: "https://discord.com/users/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "Telegram",
    icon: FaTelegram,
    baseUrl: "https://t.me/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "GitHub",
    icon: Github,
    baseUrl: "https://github.com/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    baseUrl: "https://linkedin.com/in/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "Instagram",
    icon: Instagram,
    baseUrl: "https://instagram.com/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "Facebook",
    icon: Facebook,
    baseUrl: "https://facebook.com/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "YouTube",
    icon: Youtube,
    baseUrl: "https://youtube.com/@",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "Reddit",
    icon: FaReddit,
    baseUrl: "https://reddit.com/u/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "Lens",
    icon: SiLens,
    baseUrl: "https://hey.xyz/u/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  {
    name: "Farcaster",
    icon: SiFarcaster,
    baseUrl: "https://warpcast.com/",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
];

function SocialCommunity() {
  const { toast } = useToast();
  const { user } = useSelector((state: any) => state.auth);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [updateSocialAccount, { isLoading: isUpdating }] =
    useUpdateSocialAccountMutation();
  const [removeSocialAccount, { isLoading: isRemoving }] =
    useRemoveSocialAccountMutation();

  // Get user's social accounts
  const userSocialAccounts = user?.socialAccounts || [];

  // Check if a platform is connected
  const isPlatformConnected = (platformName: string) => {
    return userSocialAccounts.some(
      (account: any) =>
        account.platform.toLowerCase() === platformName.toLowerCase()
    );
  };

  // Get username for a platform
  const getPlatformUsername = (platformName: string) => {
    const account = userSocialAccounts.find(
      (account: any) =>
        account.platform.toLowerCase() === platformName.toLowerCase()
    );
    return account?.username || "";
  };

  // Handle add/edit button click
  const handleEditClick = (platformName: string) => {
    setEditingPlatform(platformName);
    setUsername(getPlatformUsername(platformName));
  };

  // Handle save
  const handleSave = async (platformName: string) => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateSocialAccount({
        platform: platformName,
        username: username.trim(),
      }).unwrap();

      if (result.success) {
        toast({
          title: "Success!",
          description: `${platformName} account ${
            isPlatformConnected(platformName) ? "updated" : "added"
          } successfully`,
        });
        setEditingPlatform(null);
        setUsername("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.data?.message || `Failed to update ${platformName} account`,
        variant: "destructive",
      });
    }
  };

  // Handle remove
  const handleRemove = async (platformName: string) => {
    try {
      const result = await removeSocialAccount({
        platform: platformName,
      }).unwrap();

      if (result.success) {
        toast({
          title: "Success!",
          description: `${platformName} account removed successfully`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.data?.message || `Failed to remove ${platformName} account`,
        variant: "destructive",
      });
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditingPlatform(null);
    setUsername("");
  };

  // Get profile URL
  const getProfileUrl = (platformName: string, username: string) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.name === platformName);
    return platform ? `${platform.baseUrl}${username}` : "#";
  };

  return (
    <div className="space-y-4">
      {SOCIAL_PLATFORMS.map((platform) => {
        const isConnected = isPlatformConnected(platform.name);
        const platformUsername = getPlatformUsername(platform.name);
        const isEditing = editingPlatform === platform.name;
        const Icon = platform.icon;

        return (
          <Card
            key={platform.name}
            className="border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Platform Info */}
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-3 rounded-xl ${platform.bgColor} shadow-sm`}
                  >
                    <Icon className={`w-5 h-5 ${platform.color}`} />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {platform.name}
                    </h4>

                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={`Enter your ${platform.name} username`}
                          className="h-8 text-sm"
                          disabled={isUpdating}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSave(platform.name)}
                          disabled={isUpdating}
                          className="h-8 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isUpdating}
                          className="h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : isConnected ? (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          @{platformUsername}
                        </p>
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                        Not connected
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <>
                      {isConnected ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              window.open(
                                getProfileUrl(platform.name, platformUsername),
                                "_blank"
                              )
                            }
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditClick(platform.name)}
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(platform.name)}
                            disabled={isRemoving}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleEditClick(platform.name)}
                          className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default SocialCommunity;

