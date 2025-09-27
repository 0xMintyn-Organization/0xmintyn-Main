import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

// Environment variables
const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const GOVERNANCE_PROGRAM_ID = process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID || '11111111111111111111111111111111';
const UBI_PROGRAM_ID = process.env.NEXT_PUBLIC_UBI_PROGRAM_ID || '11111111111111111111111111111111';
const COUNTER_PROGRAM_ID = process.env.NEXT_PUBLIC_COUNTER_PROGRAM_ID || 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS';

export interface TransactionResult {
  signature: string;
  confirmed: boolean;
  slot?: number;
  error?: string;
}

export interface ContractServiceConfig {
  connection: Connection;
  programIds: {
    governance: PublicKey;
    ubi: PublicKey;
    counter: PublicKey;
    splToken: PublicKey;
  };
}

export class SmartContractService {
  private connection: Connection;
  private programIds: {
    governance: PublicKey;
    ubi: PublicKey;
    counter: PublicKey;
    splToken: PublicKey;
  };

  constructor(config?: Partial<ContractServiceConfig>) {
    this.connection = config?.connection || new Connection(SOLANA_RPC_URL, 'confirmed');
    this.programIds = {
      governance: config?.programIds?.governance || new PublicKey(GOVERNANCE_PROGRAM_ID),
      ubi: config?.programIds?.ubi || new PublicKey(UBI_PROGRAM_ID),
      counter: config?.programIds?.counter || new PublicKey(COUNTER_PROGRAM_ID),
      splToken: TOKEN_PROGRAM_ID,
    };
  }

