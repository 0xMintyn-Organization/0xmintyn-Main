/**
 * Simplified ownership detection utilities
 */

import React from "react";

interface User {
  _id: string;
  isSeller?: boolean;
}

interface Service {
  _id: string;
  sellerId: string | { _id: string };
}

interface Product {
  _id: string;
  sellerId: string | { _id: string };
}

interface Conversation {
  _id: string;
  serviceId?: Service;
  productId?: Product;
  messages?: any[];
}

/**
 * Simplified ownership detection
 */
export class OwnershipDetector {
  private user: User | null = null;
  private sellerProfile: any = null;

  constructor(user: User | null) {
    this.user = user;
  }

  /**
   * Set seller profile for more accurate detection
   */
  setSellerProfile(profile: any) {
    this.sellerProfile = profile;
  }

  /**
   * Check if user owns a service
   */
  async isServiceOwner(service: Service): Promise<boolean> {
    if (!this.user) return false;

    try {
      // Method 1: Check seller profile if available
      if (this.sellerProfile) {
        const userSellerId = this.sellerProfile._id;
        const serviceSellerId = typeof service.sellerId === 'string' 
          ? service.sellerId 
          : service.sellerId._id;
        return userSellerId === serviceSellerId;
      }

      // Method 2: Check if user is seller and has the service
      if (this.user.isSeller) {
        // This would require an API call to check ownership
        // For now, return false and let the conversation context handle it
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error checking service ownership:', error);
      return false;
    }
  }

  /**
   * Check if user owns a product
   */
  async isProductOwner(product: Product): Promise<boolean> {
    if (!this.user) return false;

    try {
      // Method 1: Check seller profile if available
      if (this.sellerProfile) {
        const userSellerId = this.sellerProfile._id;
        const productSellerId = typeof product.sellerId === 'string' 
          ? product.sellerId 
          : product.sellerId._id;
        return userSellerId === productSellerId;
      }

      // Method 2: Check if user is seller and has the product
      if (this.user.isSeller) {
        // This would require an API call to check ownership
        // For now, return false and let the conversation context handle it
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error checking product ownership:', error);
      return false;
    }
  }

  /**
   * Simplified conversation ownership detection
   */
  async detectConversationOwnership(conversation: Conversation): Promise<{
    isOwner: boolean;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    if (!this.user) {
      return { isOwner: false, reason: 'No user logged in', confidence: 'high' };
    }

    try {
      // Method 1: Check seller profile (most reliable)
      if (this.sellerProfile) {
        if (conversation.serviceId) {
          const isOwner = await this.isServiceOwner(conversation.serviceId);
          return {
            isOwner,
            reason: isOwner ? 'User owns the service' : 'User does not own the service',
            confidence: 'high'
          };
        }

        if (conversation.productId) {
          const isOwner = await this.isProductOwner(conversation.productId);
          return {
            isOwner,
            reason: isOwner ? 'User owns the product' : 'User does not own the product',
            confidence: 'high'
          };
        }
      }

      // Method 2: Conversation context analysis (fallback)
      if (conversation.messages && conversation.messages.length > 0) {
        const firstMessage = conversation.messages[0];
        const isFirstMessageReceived = firstMessage.receiverId?._id === this.user._id || 
                                     firstMessage.receiverId === this.user._id;
        
        return {
          isOwner: isFirstMessageReceived,
          reason: isFirstMessageReceived 
            ? 'User received the first message (likely service/product owner)' 
            : 'User sent the first message (likely buyer)',
          confidence: 'medium'
        };
      }

      // Method 3: Default fallback
      return {
        isOwner: false,
        reason: 'Unable to determine ownership',
        confidence: 'low'
      };

    } catch (error) {
      console.error('Error detecting conversation ownership:', error);
      return {
        isOwner: false,
        reason: 'Error occurred during ownership detection',
        confidence: 'low'
      };
    }
  }

  /**
   * Get ownership status with user feedback
   */
  async getOwnershipStatus(conversation: Conversation): Promise<{
    isOwner: boolean;
    status: 'loading' | 'owner' | 'buyer' | 'unknown';
    message: string;
  }> {
    const result = await this.detectConversationOwnership(conversation);
    
    if (result.confidence === 'low') {
      return {
        isOwner: false,
        status: 'unknown',
        message: 'Unable to determine your role in this conversation'
      };
    }

    if (result.isOwner) {
      return {
        isOwner: true,
        status: 'owner',
        message: 'You are the service/product owner'
      };
    }

    return {
      isOwner: false,
      status: 'buyer',
      message: 'You are the buyer in this conversation'
    };
  }
}

/**
 * React hook for ownership detection
 */
export function useOwnershipDetection(user: User | null) {
  const [detector] = React.useState(() => new OwnershipDetector(user));
  const [sellerProfile, setSellerProfile] = React.useState<any>(null);

  React.useEffect(() => {
    detector.setSellerProfile(sellerProfile);
  }, [sellerProfile, detector]);

  const detectOwnership = React.useCallback(async (conversation: Conversation) => {
    return await detector.getOwnershipStatus(conversation);
  }, [detector]);

  const loadSellerProfile = React.useCallback(async () => {
    // Marketplace removed - seller profile loading disabled
    return;
  }, []);

  React.useEffect(() => {
    loadSellerProfile();
  }, [loadSellerProfile]);

  return {
    detectOwnership,
    loadSellerProfile,
    sellerProfile
  };
}
