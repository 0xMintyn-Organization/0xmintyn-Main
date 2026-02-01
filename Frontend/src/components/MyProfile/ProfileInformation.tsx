/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import {
  useEditUsernameMutation,
  useUpdateAvatarMutation,
  useUpdateBannerMutation,
} from "@/redux/features/user/userApi";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Camera,
  Edit,
  Save,
  X,
  Mail,
  MapPin,
  Calendar,
  User,
  Check,
  Upload,
  Image as ImageIcon,
  Shield,
  Star,
  Award,
  Globe,
  Verified,
} from "lucide-react";

interface ProfilePageProps {
  isOwnProfile: boolean;
  userData?: any;
}

function ProfileInformation({ isOwnProfile, userData }: ProfilePageProps) {
  const { toast } = useToast();
  const { user: reduxUser } = useSelector((state: any) => state.auth);
  const user = userData || reduxUser;
  const [username, setUsername] = useState(user?.username || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUsername, setEditedUsername] = useState(username);
  const [updateBanner, { isSuccess, isLoading, error }] =
    useUpdateBannerMutation();
  const [
    updateAvatar,
    {
      isSuccess: isAvatarSuccess,
      isLoading: isAvatarLoading,
      error: avatarError,
    },
  ] = useUpdateAvatarMutation();
  const [
    editUsername,
    {
      isSuccess: isUsernameSuccess,
      isLoading: isUsernameLoading,
      error: usernameError,
    },
  ] = useEditUsernameMutation();

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    country: user?.nationality || "",
    bio: user?.bio || "",
    dateOfBirth: user?.dateOfBirth || "",
  });

  // Helper function to construct full image URLs
  const getFullImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Handle environment variable with trailing slash
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'https://api.equalmint.com';
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Ensure imagePath starts with /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setFormData({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        country: user?.nationality || "",
        bio: user?.bio || "",
        dateOfBirth: user?.dateOfBirth || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile) return;
    setIsSaving(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URI}update-user-info`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            nationality: formData.country,
            bio: formData.bio,
            dateOfBirth: formData.dateOfBirth,
          }),
        }
      );

      const data = await res.json();

      console.log('Profile update result:', data);
      if (data.success) {
      setIsEditing(false);
      toast({
          title: "Success!",
        description: "Profile updated successfully",
        });
        // Reload to fetch updated user data
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUserNameEditToggle = () => {
    setIsEditingUsername(!isEditingUsername);
    if (!isEditingUsername) {
      setEditedUsername(username);
    }
  };

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditedUsername(e.target.value);
  };

  const handleSave = async () => {
    if (editedUsername.trim() === "") {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (editedUsername === username) {
      setIsEditingUsername(false);
      return;
    }

    try {
      const result = await editUsername({ username: editedUsername }).unwrap();
      console.log('Username update result:', result);
      if (result.success) {
        setUsername(editedUsername);
        setIsEditingUsername(false);
      toast({
          title: "Success!",
        description: "Username updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Username update error:', error);
        toast({
          title: "Error",
        description: error?.data?.message || "Failed to update username",
          variant: "destructive",
        });
      setEditedUsername(username); // Reset to original
    }
  };

  const handleBannerChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
        description: "Please upload an image file",
          variant: "destructive",
        });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
        description: "Image size should be less than 5MB",
          variant: "destructive",
        });
      return;
    }

    const formData = new FormData();
    formData.append("banner", file);

    try {
      const result = await updateBanner(formData).unwrap();
      console.log('Banner update result:', result);
      if (result.success) {
        toast({
          title: "Success!",
          description: "Banner updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Banner update error:', error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update banner",
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const result = await updateAvatar(formData).unwrap();
      console.log('Avatar update result:', result);
      if (result.success) {
        toast({
          title: "Success!",
          description: "Avatar updated successfully",
        });
      }
    } catch (error: any) {
      console.error('Avatar update error:', error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to update avatar",
        variant: "destructive",
      });
    }
  };

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      console.log('User Data:', user);
      console.log('Avatar URL:', user.avatar);
      console.log('Banner URL:', user.banner);
      console.log('Full Avatar URL:', getFullImageUrl(user.avatar));
      console.log('Full Banner URL:', getFullImageUrl(user.banner));
      
      setUsername(user.username || "");
      setEditedUsername(user.username || "");
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        country: user.nationality || "",
        bio: user.bio || "",
        dateOfBirth: user.dateOfBirth || "",
      });
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Banner and Avatar Section */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-black shadow-lg">
          {user?.banner && getFullImageUrl(user.banner) && (
          <Image
              src={getFullImageUrl(user.banner)}
              alt="Profile Banner"
            fill
            className="object-cover"
              unoptimized
            />
          )}
          {isOwnProfile && (
            <div className="absolute top-4 right-4">
          <input
            type="file"
                ref={bannerInputRef}
            onChange={handleBannerChange}
            accept="image/*"
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                className="bg-white/90 hover:bg-white text-slate-900 backdrop-blur-sm shadow-lg"
                disabled={isLoading}
              >
                <Camera className="w-4 h-4 mr-2" />
                {isLoading ? "Uploading..." : "Change Banner"}
              </Button>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-16 left-6 md:left-8">
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-white dark:border-slate-900 shadow-2xl">
              <AvatarImage 
                src={getFullImageUrl(user?.avatar)} 
                alt={user?.firstName}
              />
              <AvatarFallback className="text-3xl font-bold bg-slate-700 dark:bg-slate-800 text-white">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
              {isOwnProfile && (
                <>
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                  <button
                  onClick={() => avatarInputRef.current?.click()}
                    disabled={isAvatarLoading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    {isAvatarLoading ? (
                    <Upload className="w-6 h-6 text-white animate-pulse" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      {/* Profile Header */}
      <div className="pt-20 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-3">
            {/* Username */}
            <div className="flex items-center gap-3 flex-wrap">
              {!isEditingUsername ? (
                <>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {username}
                  </h2>
                  {user?.isVerified && (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white">
                      <Check className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleUserNameEditToggle}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={editedUsername}
                    onChange={handleUsernameChange}
                    className="max-w-xs"
                    disabled={isUsernameLoading}
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isUsernameLoading}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUserNameEditToggle}
                    disabled={isUsernameLoading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* User Role Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {user?.role === "admin" && (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Administrator
                  </>
                )}
                {user?.role === "instructor" && (
                  <>
                    <Award className="w-3 h-3 mr-1" />
                    Instructor
                  </>
                )}
                {user?.role === "user" && (
                  <>
                    <User className="w-3 h-3 mr-1" />
                    Member
                  </>
                )}
              </Badge>
              {user?.isSeller && (
                <Badge className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Seller
                </Badge>
              )}
            </div>

          </div>

          {/* Edit Button */}
          {isOwnProfile && (
            <div className="flex gap-2">
            {isEditing ? (
                <>
                  <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                  onClick={handleEditToggle}
                    disabled={isSaving}
                >
                    <X className="w-4 h-4 mr-2" />
                  Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={handleEditToggle} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              </div>
            )}
          </div>
        </div>

      <Separator />

      {/* Profile Information Grid */}
      <div className="px-4 md:px-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                First Name
              </Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                />
              ) : (
                <p className="text-base text-slate-900 dark:text-white px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  {user?.firstName || "Not provided"}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Last Name
              </Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                />
              ) : (
                <p className="text-base text-slate-900 dark:text-white px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  {user?.lastName || "Not provided"}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed"
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Country
              </Label>
              {isEditing ? (
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition-all duration-200"
                >
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-base text-slate-900 dark:text-white px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  {user?.nationality || "Not provided"}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </Label>
              {isEditing ? (
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth?.split("T")[0] || ""}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={handleInputChange}
                  className="transition-all duration-200 focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                />
              ) : (
                <p className="text-base text-slate-900 dark:text-white px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  {formatDate(user?.dateOfBirth) || "Not provided"}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Bio
              </Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="resize-none transition-all duration-200 focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
                />
              ) : (
                <p className="text-base text-slate-900 dark:text-white px-3 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg whitespace-pre-wrap min-h-[100px]">
                  {user?.bio || "No bio provided"}
                </p>
              )}
            </div>
          </div>
          </div>
          </div>
        </div>
  );
}

export default ProfileInformation;
