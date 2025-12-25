'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Protected from '@/hooks/useProtected';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Search, Loader2, Shield, HandCoins, Lock } from 'lucide-react';
import { p2pAPI } from '@/lib/api';
import MessageBubble from '@/components/Exchange/Chat/MessageBubble';
import ChatInput from '@/components/Exchange/Chat/ChatInput';
import PaymentDetailsCard, { PaymentMethodDetail } from '@/components/Exchange/Chat/PaymentDetailsCard';

type P2POrderStatus = 'created' | 'accepted' | 'paid' | 'released' | 'cancelled' | 'disputed' | 'expired';

type ExchangeP2POrder = {
  id: string;
  asset: string;
  fiat: string;
  side: 'buy' | 'sell';
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
  traderId?: string;
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

type MerchantProfile = {
  displayName: string;
  paymentMethods: string[];
  paymentMethodDetails: PaymentMethodDetail[];
  timeLimitMinutes: number;
  terms: string;
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
  const { socket, isConnected, joinOrderRoom, leaveOrderRoom, sendMessage: sendSocketMessage } = useSocket();
  const searchParams = useSearchParams();
  const router = useRouter();
  const messageEndRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders] = useState<ExchangeP2POrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ExchangeP2POrder | null>(null);
  const [messages, setMessages] = useState<ExchangeP2PMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [loadingMerchantProfile, setLoadingMerchantProfile] = useState(false);

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

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

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

  const saveMessageToStorage = (message: ExchangeP2PMessage) => {
    const key = getMessagesStorageKey(message.orderId);
    const existing = loadMessagesForOrder(message.orderId);
    const updated = [...existing, message];
    sessionStorage.setItem(key, JSON.stringify(updated));
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

  // Load orders on mount
  useEffect(() => {
    setLoading(true);
    const loadedOrders = loadOrdersFromSession();
    setOrders(loadedOrders);
    setLoading(false);
  }, []);

  // Handle order selection from URL
  useEffect(() => {
    const orderId = searchParams.get('order');
    if (!orderId) return;

    const order = safeJsonParse<ExchangeP2POrder>(sessionStorage.getItem(getOrderStorageKey(orderId)));
    if (order) {
      setSelectedOrder(order);
      const msgList = loadMessagesForOrder(orderId);
      setMessages(msgList);
      markIncomingAsRead(orderId);
    }
  }, [searchParams, currentUserId]);

  // Join WebSocket room when order is selected
  useEffect(() => {
    if (selectedOrder && isConnected) {
      joinOrderRoom(selectedOrder.id);
      return () => {
        leaveOrderRoom(selectedOrder.id);
      };
    }
  }, [selectedOrder, isConnected, joinOrderRoom, leaveOrderRoom]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!socket || !selectedOrder) return;

    const handleNewMessage = (messageData: ExchangeP2PMessage) => {
      if (messageData.orderId === selectedOrder.id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === messageData.id)) return prev;
          const updated = [...prev, messageData];
          saveMessageToStorage(messageData);
          return updated;
        });
        scrollToBottom();
        
        // Mark as read if it's not from current user
        if (messageData.senderUserId !== currentUserId) {
          markIncomingAsRead(selectedOrder.id);
        }
      }
    };

    const handleMessageSent = (messageData: ExchangeP2PMessage) => {
      if (messageData.orderId === selectedOrder.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === messageData.id)) return prev;
          const updated = [...prev, messageData];
          saveMessageToStorage(messageData);
          return updated;
        });
        scrollToBottom();
      }
    };

    socket.on('p2p:message:new', handleNewMessage);
    socket.on('p2p:message:sent', handleMessageSent);

    return () => {
      socket.off('p2p:message:new', handleNewMessage);
      socket.off('p2p:message:sent', handleMessageSent);
    };
  }, [socket, selectedOrder, currentUserId]);

  // Fetch merchant profile when order is selected and user is buyer
  useEffect(() => {
    const fetchMerchantProfile = async () => {
      if (!selectedOrder || selectedRole !== 'buyer' || !selectedOrder.traderId) {
        setMerchantProfile(null);
        return;
      }

      try {
        setLoadingMerchantProfile(true);
        const res = await p2pAPI.getMerchantProfileByUserId(selectedOrder.traderId);
        if (res.success && res.profile) {
          setMerchantProfile(res.profile);
        }
      } catch (error: any) {
        console.error('Failed to fetch merchant profile:', error);
      } finally {
        setLoadingMerchantProfile(false);
      }
    };

    fetchMerchantProfile();
  }, [selectedOrder, selectedRole]);

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

  const handleSendMessage = useCallback(async (message: string, files: File[]) => {
    if (!selectedOrder || !currentUserId) return;

    try {
      // Send via WebSocket if connected, otherwise fallback to sessionStorage
      if (isConnected && socket) {
        sendSocketMessage(selectedOrder.id, message, files);
      } else {
        // Fallback: save to sessionStorage
        const newMessage: ExchangeP2PMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId: selectedOrder.id,
          senderUserId: currentUserId,
          message: message.trim(),
          createdAt: new Date().toISOString(),
          isRead: false,
          attachments: files.map((f) => ({
            originalName: f.name,
            fileSize: f.size,
            mimeType: f.type || 'application/octet-stream',
          })),
        };

        setMessages((prev) => [...prev, newMessage]);
        saveMessageToStorage(newMessage);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [selectedOrder, currentUserId, isConnected, socket, sendSocketMessage]);

  const getPaymentMethodDetails = (method: string): PaymentMethodDetail | null => {
    if (!merchantProfile) return null;
    return merchantProfile.paymentMethodDetails.find(d => d.method === method) || null;
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
                {isConnected && <span className="ml-2 text-green-600">● Live</span>}
              </p>
            </div>
            {unreadCountTotal > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCountTotal} unread</Badge>
            )}
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
                    Place a P2P order and we'll create an order-chat for it.
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
                            {unread > 0 && <Badge className="bg-red-500 text-white text-xs">{unread}</Badge>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Thread */}
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

                  {/* Payment Method Details for Buyers */}
                  {selectedRole === 'buyer' && selectedOrder.paymentMethod && (
                    <div className="mb-4">
                      <PaymentDetailsCard
                        paymentMethod={selectedOrder.paymentMethod}
                        totalAmount={selectedOrder.totalFiat}
                        paymentDetails={getPaymentMethodDetails(selectedOrder.paymentMethod)}
                        loading={loadingMerchantProfile}
                      />
                    </div>
                  )}

                  {/* Order-based actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Shield className="w-4 h-4 mr-2" />
                      Open Dispute (backend)
                    </Button>
                    {selectedRole === 'buyer' && (
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled>
                        <HandCoins className="w-4 h-4 mr-2" />
                        Mark Paid (backend)
                      </Button>
                    )}
                    {selectedRole === 'seller' && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Release Tokens (on-chain)
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-zinc-900/40">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-14 h-14 text-gray-300 dark:text-gray-700 mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">No messages yet for this order.</p>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        message={m.message}
                        isMine={m.senderUserId === currentUserId}
                        timestamp={m.createdAt}
                        isRead={m.isRead}
                        attachments={m.attachments}
                      />
                    ))
                  )}
                  <div ref={messageEndRef} />
                </CardContent>

                <ChatInput
                  onSend={handleSendMessage}
                  disabled={selectedRole === 'viewer' || !isConnected}
                  placeholder="Type a message..."
                  maxLength={1000}
                  maxFiles={5}
                />
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

