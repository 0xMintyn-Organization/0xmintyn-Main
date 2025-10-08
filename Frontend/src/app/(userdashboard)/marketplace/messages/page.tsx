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
  Check
} from 'lucide-react';
import Image from 'next/image';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function MessengerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageEndRef = useRef<HTMLDivElement>(null);

  // States
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
    fetchUnreadCount();
  }, [activeTab]);

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

      const endpoint = activeTab === 'inbox' 
        ? `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/inbox`
        : `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/sent`;

      const response = await axios.get(endpoint, { withCredentials: true });

      if (response.data.success) {
        // Group messages by conversation (sender/receiver pair)
        const groupedMessages = groupMessagesByConversation(response.data.messages);
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

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/unread-count`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const groupMessagesByConversation = (messages: any[]) => {
    const conversationMap = new Map();

    messages.forEach((message: any) => {
      const otherUser = activeTab === 'inbox' ? message.senderId : message.receiverId;
      const conversationKey = otherUser?._id;

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          _id: message._id,
          otherUser,
          lastMessage: message,
          messages: [message],
          unreadCount: !message.isRead && activeTab === 'inbox' ? 1 : 0,
          serviceId: message.serviceId,
          productId: message.productId
        });
      } else {
        const conversation = conversationMap.get(conversationKey);
        conversation.messages.push(message);
        if (!message.isRead && activeTab === 'inbox') {
          conversation.unreadCount++;
        }
        // Update last message if this is more recent
        if (new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
          conversation.lastMessage = message;
        }
      }
    });

    // Convert map to array and sort by last message date
    return Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  };

  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    setMessages(conversation.messages.sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ));

    // Mark messages as read if inbox
    if (activeTab === 'inbox') {
      conversation.messages.forEach(async (msg: any) => {
        if (!msg.isRead) {
          try {
            await axios.patch(
              `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/${msg._id}/read`,
              {},
              { withCredentials: true }
            );
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        }
      });
      // Refresh unread count
      fetchUnreadCount();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}marketplace/messages/send`,
        {
          receiverId: selectedConversation.otherUser._id,
          subject: `Re: ${selectedConversation.lastMessage.subject}`,
          message: newMessage.trim(),
          serviceId: selectedConversation.serviceId?._id || null,
          productId: selectedConversation.productId?._id || null
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Add new message to the conversation
        const newMsg = response.data.data;
        setMessages([...messages, newMsg]);
        setNewMessage('');
        
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

  const filteredConversations = conversations.filter(conversation =>
    conversation.otherUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.otherUser?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.lastMessage?.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    
    let baseUrl = process.env.NEXT_PUBLIC_SERVER_URI?.replace('/api/v1', '') || 'http://localhost:8000';
    baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
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
              <CardTitle className="text-lg">Conversations</CardTitle>
              {unreadCount > 0 && (
                <Badge className="bg-green-500">{unreadCount} unread</Badge>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'inbox' | 'sent')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inbox" className="flex items-center gap-2">
                  <Inbox className="w-4 h-4" />
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <SendIcon className="w-4 h-4" />
                  Sent
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
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
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                      selectedConversation?._id === conversation._id
                        ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        {conversation.otherUser?.avatar ? (
                          <Image
                            src={conversation.otherUser.avatar}
                            alt={conversation.otherUser.firstName || 'User'}
                            fill
                            className="object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {conversation.otherUser?.firstName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">{conversation.unreadCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {conversation.otherUser?.firstName} {conversation.otherUser?.lastName}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {conversation.lastMessage.subject}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-1">
                          {conversation.lastMessage.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <CardHeader className="border-b">
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12">
                    {selectedConversation.otherUser?.avatar ? (
                      <Image
                        src={selectedConversation.otherUser.avatar}
                        alt={selectedConversation.otherUser.firstName || 'User'}
                        fill
                        className="object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium">
                          {selectedConversation.otherUser?.firstName?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.otherUser?.firstName} {selectedConversation.otherUser?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{selectedConversation.otherUser?.username}
                    </p>
                  </div>
                  {(selectedConversation.serviceId || selectedConversation.productId) && (
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {selectedConversation.serviceId ? 'Service' : 'Product'} Inquiry
                      </Badge>
                      {selectedConversation.serviceId && (
                        <p className="text-xs text-gray-600 mt-1 truncate max-w-[200px]">
                          {selectedConversation.serviceId.title}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId?._id === user?._id || message.senderId === user?._id;
                  
                  return (
                    <div
                      key={message._id || index}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-lg p-4 ${
                            isOwnMessage
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          {index === 0 && (
                            <p className="font-semibold text-sm mb-2 opacity-90">
                              {message.subject}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          <div className="flex items-center justify-end mt-2 space-x-2">
                            <span className={`text-xs ${isOwnMessage ? 'text-green-100' : 'text-gray-500'}`}>
                              {new Date(message.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {isOwnMessage && (
                              message.isRead ? (
                                <CheckCheck className="w-3 h-3 text-green-100" />
                              ) : (
                                <Check className="w-3 h-3 text-green-100" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-end space-x-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                    className="flex-1 resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift + Enter for new line
                </p>
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
    </div>
  );
}

