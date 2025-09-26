import { PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Program, AnchorProvider, BN, IdlAccounts, IdlTypes } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { SolanaConnectionManager } from '../connection.service';
import { UbiProgramIDL } from '../../../types/anchor/ubi-program';

// Import the IDL - you'll need to copy this from the target/idl directory
export type UbiProgram = Program<UbiProgramIDL>;
export type UbiConfig = IdlAccounts<UbiProgramIDL>['UbiConfig'];
export type UserProfile = IdlAccounts<UbiProgramIDL>['UserProfile'];
export type FraudDetection = IdlAccounts<UbiProgramIDL>['FraudDetection'];
export type Treasury = IdlAccounts<UbiProgramIDL>['Treasury'];

export interface UbiInitializeParams {
  admin: PublicKey;
  tokenMint: PublicKey;
  maxUsers: number;
}

export interface UserInitializeParams {
  userKeypair: Keypair;
  identityHash: number[];
  referralCode?: string;
}

export interface ClaimUbiParams {
  userKeypair: Keypair;
  userTokenAccount: PublicKey;
}

export interface FundTreasuryParams {
  adminKeypair: Keypair;
  amount: BN;
  adminTokenAccount: PublicKey;
}

export class UbiClientService {
  private program: UbiProgram;
  private connectionManager: SolanaConnectionManager;
  private programId: PublicKey;

  constructor(
    connectionManager: SolanaConnectionManager,
    programId: string = 'CsKFzRYMSJpE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN'
  ) {
    this.connectionManager = connectionManager;
    this.programId = new PublicKey(programId);
    
    // Initialize program with provider
    const provider = connectionManager.getProvider();
    this.program = new Program(
      require('../../../idl/ubi_program.json'),
      this.programId,
      provider
    ) as UbiProgram;
  }

