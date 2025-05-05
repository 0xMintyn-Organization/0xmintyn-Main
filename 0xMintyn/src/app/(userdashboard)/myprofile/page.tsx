/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import ConnectAccount from "@/components/MyProfile/ConnectWallet";
import ProfileInformation from "@/components/MyProfile/ProfileInformation";
import SecurityAuth from "@/components/MyProfile/SecurityAuth";
import SocialCommunity from "@/components/MyProfile/Social&Community";
import UBIFinancials from "@/components/MyProfile/UBI&Financials";
import ProductsGrid from "@/components/MyProfile/UserProducts/ProductsGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Protected from "@/hooks/useProtected";
import { useSelector } from "react-redux";

function MyProfile() {
  const { user } = useSelector((state: any) => state.auth);

  return (
    <Protected>

      <div className="flex flex-col mx-auto space-y-4 py-6 px-4">
        {/* Profile Information */}        <ConnectAccount />

        <ProfileInformation isOwnProfile={true} userData={user} />
        <ProductsGrid />

        {/* UBI & Financials */}
        <UBIFinancials />

        {/* Social & Community */}
        <Card>
          <CardHeader className="text-heading font-semibold">
            <CardTitle>Social & Community</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <SocialCommunity />
          </CardContent>
        </Card>

        {/* Security & Authentication */}
        <Card>
          <CardHeader className="text-heading font-semibold">
            <CardTitle>Security & Authentication</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <SecurityAuth />
          </CardContent>
        </Card>

      </div>
    </Protected>

  );
}

export default MyProfile;
