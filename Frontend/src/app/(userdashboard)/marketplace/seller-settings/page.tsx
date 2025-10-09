'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, Upload, Save, Bell, CreditCard, Shield, 
  Globe, Mail, Phone, MapPin, FileText, CheckCircle,
  AlertCircle, Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function SellerSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Seller Profile State
  const [sellerProfile, setSellerProfile] = useState({
    storeName: 'CodeMaster Pro',
    tagline: 'Professional Web Development Services',
    description: 'I am a full-stack developer with 5+ years of experience in building modern web applications using React, Node.js, and other cutting-edge technologies.',
    logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=200&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=1200&h=400&fit=crop',
    website: 'https://codemaster.com',
    email: 'contact@codemaster.com',
    phone: '+1 (555) 123-4567',
    address: '123 Tech Street, San Francisco, CA 94102',
    languages: ['English', 'Spanish'],
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    responseTime: '2 hours',
    completionRate: 98,
    rating: 4.8
  });

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    paypalEmail: 'payment@codemaster.com',
    stripeConnected: true,
    withdrawalMethod: 'paypal',
    minimumWithdrawal: 50
  });

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    emailNewOrder: true,
    emailMessageReceived: true,
    emailReviewReceived: true,
    emailPaymentReceived: true,
    pushNewOrder: true,
    pushMessage: false,
    smsImportant: false
  });

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // TODO: API call to save profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Profile Updated",
        description: "Your seller profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Payment Settings Updated",
        description: "Your payment settings have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Notification Preferences Updated",
        description: "Your notification settings have been saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update notification settings.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Seller Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your seller profile, payment methods, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2">
            <Store className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Update your store name, description, and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Store Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <Image
                      src={sellerProfile.logo}
                      alt="Store Logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Change Logo
                  </Button>
                </div>
              </div>

              {/* Banner Image */}
              <div className="space-y-2">
                <Label>Banner Image</Label>
                <div className="relative w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 mb-2">
                  <Image
                    src={sellerProfile.bannerImage}
                    alt="Store Banner"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Change Banner
                </Button>
              </div>

              {/* Store Name */}
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name *</Label>
                <Input
                  id="storeName"
                  value={sellerProfile.storeName}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, storeName: e.target.value })}
                  placeholder="Your store name"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={sellerProfile.tagline}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, tagline: e.target.value })}
                  placeholder="A short tagline for your store"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Store Description *</Label>
                <Textarea
                  id="description"
                  value={sellerProfile.description}
                  onChange={(e) => setSellerProfile({ ...sellerProfile, description: e.target.value })}
                  placeholder="Describe your store and services..."
                  rows={5}
                />
                <p className="text-sm text-gray-500">
                  {sellerProfile.description.length}/500 characters
                </p>
              </div>

              {/* Skills/Categories */}
              <div className="space-y-2">
                <Label>Skills & Expertise</Label>
                <div className="flex flex-wrap gap-2">
                  {sellerProfile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                  <Button variant="outline" size="sm">
                    + Add Skill
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? (
                    <>
                      <Settings className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How buyers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={sellerProfile.email}
                      onChange={(e) => setSellerProfile({ ...sellerProfile, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={sellerProfile.phone}
                      onChange={(e) => setSellerProfile({ ...sellerProfile, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      type="url"
                      value={sellerProfile.website}
                      onChange={(e) => setSellerProfile({ ...sellerProfile, website: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      value={sellerProfile.address}
                      onChange={(e) => setSellerProfile({ ...sellerProfile, address: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Contact Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Configure how you receive payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PayPal */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">PayPal</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Withdraw earnings to your PayPal account
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    Connected
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypalEmail">PayPal Email</Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    value={paymentSettings.paypalEmail}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalEmail: e.target.value })}
                  />
                </div>
              </div>

              {/* Stripe */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Stripe</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Direct bank transfers via Stripe
                      </p>
                    </div>
                  </div>
                  {paymentSettings.stripeConnected ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      Connected
                    </Badge>
                  ) : (
                    <Button variant="outline">Connect Stripe</Button>
                  )}
                </div>
              </div>

              {/* Withdrawal Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Withdrawal Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Method</Label>
                    <Select 
                      value={paymentSettings.withdrawalMethod}
                      onValueChange={(value) => setPaymentSettings({ ...paymentSettings, withdrawalMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Withdrawal Amount</Label>
                    <Input
                      type="number"
                      value={paymentSettings.minimumWithdrawal}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, minimumWithdrawal: parseInt(e.target.value) })}
                      prefix="$"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePayment} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Payment Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <h3 className="font-semibold">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Order Received</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified when you receive a new order
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNewOrder}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNewOrder: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Message</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified when buyers send you messages
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailMessageReceived}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailMessageReceived: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Review Received</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified when you receive a new review
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailReviewReceived}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailReviewReceived: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Payment Received</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified when payments are processed
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailPaymentReceived}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailPaymentReceived: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Orders</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Instant notifications for new orders
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNewOrder}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, pushNewOrder: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Messages</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Instant notifications for new messages
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushMessage}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, pushMessage: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-300">Account Verified</p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Your seller account has been verified and is in good standing.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Enable Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Account Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

