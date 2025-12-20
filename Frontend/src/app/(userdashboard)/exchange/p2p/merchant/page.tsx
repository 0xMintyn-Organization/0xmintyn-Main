'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Protected from '@/hooks/useProtected';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Store, ArrowLeft, CheckCircle2, Shield, HandCoins, PauseCircle, PlayCircle, Trash2, Plus } from 'lucide-react';

type MerchantProfile = {
  displayName: string;
  paymentMethods: string[];
  timeLimitMinutes: number;
  terms: string;
};

type CustomP2POffer = {
  id: string;
  traderName: string;
  traderId: string;
  traderRating: number;
  completedTrades: number;
  completionRate: number;
  responseRate: number;
  responseTime: number;
  price: number;
  available: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  side: 'buy' | 'sell';
  timeLimit: number;
  isVerified: boolean;
  isOnline: boolean;
  requiresVerification?: boolean;
  asset: string;
  // extra meta (optional)
  createdAt?: string;
  terms?: string;
};

const PROFILE_KEY = 'exchange:p2pMerchantProfile';
const OFFERS_KEY = 'exchange:p2pCustomOffers';

const AVAILABLE_PAYMENT_METHODS = ['Easypaisa', 'JazzCash', 'Bank Transfer', 'Wise', 'PayPal', 'Revolut'] as const;
const AVAILABLE_ASSETS = ['OXM', 'USDT', 'BTC', 'ETH', 'SOL', 'USDC'] as const;

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readStorageJson<T>(key: string): T | null {
  try {
    const fromLocal = safeParse<T>(localStorage.getItem(key));
    if (fromLocal) return fromLocal;
  } catch {
    // ignore
  }
  try {
    return safeParse<T>(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

function writeStorageJson(key: string, value: unknown) {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
  } catch {
    // ignore
  }
  try {
    sessionStorage.setItem(key, serialized);
  } catch {
    // ignore
  }
}

export default function ExchangeP2PMerchantPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent'); // buy | sell
  const { user } = useAuth();

  const traderId = user?._id || `local:${user?.email || 'me'}`;

  const [profile, setProfile] = useState<MerchantProfile>({
    displayName: user?.name || user?.email || 'Merchant',
    paymentMethods: ['Easypaisa', 'JazzCash'],
    timeLimitMinutes: 15,
    terms: 'Fast response. Please pay within time window and share transaction reference.',
  });

  const [profileDraft, setProfileDraft] = useState<MerchantProfile>(profile);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  const [offers, setOffers] = useState<CustomP2POffer[]>([]);
  const [offerQuery, setOfferQuery] = useState('');
  const [offerFilterSide, setOfferFilterSide] = useState<'all' | 'buy' | 'sell'>('all');

  const [isCreateAdDialogOpen, setIsCreateAdDialogOpen] = useState(false);
  const [adSide, setAdSide] = useState<'buy' | 'sell'>(intent === 'sell' ? 'sell' : 'buy');

  // Ad form (modal) state
  const [asset, setAsset] = useState<(typeof AVAILABLE_ASSETS)[number]>('OXM');
  const [price, setPrice] = useState<string>('1.05');
  const [available, setAvailable] = useState<string>('1000');
  const [minLimit, setMinLimit] = useState<string>('50');
  const [maxLimit, setMaxLimit] = useState<string>('5000');

  useEffect(() => {
    const savedProfile = readStorageJson<MerchantProfile>(PROFILE_KEY);
    if (savedProfile) {
      setProfile(savedProfile);
      setProfileDraft(savedProfile);
    }

    const savedOffers = readStorageJson<CustomP2POffer[]>(OFFERS_KEY) || [];
    setOffers(savedOffers);
  }, []);

  useEffect(() => {
    setAdSide(intent === 'sell' ? 'sell' : 'buy');
  }, [intent]);

  const profileReady = useMemo(() => {
    return profile.displayName.trim().length >= 2 && profile.paymentMethods.length > 0 && profile.timeLimitMinutes > 0;
  }, [profile]);

  const togglePaymentMethodDraft = (method: string) => {
    setProfileDraft((prev) => {
      const exists = prev.paymentMethods.includes(method);
      const nextMethods = exists ? prev.paymentMethods.filter((m) => m !== method) : [...prev.paymentMethods, method];
      return { ...prev, paymentMethods: nextMethods };
    });
  };

  const openEditProfile = () => {
    setProfileDraft(profile);
    setIsProfileDialogOpen(true);
  };

  const saveProfile = () => {
    setProfile(profileDraft);
    writeStorageJson(PROFILE_KEY, profileDraft);
    toast.success('Merchant profile saved');
    setIsProfileDialogOpen(false);
  };

  const myOffers = useMemo(() => {
    return offers.filter((o) => o.traderId === traderId);
  }, [offers, traderId]);

  const filteredMyOffers = useMemo(() => {
    const q = offerQuery.trim().toLowerCase();
    return myOffers.filter((o) => {
      const matchesQuery =
        !q ||
        o.asset.toLowerCase().includes(q) ||
        o.side.toLowerCase().includes(q) ||
        o.paymentMethods.join(' ').toLowerCase().includes(q);
      const matchesSide = offerFilterSide === 'all' ? true : o.side === offerFilterSide;
      return matchesQuery && matchesSide;
    });
  }, [myOffers, offerQuery, offerFilterSide]);

  const persistOffers = (next: CustomP2POffer[]) => {
    setOffers(next);
    writeStorageJson(OFFERS_KEY, next);
  };

  const toggleOfferOnline = (offerId: string) => {
    const next = offers.map((o) => (o.id === offerId ? { ...o, isOnline: !o.isOnline } : o));
    persistOffers(next);
  };

  const deleteOffer = (offerId: string) => {
    const next = offers.filter((o) => o.id !== offerId);
    persistOffers(next);
  };

  const openCreateAd = (side?: 'buy' | 'sell') => {
    setAdSide(side || (intent === 'sell' ? 'sell' : 'buy'));
    setIsCreateAdDialogOpen(true);
  };

  const createAd = () => {
    if (!profileReady) {
      toast.error('Complete your merchant profile first (name + payment methods + time limit).');
      setIsProfileDialogOpen(true);
      return;
    }

    const numericPrice = Number(price);
    const numericAvailable = Number(available);
    const numericMin = Number(minLimit);
    const numericMax = Number(maxLimit);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) return toast.error('Invalid price');
    if (!Number.isFinite(numericAvailable) || numericAvailable <= 0) return toast.error('Invalid available amount');
    if (!Number.isFinite(numericMin) || numericMin <= 0) return toast.error('Invalid min limit');
    if (!Number.isFinite(numericMax) || numericMax <= 0 || numericMax < numericMin) return toast.error('Invalid max limit');

    const offer: CustomP2POffer = {
      id: `custom_${Date.now()}`,
      traderName: profile.displayName.trim(),
      traderId,
      traderRating: 0,
      completedTrades: 0,
      completionRate: 0,
      responseRate: 0,
      responseTime: 5,
      price: numericPrice,
      available: numericAvailable,
      minLimit: numericMin,
      maxLimit: numericMax,
      paymentMethods: profile.paymentMethods,
      side: adSide,
      timeLimit: profile.timeLimitMinutes,
      isVerified: false,
      isOnline: true,
      requiresVerification: false,
      asset,
      createdAt: new Date().toISOString(),
      terms: profile.terms,
    };

    persistOffers([offer, ...offers]);
    toast.success(`${adSide === 'buy' ? 'Buy' : 'Sell'} ad created`);
    setIsCreateAdDialogOpen(false);
  };

  return (
    <Protected>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Store className="w-7 h-7" />
              P2P Merchant Setup
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Setup your payment methods and post Buy/Sell ads (Binance-style). For now this is frontend-only (saved in session).
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Merchant profile summary */}
        <Card className="border border-gray-200 dark:border-zinc-800">
          <CardHeader className="border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Merchant Profile
                  {profileReady ? (
                    <Badge className="bg-emerald-600 text-white ml-2">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2">
                      Incomplete
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  This info is shown on your ads and used during P2P order chat.
                </p>
              </div>
              <Button onClick={openEditProfile} variant="outline">
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 bg-gray-50 dark:bg-zinc-900/40">
                <p className="text-xs text-gray-500">Display name</p>
                <p className="text-lg font-semibold">{profile.displayName}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 bg-gray-50 dark:bg-zinc-900/40">
                <p className="text-xs text-gray-500">Payment time limit</p>
                <p className="text-lg font-semibold">{profile.timeLimitMinutes} minutes</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 bg-gray-50 dark:bg-zinc-900/40">
                <p className="text-xs text-gray-500">Payment methods</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.paymentMethods.length ? (
                    profile.paymentMethods.map((m) => (
                      <Badge key={m} variant="secondary">
                        {m}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">None</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-gray-500 mb-2">Terms</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.terms || '—'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Ads list (manage) */}
        <Card className="border border-gray-200 dark:border-zinc-800">
          <CardHeader className="border-b border-gray-200 dark:border-zinc-800">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-blue-600" />
                  My P2P Ads
                  <Badge variant="outline" className="ml-2">
                    {myOffers.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage your Buy/Sell ads (pause/resume/delete). This is frontend-only storage for now.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-end">
                <Button onClick={() => openCreateAd('buy')} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Buy Ad
                </Button>
                <Button onClick={() => openCreateAd('sell')} className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Sell Ad
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <Input
                  placeholder="Search ads (asset, method, side)..."
                  value={offerQuery}
                  onChange={(e) => setOfferQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="h-10 rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
                  value={offerFilterSide}
                  onChange={(e) => setOfferFilterSide(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
                <Button variant="outline" onClick={() => router.push('/exchange?mode=p2p')}>
                  View P2P Market
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMyOffers.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">No ads yet.</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Create a Buy/Sell ad to become a merchant (like Binance P2P).
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Side</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Price (USD)</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Limits</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMyOffers.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Badge className={o.side === 'buy' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}>
                            {o.side.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{o.asset}</TableCell>
                        <TableCell>${o.price.toFixed(3)}</TableCell>
                        <TableCell>
                          {o.available.toLocaleString()} {o.asset}
                        </TableCell>
                        <TableCell>
                          {o.minLimit} - {o.maxLimit.toLocaleString()} {o.asset}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {o.paymentMethods.slice(0, 3).map((m) => (
                              <Badge key={m} variant="secondary" className="text-[10px]">
                                {m}
                              </Badge>
                            ))}
                            {o.paymentMethods.length > 3 ? (
                              <Badge variant="secondary" className="text-[10px]">
                                +{o.paymentMethods.length - 3}
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          {o.isOnline ? (
                            <Badge className="bg-emerald-600 text-white">Online</Badge>
                          ) : (
                            <Badge variant="outline">Paused</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleOfferOnline(o.id)}
                              className="h-8"
                            >
                              {o.isOnline ? (
                                <>
                                  <PauseCircle className="w-4 h-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Resume
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this ad?')) deleteOffer(o.id);
                              }}
                              className="h-8 text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile modal */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Merchant Profile</DialogTitle>
              <DialogDescription>Update your merchant details. These will appear on your ads.</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={profileDraft.displayName}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, displayName: e.target.value }))}
                    maxLength={40}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={profileDraft.timeLimitMinutes}
                    onChange={(e) => setProfileDraft((p) => ({ ...p, timeLimitMinutes: Number(e.target.value || 0) }))}
                    min={5}
                    max={60}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Supported Payment Methods</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {AVAILABLE_PAYMENT_METHODS.map((method) => (
                    <label
                      key={method}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-800 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900/40"
                    >
                      <Checkbox
                        checked={profileDraft.paymentMethods.includes(method)}
                        onCheckedChange={() => togglePaymentMethodDraft(method)}
                      />
                      <span className="text-sm font-medium">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trade Terms / Notes</Label>
                <Textarea
                  value={profileDraft.terms}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, terms: e.target.value }))}
                  maxLength={500}
                  rows={5}
                />
                <div className="text-right text-xs text-gray-400">{profileDraft.terms.length}/500</div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveProfile} className="bg-green-600 hover:bg-green-700">
                Save Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create ad modal */}
        <Dialog open={isCreateAdDialogOpen} onOpenChange={setIsCreateAdDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Create P2P Ad</DialogTitle>
              <DialogDescription>Post a Buy/Sell ad like Binance P2P merchant ads.</DialogDescription>
            </DialogHeader>

            <Tabs value={adSide} onValueChange={(v) => setAdSide(v as 'buy' | 'sell')}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-zinc-800">
                <TabsTrigger value="buy" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Buy Ad
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                  Sell Ad
                </TabsTrigger>
              </TabsList>
              <TabsContent value="buy" className="mt-4" />
              <TabsContent value="sell" className="mt-4" />
            </Tabs>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Asset</Label>
                  <select
                    className="w-full h-10 rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-sm"
                    value={asset}
                    onChange={(e) => setAsset(e.target.value as any)}
                  >
                    {AVAILABLE_ASSETS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Price (USD)</Label>
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1.05" />
                </div>
                <div className="space-y-2">
                  <Label>Available ({asset})</Label>
                  <Input value={available} onChange={(e) => setAvailable(e.target.value)} placeholder="1000" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Limit ({asset})</Label>
                  <Input value={minLimit} onChange={(e) => setMinLimit(e.target.value)} placeholder="50" />
                </div>
                <div className="space-y-2">
                  <Label>Max Limit ({asset})</Label>
                  <Input value={maxLimit} onChange={(e) => setMaxLimit(e.target.value)} placeholder="5000" />
                </div>
              </div>

              <Separator />

              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4 bg-gray-50 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 dark:text-white">Preview</p>
                  <Badge variant="outline">{adSide.toUpperCase()} AD</Badge>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Merchant</p>
                    <p className="font-semibold">{profile.displayName || 'Merchant'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Methods</p>
                    <p className="font-semibold">{profile.paymentMethods.join(', ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="font-semibold">${Number(price || 0).toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Limits</p>
                    <p className="font-semibold">
                      {minLimit || '0'} - {maxLimit || '0'} {asset}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  Time limit: <span className="font-semibold">{profile.timeLimitMinutes} min</span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setIsCreateAdDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createAd} className={adSide === 'buy' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}>
                Create {adSide === 'buy' ? 'Buy' : 'Sell'} Ad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Protected>
  );
}


