import { BaseProgramClientService } from './base-program-client.service';
import { SolanaConnectionManager } from '../connection.service';
import { PublicKey } from '@solana/web3.js';

export class P2PExchangeClientService extends BaseProgramClientService {
  constructor(connectionManager: SolanaConnectionManager, programId: string) {
    super(connectionManager, programId, '../../../idl/p2p-exchange.json');
  }

  // P2P Exchange specific methods
  async getExchangeConfig() {
    try {
      const [exchangePda] = await PublicKey.findProgramAddress(
        [Buffer.from('exchange')],
        new PublicKey(this.programId)
      );
      return await this.program.account.exchangeConfig.fetch(exchangePda);
    } catch (error) {
      console.error('Error fetching exchange config:', error);
      return null;
    }
  }

  async getActiveOrders() {
    try {
      return await this.program.account.order.all([
        {
          memcmp: {
            offset: 8 + 8 + 32, // offset to isActive field (approximate)
            bytes: 'true'
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching active orders:', error);
      return [];
    }
  }

  async getOrdersByMaker(maker: PublicKey) {
    try {
      return await this.program.account.order.all([
        {
          memcmp: {
            offset: 8 + 8, // offset to maker field
            bytes: maker.toBase58()
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching maker orders:', error);
      return [];
    }
  }

  async getOrdersByTaker(taker: PublicKey) {
    try {
      return await this.program.account.trade.all([
        {
          memcmp: {
            offset: 8 + 8 + 32, // offset to taker field
            bytes: taker.toBase58()
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching taker orders:', error);
      return [];
    }
  }

  async getUserReputation(user: PublicKey) {
    try {
      const [reputationPda] = await PublicKey.findProgramAddress(
        [Buffer.from('reputation'), user.toBuffer()],
        new PublicKey(this.programId)
      );
      return await this.program.account.reputation.fetch(reputationPda);
    } catch (error) {
      console.error('Error fetching user reputation:', error);
      return null;
    }
  }

  async getActiveDisputes() {
    try {
      return await this.program.account.dispute.all([
        {
          memcmp: {
            offset: 8 + 8 + 32 + 32 + 32, // offset to status field (approximate)
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
  onOrderCreated(callback: (event: any) => void) {
    this.program.addEventListener('OrderCreated', callback);
  }

  onOrderFilled(callback: (event: any) => void) {
    this.program.addEventListener('OrderFilled', callback);
  }

  onTradeCompleted(callback: (event: any) => void) {
    this.program.addEventListener('TradeCompleted', callback);
  }

  onDisputeCreated(callback: (event: any) => void) {
    this.program.addEventListener('DisputeCreated', callback);
  }

  onReputationUpdated(callback: (event: any) => void) {
    this.program.addEventListener('ReputationUpdated', callback);
  }
}
