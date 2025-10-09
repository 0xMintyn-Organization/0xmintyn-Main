'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { 
  Send, 
  Search, 
  MessageSquare, 
  Star, 
  Clock,
  Loader2,
  AlertCircle,
  Inbox,
  SendIcon,
  Archive,
  CheckCheck,
  Check,
  Paperclip,
  X,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Download
} from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import SimpleOfferModal from '@/components/Marketplace/SimpleOfferModal';
import OfferBubble from '@/components/Marketplace/OfferBubble';

export default function MessengerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageEndRef = useRef<HTMLDivElement>(null);

  // States
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [isServiceOwner, setIsServiceOwner] = useState(false);

  // Check for conversation parameter (when redirected from service page)
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [searchParams, conversations]);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both inbox and sent messages
      const [inboxResponse, sentResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/inbox`, { withCredentials: true }),
        axios.get(`${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/sent`, { withCredentials: true })
      ]);

      if (inboxResponse.data.success && sentResponse.data.success) {
        // Combine all messages from both inbox and sent
        const allMessages = [
          ...inboxResponse.data.messages,
          ...sentResponse.data.messages
        ];
        
        // Get unread count from inbox response
        setUnreadCount(inboxResponse.data.unreadCount || 0);
        
        // Group messages by conversation (sender/receiver pair)
        const groupedMessages = groupMessagesByConversation(allMessages);
        setConversations(groupedMessages);
        
        // Auto-select first conversation if none selected
        if (!selectedConversation && groupedMessages.length > 0) {
          setSelectedConversation(groupedMessages[0]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const groupMessagesByConversation = (messages: any[]) => {
    const conversationMap = new Map();

    messages.forEach((message: any) => {
      // Determine the other user (not the current user)
      const isReceived = message.receiverId?._id === user?._id || message.receiverId === user?._id;
      const otherUser = isReceived ? message.senderId : message.receiverId;
      const otherUserId = otherUser?._id || otherUser;
      const currentUserId = user?._id;
      
      // Create a consistent conversationId by sorting user IDs alphabetically
      // This ensures both users use the same conversationId
      const conversationKey = otherUserId;
      const conversationId = [currentUserId, otherUserId].sort().join('-');

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          _id: conversationId, // Use consistent ID for both users
          otherUser,
          lastMessage: message,
          messages: [message],
          unreadCount: !message.isRead && isReceived ? 1 : 0,
          serviceId: message.serviceId,
          productId: message.productId
        });
      } else {
        const conversation = conversationMap.get(conversationKey);
        conversation.messages.push(message);
        
        // Count unread messages (only messages TO current user)
        if (!message.isRead && isReceived) {
          conversation.unreadCount++;
        }
        
        // Update last message if this is more recent
        if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
          conversation.lastMessage = message;
        }
      }
    });

    // Convert map to array and sort by last message date (most recent first)
    return Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  };

  const fetchConversationOffers = async (conversationId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/offers/conversation/${conversationId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setOffers(response.data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const determineConversationRoles = (conversation: any) => {
    // Determine if current user is the service/product owner
    if (conversation.serviceId) {
      // For services, need to check the service owner
      // This will be handled by checking sellerId in the service
      // For now, we'll fetch this when selecting conversation
      return false;
    }
    return false;
  };

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    setMessages(conversation.messages.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ));

    // Fetch offers for this conversation
    if (conversation._id) {
      await fetchConversationOffers(conversation._id);
    }

    // Determine if current user is service/product owner
    let isOwner = false;
    
    if (conversation.serviceId) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/services/${conversation.serviceId._id || conversation.serviceId}`,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          const service = response.data.service;
          console.log('Service data:', service);
          
          // Try to get the user's seller profile first
          try {
            const sellerResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/seller/profile/me`,
              { withCredentials: true }
            );
            
            if (sellerResponse.data.success && sellerResponse.data.seller) {
              const userSellerId = sellerResponse.data.seller._id;
              const serviceSellerId = service.sellerId?._id || service.sellerId;
              isOwner = userSellerId === serviceSellerId;
              console.log('Service ownership check (with seller profile):', { 
                userSellerId, 
                serviceSellerId, 
                currentUserId: user?._id, 
                isOwner 
              });
            }
          } catch (sellerError) {
            console.log('No seller profile found, using conversation context approach');
            // Alternative approach: Check conversation context
            // If the conversation has messages and the other user is the one who initiated
            // the service inquiry, then current user is likely the service owner
            const messages = conversation.messages || [];
            if (messages.length > 0) {
              const firstMessage = messages[0];
              // If the first message was sent TO the current user (meaning someone contacted them about their service)
              const isFirstMessageReceived = firstMessage.receiverId?._id === user?._id || firstMessage.receiverId === user?._id;
              isOwner = isFirstMessageReceived;
              console.log('Service ownership check (conversation context):', { 
                firstMessageReceiver: firstMessage.receiverId?._id || firstMessage.receiverId,
                currentUserId: user?._id, 
                isFirstMessageReceived,
                isOwner,
                reason: 'Based on first message receiver'
              });
            } else {
              isOwner = false;
              console.log('Service ownership check (fallback):', { 
                currentUserId: user?._id, 
                isOwner: false,
                reason: 'No messages to analyze'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching service:', error);
        isOwner = false;
      }
    } else if (conversation.productId) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/products/${conversation.productId._id || conversation.productId}`,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          const product = response.data.product;
          console.log('Product data:', product);
          
          // Try to get the user's seller profile first
          try {
            const sellerResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/seller/profile/me`,
              { withCredentials: true }
            );
            
            if (sellerResponse.data.success && sellerResponse.data.seller) {
              const userSellerId = sellerResponse.data.seller._id;
              const productSellerId = product.sellerId?._id || product.sellerId;
              isOwner = userSellerId === productSellerId;
              console.log('Product ownership check (with seller profile):', { 
                userSellerId, 
                productSellerId, 
                currentUserId: user?._id, 
                isOwner 
              });
            }
          } catch (sellerError) {
            console.log('No seller profile found, using conversation context approach');
            // Alternative approach: Check conversation context
            const messages = conversation.messages || [];
            if (messages.length > 0) {
              const firstMessage = messages[0];
              const isFirstMessageReceived = firstMessage.receiverId?._id === user?._id || firstMessage.receiverId === user?._id;
              isOwner = isFirstMessageReceived;
              console.log('Product ownership check (conversation context):', { 
                firstMessageReceiver: firstMessage.receiverId?._id || firstMessage.receiverId,
                currentUserId: user?._id, 
                isFirstMessageReceived,
                isOwner,
                reason: 'Based on first message receiver'
              });
            } else {
              isOwner = false;
              console.log('Product ownership check (fallback):', { 
                currentUserId: user?._id, 
                isOwner: false,
                reason: 'No messages to analyze'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        isOwner = false;
      }
    }
    
    setIsServiceOwner(isOwner);

    // Mark unread messages as read (only messages TO current user)
    const unreadMessages = conversation.messages.filter((msg: any) => {
      const isReceived = msg.receiverId?._id === user?._id || msg.receiverId === user?._id;
      return !msg.isRead && isReceived;
    });

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(async (msg: any) => {
        try {
          await axios.patch(
            `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/${msg._id}/read`,
            {},
            { withCredentials: true }
          );
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });
      
      // Update local state to reflect read status
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv._id === conversation._id
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - unreadMessages.length));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limit to 5 files
    if (selectedFiles.length + files.length > 5) {
      alert('You can only attach up to 5 files per message');
      return;
    }

    // Check file sizes (max 10MB per file)
    const invalidFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert('Each file must be less than 10MB');
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!selectedConversation) return;

    try {
      setSending(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('receiverId', selectedConversation.otherUser._id);
      formData.append('subject', `Re: ${selectedConversation.lastMessage.subject}`);
      formData.append('message', newMessage.trim() || '(File attachment)');
      
      if (selectedConversation.serviceId?._id) {
        formData.append('serviceId', selectedConversation.serviceId._id);
      }
      if (selectedConversation.productId?._id) {
        formData.append('productId', selectedConversation.productId._id);
      }

      // Append files
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/send`,
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        // Add new message to the conversation
        const newMsg = response.data.data;
        setMessages([...messages, newMsg]);
        setNewMessage('');
        setSelectedFiles([]);
        
        // Refresh conversations to update last message
        fetchConversations();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Filter conversations based on search and unread status
  const filteredConversations = conversations.filter(conversation => {
    // Search filter
    const matchesSearch = conversation.otherUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.otherUser?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.lastMessage?.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Unread filter
    const matchesUnread = !showUnreadOnly || conversation.unreadCount > 0;
    
    return matchesSearch && matchesUnread;
  });

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${baseUrl}${normalizedPath}`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-5 h-5" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFullFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
    return `${baseUrl}${normalizedPath}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Messenger
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Communicate with buyers and sellers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 flex flex-col h-full">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg">Messages</CardTitle>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">{unreadCount} unread</Badge>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <Button
                variant={!showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(false)}
                className={!showUnreadOnly ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                All ({conversations.length})
              </Button>
              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(true)}
                className={showUnreadOnly ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Unread ({unreadCount})
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-4">
                <MessageSquare className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {filteredConversations.map((conversation) => {
                  const isUnread = conversation.unreadCount > 0;
                  const isSelected = selectedConversation?._id === conversation._id;
                  
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left relative ${
                        isSelected
                          ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                          : isUnread
                          ? 'bg-blue-50/50 dark:bg-blue-900/10'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {conversation.otherUser?.avatar ? (
                            <Image
                              src={conversation.otherUser.avatar}
                              alt={conversation.otherUser.firstName || 'User'}
                              fill
                              className="object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {conversation.otherUser?.firstName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          {isUnread && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                              <span className="text-xs font-bold text-white">{conversation.unreadCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-900 dark:text-white'}`}>
                              {conversation.otherUser?.firstName} {conversation.otherUser?.lastName}
                            </h4>
                            <span className={`text-xs flex-shrink-0 ml-2 ${isUnread ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-500'}`}>
                              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className={`text-xs text-gray-600 dark:text-gray-400 truncate mb-1`}>
                            @{conversation.otherUser?.username}
                          </p>
                          <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {conversation.lastMessage.message}
                          </p>
                          {(conversation.serviceId || conversation.productId) && (
                            <Badge variant="outline" className="text-xs mt-2">
                              {conversation.serviceId ? '🎯 Service' : '📦 Product'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-14 h-14">
                      {selectedConversation.otherUser?.avatar ? (
                        <Image
                          src={selectedConversation.otherUser.avatar}
                          alt={selectedConversation.otherUser.firstName || 'User'}
                          fill
                          className="object-cover rounded-full border-2 border-green-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center border-2 border-green-500">
                          <span className="text-white text-xl font-bold">
                            {selectedConversation.otherUser?.firstName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {selectedConversation.otherUser?.firstName} {selectedConversation.otherUser?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{selectedConversation.otherUser?.username}
                      </p>
                    </div>
                  </div>
                  {(selectedConversation.serviceId || selectedConversation.productId) && (
                    <div className="text-right">
                      <Badge className="bg-green-600 text-white">
                        {selectedConversation.serviceId ? '🎯 Service Inquiry' : '📦 Product Inquiry'}
                      </Badge>
                      {selectedConversation.serviceId?.title && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-[200px] truncate">
                          {selectedConversation.serviceId.title}
                        </p>
                      )}
                    </div>
                  )}
                </div>

              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {(() => {
                  // Combine messages and offers into a single timeline
                  const timeline = [
                    ...messages.map(msg => ({ ...msg, type: 'message' })),
                    ...offers.map(offer => ({ ...offer, type: 'offer', createdAt: offer.createdAt }))
                  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  

                  if (timeline.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full">
                        <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No messages in this conversation</p>
                      </div>
                    );
                  }

                  return timeline.map((item, index) => {
                    const showDate = index === 0 || 
                      new Date(item.createdAt).toDateString() !== new Date(timeline[index - 1].createdAt).toDateString();
                    
                    if (item.type === 'offer') {
                      // Render offer using the professional OfferBubble component
                      return (
                        <div key={`offer-${item._id}`}>
                          {/* Date Separator */}
                          {showDate && (
                            <div className="flex items-center justify-center my-6">
                              <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                  {new Date(item.createdAt).toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Offer Bubble */}
                          <OfferBubble
                            offer={item}
                            currentUserId={user?._id || ''}
                            onOfferUpdate={() => fetchConversationOffers(selectedConversation._id)}
                          />
                        </div>
                      );
                    } else {
                      // Render regular message
                      return (
                        <div key={item._id || index}>
                          {/* Date Separator */}
                          {showDate && (
                            <div className="flex items-center justify-center my-6">
                              <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                  {new Date(item.createdAt).toLocaleDateString('en-US', { 
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={`flex ${item.senderId?._id === user?._id || item.senderId === user?._id ? 'justify-end' : 'justify-start'} mb-4`}>
                            <div className={`max-w-[75%] ${item.senderId?._id === user?._id || item.senderId === user?._id ? '' : 'flex items-start gap-3'}`}>
                              {/* Other user's avatar */}
                              {!(item.senderId?._id === user?._id || item.senderId === user?._id) && (
                                <div className="relative w-10 h-10 flex-shrink-0">
                                  {selectedConversation.otherUser?.avatar ? (
                                    <Image
                                      src={selectedConversation.otherUser.avatar}
                                      alt={selectedConversation.otherUser.firstName || 'User'}
                                      fill
                                      className="object-cover rounded-full"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-semibold">
                                        {selectedConversation.otherUser?.firstName?.charAt(0) || 'U'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Message Content */}
                              <div>
                                {/* Show subject only on first message */}
                                {index === 0 && (
                                  <div className={`mb-2 ${item.senderId?._id === user?._id || item.senderId === user?._id ? 'text-right' : 'text-left'}`}>
                                    <Badge variant="outline" className="text-xs">
                                      📧 {item.subject}
                                    </Badge>
                                  </div>
                                )}
                                
                                <div
                                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                                    item.senderId?._id === user?._id || item.senderId === user?._id
                                      ? 'bg-green-600 text-white rounded-br-none'
                                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-none'
                                  }`}
                                >
                                  {item.message && (
                                    <p className="text-sm whitespace-pre-wrap break-words">{item.message}</p>
                                  )}
                                  
                                  {/* Attachments */}
                                  {item.attachments && item.attachments.length > 0 && (
                                    <div className={`space-y-2 ${item.message ? 'mt-3 pt-3 border-t' : ''} ${item.senderId?._id === user?._id || item.senderId === user?._id ? 'border-green-500' : 'border-gray-200 dark:border-gray-600'}`}>
                                      {item.attachments.map((file: any, fileIndex: number) => {
                                        const isImage = file.mimeType.startsWith('image/');
                                        
                                        return (
                                          <div key={fileIndex}>
                                            {isImage ? (
                                              <div className="relative rounded-lg overflow-hidden max-w-xs">
                                                <Image
                                                  src={getFullFileUrl(file.fileUrl)}
                                                  alt={file.originalName}
                                                  width={300}
                                                  height={200}
                                                  className="rounded-lg"
                                                />
                                                <a
                                                  href={getFullFileUrl(file.fileUrl)}
                                                  download={file.originalName}
                                                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                                                  title="Download"
                                                >
                                                  <Download className="w-4 h-4" />
                                                </a>
                                              </div>
                                            ) : (
                                              <a
                                                href={getFullFileUrl(file.fileUrl)}
                                                download={file.originalName}
                                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                                  item.senderId?._id === user?._id || item.senderId === user?._id
                                                    ? 'bg-green-700 hover:bg-green-800'
                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                              >
                                                <div className={item.senderId?._id === user?._id || item.senderId === user?._id ? 'text-white' : 'text-gray-600 dark:text-gray-300'}>
                                                  {getFileIcon(file.mimeType)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className={`text-sm font-medium truncate ${item.senderId?._id === user?._id || item.senderId === user?._id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                                    {file.originalName}
                                                  </p>
                                                  <p className={`text-xs ${item.senderId?._id === user?._id || item.senderId === user?._id ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {formatFileSize(file.fileSize)}
                                                  </p>
                                                </div>
                                                <Download className={`w-4 h-4 flex-shrink-0 ${item.senderId?._id === user?._id || item.senderId === user?._id ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                                              </a>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-end mt-2 gap-1">
                                    <span className={`text-xs ${item.senderId?._id === user?._id || item.senderId === user?._id ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                      {new Date(item.createdAt).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                    {(item.senderId?._id === user?._id || item.senderId === user?._id) && (
                                      item.isRead ? (
                                        <CheckCheck className="w-4 h-4 text-blue-200" title="Read" />
                                      ) : (
                                        <Check className="w-4 h-4 text-green-100" title="Sent" />
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  });
                })()}
                <div ref={messageEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t bg-white dark:bg-gray-800 p-4">
                {/* File Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Attachments ({selectedFiles.length}/5)
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border">
                          {getFileIcon(file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Attach File Button */}
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

                  {/* Offer Button - Dynamic based on user role */}
                  {selectedConversation && (selectedConversation.serviceId || selectedConversation.productId) && (
                    <>
                      {/* For Sellers: Create Custom Offer */}
                      {isServiceOwner && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setShowCreateOffer(true)}
                          className="rounded-full h-12 px-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                          title="Create custom offer"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Create Offer
                        </Button>
                      )}
                      
                      {/* For Buyers: Request Custom Offer */}
                      {!isServiceOwner && (
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setNewMessage('Hi, could you please send me a custom offer with pricing and details? Thank you!');
                          }}
                          className="rounded-full h-12 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                          title="Request custom offer"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Request Offer
                        </Button>
                      )}
                    </>
                  )}

                  {/* Message Input */}
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={2}
                      className="resize-none pr-12 rounded-2xl border-gray-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500"
                      maxLength={1000}
                    />
                    <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                      {newMessage.length}/1000
                    </div>
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 rounded-full h-12 w-12 p-0"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    📎 Max 5 files, 10MB each • 💡 <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift+Enter</kbd> for new line
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Create Offer Modal */}
      {selectedConversation && (
        <SimpleOfferModal
          isOpen={showCreateOffer}
          onClose={() => setShowCreateOffer(false)}
          conversationId={selectedConversation._id}
          buyerId={selectedConversation.otherUser._id}
          buyerName={`${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
          serviceTitle={selectedConversation.serviceId?.title || selectedConversation.productId?.title}
          serviceId={selectedConversation.serviceId?._id || selectedConversation.serviceId}
          productId={selectedConversation.productId?._id || selectedConversation.productId}
          onOfferCreated={() => {
            fetchConversationOffers(selectedConversation._id);
          }}
        />
      )}
    </div>
  );
}

