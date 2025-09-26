import { PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

// Helper function to get associated token address (since it's not available in this SPL Token version)
function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey, allowOwnerOffCurve = false): PublicKey {
  const seeds = [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()];
  const [address] = PublicKey.findProgramAddressSync(seeds, TOKEN_PROGRAM_ID);
  return address;
}
import { getConnectionPool } from './connection';

// Types
export interface Product {
  id: PublicKey;
  seller: PublicKey;
  title: string;
  description: string;
  price: BN;
  category: string;
  tags: string[];
  imageUrl: string;
  fileUrl: string;
  isActive: boolean;
  createdAt: BN;
  updatedAt: BN;
  totalSales: number;
  rating: number;
  reviewCount: number;
  bump: number;
}

export interface Order {
  id: PublicKey;
  buyer: PublicKey;
  seller: PublicKey;
  product: PublicKey;
  amount: BN;
  status: OrderStatus;
  createdAt: BN;
  escrowExpiry: BN;
  disputeWindow: BN;
  isDisputed: boolean;
  disputeReason: string | null;
  bump: number;
}

export interface Escrow {
  order: PublicKey;
  buyer: PublicKey;
  seller: PublicKey;
  amount: BN;
  isReleased: boolean;
  releaseTime: BN;
  bump: number;
}

export interface Review {
  id: PublicKey;
  buyer: PublicKey;
  product: PublicKey;
  order: PublicKey;
  rating: number;
  comment: string;
  createdAt: BN;
  bump: number;
}

export interface MarketplaceConfig {
  admin: PublicKey;
  feeRecipient: PublicKey;
  platformFee: number; // Percentage (e.g., 250 = 2.5%)
  escrowDuration: BN;
  disputeWindow: BN;
  isActive: boolean;
  bump: number;
}

export enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Delivered = 'delivered',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Disputed = 'disputed',
  Refunded = 'refunded',
}

export interface CreateProductParams {
  sellerKeypair: Keypair;
  title: string;
  description: string;
  price: BN;
  category: string;
  tags: string[];
  imageUrl: string;
  fileUrl: string;
}

export interface PurchaseProductParams {
  buyerKeypair: Keypair;
  productId: PublicKey;
  sellerTokenAccount: PublicKey;
}

export interface ReleaseEscrowParams {
  sellerKeypair: Keypair;
  orderId: PublicKey;
}

export interface DisputeOrderParams {
  disputerKeypair: Keypair;
  orderId: PublicKey;
  reason: string;
}

export interface ResolveDisputeParams {
  adminKeypair: Keypair;
  orderId: PublicKey;
  favorBuyer: boolean;
  reason: string;
}

export interface AddReviewParams {
  buyerKeypair: Keypair;
  productId: PublicKey;
  orderId: PublicKey;
  rating: number;
  comment: string;
}

// Marketplace Service Class
export class MarketplaceService {
  private program: Program<Idl>;
  private connectionPool = getConnectionPool();
  private programId: PublicKey;

  constructor(provider: AnchorProvider) {
    this.programId = new PublicKey(process.env.NEXT_PUBLIC_MARKETPLACE_PROGRAM_ID || '11111111111111111111111111111111');
    // Note: In a real implementation, you would have the marketplace program IDL
    this.program = new Program({} as Idl, this.programId, provider);
  }

