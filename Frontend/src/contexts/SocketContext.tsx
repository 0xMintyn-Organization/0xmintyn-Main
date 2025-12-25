'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinOrderRoom: (orderId: string) => void;
  leaveOrderRoom: (orderId: string) => void;
  sendMessage: (orderId: string, message: string, attachments?: File[]) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const currentRoomRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?._id) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize Socket.io connection
    // Extract base URL from NEXT_PUBLIC_SERVER_URI (remove /api/v1 if present)
    let serverUrl = process.env.NEXT_PUBLIC_SERVER_URI || 'http://localhost:8000/api/v1';
    
    // Remove trailing slashes and /api/v1 if present
    serverUrl = serverUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    
    // If no protocol, add http://
    if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
      serverUrl = `http://${serverUrl}`;
    }
    
    // Socket.io namespace - connect directly to the namespace
    // Format: http://localhost:8000/exchange-p2p
    const namespace = '/exchange-p2p';
    const fullSocketUrl = `${serverUrl}${namespace}`;
    
    console.log('🔌 Socket.io connection config:', {
      baseUrl: serverUrl,
      namespace,
      fullSocketUrl,
      userId: user._id,
      envVar: process.env.NEXT_PUBLIC_SERVER_URI
    });
    
    // Connect directly to the namespace
    const newSocket = io(fullSocketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: false, // Don't force new, allow reuse
      autoConnect: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Socket connected to exchange-p2p namespace, socket ID:', newSocket.id);
      setIsConnected(true);
      
      // Authenticate with user ID immediately after connection
      if (user._id) {
        console.log('🔐 Authenticating user:', user._id);
        newSocket.emit('authenticate', { userId: user._id });
      } else {
        console.error('❌ No user ID available for authentication');
      }
    });
    
    // Listen for connection attempt
    newSocket.on('connecting', () => {
      console.log('🔄 Socket connecting...');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        type: error.type,
        description: error.description,
        context: error.context,
        fullSocketUrl,
        transport: error.transport,
      });
      setIsConnected(false);
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (socketRef.current && !socketRef.current.connected) {
          console.log('🔄 Attempting to reconnect...');
          socketRef.current.connect();
        }
      }, 2000);
    });
    
    // Listen for reconnection attempts
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt #${attemptNumber}`);
    });
    
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      if (user._id) {
        newSocket.emit('authenticate', { userId: user._id });
      }
    });
    
    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });
    
    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
    });

    newSocket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      // Emit custom error event for components to handle
      if (error.message || error.code) {
        newSocket.emit('socket:error', { 
          message: error.message || 'Socket connection error',
          code: error.code 
        });
      }
    });

    // Cleanup on unmount
    return () => {
      if (currentRoomRef.current) {
        newSocket.emit('leave-room', { orderId: currentRoomRef.current });
      }
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user?._id]);

  const joinOrderRoom = useCallback((orderId: string) => {
    if (!socketRef.current) {
      console.warn('⚠️ Socket not initialized, cannot join room');
      return;
    }

    // Join the room (we can be in multiple rooms simultaneously)
    // Don't leave previous room - users should be in all their order rooms
    socketRef.current.emit('join-room', { orderId });
    console.log(`📥 Joining room: order:${orderId} (connected: ${isConnected})`);
  }, [isConnected]);

  const leaveOrderRoom = useCallback((orderId: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit('leave-room', { orderId });
    if (currentRoomRef.current === orderId) {
      currentRoomRef.current = null;
    }
    console.log(`📤 Left room: order:${orderId}`);
  }, []);

  const sendMessage = useCallback((orderId: string, message: string, attachments?: File[]) => {
    if (!socketRef.current) {
      console.warn('Socket not initialized, cannot send message');
      return;
    }

    if (!isConnected) {
      console.warn('Socket not connected, attempting to send anyway (will queue)');
    }

    // Send message even if not fully connected (Socket.io will queue it)
    socketRef.current.emit('p2p:message:send', {
      orderId,
      message: message.trim(),
      attachments: attachments?.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    });
    
    console.log('📤 Message sent via WebSocket:', { orderId, messageLength: message.trim().length });
  }, [isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinOrderRoom,
        leaveOrderRoom,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

