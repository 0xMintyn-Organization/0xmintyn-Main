"use client"
import UpdatePassword from "@/components/Settings/UpdatePassword/UpdatePassword";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Protected from "@/hooks/useProtected";
import {
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Settings as SettingsIcon,
  Vote,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export default function Settings() {
  // State for theme preview
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark" | "system">(
    "system"
  );
  const [autoLogoutTime, setAutoLogoutTime] = useState<number>(30);
  const [privateMode, setPrivateMode] = useState<boolean>(false);

  return (
    <Protected>

    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">User Settings</h1>
        <Button variant="outline" className="bg-green-700 hover:bg-green-800 text-white hover:text-white">Save All Changes</Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 md:mb-8 mb-10 gap-2 md:gap-0">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span>Wallet</span>
          </TabsTrigger>
          <TabsTrigger value="governance" className="flex items-center gap-2">
            <Vote className="h-4 w-4" />
            <span>Governance</span>
          </TabsTrigger>
        </TabsList>

        {/* GENERAL SETTINGS */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your language, theme, and accessibility preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Language Selection</h3>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Theme Preferences</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      previewTheme === "light" ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setPreviewTheme("light")}
                  >
                    <div className="bg-white border rounded-md p-2 mb-2">
                      <div className="h-2 w-16 bg-gray-300 rounded-full mb-1"></div>
                      <div className="h-2 w-10 bg-gray-200 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">Light</span>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      previewTheme === "dark" ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setPreviewTheme("dark")}
                  >
                    <div className="bg-gray-900 border border-gray-700 rounded-md p-2 mb-2">
                      <div className="h-2 w-16 bg-gray-700 rounded-full mb-1"></div>
                      <div className="h-2 w-10 bg-gray-800 rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">Dark</span>
                  </div>
                </div>
              </div>

              {/* Accessibility Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Accessibility Settings</h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm">Font Size</label>
                    <span className="text-xs">Medium</span>
                  </div>
                  <Slider defaultValue={[50]} max={100} step={10} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      High-contrast mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Enhance visibility with higher contrast colors
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      Text-to-speech
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Enable screen reader compatibility
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              {/* Auto-Logout Timer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Auto-Logout Timer</h3>
                    <p className="text-xs text-muted-foreground">
                      Set session timeout duration
                    </p>
                  </div>
                  <span className="font-medium">{autoLogoutTime} minutes</span>
                </div>
                <Slider
                  defaultValue={[30]}
                  min={5}
                  max={120}
                  step={5}
                  onValueChange={(val) => setAutoLogoutTime(val[0])}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY & PRIVACY */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
              <CardDescription>
                Manage your password, authentication methods, and privacy
                settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
             <UpdatePassword />

              {/* 2FA */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Two-Factor Authentication
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Verification</h4>
                      <p className="text-xs text-muted-foreground">
                        Receive a code via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Authenticator App</h4>
                      <p className="text-xs text-muted-foreground">
                        Use an app like Google Authenticator
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">SMS Verification</h4>
                      <p className="text-xs text-muted-foreground">
                        Receive a code via text message
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              {/* Privacy Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Private Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Hide your profile from public view
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {privateMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Switch onCheckedChange={setPrivateMode} />
                </div>
              </div>

              {/* Recovery Methods */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Recovery Methods</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full flex justify-between hover:bg-green-800 hover:text-white"
                  >
                    Add trusted contacts
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex justify-between hover:bg-green-800 hover:text-white"
                  >
                    Generate backup codes
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* DApp & API Permissions */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">DApp & API Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Control access for third-party integrations
                </p>
                <div className="border rounded-lg divide-y">
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <h4 className="font-medium">DeFi Aggregator</h4>
                      <p className="text-xs text-muted-foreground">
                        Read-only access to wallet balance
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <div>
                      <h4 className="font-medium">NFT Marketplace</h4>
                      <p className="text-xs text-muted-foreground">
                        Transaction signing permissions
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              {/* Data Export & Account Deletion */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Data & Account Management
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full hover:bg-green-800 hover:text-white">
                    Export All Data (GDPR)
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Request Account Deletion
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications & Communication</CardTitle>
              <CardDescription>
                Customize your notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email & In-App */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email & In-App Alerts</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-xs text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-xs text-muted-foreground">
                        In-app notifications and alerts
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Browser Notifications</h4>
                      <p className="text-xs text-muted-foreground">
                        Desktop alerts when browser is open
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              {/* Transaction & Claim Alerts */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Transaction & Claim Alerts
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Transaction Confirmations</h4>
                      <p className="text-xs text-muted-foreground">
                        Notifications when transactions complete
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Claim Reminders</h4>
                      <p className="text-xs text-muted-foreground">Notifications for available UBI claims</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Gas Price Alerts</h4>
                      <p className="text-xs text-muted-foreground">Notifications when gas prices are favorable</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              {/* UBI Reports */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">UBI Reports</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Weekly Reports</h4>
                      <p className="text-xs text-muted-foreground">Receive weekly UBI summaries</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Monthly Reports</h4>
                      <p className="text-xs text-muted-foreground">Receive detailed monthly UBI reports</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
              
              {/* Community Announcements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Community Announcements</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Governance Updates</h4>
                      <p className="text-xs text-muted-foreground">News about governance proposals</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Community Events</h4>
                      <p className="text-xs text-muted-foreground">Announcements about virtual meetups</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Protocol Updates</h4>
                      <p className="text-xs text-muted-foreground">Important system and protocol changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* WALLET & PAYMENT */}
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>Wallet & Payment Settings</CardTitle>
              <CardDescription>Manage your wallet connections and payment preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Wallet Management */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Connected Wallets</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">MetaMask</h4>
                        <p className="text-xs text-muted-foreground">0x71C...F3E2 (Primary)</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="bg-green-900 hover:bg-green-600 text-white hover:text-white">Disconnect</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">WalletConnect</h4>
                        <p className="text-xs text-muted-foreground">0x89B...42A1</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                      <Button variant="outline" size="sm" className="bg-green-700 hover:bg-green-800 text-white hover:text-white">Set Primary</Button>
                      <Button variant="outline" size="sm" className="bg-green-900 hover:bg-green-600 text-white hover:text-white">Disconnect</Button>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-green-700 hover:bg-green-800 text-white">+ Connect New Wallet</Button>
                </div>
              </div>
              
              {/* Gas Fee Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Gas Fee Preferences</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-adjust Gas Fees</h4>
                      <p className="text-xs text-muted-foreground">Optimize based on network conditions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Gas Price Strategy</label>
                    <Select defaultValue="balanced">
                      <SelectTrigger>
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast (Higher Cost)</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="economic">Economic (Slower)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Fiat On/Off Ramp */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fiat On/Off Ramp Integration</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-500 font-bold">$</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Stripe</h4>
                        <p className="text-xs text-muted-foreground">Credit/debit card payments</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-500 font-bold">R</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Ramp</h4>
                        <p className="text-xs text-muted-foreground">Bank transfers & more</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <span className="text-yellow-500 font-bold">M</span>
                      </div>
                      <div>
                        <h4 className="font-medium">MoonPay</h4>
                        <p className="text-xs text-muted-foreground">Global payment options</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* GOVERNANCE */}
        <TabsContent value="governance">
          <Card>
            <CardHeader>
              <CardTitle>Governance & Participation</CardTitle>
              <CardDescription>Manage your governance settings and view participation statistics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voting Dashboard */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Voting Dashboard</h3>
                <div className="space-y-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">Active Proposals</h4>
                      <span className="text-sm font-medium text-green-500">4 Open</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                        <span className="text-sm">UBI Increase Proposal</span>
                        <Button size="sm" variant="outline" className="bg-green-700 hover:bg-green-800 text-white hover:text-white">Vote</Button>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                        <span className="text-sm">Protocol Upgrade v2.3</span>
                        <Button size="sm" variant="outline" className="bg-green-700 hover:bg-green-800 text-white hover:text-white">Vote</Button>
                      </div>
                    </div>
                    <Button variant="link" className="px-0 mt-2">View All Proposals</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Delegate Voting Power</h4>
                      <p className="text-xs text-muted-foreground">Allow a trusted delegate to vote on your behalf</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-green-700 hover:bg-green-800 text-white hover:text-white">Configure</Button>
                  </div>
                </div>
              </div>
              
              {/* Project Contributions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Project Contributions</h3>
                <div className="space-y-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between mb-4">
                      <h4 className="font-medium">Reputation Points</h4>
                      <span className="text-lg font-bold">1,250</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Governance Participation</span>
                          <span>450 pts</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="w-[36%] bg-blue-500 h-2 rounded-full"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Community Engagement</span>
                          <span>325 pts</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="w-[26%] bg-green-500 h-2 rounded-full"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Protocol Testing</span>
                          <span>475 pts</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="w-[38%] bg-purple-500 h-2 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Contribution Preferences</h4>
                      <p className="text-xs text-muted-foreground">Choose areas where you&apos;d like to contribute</p>
                    </div>
                    <Button variant="outline" size="sm" className="bg-green-700 hover:bg-green-800 text-white hover:text-white">Configure</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Protected>
  );
}