  // PDA Generation Methods
  public getUbiConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('ubi_config')],
      this.programId
    );
  }

  public getUserProfilePDA(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user_profile'), user.toBuffer()],
      this.programId
    );
  }

  public getFraudDetectionPDA(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('fraud_detection'), user.toBuffer()],
      this.programId
    );
  }

  public getTreasuryPDA(ubiConfig: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('ubi_treasury'), ubiConfig.toBuffer()],
      this.programId
    );
  }

  // Initialize UBI Program
  public async initializeProgram(params: UbiInitializeParams): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();
    const [treasury] = this.getTreasuryPDA(ubiConfig);

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .initializeProgram(params.admin, params.tokenMint, params.maxUsers)
        .accounts({
          admin: params.admin,
          ubiConfig,
          treasury,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    });
  }

  // Initialize User
  public async initializeUser(params: UserInitializeParams): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();
    const [userProfile] = this.getUserProfilePDA(params.userKeypair.publicKey);
    const [fraudDetection] = this.getFraudDetectionPDA(params.userKeypair.publicKey);
    const [treasury] = this.getTreasuryPDA(ubiConfig);

    // Get or create user token account
    const userTokenAccount = await getAssociatedTokenAddress(
      (await this.getUbiConfig()).tokenMint,
      params.userKeypair.publicKey
    );

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      (await this.getUbiConfig()).tokenMint,
      treasury,
      true
    );

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .initializeUser(params.identityHash, params.referralCode || null)
        .accounts({
          user: params.userKeypair.publicKey,
          ubiConfig,
          userProfile,
          fraudDetection,
          treasury,
          treasuryTokenAccount,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([params.userKeypair])
        .rpc();

      return tx;
    });
  }

  // Claim Initial UBI
  public async claimInitialUbi(params: ClaimUbiParams): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();
    const [userProfile] = this.getUserProfilePDA(params.userKeypair.publicKey);
    const [fraudDetection] = this.getFraudDetectionPDA(params.userKeypair.publicKey);
    const [treasury] = this.getTreasuryPDA(ubiConfig);

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      (await this.getUbiConfig()).tokenMint,
      treasury,
      true
    );

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .claimInitialUbi()
        .accounts({
          user: params.userKeypair.publicKey,
          ubiConfig,
          userProfile,
          fraudDetection,
          treasury,
          treasuryTokenAccount,
          userTokenAccount: params.userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([params.userKeypair])
        .rpc();

      return tx;
    });
  }

  // Claim Monthly UBI
  public async claimMonthlyUbi(params: ClaimUbiParams): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();
    const [userProfile] = this.getUserProfilePDA(params.userKeypair.publicKey);
    const [fraudDetection] = this.getFraudDetectionPDA(params.userKeypair.publicKey);
    const [treasury] = this.getTreasuryPDA(ubiConfig);

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      (await this.getUbiConfig()).tokenMint,
      treasury,
      true
    );

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .claimMonthlyUbi()
        .accounts({
          user: params.userKeypair.publicKey,
          ubiConfig,
          userProfile,
          fraudDetection,
          treasury,
          treasuryTokenAccount,
          userTokenAccount: params.userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([params.userKeypair])
        .rpc();

      return tx;
    });
  }

  // Fund Treasury
  public async fundTreasury(params: FundTreasuryParams): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();
    const [treasury] = this.getTreasuryPDA(ubiConfig);

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      (await this.getUbiConfig()).tokenMint,
      treasury,
      true
    );

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .fundTreasury(params.amount)
        .accounts({
          admin: params.adminKeypair.publicKey,
          ubiConfig,
          treasury,
          adminTokenAccount: params.adminTokenAccount,
          treasuryTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([params.adminKeypair])
        .rpc();

      return tx;
    });
  }

  // Report Fraud
  public async reportFraud(
    reporterKeypair: Keypair,
    reportedUser: PublicKey,
    reason: string
  ): Promise<string> {
    const [fraudDetection] = this.getFraudDetectionPDA(reportedUser);

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .reportFraud(reportedUser, reason)
        .accounts({
          reporter: reporterKeypair.publicKey,
          fraudDetection,
        })
        .signers([reporterKeypair])
        .rpc();

      return tx;
    });
  }

  // Admin Functions
  public async suspendUser(
    adminKeypair: Keypair,
    userToSuspend: PublicKey,
    suspend: boolean,
    reason: string
  ): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();
    const [userProfile] = this.getUserProfilePDA(userToSuspend);
    const [fraudDetection] = this.getFraudDetectionPDA(userToSuspend);

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .suspendUser(suspend, reason)
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig,
          userProfile,
          fraudDetection,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  public async verifyUser(
    adminKeypair: Keypair,
    userToVerify: PublicKey,
    verificationScore: number
  ): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();
    const [userProfile] = this.getUserProfilePDA(userToVerify);

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .verifyUser(verificationScore)
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig,
          userProfile,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  public async toggleProgram(adminKeypair: Keypair, active: boolean): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .toggleProgram(active)
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  public async updateUbiAmounts(
    adminKeypair: Keypair,
    newWelcomeBonus?: BN,
    newInitialUbi?: BN,
    newMonthlyUbi?: BN
  ): Promise<string> {
    const [ubiConfig] = this.getUbiConfigPDA();

    return await this.connectionManager.executeWithRetry(async (connection) => {
      const tx = await this.program.methods
        .updateUbiAmounts(
          newWelcomeBonus || null,
          newInitialUbi || null,
          newMonthlyUbi || null
        )
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    });
  }

  // Query Methods
  public async getUbiConfig(): Promise<UbiConfig> {
    const [ubiConfigPDA] = this.getUbiConfigPDA();
    return await this.program.account.ubiConfig.fetch(ubiConfigPDA);
  }

  public async getUserProfile(user: PublicKey): Promise<UserProfile | null> {
    try {
      const [userProfilePDA] = this.getUserProfilePDA(user);
      return await this.program.account.userProfile.fetch(userProfilePDA);
    } catch (error) {
      return null;
    }
  }

  public async getFraudDetection(user: PublicKey): Promise<FraudDetection | null> {
    try {
      const [fraudDetectionPDA] = this.getFraudDetectionPDA(user);
      return await this.program.account.fraudDetection.fetch(fraudDetectionPDA);
    } catch (error) {
      return null;
    }
  }

  public async getTreasury(): Promise<Treasury> {
    const [ubiConfig] = this.getUbiConfigPDA();
    const [treasuryPDA] = this.getTreasuryPDA(ubiConfig);
    return await this.program.account.treasury.fetch(treasuryPDA);
  }

  // Utility Methods
  public async canClaimInitialUbi(user: PublicKey): Promise<boolean> {
    const userProfile = await this.getUserProfile(user);
    if (!userProfile) return false;
    
    return !userProfile.initialUbiClaimed && userProfile.isVerified && !userProfile.isSuspended;
  }

  public async canClaimMonthlyUbi(user: PublicKey): Promise<boolean> {
    const userProfile = await this.getUserProfile(user);
    if (!userProfile) return false;
    
    const now = new Date().getTime() / 1000;
    const monthInSeconds = 30 * 24 * 60 * 60; // 30 days
    const timeSinceLastClaim = now - userProfile.lastMonthlyClaim.toNumber();
    
    return userProfile.initialUbiClaimed && 
           userProfile.isVerified && 
           !userProfile.isSuspended &&
           timeSinceLastClaim >= monthInSeconds;
  }

  public async getUserTokenBalance(user: PublicKey): Promise<number> {
    return await this.connectionManager.executeWithRetry(async (connection) => {
      const config = await this.getUbiConfig();
      const userTokenAccount = await getAssociatedTokenAddress(config.tokenMint, user);
      
      try {
        const balance = await connection.getTokenAccountBalance(userTokenAccount);
        return balance.value.uiAmount || 0;
      } catch (error) {
        return 0; // Account doesn't exist
      }
    });
  }

  // Event Listeners
  public onUserInitialized(callback: (event: any) => void): void {
    this.program.addEventListener('UserInitialized', callback);
  }

  public onInitialUbiClaimed(callback: (event: any) => void): void {
    this.program.addEventListener('InitialUbiClaimed', callback);
  }

  public onMonthlyUbiClaimed(callback: (event: any) => void): void {
    this.program.addEventListener('MonthlyUbiClaimed', callback);
  }

  public onFraudReported(callback: (event: any) => void): void {
    this.program.addEventListener('FraudReported', callback);
  }

  public onUserSuspended(callback: (event: any) => void): void {
    this.program.addEventListener('UserSuspended', callback);
  }

  public onUserVerified(callback: (event: any) => void): void {
    this.program.addEventListener('UserVerified', callback);
  }
}