  // PDA derivation helpers
  private getMarketplaceConfigPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace_config')],
      this.programId
    );
  }

  private getProductPda(productId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('product'), Buffer.from(productId)],
      this.programId
    );
  }

  private getOrderPda(orderId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('order'), Buffer.from(orderId)],
      this.programId
    );
  }

  private getEscrowPda(order: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), order.toBuffer()],
      this.programId
    );
  }

  private getReviewPda(buyer: PublicKey, product: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('review'), buyer.toBuffer(), product.toBuffer()],
      this.programId
    );
  }

  // Get marketplace configuration
  async getMarketplaceConfig(): Promise<MarketplaceConfig | null> {
    try {
      const [configPda] = this.getMarketplaceConfigPda();
      // Mock implementation
      return {
        admin: PublicKey.default,
        feeRecipient: PublicKey.default,
        platformFee: 250, // 2.5%
        escrowDuration: new BN(7 * 24 * 60 * 60), // 7 days
        disputeWindow: new BN(3 * 24 * 60 * 60), // 3 days
        isActive: true,
        bump: 0,
      };
    } catch (error) {
      console.error('Failed to fetch marketplace config:', error);
      return null;
    }
  }

  // Get product by ID
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const [productPda] = this.getProductPda(productId);
      // Mock implementation
      return {
        id: productPda,
        seller: PublicKey.default,
        title: 'Mock Digital Product',
        description: 'This is a mock digital product for demonstration',
        price: new BN(1000000), // 1 SOL
        category: 'digital_art',
        tags: ['art', 'digital', 'nft'],
        imageUrl: 'https://example.com/image.jpg',
        fileUrl: 'https://example.com/file.zip',
        isActive: true,
        createdAt: new BN(Date.now() / 1000),
        updatedAt: new BN(Date.now() / 1000),
        totalSales: 15,
        rating: 4.5,
        reviewCount: 12,
        bump: 0,
      };
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }

  // Get all products
  async getAllProducts(filters?: {
    category?: string;
    minPrice?: BN;
    maxPrice?: BN;
    seller?: PublicKey;
    search?: string;
  }): Promise<Product[]> {
    try {
      // Mock implementation
      const mockProducts: Product[] = [
        {
          id: PublicKey.default,
          seller: PublicKey.default,
          title: 'Premium Digital Art Collection',
          description: 'A collection of high-quality digital artworks',
          price: new BN(2500000), // 2.5 SOL
          category: 'digital_art',
          tags: ['art', 'collection', 'premium'],
          imageUrl: 'https://example.com/art1.jpg',
          fileUrl: 'https://example.com/art1.zip',
          isActive: true,
          createdAt: new BN(Date.now() / 1000 - 2 * 24 * 60 * 60),
          updatedAt: new BN(Date.now() / 1000),
          totalSales: 8,
          rating: 4.8,
          reviewCount: 6,
          bump: 0,
        },
        {
          id: PublicKey.default,
          seller: PublicKey.default,
          title: 'Educational Course: Solana Development',
          description: 'Complete course on Solana blockchain development',
          price: new BN(5000000), // 5 SOL
          category: 'education',
          tags: ['course', 'education', 'solana', 'development'],
          imageUrl: 'https://example.com/course1.jpg',
          fileUrl: 'https://example.com/course1.zip',
          isActive: true,
          createdAt: new BN(Date.now() / 1000 - 5 * 24 * 60 * 60),
          updatedAt: new BN(Date.now() / 1000),
          totalSales: 25,
          rating: 4.9,
          reviewCount: 18,
          bump: 0,
        },
      ];

      // Apply filters
      let filteredProducts = mockProducts;

      if (filters?.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }

      if (filters?.minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price.gte(filters.minPrice!));
      }

      if (filters?.maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price.lte(filters.maxPrice!));
      }

      if (filters?.seller) {
        filteredProducts = filteredProducts.filter(p => p.seller.equals(filters.seller!));
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return filteredProducts;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }
  }

  // Get user's products
  async getUserProducts(seller: PublicKey): Promise<Product[]> {
    try {
      const allProducts = await this.getAllProducts();
      return allProducts.filter(p => p.seller.equals(seller));
    } catch (error) {
      console.error('Failed to fetch user products:', error);
      return [];
    }
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const [orderPda] = this.getOrderPda(orderId);
      // Mock implementation
      return {
        id: orderPda,
        buyer: PublicKey.default,
        seller: PublicKey.default,
        product: PublicKey.default,
        amount: new BN(1000000),
        status: OrderStatus.Paid,
        createdAt: new BN(Date.now() / 1000 - 2 * 24 * 60 * 60),
        escrowExpiry: new BN(Date.now() / 1000 + 5 * 24 * 60 * 60),
        disputeWindow: new BN(Date.now() / 1000 + 2 * 24 * 60 * 60),
        isDisputed: false,
        disputeReason: null,
        bump: 0,
      };
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return null;
    }
  }

  // Get user's orders
  async getUserOrders(user: PublicKey, asBuyer: boolean = true): Promise<Order[]> {
    try {
      // Mock implementation
      return [];
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      return [];
    }
  }

  // Get product reviews
  async getProductReviews(productId: PublicKey): Promise<Review[]> {
    try {
      // Mock implementation
      return [];
    } catch (error) {
      console.error('Failed to fetch product reviews:', error);
      return [];
    }
  }

  // Create product
  async createProduct(params: CreateProductParams): Promise<string> {
    try {
      const { sellerKeypair, title, description, price, category, tags, imageUrl, fileUrl } = params;
      
      const productId = `product_${Date.now()}`;
      const [productPda] = this.getProductPda(productId);
      const [marketplaceConfigPda] = this.getMarketplaceConfigPda();

      // Mock implementation
      const mockTxHash = `mock_product_tx_${Date.now()}`;
      
      console.log('Creating product:', {
        title,
        description,
        price: price.toString(),
        category,
        tags,
        imageUrl,
        fileUrl,
      });

      return mockTxHash;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  }

  // Purchase product
  async purchaseProduct(params: PurchaseProductParams): Promise<string> {
    try {
      const { buyerKeypair, productId, sellerTokenAccount } = params;
      
      const orderId = `order_${Date.now()}`;
      const [orderPda] = this.getOrderPda(orderId);
      const [productPda] = this.getProductPda(productId.toString());
      const [escrowPda] = this.getEscrowPda(orderPda);

      // Mock implementation
      const mockTxHash = `mock_purchase_tx_${Date.now()}`;
      
      console.log('Purchasing product:', {
        productId: productId.toString(),
        sellerTokenAccount: sellerTokenAccount.toString(),
      });

      return mockTxHash;
    } catch (error) {
      console.error('Failed to purchase product:', error);
      throw error;
    }
  }

  // Release escrow (seller confirms delivery)
  async releaseEscrow(params: ReleaseEscrowParams): Promise<string> {
    try {
      const { sellerKeypair, orderId } = params;
      
      const [orderPda] = this.getOrderPda(orderId.toString());
      const [escrowPda] = this.getEscrowPda(orderPda);

      // Mock implementation
      const mockTxHash = `mock_release_tx_${Date.now()}`;
      
      console.log('Releasing escrow for order:', orderId.toString());

      return mockTxHash;
    } catch (error) {
      console.error('Failed to release escrow:', error);
      throw error;
    }
  }

  // Dispute order
  async disputeOrder(params: DisputeOrderParams): Promise<string> {
    try {
      const { disputerKeypair, orderId, reason } = params;
      
      const [orderPda] = this.getOrderPda(orderId.toString());

      // Mock implementation
      const mockTxHash = `mock_dispute_tx_${Date.now()}`;
      
      console.log('Disputing order:', {
        orderId: orderId.toString(),
        reason,
      });

      return mockTxHash;
    } catch (error) {
      console.error('Failed to dispute order:', error);
      throw error;
    }
  }

  // Resolve dispute (admin only)
  async resolveDispute(params: ResolveDisputeParams): Promise<string> {
    try {
      const { adminKeypair, orderId, favorBuyer, reason } = params;
      
      const [orderPda] = this.getOrderPda(orderId.toString());
      const [escrowPda] = this.getEscrowPda(orderPda);

      // Mock implementation
      const mockTxHash = `mock_resolve_tx_${Date.now()}`;
      
      console.log('Resolving dispute:', {
        orderId: orderId.toString(),
        favorBuyer,
        reason,
      });

      return mockTxHash;
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
      throw error;
    }
  }

  // Add review
  async addReview(params: AddReviewParams): Promise<string> {
    try {
      const { buyerKeypair, productId, orderId, rating, comment } = params;
      
      const [reviewPda] = this.getReviewPda(buyerKeypair.publicKey, productId);
      const [orderPda] = this.getOrderPda(orderId.toString());
      const [productPda] = this.getProductPda(productId.toString());

      // Mock implementation
      const mockTxHash = `mock_review_tx_${Date.now()}`;
      
      console.log('Adding review:', {
        productId: productId.toString(),
        orderId: orderId.toString(),
        rating,
        comment,
      });

      return mockTxHash;
    } catch (error) {
      console.error('Failed to add review:', error);
      throw error;
    }
  }

  // Update product
  async updateProduct(
    sellerKeypair: Keypair,
    productId: string,
    updates: Partial<Pick<Product, 'title' | 'description' | 'price' | 'category' | 'tags' | 'imageUrl' | 'fileUrl'>>
  ): Promise<string> {
    try {
      const [productPda] = this.getProductPda(productId);

      // Mock implementation
      const mockTxHash = `mock_update_tx_${Date.now()}`;
      
      console.log('Updating product:', {
        productId,
        updates,
      });

      return mockTxHash;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  }

  // Deactivate product
  async deactivateProduct(sellerKeypair: Keypair, productId: string): Promise<string> {
    try {
      const [productPda] = this.getProductPda(productId);

      // Mock implementation
      const mockTxHash = `mock_deactivate_tx_${Date.now()}`;
      
      console.log('Deactivating product:', productId);

      return mockTxHash;
    } catch (error) {
      console.error('Failed to deactivate product:', error);
      throw error;
    }
  }

  // Get marketplace statistics
  async getMarketplaceStats(): Promise<{
    totalProducts: number;
    totalSales: number;
    totalVolume: BN;
    activeOrders: number;
    pendingDisputes: number;
  }> {
    try {
      // Mock implementation
      return {
        totalProducts: 150,
        totalSales: 1250,
        totalVolume: new BN(50000000000), // 50 SOL
        activeOrders: 45,
        pendingDisputes: 3,
      };
    } catch (error) {
      console.error('Failed to get marketplace stats:', error);
      return {
        totalProducts: 0,
        totalSales: 0,
        totalVolume: new BN(0),
        activeOrders: 0,
        pendingDisputes: 0,
      };
    }
  }

  // Check if order can be disputed
  async canDisputeOrder(order: Order): Promise<boolean> {
    try {
      const now = new BN(Date.now() / 1000);
      
      // Can dispute if order is paid and within dispute window
      return order.status === OrderStatus.Paid && 
             now.lte(order.disputeWindow) && 
             !order.isDisputed;
    } catch (error) {
      console.error('Failed to check if order can be disputed:', error);
      return false;
    }
  }

  // Check if escrow can be released
  async canReleaseEscrow(order: Order): Promise<boolean> {
    try {
      const now = new BN(Date.now() / 1000);
      
      // Can release if order is paid and not disputed
      return order.status === OrderStatus.Paid && 
             !order.isDisputed;
    } catch (error) {
      console.error('Failed to check if escrow can be released:', error);
      return false;
    }
  }

  // Event listeners
  async listenToEvents(callback: (event: any) => void): Promise<void> {
    try {
      // Mock implementation
      console.log('Setting up marketplace event listeners');
    } catch (error) {
      console.error('Failed to set up event listeners:', error);
      throw error;
    }
  }

  // Remove event listeners
  async removeEventListeners(): Promise<void> {
    try {
      // Mock implementation
      console.log('Removing marketplace event listeners');
    } catch (error) {
      console.error('Failed to remove event listeners:', error);
    }
  }
}

export default MarketplaceService;
