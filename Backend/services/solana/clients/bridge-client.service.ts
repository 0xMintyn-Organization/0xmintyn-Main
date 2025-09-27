import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { BaseProgramClientService } from './base-program-client.service';
import { SolanaConnectionManager } from '../connection.service';

export interface InitiateBridgeParams {
  senderKeypair: Keypair;
  tokenMint: PublicKey;
  amount: BN;
  destinationChain: string;
  destinationAddress: string;
  bridgeFee: BN;
}

export interface CompleteBridgeParams {
  guardianKeypair: Keypair;
  bridgeRequest: PublicKey;
  destinationTxHash: string;
}

export interface BridgeRequest {
  sender: PublicKey;
  tokenMint: PublicKey;
  amount: BN;
  destinationChain: string;
  destinationAddress: string;
  bridgeFee: BN;
  status: number; // 0: Pending, 1: Completed, 2: Failed, 3: Cancelled
  requestId: BN;
  createdAt: BN;
  completedAt: BN;
  destinationTxHash: string;
  guardian: PublicKey;
}

export interface BridgeConfig {
  admin: PublicKey;
  guardians: PublicKey[];
  requiredSignatures: number;
  supportedChains: string[];
  bridgeFee: BN;
  feeRecipient: PublicKey;
  totalBridged: BN;
  totalRequests: number;
  isActive: boolean;
}

export interface GuardianSignature {
  guardian: PublicKey;
  bridgeRequest: PublicKey;
  signature: number[];
  timestamp: BN;
}

export class BridgeClientService extends BaseProgramClientService {
  constructor(
    connectionManager: SolanaConnectionManager,
    programId: string = 'FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS' // Bridge program ID
  ) {
    super(connectionManager, programId, '../../../idl/counter.json'); // Update with actual bridge IDL
  }