  // Universal transaction builder
  async buildAndSignTransaction(
    instructions: TransactionInstruction | TransactionInstruction[],
    wallet: any,
    options: {
      estimateFees?: boolean;
      awaitConfirmation?: boolean;
      skipPreflight?: boolean;
      onFeeEstimated?: (fee: number) => void;
    } = {}
  ): Promise<TransactionResult> {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Create transaction
      const transaction = new Transaction();
      
      // Add instructions
      if (Array.isArray(instructions)) {
        transaction.add(...instructions);
      } else {
        transaction.add(instructions);
      }

      // Get recent blockhash and set fee payer
      const { blockhash, feeCalculator } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Estimate fees if requested
      if (options.estimateFees) {
        const fee = feeCalculator.lamportsPerSignature * (Array.isArray(instructions) ? instructions.length + 1 : 2);
        options.onFeeEstimated?.(fee);
      }

      // Sign transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      
      // Send transaction
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: options.skipPreflight || false,
          preflightCommitment: 'confirmed'
        }
      );

      // Wait for confirmation if requested
      let confirmation;
      if (options.awaitConfirmation !== false) {
        confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
      }

      // Emit event for real-time updates
      this.emitContractEvent('transaction_confirmed', {
        signature,
        publicKey: wallet.publicKey.toString(),
        confirmed: true
      });

      return {
        signature,
        confirmed: true,
        slot: confirmation?.context?.slot
      };

    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      // Emit error event
      this.emitContractEvent('transaction_failed', {
        error: error.message,
        publicKey: wallet.publicKey?.toString()
      });
      
      throw error;
    }
  }

  // Counter program interactions
  async incrementCounter(wallet: any): Promise<TransactionResult> {
    try {
      const instruction = new TransactionInstruction({
        keys: [
          {
            pubkey: wallet.publicKey,
            isSigner: true,
            isWritable: false,
          },
        ],
        programId: this.programIds.counter,
        data: Buffer.from([0]), // increment instruction
      });

      const result = await this.buildAndSignTransaction(instruction, wallet, {
        estimateFees: true,
        awaitConfirmation: true
      });

      this.emitContractEvent('counter_incremented', {
        publicKey: wallet.publicKey.toString(),
        signature: result.signature
      });

      return result;
    } catch (error: any) {
      console.error('Counter increment failed:', error);
      throw error;
    }
  }

  async decrementCounter(wallet: any): Promise<TransactionResult> {
    try {
      const instruction = new TransactionInstruction({
        keys: [
          {
            pubkey: wallet.publicKey,
            isSigner: true,
            isWritable: false,
          },
        ],
        programId: this.programIds.counter,
        data: Buffer.from([1]), // decrement instruction
      });

      const result = await this.buildAndSignTransaction(instruction, wallet, {
        estimateFees: true,
        awaitConfirmation: true
      });

      this.emitContractEvent('counter_decremented', {
        publicKey: wallet.publicKey.toString(),
        signature: result.signature
      });

      return result;
    } catch (error: any) {
      console.error('Counter decrement failed:', error);
      throw error;
    }
  }

  // Governance interactions
  async participateInGovernance(
    proposalId: string,
    vote: boolean,
    wallet: any
  ): Promise<TransactionResult> {
    try {
      const proposalPubkey = new PublicKey(proposalId);
      
      // Build governance vote instruction
      const voteInstruction = new TransactionInstruction({
        keys: [
          {
            pubkey: wallet.publicKey,
            isSigner: true,
            isWritable: false,
          },
          {
            pubkey: proposalPubkey,
            isSigner: false,
            isWritable: true,
          },
        ],
        programId: this.programIds.governance,
        data: Buffer.from([vote ? 1 : 0]), // vote instruction with boolean
      });

      const result = await this.buildAndSignTransaction(voteInstruction, wallet, {
        estimateFees: true,
        awaitConfirmation: true
      });

      // Emit event for real-time updates
      this.emitContractEvent('governance_vote_cast', {
        proposalId,
        voter: wallet.publicKey.toString(),
        vote,
        signature: result.signature
      });

      return result;
    } catch (error: any) {
      console.error('Governance voting failed:', error);
      throw error;
    }
  }

  // UBI interactions
  async claimUBICredits(wallet: any): Promise<TransactionResult> {
    try {
      // Build UBI claim instruction
      const claimInstruction = new TransactionInstruction({
        keys: [
          {
            pubkey: wallet.publicKey,
            isSigner: true,
            isWritable: false,
          },
        ],
        programId: this.programIds.ubi,
        data: Buffer.from([0]), // claim instruction
      });

      const result = await this.buildAndSignTransaction(claimInstruction, wallet, {
        estimateFees: true,
        awaitConfirmation: true,
        onFeeEstimated: (fee) => {
          console.log(`UBI claim fee: ${fee} lamports`);
        }
      });

      // Update local state
      this.emitContractEvent('ubi_claimed', {
        claimer: wallet.publicKey.toString(),
        signature: result.signature
      });

      return result;
    } catch (error: any) {
      console.error('UBI claim failed:', error);
      throw error;
    }
  }

  // SPL Token operations
  async transferSPLToken(
    mintAddress: string,
    recipientAddress: string,
    amount: number,
    wallet: any
  ): Promise<TransactionResult> {
    try {
      const mint = new PublicKey(mintAddress);
      const recipient = new PublicKey(recipientAddress);
      
      // Get or create associated token accounts
      const senderTokenAccount = await getAssociatedTokenAddress(
        mint,
        wallet.publicKey
      );
      
      const recipientTokenAccount = await getAssociatedTokenAddress(
        mint,
        recipient
      );

      // Check if recipient token account exists
      let recipientAccountInfo;
      try {
        recipientAccountInfo = await getAccount(this.connection, recipientTokenAccount);
      } catch (error) {
        recipientAccountInfo = null;
      }

      const instructions: TransactionInstruction[] = [];

      if (!recipientAccountInfo) {
        // Create recipient token account
        instructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            recipientTokenAccount,
            recipient,
            mint
          )
        );
      }

      // Add transfer instruction
      instructions.push(
        createTransferInstruction(
          senderTokenAccount,
          recipientTokenAccount,
          wallet.publicKey,
          amount * Math.pow(10, 6) // Assuming 6 decimals, adjust as needed
        )
      );

      const result = await this.buildAndSignTransaction(instructions, wallet, {
        estimateFees: true,
        awaitConfirmation: true
      });

      this.emitContractEvent('spl_token_transferred', {
        sender: wallet.publicKey.toString(),
        recipient: recipientAddress,
        mint: mintAddress,
        amount,
        signature: result.signature
      });

      return result;
    } catch (error: any) {
      console.error('SPL token transfer failed:', error);
      throw error;
    }
  }

  // Multi-program transaction composer
  async composeMultiProgramTransaction(
    operations: Array<{
      type: 'GOVERNANCE_VOTE' | 'UBI_CLAIM' | 'SPL_TRANSFER' | 'COUNTER_UPDATE';
      params: any;
    }>,
    wallet: any
  ): Promise<TransactionResult> {
    try {
      const instructions: TransactionInstruction[] = [];

      for (const operation of operations) {
        let instruction: TransactionInstruction;

        switch (operation.type) {
          case 'GOVERNANCE_VOTE':
            instruction = new TransactionInstruction({
              keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
                { pubkey: new PublicKey(operation.params.proposalId), isSigner: false, isWritable: true },
              ],
              programId: this.programIds.governance,
              data: Buffer.from([operation.params.vote ? 1 : 0]),
            });
            break;
          
          case 'UBI_CLAIM':
            instruction = new TransactionInstruction({
              keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
              ],
              programId: this.programIds.ubi,
              data: Buffer.from([0]),
            });
            break;
          
          case 'COUNTER_UPDATE':
            instruction = new TransactionInstruction({
              keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
              ],
              programId: this.programIds.counter,
              data: Buffer.from([operation.params.increment ? 0 : 1]),
            });
            break;
          
          default:
            throw new Error(`Unsupported operation type: ${operation.type}`);
        }

        instructions.push(instruction);
      }

      const result = await this.buildAndSignTransaction(instructions, wallet, {
        estimateFees: true,
        awaitConfirmation: true
      });

      this.emitContractEvent('multi_program_transaction', {
        operations: operations.map(op => op.type),
        publicKey: wallet.publicKey.toString(),
        signature: result.signature
      });

      return result;
    } catch (error: any) {
      console.error('Multi-program transaction failed:', error);
      throw error;
    }
  }

  // Event emission for real-time updates
  private emitContractEvent(eventType: string, data: any) {
    // Broadcast to WebSocket connections
    if (typeof window !== 'undefined' && window.contractEventSocket && window.contractEventSocket.readyState === WebSocket.OPEN) {
      window.contractEventSocket.send(JSON.stringify({
        type: eventType,
        data,
        timestamp: Date.now()
      }));
    }

    // Dispatch custom event for local components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`contract:${eventType}`, {
        detail: data
      }));
    }
  }

  // Get connection for external use
  getConnection(): Connection {
    return this.connection;
  }

  // Get program IDs
  getProgramIds() {
    return this.programIds;
  }
}

// Global WebSocket interface extension
declare global {
  interface Window {
    contractEventSocket?: WebSocket;
  }
}

export default SmartContractService;
