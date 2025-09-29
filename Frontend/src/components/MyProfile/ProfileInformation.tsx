/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import {
  useEditUsernameMutation,
  useUpdateAvatarMutation,
  useUpdateBannerMutation,
} from "@/redux/features/user/userApi";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { FaPencil } from "react-icons/fa6";
import { useSelector } from "react-redux";
import TabsCreate from "./TabsCreate/TabsCreate";
import Link from "next/link";

interface ProfilePageProps {
  isOwnProfile: boolean;
  userData?: any;
}

function ProfileInformation({ isOwnProfile, userData }: ProfilePageProps) {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(userData);
  const [username, setUsername] = useState(user?.username || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadUser, setLoadUser] = useState(false);
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
  // const { } = useLoadUserQuery(undefined, { skip: loadUser ? false : true });

  const { walletAddress } = useSelector((state: any) => state.auth);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    country: user?.nationality || "",
    bio: user?.bio || "",
    dateOfBirth: user?.dateOfBirth || "",
  });

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
            dateOfBirth: formData.dateOfBirth,
            nationality: formData.country,
            bio: formData.bio,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.log("Error updating profile:", data.error);
      }

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const [handledSuccess, setHandledSuccess] = useState<Set<string>>(new Set());
  const [handledError, setHandledError] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newHandledSuccess = new Set(handledSuccess);
    const newHandledError = new Set(handledError);

    // Success Notifications
    if (isSuccess && !newHandledSuccess.has("bannerUpdate")) {
      toast({
        title: "Success",
        description: "Banner updated successfully",
        variant: "default",
      });
      newHandledSuccess.add("bannerUpdate");
      window.location.reload();
    }

    if (isAvatarSuccess && !newHandledSuccess.has("avatarUpdate")) {
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
        variant: "default",
      });
      newHandledSuccess.add("avatarUpdate");
      window.location.reload();
    }

    if (isUsernameSuccess && !newHandledSuccess.has("usernameUpdate")) {
      toast({
        title: "Success",
        description: "Username updated successfully",
        variant: "default",
      });
      newHandledSuccess.add("usernameUpdate");
      window.location.reload();
    }

    // Error Notifications
    if (error && !newHandledError.has("bannerUpdateError")) {
      if ("data" in error) {
        const errorData = error as any;
        toast({
          title: "Error",
          description: errorData.data.error,
          variant: "destructive",
        });
        newHandledError.add("bannerUpdateError");
      }
    }

    if (avatarError && !newHandledError.has("avatarUpdateError")) {
      if ("data" in avatarError) {
        const errorData = avatarError as any;
        toast({
          title: "Error",
          description: errorData.data.error,
          variant: "destructive",
        });
        newHandledError.add("avatarUpdateError");
      }
    }

    if (usernameError && !newHandledError.has("usernameUpdateError")) {
      if ("data" in usernameError) {
        const errorData = usernameError as any;
        toast({
          title: "Error",
          description: errorData.data.error,
          variant: "destructive",
        });
        newHandledError.add("usernameUpdateError");
      }
    }

    // Update the handled sets if new entries were added
    if (newHandledSuccess.size > handledSuccess.size) {
      setHandledSuccess(newHandledSuccess);
    }
    if (newHandledError.size > handledError.size) {
      setHandledError(newHandledError);
    }
  }, [
    isSuccess,
    error,
    isAvatarSuccess,
    avatarError,
    isUsernameSuccess,
    usernameError,
    handledSuccess,
    handledError,
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const handleBannerClick = () => {
    bannerInput.current?.click();
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setLoadUser(false);

      await updateAvatar(formData);
    } catch (err) {
      console.error("Avatar update failed", err);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("banner", file); // ✅ MUST be "banner" to match upload.single("banner")

    // Optional: debug
    for (const [key, val] of formData.entries()) {
      console.log(key, val);
    }

    try {
      setLoadUser(false);

      await updateBanner(formData);
    } catch (err) {
      console.error("Banner update failed", err);
    }
  };

  const handleUserNameEditToggle = () => {
    setIsEditingUsername((prev) => !prev);
    setEditedUsername(username);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedUsername(e.target.value);
  };

  const handleSave = async () => {
    setLoadUser(false);
    await editUsername({ username: editedUsername });
    setIsEditingUsername(false);
  };

  useEffect(() => {
    if (userData) {
      setUser(userData);
      setUsername(userData.username);
    }
  }, [userData]);

  return (
    <Card>
      <CardHeader className="text-heading font-semibold">
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {/* <div className="flex flex-col lg:flex-row gap-8"> */}
        {/* Banner with edit option */}
        <div className="relative h-48 xl:h-60 mb-24 rounded-lg">
          <Image
            src={user?.banner || "/assets/images/myprofile/banner.jpg"}
            alt="Profile banner"
            fill
            className="object-cover"
          />
          {/* {isOwnProfile && ( */}
          <button
            className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full"
            onClick={handleBannerClick}
            disabled={isLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
          {/* )} */}
          <input
            type="file"
            className="hidden"
            ref={bannerInput}
            onChange={handleBannerChange}
            accept="image/*"
          />

          {/* Profile picture */}
          <div className="absolute -bottom-20 left-8">
            <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white bg-white">
              <Image
                src={user?.avatar || "/assets/images/myprofile/profile.jpg"}
                alt="Profile picture"
                fill
                priority
                className="object-cover object-center"
              />

              {/* Edit Button */}
              {isOwnProfile && (
                <>
                  <button
                    type="button"
                    onClick={handleEditClick}
                    className="absolute bottom-4 right-5 bg-black bg-opacity-50 text-white p-1 rounded-full"
                    disabled={isAvatarLoading}
                  >
                    {isAvatarLoading ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    )}
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    name="avatar"
                    accept="image/*"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top section with username and wallet */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="mb-4">
              {!isEditingUsername ? (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{username}</h1>
                  {isOwnProfile && (
                    <button
                      onClick={handleUserNameEditToggle}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-200"
                    >
                      <FaPencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedUsername}
                    onChange={handleUsernameChange}
                    className="border rounded px-2 py-1 text-base text-black"
                  />
                  <button
                    onClick={handleSave}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleUserNameEditToggle}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center text-gray-500">
              <span className="mr-2">Wallet:</span>

              <span className="font-mono">
                {walletAddress?.length > 10
                  ? walletAddress?.slice(0, 6) +
                  "..." +
                  walletAddress?.slice(-4)
                  : walletAddress}
              </span>
            </div>
          </div>

          {/* {isOwnProfile && ( */}
          <div>
            {isEditing ? (
              <div className="space-x-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleEditToggle}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEditToggle}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  
                  Edit Profile

                </button>
                < TabsCreate />
                  <Link
                  href={"/purchased"}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Purchased Courses 
                  </Link> 
              </div>
            )}
          </div>
          {/* )} */}
        </div>
        {/* </div> */}
        <div className=" p-6 rounded-lg shadow-md mb-8 dark:bg-zinc-900 bg-slate-100">
          <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-500 mb-2">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-black"
                />
              ) : (
                <p>{user?.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-black"
                />
              ) : (
                <p>{user?.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                className="w-full p-2 border rounded text-black"
              />
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Country</label>
              {isEditing ? (
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-black"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p>{user?.nationality}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-500 mb-2">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth?.split("T")[0] || ""}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded text-black"
                />
              ) : (
                <p>{formatDate(user?.dateOfBirth) || "Not provided"}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-500 mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded h-24 resize-none text-black"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="whitespace-pre-wrap">
                  {user?.bio || "No bio provided"}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              isOwnProfile && (
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              )
            )}
          </div>
        </div>

        {/* Referral Code & Rewards */}
        <div className="p-6 rounded-lg shadow-md dark:bg-zinc-900">
          <h2 className="text-xl font-semibold mb-4">Referral Program</h2>

          <div className="bg-slate-300 dark:bg-slate-500 p-4 rounded-lg mb-6 flex justify-between items-center">
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                Your Referral Code
              </p>
              <p className="text-xl font-mono font-bold">
                {user?.referralCode}
              </p>
            </div>
            <button
              // onClick={copyReferralCode}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Copy Code
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileInformation;