  // PDA Generation Methods
  public getBridgeConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bridge_config')],
      this.programId
    );
  }

  public getBridgeRequestPDA(requestId: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bridge_request'), requestId.toArrayLike(Buffer, 'le', 8)],
      this.programId
    );
  }

  public getBridgeVaultPDA(tokenMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bridge_vault'), tokenMint.toBuffer()],
      this.programId
    );
  }

  public getGuardianSignaturePDA(
    guardian: PublicKey,
    bridgeRequest: PublicKey
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('guardian_signature'),
        guardian.toBuffer(),
        bridgeRequest.toBuffer()
      ],
      this.programId
    );
  }

  // Initialize Bridge
  public async initializeBridge(
    adminKeypair: Keypair,
    guardians: PublicKey[],
    requiredSignatures: number,
    supportedChains: string[],
    bridgeFee: BN,
    feeRecipient: PublicKey
  ): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .initializeBridge(
          guardians,
          requiredSignatures,
          supportedChains,
          bridgeFee,
          feeRecipient
        )
        .accounts({
          admin: adminKeypair.publicKey,
          bridgeConfig,
          systemProgram: SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  // Add Supported Token
  public async addSupportedToken(
    adminKeypair: Keypair,
    tokenMint: PublicKey
  ): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();
    const [bridgeVault] = this.getBridgeVaultPDA(tokenMint);

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .addSupportedToken()
        .accounts({
          admin: adminKeypair.publicKey,
          bridgeConfig,
          tokenMint,
          bridgeVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  // Initiate Bridge Transfer
  public async initiateBridge(params: InitiateBridgeParams): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();
    const config = await this.getBridgeConfig();
    const requestId = new BN(config.totalRequests);
    const [bridgeRequest] = this.getBridgeRequestPDA(requestId);
    const [bridgeVault] = this.getBridgeVaultPDA(params.tokenMint);

    const senderTokenAccount = await getAssociatedTokenAddress(
      params.tokenMint,
      params.senderKeypair.publicKey
    );

    const vaultTokenAccount = await getAssociatedTokenAddress(
      params.tokenMint,
      bridgeVault,
      true
    );

    const feeAccount = await getAssociatedTokenAddress(
      params.tokenMint,
      config.feeRecipient
    );

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .initiateBridge(
          params.amount,
          params.destinationChain,
          params.destinationAddress,
          params.bridgeFee
        )
        .accounts({
          sender: params.senderKeypair.publicKey,
          bridgeConfig,
          bridgeRequest,
          bridgeVault,
          tokenMint: params.tokenMint,
          senderTokenAccount,
          vaultTokenAccount,
          feeAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([params.senderKeypair])
        .rpc();

      return tx;
    });
  }

  // Guardian Sign Bridge Request
  public async signBridgeRequest(
    guardianKeypair: Keypair,
    bridgeRequest: PublicKey,
    signature: number[]
  ): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();
    const [guardianSignature] = this.getGuardianSignaturePDA(
      guardianKeypair.publicKey,
      bridgeRequest
    );

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .signBridgeRequest(signature)
        .accounts({
          guardian: guardianKeypair.publicKey,
          bridgeConfig,
          bridgeRequest,
          guardianSignature,
          systemProgram: SystemProgram.programId,
        })
        .signers([guardianKeypair])
        .rpc();

      return tx;
    });
  }

  // Complete Bridge Transfer
  public async completeBridge(params: CompleteBridgeParams): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .completeBridge(params.destinationTxHash)
        .accounts({
          guardian: params.guardianKeypair.publicKey,
          bridgeConfig,
          bridgeRequest: params.bridgeRequest,
        })
        .signers([params.guardianKeypair])
        .rpc();

      return tx;
    });
  }

  // Cancel Bridge Request (Admin or Sender)
  public async cancelBridgeRequest(
    authorityKeypair: Keypair,
    bridgeRequest: PublicKey
  ): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();

    // Get bridge request details
    const requestAccount = await this.getBridgeRequest(bridgeRequest);
    if (!requestAccount) {
      throw new Error('Bridge request not found');
    }

    const [bridgeVault] = this.getBridgeVaultPDA(requestAccount.tokenMint);

    const senderTokenAccount = await getAssociatedTokenAddress(
      requestAccount.tokenMint,
      requestAccount.sender
    );

    const vaultTokenAccount = await getAssociatedTokenAddress(
      requestAccount.tokenMint,
      bridgeVault,
      true
    );

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .cancelBridgeRequest()
        .accounts({
          authority: authorityKeypair.publicKey,
          sender: requestAccount.sender,
          bridgeConfig,
          bridgeRequest,
          bridgeVault,
          tokenMint: requestAccount.tokenMint,
          senderTokenAccount,
          vaultTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authorityKeypair])
        .rpc();

      return tx;
    });
  }

  // Admin: Add Guardian
  public async addGuardian(
    adminKeypair: Keypair,
    newGuardian: PublicKey
  ): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .addGuardian(newGuardian)
        .accounts({
          admin: adminKeypair.publicKey,
          bridgeConfig,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  // Admin: Remove Guardian
  public async removeGuardian(
    adminKeypair: Keypair,
    guardianToRemove: PublicKey
  ): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .removeGuardian(guardianToRemove)
        .accounts({
          admin: adminKeypair.publicKey,
          bridgeConfig,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  // Admin: Update Bridge Config
  public async updateBridgeConfig(
    adminKeypair: Keypair,
    requiredSignatures?: number,
    bridgeFee?: BN,
    feeRecipient?: PublicKey,
    isActive?: boolean
  ): Promise<string> {
    const [bridgeConfig] = this.getBridgeConfigPDA();

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .updateBridgeConfig(
          requiredSignatures || null,
          bridgeFee || null,
          feeRecipient || null,
          isActive !== undefined ? isActive : null
        )
        .accounts({
          admin: adminKeypair.publicKey,
          bridgeConfig,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  // Query Methods
  public async getBridgeConfig(): Promise<BridgeConfig> {
    const [bridgeConfigPDA] = this.getBridgeConfigPDA();
    return await this.program.account.bridgeConfig.fetch(bridgeConfigPDA);
  }

  public async getBridgeRequest(bridgeRequest: PublicKey): Promise<BridgeRequest | null> {
    try {
      return await this.program.account.bridgeRequest.fetch(bridgeRequest);
    } catch (error) {
      return null;
    }
  }

  public async getGuardianSignature(
    guardian: PublicKey,
    bridgeRequest: PublicKey
  ): Promise<GuardianSignature | null> {
    try {
      const [guardianSignaturePDA] = this.getGuardianSignaturePDA(guardian, bridgeRequest);
      return await this.program.account.guardianSignature.fetch(guardianSignaturePDA);
    } catch (error) {
      return null;
    }
  }

  public async getAllBridgeRequests(): Promise<Array<{ publicKey: PublicKey; account: BridgeRequest }>> {
    return await this.program.account.bridgeRequest.all();
  }

  public async getPendingBridgeRequests(): Promise<Array<{ publicKey: PublicKey; account: BridgeRequest }>> {
    const allRequests = await this.getAllBridgeRequests();
    return allRequests.filter(({ account }) => account.status === 0); // Pending
  }

  public async getBridgeRequestsBySender(sender: PublicKey): Promise<Array<{ publicKey: PublicKey; account: BridgeRequest }>> {
    const allRequests = await this.getAllBridgeRequests();
    return allRequests.filter(({ account }) => account.sender.equals(sender));
  }

  public async getBridgeRequestsByDestination(destinationChain: string): Promise<Array<{ publicKey: PublicKey; account: BridgeRequest }>> {
    const allRequests = await this.getAllBridgeRequests();
    return allRequests.filter(({ account }) => 
      account.destinationChain.toLowerCase() === destinationChain.toLowerCase()
    );
  }

  // Utility Methods
  public async getBridgeRequestStatus(bridgeRequest: PublicKey): Promise<string> {
    const requestAccount = await this.getBridgeRequest(bridgeRequest);
    if (!requestAccount) return 'Not Found';
    
    const statusMap = {
      0: 'Pending',
      1: 'Completed',
      2: 'Failed',
      3: 'Cancelled'
    };
    
    return statusMap[requestAccount.status] || 'Unknown';
  }

  public async getRequiredSignatures(bridgeRequest: PublicKey): Promise<number> {
    const requestAccount = await this.getBridgeRequest(bridgeRequest);
    if (!requestAccount) return 0;
    
    const config = await this.getBridgeConfig();
    const signatures = await this.getSignatureCount(bridgeRequest);
    
    return Math.max(0, config.requiredSignatures - signatures);
  }

  public async getSignatureCount(bridgeRequest: PublicKey): Promise<number> {
    const config = await this.getBridgeConfig();
    let count = 0;
    
    for (const guardian of config.guardians) {
      const signature = await this.getGuardianSignature(guardian, bridgeRequest);
      if (signature) count++;
    }
    
    return count;
  }

  public async canCompleteBridge(bridgeRequest: PublicKey): Promise<boolean> {
    const config = await this.getBridgeConfig();
    const signatureCount = await this.getSignatureCount(bridgeRequest);
    return signatureCount >= config.requiredSignatures;
  }

  public async isSupportedChain(chain: string): Promise<boolean> {
    const config = await this.getBridgeConfig();
    return config.supportedChains.includes(chain.toLowerCase());
  }

  public async estimateBridgeFee(tokenMint: PublicKey, amount: BN): Promise<BN> {
    const config = await this.getBridgeConfig();
    return config.bridgeFee;
  }

  // Statistics Methods
  public async getBridgeStatistics(): Promise<{
    totalBridged: BN;
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    failedRequests: number;
  }> {
    const config = await this.getBridgeConfig();
    const allRequests = await this.getAllBridgeRequests();
    
    const pendingRequests = allRequests.filter(({ account }) => account.status === 0).length;
    const completedRequests = allRequests.filter(({ account }) => account.status === 1).length;
    const failedRequests = allRequests.filter(({ account }) => account.status === 2).length;
    
    return {
      totalBridged: config.totalBridged,
      totalRequests: config.totalRequests,
      pendingRequests,
      completedRequests,
      failedRequests
    };
  }

  // Event Listeners
  public onBridgeInitiated(callback: (event: any) => void): void {
    this.program.addEventListener('BridgeInitiated', callback);
  }

  public onBridgeCompleted(callback: (event: any) => void): void {
    this.program.addEventListener('BridgeCompleted', callback);
  }

  public onBridgeCancelled(callback: (event: any) => void): void {
    this.program.addEventListener('BridgeCancelled', callback);
  }

  public onGuardianAdded(callback: (event: any) => void): void {
    this.program.addEventListener('GuardianAdded', callback);
  }

  public onGuardianRemoved(callback: (event: any) => void): void {
    this.program.addEventListener('GuardianRemoved', callback);
  }

  public onBridgeRequestSigned(callback: (event: any) => void): void {
    this.program.addEventListener('BridgeRequestSigned', callback);
  }
}













