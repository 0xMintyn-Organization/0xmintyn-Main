"use client";
import UpdatePassword from "@/components/Settings/UpdatePassword/UpdatePassword";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Protected from "@/hooks/useProtected";
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSize } from "@/contexts/FontSizeContext";
import { useTextToSpeech } from "@/contexts/TextToSpeechContext";
import { TextToSpeechWrapper } from "@/components/TextToSpeech/TextToSpeechWrapper";
import { 
  Bell, 
  ChevronRight, 
  Eye, 
  Lock, 
  Settings as SettingsIcon, 
  Wallet, 
  Shield, 
  Code, 
  Download, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Globe, 
  Smartphone, 
  Mail, 
  CreditCard, 
  DollarSign, 
  Gauge, 
  Moon, 
  Sun,
  Save
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useToast } from "@/hooks/use-toast";

const AUTO_LOGOUT_STORAGE_KEY = 'autoLogout_time';
const AUTO_LOGOUT_ENABLED_KEY = 'autoLogout_enabled';
const DEFAULT_AUTO_LOGOUT_TIME = 30; // minutes

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize, resetFontSize } = useFontSize();
  const { toast } = useToast();
  const { 
    isEnabled: ttsEnabled, 
    isSpeaking, 
    currentText, 
    voice, 
    rate, 
    pitch, 
    volume, 
    voices, 
    toggleTTS, 
    stop, 
    setVoice, 
    setRate, 
    setPitch, 
    setVolume 
  } = useTextToSpeech();
  
  // Auto-logout state with persistence
  const [autoLogoutTime, setAutoLogoutTime] = useState<number>(DEFAULT_AUTO_LOGOUT_TIME);
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState<boolean>(true);
  const { saveUserPreference } = useAutoLogout();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isSaving, setIsSaving] = useState(false);

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    email: true,
    transactionAlerts: true,
    claimReminders: true,
    gasPriceAlerts: false,
    failedTransactionAlerts: true,
    weeklyReports: false,
    monthlyReports: true,
    quarterlyReviews: false,
    achievementNotifications: true,
    communityUpdates: true,
    communityEvents: false,
    protocolUpdates: true,
    marketingPromotions: false,
    productAnnouncements: true,
  });

  // Privacy settings state
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    allowMessageRequests: true,
    activityStatus: false,
  });

  // Connected apps state
  const [connectedApps, setConnectedApps] = useState({
    defiAggregator: true,
    nftMarketplace: true,
    analyticsPlatform: true,
    externalIntegrations: false,
  });

  // Payment preferences state
  const [paymentPrefs, setPaymentPrefs] = useState({
    preferredCurrency: "usd",
    autoConversion: true,
    gasFeeStrategy: "balanced",
    autoAdjustGas: true,
  });

  // Quiet hours state
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: 22,
    end: 8,
  });

  // Load auto-logout preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTime = localStorage.getItem(AUTO_LOGOUT_STORAGE_KEY);
      const savedEnabled = localStorage.getItem(AUTO_LOGOUT_ENABLED_KEY);
      
      if (savedTime) {
        const parsedTime = parseInt(savedTime, 10);
        if (!isNaN(parsedTime) && parsedTime >= 5 && parsedTime <= 120) {
          setAutoLogoutTime(parsedTime);
        }
      }
      
      if (savedEnabled !== null) {
        setAutoLogoutEnabled(savedEnabled === 'true');
      }
    }
  }, []);

  // Save auto-logout time preference
  const handleAutoLogoutTimeChange = (value: number) => {
    setAutoLogoutTime(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTO_LOGOUT_STORAGE_KEY, value.toString());
      localStorage.setItem('autoLogout_sessionTimeout', value.toString());
    }
  };

  // Save auto-logout enabled preference
  const handleAutoLogoutEnabledChange = (enabled: boolean) => {
    setAutoLogoutEnabled(enabled);
    saveUserPreference(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTO_LOGOUT_ENABLED_KEY, enabled.toString());
    }
  };

  // Reset to default
  const handleResetAutoLogout = () => {
    handleAutoLogoutTimeChange(DEFAULT_AUTO_LOGOUT_TIME);
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    if (newTheme !== theme) {
      toggleTheme();
    }
  };

  // Save all settings
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings saved",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSetting = ({ 
    title, 
    description, 
    checked, 
    onCheckedChange 
  }: { 
    title: string; 
    description: string; 
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-2 px-3 rounded-md border border-border hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-xs font-medium text-foreground leading-tight">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="scale-90" />
    </div>
  );

  return (
    <Protected>
      <div className="min-h-screen bg-background py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <TextToSpeechWrapper>
                  <h1 className="text-xl font-semibold text-foreground">Settings</h1>
                </TextToSpeechWrapper>
                <TextToSpeechWrapper>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage your preferences</p>
                </TextToSpeechWrapper>
              </div>
              <Button 
                onClick={handleSaveAll}
                disabled={isSaving}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-8"
              >
                {isSaving ? (
                  <>
                    <Zap className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 h-9">
              <TabsTrigger value="general" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Wallet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
            </TabsList>

            {/* GENERAL SETTINGS */}
            <TabsContent value="general" className="space-y-3">
              {/* Theme */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <SettingsIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Theme</CardTitle>
                      <CardDescription className="text-xs">Choose your preferred theme</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleThemeChange("light")}
                      className={`p-3 rounded-lg border transition-all ${
                        theme === "light" 
                          ? "border-green-600 bg-green-50 dark:bg-green-900/20" 
                          : "border-border hover:border-green-300"
                      }`}
                    >
                      <Sun className="h-4 w-4 mx-auto mb-1.5 text-foreground" />
                      <p className="text-xs font-medium text-center">Light</p>
                      {theme === "light" && (
                        <CheckCircle className="h-3 w-3 mx-auto mt-1 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleThemeChange("dark")}
                      className={`p-3 rounded-lg border transition-all ${
                        theme === "dark" 
                          ? "border-green-600 bg-green-50 dark:bg-green-900/20" 
                          : "border-border hover:border-green-300"
                      }`}
                    >
                      <Moon className="h-4 w-4 mx-auto mb-1.5 text-foreground" />
                      <p className="text-xs font-medium text-center">Dark</p>
                      {theme === "dark" && (
                        <CheckCircle className="h-3 w-3 mx-auto mt-1 text-green-600" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Accessibility */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Smartphone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Accessibility</CardTitle>
                      <CardDescription className="text-xs">Customize text size and reading</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-3">
                  {/* Font Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-medium text-foreground">Font Size</label>
                      <span className="text-xs font-semibold text-green-600">{fontSize}%</span>
                    </div>
                    <input
                      type="range"
                      min="90"
                      max="110"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #16a34a 0%, #16a34a ${((fontSize - 90) / (110 - 90)) * 100}%, #e5e7eb ${((fontSize - 90) / (110 - 90)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>90%</span>
                      <span>100%</span>
                      <span>110%</span>
                    </div>
                    <Button 
                      onClick={resetFontSize}
                      variant="outline" 
                      size="sm" 
                      className="w-full h-7 text-xs"
                    >
                      Reset to 100%
                    </Button>
                  </div>

                  {/* Text-to-Speech */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <ToggleSetting
                      title="Text-to-Speech"
                      description="Enable screen reader compatibility"
                      checked={ttsEnabled}
                      onCheckedChange={toggleTTS}
                    />

                    {ttsEnabled && (
                      <div className="space-y-2 p-2.5 bg-muted rounded-md">
                        {isSpeaking && (
                          <div className="flex items-center justify-between p-1.5 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                            <span className="text-[10px] text-green-700 dark:text-green-300 truncate flex-1 mr-2">
                              Reading: "{currentText?.substring(0, 35)}..."
                            </span>
                            <Button onClick={stop} size="sm" variant="outline" className="h-6 text-[10px] px-2">
                              Stop
                            </Button>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-medium text-foreground mb-1 block">Voice</label>
                            <Select value={voice?.name || ''} onValueChange={(voiceName) => {
                              const selectedVoice = voices.find(v => v.name === voiceName);
                              if (selectedVoice) setVoice(selectedVoice);
                            }}>
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {voices.map((v) => (
                                  <SelectItem key={v.name} value={v.name} className="text-xs">
                                    {v.name} ({v.lang})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-[10px] font-medium text-foreground mb-1 block">Rate: {rate.toFixed(1)}x</label>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              value={rate}
                              onChange={(e) => setRate(parseFloat(e.target.value))}
                              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-medium text-foreground mb-1 block">Pitch: {pitch.toFixed(1)}</label>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              value={pitch}
                              onChange={(e) => setPitch(parseFloat(e.target.value))}
                              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-medium text-foreground mb-1 block">Volume: {Math.round(volume * 100)}%</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={(e) => setVolume(parseFloat(e.target.value))}
                              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Session Management */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Gauge className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Session</CardTitle>
                      <CardDescription className="text-xs">Control session duration</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-3">
                  <ToggleSetting
                    title="Enable Auto-Logout"
                    description="Auto logout when session expires"
                    checked={autoLogoutEnabled}
                    onCheckedChange={handleAutoLogoutEnabledChange}
                  />

                  {autoLogoutEnabled && (
                    <div className="space-y-2 p-2.5 bg-muted rounded-md">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-foreground">Timeout</label>
                        <span className="text-xs font-semibold text-green-600">{autoLogoutTime} min</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={autoLogoutTime}
                        onChange={(e) => handleAutoLogoutTimeChange(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #16a34a 0%, #16a34a ${((autoLogoutTime - 5) / (120 - 5)) * 100}%, #e5e7eb ${((autoLogoutTime - 5) / (120 - 5)) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>5m</span>
                        <span>30m</span>
                        <span>60m</span>
                        <span>120m</span>
                      </div>
                      <Button 
                        onClick={handleResetAutoLogout}
                        variant="outline" 
                        size="sm" 
                        className="w-full h-7 text-xs"
                      >
                        Reset ({DEFAULT_AUTO_LOGOUT_TIME}m)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SECURITY */}
            <TabsContent value="security" className="space-y-3">
              {/* Password */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Lock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Password</CardTitle>
                      <CardDescription className="text-xs">Update your password</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <UpdatePassword />
                </CardContent>
              </Card>

              {/* 2FA */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Shield className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Two-Factor Auth</CardTitle>
                      <CardDescription className="text-xs">Extra security layer</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <ToggleSetting
                    title="Email Verification"
                    description="Receive a verification code via email"
                    checked={true}
                    onCheckedChange={() => {}}
                  />
                
                </CardContent>
              </Card>

           

              {/* Connected Apps */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Code className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Connected Apps</CardTitle>
                      <CardDescription className="text-xs">Manage app permissions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <ToggleSetting
                    title="DeFi Aggregator"
                    description="Read-only access to wallet balance"
                    checked={connectedApps.defiAggregator}
                    onCheckedChange={(checked) => setConnectedApps({...connectedApps, defiAggregator: checked})}
                  />
                  <ToggleSetting
                    title="NFT Marketplace"
                    description="Transaction signing permissions"
                    checked={connectedApps.nftMarketplace}
                    onCheckedChange={(checked) => setConnectedApps({...connectedApps, nftMarketplace: checked})}
                  />
                  <ToggleSetting
                    title="Analytics Platform"
                    description="View your usage and performance data"
                    checked={connectedApps.analyticsPlatform}
                    onCheckedChange={(checked) => setConnectedApps({...connectedApps, analyticsPlatform: checked})}
                  />
                  <ToggleSetting
                    title="External Integrations"
                    description="Connect with third-party services"
                    checked={connectedApps.externalIntegrations}
                    onCheckedChange={(checked) => setConnectedApps({...connectedApps, externalIntegrations: checked})}
                  />
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Download className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Data & Account</CardTitle>
                      <CardDescription className="text-xs">Control your data</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      Export Data (GDPR)
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="destructive" size="sm" className="w-full justify-between h-8 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Account
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTIFICATIONS */}
            <TabsContent value="notifications" className="space-y-3">
              {/* Email & In-App */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Mail className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Email & In-App</CardTitle>
                      <CardDescription className="text-xs">Notification channels</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <ToggleSetting
                    title="Email Notifications"
                    description="Receive important updates via email"
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  />
                </CardContent>
              </Card>

              {/* Transaction Alerts */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Zap className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Transactions</CardTitle>
                      <CardDescription className="text-xs">Transaction notifications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <ToggleSetting
                    title="Transaction Confirmations"
                    description="Notifications when transactions complete"
                    checked={notifications.transactionAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, transactionAlerts: checked})}
                  />
                  <ToggleSetting
                    title="Claim Reminders"
                    description="Notifications for available UBI claims"
                    checked={notifications.claimReminders}
                    onCheckedChange={(checked) => setNotifications({...notifications, claimReminders: checked})}
                  />
                  <ToggleSetting
                    title="Gas Price Alerts"
                    description="Notify when gas prices are favorable"
                    checked={notifications.gasPriceAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, gasPriceAlerts: checked})}
                  />
                  <ToggleSetting
                    title="Failed Transaction Alerts"
                    description="Get notified about failed transactions"
                    checked={notifications.failedTransactionAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, failedTransactionAlerts: checked})}
                  />
                </CardContent>
              </Card>

              {/* UBI Reports */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">UBI Reports</CardTitle>
                      <CardDescription className="text-xs">Periodic UBI updates</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <ToggleSetting
                    title="Weekly Reports"
                    description="Receive weekly UBI earnings summaries"
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                  />
                  <ToggleSetting
                    title="Monthly Reports"
                    description="Receive detailed monthly UBI analytics"
                    checked={notifications.monthlyReports}
                    onCheckedChange={(checked) => setNotifications({...notifications, monthlyReports: checked})}
                  />
                  <ToggleSetting
                    title="Quarterly Reviews"
                    description="Quarterly performance and growth reports"
                    checked={notifications.quarterlyReviews}
                    onCheckedChange={(checked) => setNotifications({...notifications, quarterlyReviews: checked})}
                  />
                  <ToggleSetting
                    title="Achievement Notifications"
                    description="Alerts for milestones and achievements"
                    checked={notifications.achievementNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, achievementNotifications: checked})}
                  />
                </CardContent>
              </Card>

              {/* Community Updates */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Bell className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Community</CardTitle>
                      <CardDescription className="text-xs">Community news & updates</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <ToggleSetting
                    title="Community Updates"
                    description="News about community initiatives"
                    checked={notifications.communityUpdates}
                    onCheckedChange={(checked) => setNotifications({...notifications, communityUpdates: checked})}
                  />
                  <ToggleSetting
                    title="Community Events"
                    description="Announcements about meetups and webinars"
                    checked={notifications.communityEvents}
                    onCheckedChange={(checked) => setNotifications({...notifications, communityEvents: checked})}
                  />
                  <ToggleSetting
                    title="Protocol Updates"
                    description="Important system and protocol changes"
                    checked={notifications.protocolUpdates}
                    onCheckedChange={(checked) => setNotifications({...notifications, protocolUpdates: checked})}
                  />
                  <ToggleSetting
                    title="Marketing & Promotions"
                    description="Special offers and promotions"
                    checked={notifications.marketingPromotions}
                    onCheckedChange={(checked) => setNotifications({...notifications, marketingPromotions: checked})}
                  />
                  <ToggleSetting
                    title="Product Announcements"
                    description="New features and product launches"
                    checked={notifications.productAnnouncements}
                    onCheckedChange={(checked) => setNotifications({...notifications, productAnnouncements: checked})}
                  />
                </CardContent>
              </Card>

              {/* Quiet Hours */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Smartphone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Quiet Hours</CardTitle>
                      <CardDescription className="text-xs">Pause notifications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-3">
                  <ToggleSetting
                    title="Enable Quiet Hours"
                    description="Disable during rest time"
                    checked={quietHours.enabled}
                    onCheckedChange={(checked) => setQuietHours({...quietHours, enabled: checked})}
                  />
                  {quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-foreground mb-1 block">Start</label>
                        <Select 
                          value={String(quietHours.start)} 
                          onValueChange={(value) => setQuietHours({...quietHours, start: parseInt(value)})}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)} className="text-xs">
                                {String(i).padStart(2, "0")}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-foreground mb-1 block">End</label>
                        <Select 
                          value={String(quietHours.end)} 
                          onValueChange={(value) => setQuietHours({...quietHours, end: parseInt(value)})}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={String(i)} className="text-xs">
                                {String(i).padStart(2, "0")}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* WALLET */}
            <TabsContent value="wallet" className="space-y-3">
              {/* Connected Wallets */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Wallet className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Wallets</CardTitle>
                      <CardDescription className="text-xs">Manage wallet connections</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-2">
                  <div className="p-2 rounded-md border border-border bg-muted/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs font-medium text-foreground">MetaMask</p>
                        <p className="text-[10px] text-muted-foreground font-mono">0x71C...F3E2</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 px-2">
                      Disconnect
                    </Button>
                  </div>
                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 h-8 text-xs">
                    + Connect Wallet
                  </Button>
                </CardContent>
              </Card>

              {/* Gas Fee Settings */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Gauge className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Gas Fees</CardTitle>
                      <CardDescription className="text-xs">Optimize transaction costs</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-3">
                  <ToggleSetting
                    title="Auto-Adjust Gas"
                    description="Optimize based on network"
                    checked={paymentPrefs.autoAdjustGas}
                    onCheckedChange={(checked) => setPaymentPrefs({...paymentPrefs, autoAdjustGas: checked})}
                  />
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Strategy</label>
                    <Select 
                      value={paymentPrefs.gasFeeStrategy}
                      onValueChange={(value) => setPaymentPrefs({...paymentPrefs, gasFeeStrategy: value})}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast" className="text-xs">⚡ Fast (Higher Cost)</SelectItem>
                        <SelectItem value="balanced" className="text-xs">⚖️ Balanced (Recommended)</SelectItem>
                        <SelectItem value="economic" className="text-xs">💰 Economic (Slower)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Preferences */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <CreditCard className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Payment</CardTitle>
                      <CardDescription className="text-xs">Default payment methods</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Currency</label>
                    <Select 
                      value={paymentPrefs.preferredCurrency}
                      onValueChange={(value) => setPaymentPrefs({...paymentPrefs, preferredCurrency: value})}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd" className="text-xs">💵 USD</SelectItem>
                        <SelectItem value="eur" className="text-xs">💶 EUR</SelectItem>
                        <SelectItem value="gbp" className="text-xs">💷 GBP</SelectItem>
                        <SelectItem value="btc" className="text-xs">₿ BTC</SelectItem>
                        <SelectItem value="eth" className="text-xs">Ξ ETH</SelectItem>
                        <SelectItem value="usdt" className="text-xs">USDT</SelectItem>
                        <SelectItem value="usdc" className="text-xs">USDC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <ToggleSetting
                    title="Auto-Conversion"
                    description="Convert to preferred currency"
                    checked={paymentPrefs.autoConversion}
                    onCheckedChange={(checked) => setPaymentPrefs({...paymentPrefs, autoConversion: checked})}
                  />
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                      <Zap className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">History</CardTitle>
                      <CardDescription className="text-xs">Transaction records</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs">
                    <span className="flex items-center gap-1.5">
                      📊 View History
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Protected>
  );
}
