"use client";
import UpdatePassword from "@/components/Settings/UpdatePassword/UpdatePassword";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedSelect, languageOptions } from "@/components/ui/EnhancedSelect";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Protected from "@/hooks/useProtected";
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSize } from "@/contexts/FontSizeContext";
import { useTextToSpeech } from "@/contexts/TextToSpeechContext";
import { TextToSpeechWrapper } from "@/components/TextToSpeech/TextToSpeechWrapper";
import { Bell, ChevronRight, Eye, EyeOff, Lock, Settings as SettingsIcon, Shield, Code, Download, Trash2, CheckCircle, AlertCircle, Zap, Globe, Smartphone, Mail, CreditCard, DollarSign, Gauge, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useAutoLogout } from "@/hooks/useAutoLogout";

const AUTO_LOGOUT_STORAGE_KEY = 'autoLogout_time';
const AUTO_LOGOUT_ENABLED_KEY = 'autoLogout_enabled';
const DEFAULT_AUTO_LOGOUT_TIME = 30; // minutes

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize, resetFontSize } = useFontSize();
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
    speak, 
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
  const [privateMode, setPrivateMode] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

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
      // Also save as session timeout (total session duration)
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

  const SettingCard = ({ icon: Icon, title, description, children, className = "" }: any) => (
    <div className={`group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-lg hover:border-green-400/50 ${className}`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:via-green-500/5 group-hover:to-green-500/0 transition-all duration-300 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 group-hover:shadow-lg transition-all duration-300">
            <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  const ToggleSetting = ({ title, description, defaultChecked = false, onChange }: any) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-green-300/50 transition-all duration-300">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} onChange={onChange} className="scale-110" />
    </div>
  );

  const IconButton = ({ icon: Icon, label, onClick, variant = "outline" }: any) => (
    <Button variant={variant} className={`w-full flex justify-between items-center gap-2 py-6 transition-all duration-300 ${variant === "outline" ? "hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 hover:text-green-600" : ""}`} onClick={onClick}>
      <span>{label}</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  );

  return (
    <Protected>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-8 w-full">
        {/* Header Section */}
        <div className="w-full px-6 mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
              <div>
                <TextToSpeechWrapper>
                  <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">Settings & Preferences</h1>
                </TextToSpeechWrapper>
                <TextToSpeechWrapper>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">Customize your experience and manage your account</p>
                </TextToSpeechWrapper>
              </div>
            <div className="flex items-center gap-3">
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 rounded-lg font-semibold">
                <CheckCircle className="h-5 w-5 mr-2" />
                Save All Changes
              </Button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-200">Profile Active</p>
                <p className="text-sm text-green-700 dark:text-green-300">All settings synced</p>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-200">Security Level: High</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">2FA enabled</p>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 flex items-center gap-3">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="font-semibold text-purple-900 dark:text-purple-200">Premium Member</p>
                <p className="text-sm text-purple-700 dark:text-purple-300">All features unlocked</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="w-full px-6">
          <Tabs defaultValue="general" className="w-full">
            {/* Tab Navigation - Enhanced */}
            <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-2 shadow-sm sticky">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full gap-2 bg-transparent h-auto p-0">
                <TabsTrigger value="general" className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                  <Globe className="h-5 w-5" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                  <Lock className="h-5 w-5" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex items-center gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
                >
                  <Bell className="h-5 w-5" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* GENERAL SETTINGS */}
            <TabsContent value="general" className="space-y-6 animate-in fade-in duration-300">
              {/* <SettingCard icon={Globe} title="Language & Region" description="Choose your preferred language and regional settings">
                <EnhancedSelect
                  value={selectedLanguage}
                  onValueChange={setSelectedLanguage}
                  options={languageOptions}
                  placeholder="Select language"
                  className="w-full"
                />
              </SettingCard> */}

              {/* Theme Preferences */}
              <SettingCard icon={SettingsIcon} title="Theme & Appearance" description="Customize how the platform looks on your devices">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "light", label: "Light", icon: "☀️" },
                    { value: "dark", label: "Dark", icon: "🌙" },
                  ].map((themeOption) => (
                    <div
                      key={themeOption.value}
                      onClick={() => handleThemeChange(themeOption.value as "light" | "dark")}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        theme === themeOption.value 
                          ? "border-green-600 bg-green-50 dark:bg-green-900/20 shadow-lg" 
                          : "border-gray-300 dark:border-gray-600 hover:border-green-400 hover:shadow-md"
                      }`}
                    >
                      <div className="text-3xl mb-2 text-center">{themeOption.icon}</div>
                      <p className="font-medium text-center text-gray-900 dark:text-white">{themeOption.label}</p>
                      {theme === themeOption.value && (
                        <div className="flex justify-center mt-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Current Theme:</strong> {theme === "light" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Theme changes are applied instantly and saved automatically
                  </p>
                </div>
              </SettingCard>

              {/* Accessibility Settings */}
              <SettingCard icon={Smartphone} title="Accessibility" description="Make the platform more comfortable to use">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="font-medium text-gray-900 dark:text-white">Font Size</label>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{fontSize}%</span>
                    </div>
                    <div className="w-full">
                      <input
                        type="range"
                        min="90"
                        max="110"
                        step="1"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${((fontSize - 90) / (110 - 90)) * 100}%, #e5e7eb ${((fontSize - 90) / (110 - 90)) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>90% (Compact)</span>
                      <span>100% (Normal)</span>
                      <span>110% (Comfortable)</span>
                    </div>
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Current Size:</strong> {fontSize}% - {fontSize < 95 ? "Compact" : fontSize < 105 ? "Normal" : "Comfortable"}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Enhanced text scaling with proper line heights and spacing for better readability
                      </p>
                    </div>
                    <Button 
                      onClick={resetFontSize}
                      variant="outline" 
                      size="sm" 
                      className="w-full border-gray-300 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      Reset to Normal (100%)
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-green-300/50 transition-all duration-300">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Text-to-Speech</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enable screen reader compatibility and click-to-read functionality</p>
                      </div>
                      <Switch 
                        checked={ttsEnabled} 
                        onCheckedChange={toggleTTS} 
                        className="scale-110" 
                      />
                    </div>

                    {ttsEnabled && (
                      <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-900 dark:text-green-200">
                            TTS Status: {isSpeaking ? 'Speaking' : 'Ready'}
                          </span>
                          {isSpeaking && (
                            <Button 
                              onClick={stop} 
                              size="sm" 
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              Stop
                            </Button>
                          )}
                        </div>

                        {currentText && (
                          <div className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 p-2 rounded">
                            Reading: "{currentText.substring(0, 50)}{currentText.length > 50 ? '...' : ''}"
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Voice</label>
                            <Select value={voice?.name || ''} onValueChange={(voiceName) => {
                              const selectedVoice = voices.find(v => v.name === voiceName);
                              if (selectedVoice) setVoice(selectedVoice);
                            }}>
                              <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 rounded-lg">
                                <SelectValue placeholder="Select voice" />
                              </SelectTrigger>
                              <SelectContent>
                                {voices.map((v) => (
                                  <SelectItem key={v.name} value={v.name}>
                                    {v.name} ({v.lang})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Rate: {rate.toFixed(1)}x</label>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              value={rate}
                              onChange={(e) => setRate(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Pitch: {pitch.toFixed(1)}</label>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              value={pitch}
                              onChange={(e) => setPitch(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">Volume: {Math.round(volume * 100)}%</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={volume}
                              onChange={(e) => setVolume(parseFloat(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>How to use:</strong> Click on any text element to have it read aloud. The text will be highlighted while being read.
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <TextToSpeechWrapper>
                            <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">Try it now!</h4>
                            <p className="text-sm text-green-800 dark:text-green-300">
                              Click on this text to test the text-to-speech functionality. You should hear the text being read aloud and see it highlighted.
                            </p>
                          </TextToSpeechWrapper>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SettingCard>

              {/* Auto-Logout Timer */}
              <SettingCard icon={Gauge} title="Session Management" description="Control your login session duration and auto-logout">
                <div className="space-y-4">
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-green-300/50 transition-all duration-300">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Enable Auto-Logout</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Automatically log out when session expires for security</p>
                    </div>
                    <Switch 
                      checked={autoLogoutEnabled} 
                      onCheckedChange={handleAutoLogoutEnabledChange}
                      className="scale-110" 
                    />
                  </div>

                  {autoLogoutEnabled && (
                    <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex justify-between items-center">
                        <label className="font-medium text-gray-900 dark:text-white">Session Timeout</label>
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">{autoLogoutTime} min</span>
                      </div>
                      <div className="w-full">
                        <input
                          type="range"
                          min="5"
                          max="120"
                          step="5"
                          value={autoLogoutTime}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            handleAutoLogoutTimeChange(newValue);
                          }}
                          className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb slider-track"
                          style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${((autoLogoutTime - 5) / (120 - 5)) * 100}%, #e5e7eb ${((autoLogoutTime - 5) / (120 - 5)) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>5m</span>
                        <span>30m</span>
                        <span>60m</span>
                        <span>120m</span>
                      </div>
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Session Duration:</strong> {autoLogoutTime} minutes total
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                          You'll be automatically logged out after {autoLogoutTime} minutes of session time. A warning will be shown 2 minutes before logout.
                        </p>
                      </div>
                      <Button 
                        onClick={handleResetAutoLogout}
                        variant="outline" 
                        size="sm" 
                        className="w-full border-gray-300 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        Reset to Default ({DEFAULT_AUTO_LOGOUT_TIME}m)
                      </Button>
                    </div>
                  )}

                  {!autoLogoutEnabled && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Auto-logout is disabled. Your session will remain active until the token expires or you manually log out.
                      </p>
                    </div>
                  )}
                </div>
              </SettingCard>
            </TabsContent>

            {/* SECURITY & PRIVACY */}
            <TabsContent value="security" className="space-y-6 animate-in fade-in duration-300">
              {/* Change Password */}
              <SettingCard icon={Lock} title="Password & Authentication" description="Update your password and manage login credentials">
                <UpdatePassword />
              </SettingCard>

              {/* 2FA */}
              <SettingCard icon={Shield} title="Two-Factor Authentication (2FA)" description="Add an extra layer of security to your account">
                <div className="space-y-3">
                  <ToggleSetting title="Email Verification" description="Receive a verification code via email" defaultChecked={true} />

                  <ToggleSetting title="Authenticator App" description="Use Google Authenticator, Authy, or Microsoft Authenticator" defaultChecked={false} />
                </div>
              </SettingCard>

              {/* Privacy Mode */}
              <SettingCard icon={Eye} title="Privacy & Visibility" description="Control who can see your profile and activities">
                <div className="space-y-3">
                  <ToggleSetting title="Show Online Status" description="Let others see when you're online" defaultChecked={true} />

                  <ToggleSetting title="Allow Message Requests" description="Permit anyone to send you messages" defaultChecked={true} />

                  <ToggleSetting title="Activity Status" description="Share your activity status with connections" defaultChecked={false} />
                </div>
              </SettingCard>

              {/* Recovery Methods */}
              <SettingCard icon={AlertCircle} title="Account Recovery" description="Set up recovery options to regain access if needed">
                <div className="space-y-3">
                  <IconButton icon={Mail} label="Add Recovery Email" variant="outline" />
                  <IconButton icon={Smartphone} label="Add Recovery Phone" variant="outline" />
                  <IconButton icon={Code} label="Generate Backup Codes" variant="outline" />
                </div>
              </SettingCard>

              {/* DApp & API Permissions */}
              <SettingCard icon={Code} title="Connected Apps & Integrations" description="Manage third-party app permissions">
                <div className="space-y-3">
                  <ToggleSetting title="DeFi Aggregator" description="Read-only access to balance" defaultChecked={true} />

                  <ToggleSetting title="NFT Marketplace" description="Transaction signing permissions" defaultChecked={true} />

                  <ToggleSetting title="Analytics Platform" description="View your usage and performance data" defaultChecked={true} />

                  <ToggleSetting title="External Integrations" description="Connect with third-party services" defaultChecked={false} />
                </div>
              </SettingCard>

              {/* Data Management */}
              <SettingCard icon={Download} title="Data & Account Management" description="Control your data and account">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-between py-6 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300">
                    <span className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export All Data (GDPR)
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button variant="destructive" className="w-full justify-between py-6 bg-red-600 hover:bg-red-700">
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Request Account Deletion
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </SettingCard>
            </TabsContent>

            {/* NOTIFICATIONS */}
            <TabsContent value="notifications" className="space-y-6 animate-in fade-in duration-300">
              {/* Email & In-App */}
              <SettingCard icon={Mail} title="Email & In-App Alerts" description="Manage your notification channels">
                <div className="space-y-3">
                  <ToggleSetting title="Email Notifications" description="Receive important updates via email" defaultChecked={true} />
                </div>
              </SettingCard>

              {/* Transaction & Claim Alerts */}
              <SettingCard icon={Zap} title="Transaction & Claim Alerts" description="Get notified about your transactions">
                <div className="space-y-3">
                  <ToggleSetting title="Transaction Confirmations" description="Notifications when transactions complete" defaultChecked={true} />

                  <ToggleSetting title="Claim Reminders" description="Notifications for available UBI claims" defaultChecked={true} />

                  <ToggleSetting title="Gas Price Alerts" description="Notify when gas prices are favorable" defaultChecked={false} />

                  <ToggleSetting title="Failed Transaction Alerts" description="Get notified about failed transactions" defaultChecked={true} />
                </div>
              </SettingCard>

              {/* UBI Reports */}
              <SettingCard icon={DollarSign} title="UBI Reports & Summaries" description="Receive periodic UBI updates">
                <div className="space-y-3">
                  <ToggleSetting title="Weekly Reports" description="Receive weekly UBI earnings summaries" defaultChecked={false} />

                  <ToggleSetting title="Monthly Reports" description="Receive detailed monthly UBI analytics" defaultChecked={true} />

                  <ToggleSetting title="Quarterly Reviews" description="Quarterly performance and growth reports" defaultChecked={false} />

                  <ToggleSetting title="Achievement Notifications" description="Alerts for milestones and achievements" defaultChecked={true} />
                </div>
              </SettingCard>

              {/* Community Announcements */}
              <SettingCard icon={Bell} title="Community & Product Updates" description="Stay informed about community news">
                <div className="space-y-3">
                  <ToggleSetting title="Community Updates" description="News about community initiatives and events" defaultChecked={true} />

                  <ToggleSetting title="Community Events" description="Announcements about meetups and webinars" defaultChecked={false} />

                  <ToggleSetting title="Protocol Updates" description="Important system and protocol changes" defaultChecked={true} />

                  <ToggleSetting title="Marketing & Promotions" description="Special offers and promotions" defaultChecked={false} />

                  <ToggleSetting title="Product Announcements" description="New features and product launches" defaultChecked={true} />
                </div>
              </SettingCard>

              {/* Notification Schedule */}
              <SettingCard icon={Smartphone} title="Notification Quiet Hours" description="Pause notifications during specific times">
                <div className="space-y-4">
                  <ToggleSetting title="Enable Quiet Hours" description="Disable notifications during your rest time" defaultChecked={false} />
                  <div className="grid grid-cols-2 gap-4">
                    <Select defaultValue="22">
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 rounded-lg">
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, "0")}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select defaultValue="08">
                      <SelectTrigger className="border-gray-300 dark:border-gray-600 rounded-lg">
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {String(i).padStart(2, "0")}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SettingCard>
            </TabsContent>

          </Tabs>
        </div>

        {/* Footer Info */}
        <div className="w-full px-6 mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">🔒 Security</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Your data is encrypted and protected with industry-standard security measures.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">🔄 Auto-Sync</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">All settings are automatically synced across your devices in real-time.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">❓ Need Help?</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Visit our <span className="text-green-600 dark:text-green-400 font-semibold cursor-pointer hover:underline">support center</span> for more information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Protected>
  );
}

