'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Protected from '@/hooks/useProtected';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  Search,
  Paperclip,
  X,
  Send,
  Loader2,
  Shield,
  CheckCheck,
  Check,
  HandCoins,
  Lock,
} from 'lucide-react';

type P2POrderStatus = 'created' | 'accepted' | 'paid' | 'released' | 'cancelled' | 'disputed' | 'expired';

type ExchangeP2POrder = {
  id: string;
  asset: string;
  fiat: string;
  side: 'buy' | 'sell'; // from current user's perspective at creation time (demo)
  price: number;
  amount: number;
  totalFiat: number;
  paymentMethod: string;
  buyerUserId: string;
  sellerUserId: string;
  buyerName: string;
  sellerName: string;
  counterpartyUserId: string;
  counterpartyName: string;
  status: P2POrderStatus;
  createdAt: string;
};

type ExchangeP2PMessage = {
  id: string;
  orderId: string;
  senderUserId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  attachments?: Array<{
    originalName: string;
    fileSize: number;
    mimeType: string;
  }>;
};

const STORAGE_ORDER_PREFIX = 'exchange:p2pOrder:';
const STORAGE_MESSAGES_PREFIX = 'exchange:p2pMessages:';

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getOrderStorageKey(orderId: string) {
  return `${STORAGE_ORDER_PREFIX}${orderId}`;
}

function getMessagesStorageKey(orderId: string) {
  return `${STORAGE_MESSAGES_PREFIX}${orderId}`;
}

