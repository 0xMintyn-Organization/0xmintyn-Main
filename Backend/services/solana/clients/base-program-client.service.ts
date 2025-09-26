import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, Commitment } from '@solana/web3.js';
import { SolanaConnectionManager } from '../connection.service';
import * as fs from 'fs';
import * as path from 'path';

export class BaseProgramClientService {
  protected connectionManager: SolanaConnectionManager;
  protected programId: string;
  protected idlPath: string;
  protected program: Program;
  protected provider: AnchorProvider;

  constructor(
    connectionManager: SolanaConnectionManager, 
    programId: string, 
    idlPath: string
  ) {
    this.connectionManager = connectionManager;
    this.programId = programId;
    this.idlPath = idlPath;
    
    this.initializeProgram();
  }

  private initializeProgram() {
    try {
      // Get connection
      const connection = this.connectionManager.getConnection('devnet');
      
      // Create a dummy wallet for read-only operations
      const dummyKeypair = Keypair.generate();
      const wallet = {
        publicKey: dummyKeypair.publicKey,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any[]) => txs,
      };

      // Create provider
      this.provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' as Commitment }
      );

      // Load IDL
      const idl = this.loadIdl();
      
      // Create program instance
      this.program = new Program(
        idl,
        new PublicKey(this.programId),
        this.provider
      );

    } catch (error) {
      console.error(`Error initializing program ${this.programId}:`, error);
      // Create a mock program to prevent crashes
      this.createMockProgram();
    }
  }

  private loadIdl(): Idl {
    try {
      const idlFilePath = path.resolve(__dirname, this.idlPath);
      
      // Check if IDL file exists
      if (fs.existsSync(idlFilePath)) {
        const idlData = fs.readFileSync(idlFilePath, 'utf8');
        return JSON.parse(idlData) as Idl;
      } else {
        console.warn(`IDL file not found: ${idlFilePath}, using mock IDL`);
        return this.createMockIdl();
      }
    } catch (error) {
      console.error(`Error loading IDL from ${this.idlPath}:`, error);
      return this.createMockIdl();
    }
  }

  private createMockIdl(): Idl {
    return {
      version: '0.1.0',
      name: 'mock_program',
      instructions: [],
      accounts: [],
      types: []
    } as Idl;
  }

  private createMockProgram() {
    // Create a mock program object to prevent crashes
    this.program = {
      account: {},
      methods: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      fetch: async () => null,
      fetchMultiple: async () => [],
      all: async () => [],
    } as any;
  }

  // Basic program information
  getProgramInfo() {
    return {
      programId: this.programId,
      idlPath: this.idlPath,
      isInitialized: !!this.program
    };
  }

  // Connection management
  getConnection(): Connection {
    return this.connectionManager.getConnection('devnet');
  }

  async getHealthyConnection(): Promise<Connection> {
    return await this.connectionManager.getHealthyConnection('devnet');
  }

  // Account utilities
  async getAccountInfo(publicKey: PublicKey) {
    try {
      const connection = this.getConnection();
      return await connection.getAccountInfo(publicKey);
    } catch (error) {
      console.error('Error fetching account info:', error);
      return null;
    }
  }

  async getMultipleAccountsInfo(publicKeys: PublicKey[]) {
    try {
      const connection = this.getConnection();
      return await connection.getMultipleAccountsInfo(publicKeys);
    } catch (error) {
      console.error('Error fetching multiple accounts info:', error);
      return [];
    }
  }

  // Transaction utilities
  async getRecentBlockhash() {
    try {
      const connection = this.getConnection();
      return await connection.getLatestBlockhash();
    } catch (error) {
      console.error('Error fetching recent blockhash:', error);
      throw error;
    }
  }

  async confirmTransaction(signature: string) {
    try {
      const connection = this.getConnection();
      return await connection.confirmTransaction(signature);
    } catch (error) {
      console.error('Error confirming transaction:', error);
      throw error;
    }
  }

  // Program Data Access
  async fetchAccount(accountType: string, publicKey: PublicKey) {
    try {
      if (this.program.account[accountType]) {
        return await this.program.account[accountType].fetch(publicKey);
      } else {
        console.warn(`Account type ${accountType} not found in program`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching ${accountType} account:`, error);
      return null;
    }
  }

  async fetchMultipleAccounts(accountType: string, publicKeys: PublicKey[]) {
    try {
      if (this.program.account[accountType]) {
        return await this.program.account[accountType].fetchMultiple(publicKeys);
      } else {
        console.warn(`Account type ${accountType} not found in program`);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching multiple ${accountType} accounts:`, error);
      return [];
    }
  }

  async getAllAccounts(accountType: string, filters?: any[]) {
    try {
      if (this.program.account[accountType]) {
        return await this.program.account[accountType].all(filters);
      } else {
        console.warn(`Account type ${accountType} not found in program`);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching all ${accountType} accounts:`, error);
      return [];
    }
  }

  // Event Management
  addEventListener(eventName: string, callback: (event: any) => void) {
    try {
      if (this.program.addEventListener) {
        return this.program.addEventListener(eventName, callback);
      } else {
        console.warn('Event listeners not supported by this program instance');
        return null;
      }
    } catch (error) {
      console.error(`Error adding event listener for ${eventName}:`, error);
      return null;
    }
  }

  removeEventListener(listenerId: number) {
    try {
      if (this.program.removeEventListener) {
        this.program.removeEventListener(listenerId);
      } else {
        console.warn('Event listeners not supported by this program instance');
      }
    } catch (error) {
      console.error('Error removing event listener:', error);
    }
  }

  // PDA Utilities
  async findProgramAddress(seeds: (Buffer | Uint8Array)[]): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(seeds, new PublicKey(this.programId));
  }

  createProgramAddressSync(seeds: (Buffer | Uint8Array)[], bump: number): PublicKey {
    return PublicKey.createProgramAddressSync(seeds.concat([Buffer.from([bump])]), new PublicKey(this.programId));
  }

  // Health Check
  async performHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    programInfo: any;
  }> {
    const issues: string[] = [];
    
    try {
      // Check if program is initialized
      if (!this.program) {
        issues.push('Program not initialized');
      }

      // Check connection
      const connection = this.getConnection();
      if (!connection) {
        issues.push('No connection available');
      } else {
        // Test connection with a simple call
        await connection.getSlot();
      }

      // Check if program account exists
      const programInfo = await this.getAccountInfo(new PublicKey(this.programId));
      if (!programInfo) {
        issues.push('Program account not found on-chain');
      }

    } catch (error) {
      issues.push(`Health check error: ${error.message}`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      programInfo: this.getProgramInfo()
    };
  }

  // Utility Methods
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  formatPublicKey(publicKey: PublicKey): string {
    return publicKey.toString();
  }

  parsePublicKey(publicKeyString: string): PublicKey {
    return new PublicKey(publicKeyString);
  }
}
