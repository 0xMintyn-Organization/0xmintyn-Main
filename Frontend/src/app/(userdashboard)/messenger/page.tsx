'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AllRolesProtected } from '@/components/RoleProtected';
import { marketplaceApi } from '@/lib/marketplaceApi';
import useAuth from '@/hooks/userAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Loader2, User, Building2 } from 'lucide-react';

type OtherUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  startupName?: string;
  avatar?: string;
};

type Conversation = {
  _id: string;
  otherUser: OtherUser | null;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  updatedAt: string;
};

type Message = {
  _id: string;
  text: string;
  createdAt: string;
  senderId: { _id: string; firstName?: string; lastName?: string; startupName?: string };
};

function displayName(u: OtherUser | null): string {
  if (!u) return 'Unknown';
  if (u.startupName) return u.startupName;
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return name || (u.email as string) || 'Unknown';
}

export default function MessengerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get('with');
  const { user } = useAuth();
  const currentUserId = (user as { _id?: string })?._id;
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [openWithUserId, setOpenWithUserId] = useState<string | null>(withUserId);

  useEffect(() => {
    setOpenWithUserId(withUserId);
  }, [withUserId]);

  useEffect(() => {
    (async () => {
      setLoadingConversations(true);
      try {
        const res = await marketplaceApi.messenger.listConversations();
        setConversations((res.conversations as Conversation[]) || []);
      } catch (e) {
        toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
      } finally {
        setLoadingConversations(false);
      }
    })();
  }, [toast]);

  useEffect(() => {
    if (!openWithUserId || !currentUserId || openWithUserId === currentUserId) return;
    (async () => {
      try {
        const res = await marketplaceApi.messenger.getOrCreateConversation(openWithUserId);
        const conv = res.conversation as Conversation & { _id: string };
        setSelectedConversation(conv);
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conv._id);
          if (exists) return prev;
          return [{ _id: conv._id, otherUser: conv.otherUser ?? null, lastMessageAt: null, lastMessageText: null, updatedAt: conv.updatedAt ?? new Date().toISOString() }, ...prev];
        });
        setOpenWithUserId(null);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('with');
          router.replace(url.pathname, { scroll: false });
        }
      } catch (e) {
        toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
        setOpenWithUserId(null);
      }
    })();
  }, [openWithUserId, currentUserId, router, toast]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    marketplaceApi.messenger
      .listMessages(selectedConversation._id)
      .then((res) => setMessages((res.messages as Message[]) || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedConversation?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !selectedConversation || sending) return;
    setSending(true);
    try {
      const res = await marketplaceApi.messenger.sendMessage(selectedConversation._id, text);
      const newMsg = res.message as Message;
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConversation._id
            ? { ...c, lastMessageAt: newMsg.createdAt, lastMessageText: text.substring(0, 100), updatedAt: newMsg.createdAt }
            : c
        )
      );
    } catch (e) {
      toast({ title: 'Error', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const isStartup = (u: OtherUser | null) => !!u && 'startupName' in u && (u as { startupName?: string }).startupName;

  function formatMessageTime(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  return (
    <AllRolesProtected>
      <div className="w-full h-[calc(100vh-8rem)] flex flex-col md:flex-row rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Conversation list */}
        <div className="w-full md:w-[320px] flex flex-col border-b md:border-b-0 md:border-r border-border bg-muted/20 dark:bg-zinc-900/50">
          <div className="shrink-0 px-5 py-4 border-b border-border">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white">
                <MessageSquare className="w-5 h-5" />
              </span>
              Messenger
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">Chat with startups and contributors</p>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[220px] mx-auto">
                  Open a startup or contributor profile and click Message to start chatting.
                </p>
              </div>
            ) : (
              <ul className="p-2 space-y-0.5">
                {conversations.map((c) => {
                  const active = selectedConversation?._id === c._id;
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedConversation(c)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                          active ? 'bg-green-600 text-white shadow-sm' : 'hover:bg-muted/80 dark:hover:bg-zinc-800/80'
                        }`}
                      >
                        <Avatar className="h-11 w-11 shrink-0 ring-2 ring-background">
                          <AvatarImage src={c.otherUser?.avatar} />
                          <AvatarFallback className={active ? 'bg-green-500 text-white text-sm' : 'bg-muted text-muted-foreground text-sm'}>
                            {isStartup(c.otherUser) ? (
                              <Building2 className="w-5 h-5" />
                            ) : (
                              (displayName(c.otherUser).charAt(0) || '?').toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{displayName(c.otherUser)}</p>
                          {c.lastMessageText ? (
                            <p className={`text-xs truncate mt-0.5 ${active ? 'text-green-100/90' : 'text-muted-foreground'}`}>
                              {c.lastMessageText}
                            </p>
                          ) : (
                            c.lastMessageAt && (
                              <p className={`text-xs mt-0.5 ${active ? 'text-green-100/70' : 'text-muted-foreground'}`}>
                                {formatMessageTime(c.lastMessageAt)}
                              </p>
                            )
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0 bg-background/50 dark:bg-zinc-950/30">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted dark:bg-zinc-800">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Select a conversation</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose a chat from the list or open a profile and click Message to start.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="shrink-0 px-4 py-3 border-b border-border flex items-center gap-3 bg-card/80 dark:bg-zinc-900/80">
                <Avatar className="h-10 w-10 ring-2 ring-background">
                  <AvatarImage src={selectedConversation.otherUser?.avatar} />
                  <AvatarFallback className="bg-green-600/10 text-green-600 dark:text-green-400 text-sm font-medium">
                    {isStartup(selectedConversation.otherUser) ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      (displayName(selectedConversation.otherUser).charAt(0) || '?').toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{displayName(selectedConversation.otherUser)}</p>
                  <p className="text-xs text-muted-foreground">
                    {isStartup(selectedConversation.otherUser) ? 'Startup' : 'Contributor'}
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-5 min-h-0">
                {loadingMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m) => {
                      const isMe = String(m.senderId._id) === String(currentUserId);
                      return (
                        <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? 'bg-green-600 text-white rounded-br-md'
                                : 'bg-muted dark:bg-zinc-800 text-foreground rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                            <p className={`text-[11px] mt-1.5 ${isMe ? 'text-green-100/80' : 'text-muted-foreground'}`}>
                              {formatMessageTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <div className="shrink-0 p-3 border-t border-border bg-card/80 dark:bg-zinc-900/80">
                <div className="flex gap-2 items-end">
                  <Input
                    placeholder="Type a message…"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={sending}
                    className="flex-1 min-h-[44px] rounded-xl border-border bg-background focus-visible:ring-green-600"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || !inputText.trim()}
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AllRolesProtected>
  );
}