function getInitials(name: string) {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

export default function ExchangeMessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orders, setOrders] = useState<ExchangeP2POrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ExchangeP2POrder | null>(null);
  const [messages, setMessages] = useState<ExchangeP2PMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const currentUserId = user?._id || '';

  const selectedRole = useMemo(() => {
    if (!selectedOrder || !currentUserId) return 'unknown';
    if (selectedOrder.buyerUserId === currentUserId) return 'buyer';
    if (selectedOrder.sellerUserId === currentUserId) return 'seller';
    return 'viewer';
  }, [selectedOrder, currentUserId]);

  const unreadCountTotal = useMemo(() => {
    return orders.reduce((sum, order) => {
      const key = getMessagesStorageKey(order.id);
      const msgList = safeJsonParse<ExchangeP2PMessage[]>(sessionStorage.getItem(key)) || [];
      const unread = msgList.filter((m) => m.orderId === order.id && m.senderUserId !== currentUserId && !m.isRead).length;
      return sum + unread;
    }, 0);
  }, [orders, currentUserId]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      return (
        o.counterpartyName.toLowerCase().includes(q) ||
        o.asset.toLowerCase().includes(q) ||
        o.fiat.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  const scrollToBottom = () => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadOrdersFromSession = () => {
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(STORAGE_ORDER_PREFIX));
    const loaded: ExchangeP2POrder[] = keys
      .map((k) => safeJsonParse<ExchangeP2POrder>(sessionStorage.getItem(k)))
      .filter(Boolean) as ExchangeP2POrder[];
    loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return loaded;
  };

  const loadMessagesForOrder = (orderId: string) => {
    const list = safeJsonParse<ExchangeP2PMessage[]>(sessionStorage.getItem(getMessagesStorageKey(orderId))) || [];
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return list;
  };

  const markIncomingAsRead = (orderId: string) => {
    const key = getMessagesStorageKey(orderId);
    const list = loadMessagesForOrder(orderId);
    let changed = false;
    const updated = list.map((m) => {
      if (m.senderUserId !== currentUserId && !m.isRead) {
        changed = true;
        return { ...m, isRead: true };
      }
      return m;
    });
    if (changed) sessionStorage.setItem(key, JSON.stringify(updated));
  };

  useEffect(() => {
    setLoading(true);
    const loadedOrders = loadOrdersFromSession();
    setOrders(loadedOrders);
    setLoading(false);
  }, []);

  useEffect(() => {
    const orderId = searchParams.get('order');
    if (!orderId) return;

    const order = safeJsonParse<ExchangeP2POrder>(sessionStorage.getItem(getOrderStorageKey(orderId)));
    if (order) {
      setSelectedOrder(order);
      const msgList = loadMessagesForOrder(orderId);
      setMessages(msgList);
      // mark read (demo)
      markIncomingAsRead(orderId);
    }
  }, [searchParams, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectOrder = (order: ExchangeP2POrder) => {
    setSelectedOrder(order);
    router.replace(`/exchange/messages?order=${encodeURIComponent(order.id)}`);
    const msgList = loadMessagesForOrder(order.id);
    setMessages(msgList);
    markIncomingAsRead(order.id);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) return;
    const invalid = files.filter((f) => f.size > 10 * 1024 * 1024);
    if (invalid.length) return;
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (idx: number) => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const handleSend = async () => {
    if (!selectedOrder || !currentUserId) return;
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    try {
      setSending(true);
      const next: ExchangeP2PMessage = {
        id: `msg_${Date.now()}`,
        orderId: selectedOrder.id,
        senderUserId: currentUserId,
        message: newMessage.trim() || '(Attachment)',
        createdAt: new Date().toISOString(),
        isRead: false,
        attachments: selectedFiles.map((f) => ({
          originalName: f.name,
          fileSize: f.size,
          mimeType: f.type || 'application/octet-stream',
        })),
      };

      const key = getMessagesStorageKey(selectedOrder.id);
      const existing = loadMessagesForOrder(selectedOrder.id);
      const updated = [...existing, next];
      sessionStorage.setItem(key, JSON.stringify(updated));
      setMessages(updated);
      setNewMessage('');
      setSelectedFiles([]);
    } finally {
      setSending(false);
    }
  };

  return (
    <Protected>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exchange Messenger</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Chat per P2P order. Your role is determined per order (buyer/seller), not your global app role.
              </p>
            </div>
            {unreadCountTotal > 0 ? (
              <Badge className="bg-red-500 text-white">{unreadCountTotal} unread</Badge>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Orders list */}
          <Card className="lg:col-span-1 flex flex-col h-full">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                P2P Orders
              </CardTitle>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by user, asset, method..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No P2P orders yet.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Place a P2P order and we’ll create an order-chat for it.
                  </p>
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-800">
                  {filteredOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    const msgList = loadMessagesForOrder(order.id);
                    const unread = msgList.filter((m) => m.senderUserId !== currentUserId && !m.isRead).length;
                    const last = msgList[msgList.length - 1];
                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors ${
                          isSelected ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                                {getInitials(order.counterpartyName)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {order.counterpartyName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {order.side.toUpperCase()} {order.amount} {order.asset} • {order.paymentMethod}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-2">
                              {last ? last.message : 'No messages yet'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="text-[11px]">
                              {order.status}
                            </Badge>
                            {unread > 0 ? <Badge className="bg-red-500 text-white text-xs">{unread}</Badge> : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thread */}
          <Card className="lg:col-span-2 flex flex-col h-full">
            {selectedOrder ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate">
                        Order #{selectedOrder.id.slice(-8)} • {selectedOrder.asset}/{selectedOrder.fiat}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        With <span className="font-semibold">{selectedOrder.counterpartyName}</span> • {selectedOrder.paymentMethod}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRole === 'buyer' ? (
                        <Badge className="bg-blue-600 text-white">You are Buyer</Badge>
                      ) : selectedRole === 'seller' ? (
                        <Badge className="bg-emerald-600 text-white">You are Seller</Badge>
                      ) : (
                        <Badge variant="destructive">No access</Badge>
                      )}
                      <Badge variant="outline">{selectedOrder.status}</Badge>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Order-based actions (placeholders for now) */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Shield className="w-4 h-4 mr-2" />
                      Open Dispute (backend)
                    </Button>
                    {selectedRole === 'buyer' ? (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled>
                        <HandCoins className="w-4 h-4 mr-2" />
                        Mark Paid (backend)
                      </Button>
                    ) : null}
                    {selectedRole === 'seller' ? (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Release Tokens (on-chain)
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-zinc-900/40">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-14 h-14 text-gray-300 dark:text-gray-700 mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">No messages yet for this order.</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.senderUserId === currentUserId;
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                              isMine
                                ? 'bg-green-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-800 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                            {m.attachments && m.attachments.length > 0 ? (
                              <div className={`mt-3 pt-3 border-t ${isMine ? 'border-green-500' : 'border-gray-200 dark:border-zinc-700'}`}>
                                <p className={`text-xs font-semibold ${isMine ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                  Attachments
                                </p>
                                <div className="mt-2 space-y-2">
                                  {m.attachments.map((a, idx) => (
                                    <div key={idx} className={`text-xs ${isMine ? 'text-green-50' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {a.originalName} • {formatFileSize(a.fileSize)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            <div className="flex items-center justify-end mt-2 gap-1">
                              <span className={`text-xs ${isMine ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine ? (m.isRead ? <CheckCheck className="w-4 h-4 text-blue-200" /> : <Check className="w-4 h-4 text-green-100" />) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messageEndRef} />
                </CardContent>

                <div className="border-t bg-white dark:bg-zinc-950 p-4">
                  {selectedFiles.length > 0 ? (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Attachments ({selectedFiles.length}/5)
                        </span>
                      </div>
                      <div className="space-y-2">
                        {selectedFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{f.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(f.size)}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeFile(idx)} className="h-7 w-7 p-0">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx,.zip,.rar"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || selectedFiles.length >= 5}
                      className="rounded-full h-12 w-12 p-0"
                      title="Attach files (max 5)"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>

                    <div className="flex-1">
                      <Textarea
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        rows={2}
                        className="resize-none rounded-2xl"
                        maxLength={1000}
                      />
                      <div className="text-right text-xs text-gray-400 mt-1">{newMessage.length}/1000</div>
                    </div>

                    <Button
                      onClick={handleSend}
                      disabled={sending || (!newMessage.trim() && selectedFiles.length === 0) || selectedRole === 'viewer'}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 rounded-full h-12 w-12 p-0"
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select an order</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose a P2P order from the left to open its order-based messenger.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Protected>
  );
}


