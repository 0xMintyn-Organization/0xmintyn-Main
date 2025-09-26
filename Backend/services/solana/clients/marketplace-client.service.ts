import { BaseProgramClientService } from './base-program-client.service';
import { SolanaConnectionManager } from '../connection.service';
import { PublicKey } from '@solana/web3.js';

export class MarketplaceClientService extends BaseProgramClientService {
  constructor(connectionManager: SolanaConnectionManager, programId: string) {
    super(connectionManager, programId, '../../../idl/marketplace.json');
  }

  // Marketplace specific methods
  async getMarketplace() {
    try {
      const [marketplacePda] = await PublicKey.findProgramAddress(
        [Buffer.from('marketplace')],
        new PublicKey(this.programId)
      );
      return await this.program.account.marketplace.fetch(marketplacePda);
    } catch (error) {
      console.error('Error fetching marketplace:', error);
      return null;
    }
  }

  async getActiveListings() {
    try {
      return await this.program.account.productListing.all([
        {
          memcmp: {
            offset: 8 + 8 + 32 + 4 + 100 + 4 + 1000 + 8 + 2 + 4 + 50 + 4 + 200 + 1, // offset to isActive field
            bytes: 'true'
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching active listings:', error);
      return [];
    }
  }

  async getListingsBySeller(seller: PublicKey) {
    try {
      return await this.program.account.productListing.all([
        {
          memcmp: {
            offset: 8 + 8, // offset to creator field
            bytes: seller.toBase58()
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching seller listings:', error);
      return [];
    }
  }

  async getEscrowsByBuyer(buyer: PublicKey) {
    try {
      return await this.program.account.escrow.all([
        {
          memcmp: {
            offset: 8 + 8, // offset to buyer field
            bytes: buyer.toBase58()
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching buyer escrows:', error);
      return [];
    }
  }

  async getActiveDisputes() {
    try {
      return await this.program.account.dispute.all([
        {
          memcmp: {
            offset: 8 + 8 + 32 + 32 + 32 + 4 + 500 + 4 + 200, // offset to status field
            bytes: 'Open'
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching active disputes:', error);
      return [];
    }
  }

  // Event listeners
  onListingCreated(callback: (event: any) => void) {
    this.program.addEventListener('ProductListed', callback);
  }

  onPurchaseCompleted(callback: (event: any) => void) {
    this.program.addEventListener('ProductPurchased', callback);
  }

  onEscrowReleased(callback: (event: any) => void) {
    this.program.addEventListener('EscrowReleased', callback);
  }

  onDisputeCreated(callback: (event: any) => void) {
    this.program.addEventListener('DisputeCreated', callback);
  }
}
