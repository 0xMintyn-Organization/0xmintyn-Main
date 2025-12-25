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
import { toast } from 'sonner';
import { p2pAPI } from '@/lib/api';
import MessageBubble from '@/components/Exchange/Chat/MessageBubble';
import ChatInput from '@/components/Exchange/Chat/ChatInput';
import PaymentDetailsCard, { PaymentMethodDetail } from '@/components/Exchange/Chat/PaymentDetailsCard';

// Match backend status enum: 'pending' | 'paid' | 'completed' | 'cancelled' | 'disputed' | 'refunded'
type P2POrderStatus = 'pending' | 'paid' | 'completed' | 'cancelled' | 'disputed' | 'refunded';

type ExchangeP2POrder = {
  id: string;
  tradeNumber: string; // Added to match backend response
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
  timeLimit?: number; // Added for expiration display
  expiresAt?: string; // Added for expiration display
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
    
    // Convert to strings for comparison (handles both string and ObjectId)
    const buyerId = String(selectedOrder.buyerUserId);
    const sellerId = String(selectedOrder.sellerUserId);
    const userId = String(currentUserId);
    
    if (buyerId === userId) return 'buyer';
    if (sellerId === userId) return 'seller';
    return 'viewer';
  }, [selectedOrder, currentUserId]);

  // Track unread counts per order (fetched from backend)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const unreadCountTotal = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

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

  // Load messages from backend API (replaces sessionStorage)
  const loadMessagesForOrder = useCallback(async (orderId: string): Promise<ExchangeP2PMessage[]> => {
    try {
      const res = await p2pAPI.getOrderMessages(orderId);
      if (res.success && res.data?.messages) {
        return res.data.messages.map((msg: any) => ({
          id: msg.id,
          orderId: msg.orderId,
          senderUserId: msg.senderUserId,
          message: msg.message,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
          attachments: msg.attachments || [],
        }));
      }
      return [];
    } catch (error: any) {
      console.error('Failed to load messages from backend:', error);
      // Only fallback to sessionStorage for old orders (p2p_ prefix)
      if (orderId.startsWith('p2p_')) {
        const list = safeJsonParse<ExchangeP2PMessage[]>(sessionStorage.getItem(getMessagesStorageKey(orderId))) || [];
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return list;
      }
      return [];
    }
  }, []);

  // Mark messages as read and sync to backend
  const markIncomingAsRead = useCallback(async (orderId: string) => {
    try {
      // Sync read status to backend
      await p2pAPI.markMessagesAsRead(orderId);
      
      // Update local state
      setMessages((prev) => 
        prev.map((m) => 
          m.orderId === orderId && 
          String(m.senderUserId) !== String(currentUserId) && 
          !m.isRead
            ? { ...m, isRead: true }
            : m
        )
      );
      
      // Update unread count
      setUnreadCounts((prev) => ({ ...prev, [orderId]: 0 }));
    } catch (error: any) {
      console.error('Failed to mark messages as read:', error);
      toast.error('Failed to mark messages as read');
    }
  }, [currentUserId]);

  // Fetch unread counts for all orders (optimized to prevent infinite loops)
  const fetchUnreadCountsRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingUnreadRef = useRef<boolean>(false);
  const lastFetchedOrdersRef = useRef<string>(''); // Track last fetched orders to prevent duplicate calls
  
  const fetchUnreadCounts = useCallback(async (orderList: ExchangeP2POrder[]) => {
    // Prevent concurrent fetches
    if (isFetchingUnreadRef.current) {
      return;
    }
    
    // Create a hash of order IDs to detect if we've already fetched for these orders
    const ordersHash = orderList.map(o => o.id).sort().join(',');
    if (lastFetchedOrdersRef.current === ordersHash) {
      return; // Already fetched for these orders
    }
    
    // Clear any pending fetch
    if (fetchUnreadCountsRef.current) {
      clearTimeout(fetchUnreadCountsRef.current);
    }
    
    // Debounce: only fetch after 2 seconds of no changes
    fetchUnreadCountsRef.current = setTimeout(async () => {
      if (orderList.length === 0) {
        setUnreadCounts({});
        lastFetchedOrdersRef.current = '';
        return;
      }
      
      isFetchingUnreadRef.current = true;
      
      try {
        const counts: Record<string, number> = {};
        // Limit to first 5 orders to prevent rate limiting and reduce API calls
        const ordersToFetch = orderList.slice(0, 5);
        
        // Fetch unread counts in parallel (but limited)
        await Promise.all(
          ordersToFetch.map(async (order) => {
            try {
              // Use a simpler approach: just get the count from the API response
              const res = await p2pAPI.getOrderMessages(order.id, { page: 1, limit: 50 });
              if (res.success && res.data?.messages) {
                const unread = res.data.messages.filter(
                  (m: any) => String(m.senderUserId) !== String(currentUserId) && !m.isRead
                ).length;
                counts[order.id] = unread;
              } else {
                counts[order.id] = 0;
              }
            } catch (error) {
              // Ignore errors for individual orders (rate limit, etc.)
              counts[order.id] = 0;
            }
          })
        );
        
        // Set counts for remaining orders to 0 (don't fetch to save API calls)
        orderList.slice(5).forEach(order => {
          counts[order.id] = 0;
        });
        
        setUnreadCounts(counts);
        lastFetchedOrdersRef.current = ordersHash; // Mark as fetched
      } catch (error) {
        console.error('Failed to fetch unread counts:', error);
      } finally {
        isFetchingUnreadRef.current = false;
      }
    }, 2000); // 2 second debounce to prevent rapid calls
  }, [currentUserId]);

  // Load orders on mount from backend (only once)
  useEffect(() => {
    let isMounted = true;
    
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Fetch from backend
        const res = await p2pAPI.getMyTrades();
        if (isMounted) {
          if (res.success && res.trades) {
            setOrders(res.trades);
            // Fetch unread counts after orders are loaded (only once)
            if (res.trades.length > 0) {
              setTimeout(() => {
                if (isMounted) {
                  fetchUnreadCounts(res.trades);
                }
              }, 1000);
            }
          } else {
            toast.error('Failed to load orders');
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch trades:', error);
        if (isMounted) {
          toast.error('Failed to load orders. Please refresh the page.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    
    return () => {
      isMounted = false;
      // Cleanup timeout on unmount
      if (fetchUnreadCountsRef.current) {
        clearTimeout(fetchUnreadCountsRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

      // Handle order selection from URL - Load messages from backend (like Binance/Facebook Messenger)
      useEffect(() => {
        const orderId = searchParams?.get('order');
        if (!orderId) {
          setSelectedOrder(null);
          setMessages([]);
          return;
        }

        // Prevent duplicate loads - check if already loaded
        if (selectedOrder?.id === orderId && messages.length > 0) {
          return; // Already loaded, don't reload
        }

        let isMounted = true;
        let isLoadingRef = { current: false };
        
        const loadOrderAndMessages = async () => {
          // Prevent concurrent loads
          if (isLoadingRef.current) return;
          isLoadingRef.current = true;
          
          try {
            // First try to find in current orders list (use closure to get latest)
            setOrders((currentOrders) => {
              const order = currentOrders.find(o => o.id === orderId);
              
              if (!order) {
                // If not found, fetch from backend
                if (orderId.startsWith('p2p_')) {
                  // Old sessionStorage order - use sessionStorage
                  const sessionOrder = safeJsonParse<ExchangeP2POrder>(sessionStorage.getItem(getOrderStorageKey(orderId)));
                  if (sessionOrder && isMounted) {
                    setSelectedOrder(sessionOrder);
                    // Load messages asynchronously
                    loadMessagesForOrder(orderId).then(msgList => {
                      if (isMounted) {
                        setMessages(msgList);
                        markIncomingAsRead(orderId).catch(() => {});
                      }
                    });
                  }
                } else {
                  // Fetch order from backend
                  p2pAPI.getTradeById(orderId).then(res => {
                    if (res.success && res.trade && isMounted) {
                      setSelectedOrder(res.trade);
                      loadMessagesForOrder(orderId).then(msgList => {
                        if (isMounted) {
                          setMessages(msgList);
                          markIncomingAsRead(orderId).catch(() => {});
                        }
                      });
                    }
                  }).catch(err => {
                    console.error('Failed to fetch order:', err);
                    if (isMounted) {
                      toast.error('Failed to load order. Please try again.');
                    }
                  });
                }
              } else {
                // Order found in list
                if (isMounted) {
                  setSelectedOrder(order);
                  loadMessagesForOrder(orderId).then(msgList => {
                    if (isMounted) {
                      setMessages(msgList);
                      markIncomingAsRead(orderId).catch(() => {});
                    }
                  });
                }
              }
              
              return currentOrders; // Don't modify orders
            });
          } catch (error: any) {
            console.error('Failed to load order:', error);
            if (isMounted) {
              toast.error('Failed to load order. Please try again.');
            }
          } finally {
            isLoadingRef.current = false;
          }
        };

        loadOrderAndMessages();
        
        return () => {
          isMounted = false;
        };
      }, [searchParams?.get('order'), currentUserId]); // Removed 'orders' and 'selectedOrder' to prevent loops

  // Join WebSocket rooms for ALL orders when socket connects (like Facebook Messenger)
  // This ensures users receive messages for all their orders, not just the selected one
  useEffect(() => {
    if (isConnected && socket && orders.length > 0) {
      console.log('📥 Joining rooms for all orders:', orders.length);
      // Small delay to ensure socket is fully ready
      setTimeout(() => {
        orders.forEach(order => {
          console.log(`📥 Joining room for order: ${order.id}`);
          joinOrderRoom(order.id);
        });
      }, 100);
    }
  }, [isConnected, socket, orders, joinOrderRoom]);

  // Join WebSocket room when order is selected (for active chat)
  useEffect(() => {
    if (selectedOrder) {
      if (isConnected && socket) {
        console.log('📥 Joining room for selected order:', selectedOrder.id);
        joinOrderRoom(selectedOrder.id);
      } else {
        console.warn('⚠️ Socket not connected, cannot join room yet. Will retry when connected.');
      }
      return () => {
        // Don't leave room - we want to stay in all order rooms to receive messages
        // Only leave if socket disconnects
      };
    }
  }, [selectedOrder, isConnected, socket, joinOrderRoom]);

  // Global message listener - listens for messages for ALL orders (like Facebook Messenger)
  // This ensures sellers receive messages even when not viewing a specific order
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⚠️ Cannot set up global message listener:', { hasSocket: !!socket, isConnected });
      return;
    }

    console.log('👂 Setting up GLOBAL message listener for all orders');

    const handleGlobalMessage = (messageData: ExchangeP2PMessage) => {
      console.log('📨 Received message via WebSocket (global listener):', {
        messageId: messageData.id,
        orderId: messageData.orderId,
        senderUserId: messageData.senderUserId,
        currentUserId,
        message: messageData.message.substring(0, 30),
        isSelectedOrder: selectedOrder?.id === messageData.orderId
      });

      // Check if this message is for any of the user's orders
      const orderExists = orders.some(o => o.id === messageData.orderId);
      if (!orderExists) {
        console.log('⚠️ Message for unknown order, ignoring');
        return;
      }

      // Message is already saved to database via WebSocket handler
      // No need to save to sessionStorage anymore

      // If this is the currently selected order, update the messages state
      if (selectedOrder && messageData.orderId === selectedOrder.id) {
        setMessages((prev) => {
          // Avoid duplicates by checking ID (more robust check)
          const isDuplicate = prev.some((m) => {
            // Check by ID first
            if (m.id === messageData.id) return true;
            // Also check by content and timestamp to catch optimistic updates
            if (m.message === messageData.message && 
                String(m.senderUserId) === String(messageData.senderUserId) &&
                Math.abs(new Date(m.createdAt).getTime() - new Date(messageData.createdAt).getTime()) < 1000) {
              return true;
            }
            return false;
          });
          
          if (isDuplicate) {
            console.log('⚠️ Duplicate message ignored:', messageData.id);
            return prev;
          }
          console.log('✅ Adding new message to chat (selected order)');
          const updated = [...prev, messageData];
          scrollToBottom();
          return updated;
        });
        
        // Mark as read if it's not from current user and order is selected
        if (String(messageData.senderUserId) !== String(currentUserId)) {
          markIncomingAsRead(messageData.orderId);
          console.log('📬 Marked incoming message as read');
        } else {
          console.log('✅ Received own message confirmation via WebSocket');
        }
        
        // Update unread count
        if (String(messageData.senderUserId) !== String(currentUserId)) {
          setUnreadCounts((prev) => {
            const current = prev[messageData.orderId] || 0;
            return { ...prev, [messageData.orderId]: Math.max(0, current - 1) };
          });
        }
        
        // Update unread count
        if (String(messageData.senderUserId) !== String(currentUserId)) {
          setUnreadCounts((prev) => {
            const current = prev[messageData.orderId] || 0;
            return { ...prev, [messageData.orderId]: Math.max(0, current - 1) };
          });
        }
      } else {
        // Message is for a different order - update the orders list to show new message
        console.log('📬 New message for order:', messageData.orderId, '- updating orders list');
        
        // Update orders list to show the new message preview
        setOrders((prevOrders) => {
          return prevOrders.map(order => {
            if (order.id === messageData.orderId) {
              // Don't mark as read if order is not selected
              // This will show unread badge
              return order; // Order stays the same, but message is saved to storage
            }
            return order;
          });
        });

        // Show browser notification if message is not from current user and order is not selected
        if (String(messageData.senderUserId) !== String(currentUserId) && 
            (!selectedOrder || selectedOrder.id !== messageData.orderId)) {
          // Get order details for notification
          const order = orders.find(o => o.id === messageData.orderId);
          if (order) {
            const counterpartyName = order.counterpartyName || 'User';
            const notificationTitle = `New message from ${counterpartyName}`;
            const notificationBody = messageData.message.substring(0, 50);
            
            // Request notification permission and show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notificationTitle, {
                body: notificationBody,
                icon: '/favicon.ico',
                tag: `order-${messageData.orderId}`, // Prevent duplicate notifications
              });
            } else if ('Notification' in window && Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification(notificationTitle, {
                    body: notificationBody,
                    icon: '/favicon.ico',
                    tag: `order-${messageData.orderId}`,
                  });
                }
              });
            }
          }
        }
      }
    };

    socket.on('p2p:message:new', handleGlobalMessage);
    console.log('✅ Global message listener registered');

    return () => {
      console.log('🧹 Cleaning up global message listener');
      socket.off('p2p:message:new', handleGlobalMessage);
    };
  }, [socket, isConnected, orders, selectedOrder, currentUserId]);

  // Listen for new orders created (for seller to receive notifications)
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewOrder = (orderData: ExchangeP2POrder) => {
      console.log('📬 Received new order notification:', orderData.id);
      
      // Add the new order to the list if it doesn't exist
      setOrders((prev) => {
        if (prev.some((o) => o.id === orderData.id)) return prev;
        return [orderData, ...prev];
      });

      // Automatically join the room for this new order
      // This ensures sellers receive messages immediately
      console.log('📥 Auto-joining room for new order:', orderData.id);
      joinOrderRoom(orderData.id);

      // If this order is selected, update it
      if (selectedOrder?.id === orderData.id) {
        setSelectedOrder(orderData);
      }
    };

    socket.on('p2p:order:created', handleNewOrder);

    return () => {
      socket.off('p2p:order:created', handleNewOrder);
    };
  }, [socket, isConnected, selectedOrder, joinOrderRoom]);

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

  const handleSelectOrder = async (order: ExchangeP2POrder) => {
    // Prevent duplicate loads
    if (selectedOrder?.id === order.id) {
      return;
    }
    
    setSelectedOrder(order);
    router.replace(`/exchange/messages?order=${encodeURIComponent(order.id)}`);
    
    // Load message history from backend (like Binance/Facebook Messenger)
    try {
      const messagesRes = await p2pAPI.getOrderMessages(order.id);
      if (messagesRes.success && messagesRes.data?.messages) {
        const transformedMessages = messagesRes.data.messages.map((msg: any) => ({
          id: msg.id,
          orderId: msg.orderId,
          senderUserId: msg.senderUserId,
          message: msg.message,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
          attachments: msg.attachments || [],
        }));
        setMessages(transformedMessages);
        
        // Mark messages as read (don't await to prevent blocking)
        markIncomingAsRead(order.id).catch(err => {
          console.error('Failed to mark as read:', err);
        });
      } else {
        // Fallback to sessionStorage for old orders
        loadMessagesForOrder(order.id).then(msgList => {
          setMessages(msgList);
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch messages, using sessionStorage fallback:', error);
      // Fallback to sessionStorage for old orders
      loadMessagesForOrder(order.id).then(msgList => {
        setMessages(msgList);
      });
    }
  };

  const handleSendMessage = useCallback(async (message: string, files: File[]) => {
    if (!selectedOrder || !currentUserId || !message.trim()) {
      console.warn('Cannot send message: missing order, userId, or message');
      return;
    }

    // Create optimistic message for immediate UI update
    const optimisticMessage: ExchangeP2PMessage = {
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

    try {
      // Add optimistic message immediately for better UX
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === optimisticMessage.id)) return prev;
        return [...prev, optimisticMessage];
      });
      scrollToBottom();

      // Always try WebSocket first (even if not fully connected, Socket.io will queue)
      if (socket) {
        console.log('📤 Sending message via WebSocket:', { 
          orderId: selectedOrder.id, 
          message: message.trim().substring(0, 50),
          isConnected 
        });
        
        // Set up error handler for WebSocket errors
        const errorHandler = (error: any) => {
          if (error.code === 'RATE_LIMIT_EXCEEDED' || error.message?.includes('Rate limit')) {
            toast.error('Rate limit exceeded. Please wait a moment before sending another message.', {
              duration: 5000,
            });
          } else if (error.message) {
            toast.error(`Failed to send message: ${error.message}`, {
              duration: 5000,
            });
          } else {
            toast.error('Failed to send message. Please try again.', {
              duration: 5000,
            });
          }
          // Remove optimistic message on error
          setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        };
        
        // Listen for WebSocket errors
        socket.once('error', errorHandler);
        
        // Send message
        sendSocketMessage(selectedOrder.id, message, files);
        
        // Remove error handler after 5 seconds (message should be sent by then)
        setTimeout(() => {
          socket.off('error', errorHandler);
        }, 5000);
      } else {
        // Fallback: try to save via API if WebSocket not available
        try {
          const res = await p2pAPI.saveMessage({
            orderId: selectedOrder.id,
            message: message.trim(),
            attachments: files.map(f => ({
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          });
          
          if (res.success) {
            // Replace optimistic message with real message from API
            setMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== optimisticMessage.id);
              return [...filtered, {
                id: res.data.id,
                orderId: res.data.orderId,
                senderUserId: res.data.senderId,
                message: res.data.message,
                createdAt: res.data.createdAt,
                isRead: false,
                attachments: res.data.attachments || [],
              }];
            });
            toast.success('Message sent', { duration: 2000 });
          }
        } catch (apiError: any) {
          console.error('❌ Failed to save message via API:', apiError);
          toast.error('Failed to send message. Please check your connection and try again.', {
            duration: 5000,
          });
          // Remove optimistic message on error
          setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to send message:', error);
      toast.error('Failed to send message. Please try again.', {
        duration: 5000,
      });
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
    }
  }, [selectedOrder, currentUserId, socket, sendSocketMessage]);

  const getPaymentMethodDetails = (method: string): PaymentMethodDetail | null => {
    if (!merchantProfile) return null;
    return merchantProfile.paymentMethodDetails.find(d => d.method === method) || null;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${Math.floor(diffMinutes)}m ago`;
    if (diffMinutes < 24 * 60) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffMinutes < 7 * 24 * 60) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString();
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
                {isConnected ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live
                  </span>
                ) : socket ? (
                  <span className="ml-2 inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    Connecting...
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    Offline
                  </span>
                )}
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
                    const unread = unreadCounts[order.id] || 0;
                    
                    return (
                      <button
                        key={order.id}
                        onClick={() => handleSelectOrder(order)}
                        className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors relative ${
                          isSelected ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' : ''
                        } ${unread > 0 ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                                  {getInitials(order.counterpartyName)}
                                </div>
                                {unread > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {unread > 9 ? '9+' : unread}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {order.counterpartyName}
                                  </p>
                                  {unread > 0 && (
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {order.side.toUpperCase()} {order.amount} {order.asset} • {order.paymentMethod}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className={`text-xs truncate ${unread > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                Order #{order.tradeNumber || order.id.slice(-8)}
                              </p>
                              {order.createdAt && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
                                  {formatTimestamp(order.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="text-[11px]">
                              {order.status}
                            </Badge>
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
                      {isConnected ? (
                        <Badge className="bg-green-600 text-white text-xs">● Live</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Offline</Badge>
                      )}
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
                  disabled={selectedRole === 'viewer'}
                  placeholder={
                    isConnected 
                      ? "Type a message..." 
                      : socket 
                        ? "Type a message... (Connecting...)" 
                        : "Type a message... (Initializing...)"
                  }
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

