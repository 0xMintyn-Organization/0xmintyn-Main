import { PublicKey, Keypair, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { getConnectionPool } from './connection';
import UbiProgramIdl from '@/lib/idl/ubi_program.json';

// Helper function to get associated token address (since it's not available in this SPL Token version)
function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey, allowOwnerOffCurve = false): PublicKey {
  const seeds = [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()];
  const [address] = PublicKey.findProgramAddressSync(seeds, TOKEN_PROGRAM_ID);
  return address;
}

// Types
export interface UbiConfig {
  admin: PublicKey;
  tokenMint: PublicKey;
  welcomeBonusAmount: BN;
  initialUbiAmount: BN;
  monthlyUbiAmount: BN;
  maxUsers: number;
  totalUsers: number;
  totalDistributed: BN;
  isActive: boolean;
  createdAt: BN;
  bump: number;
}

export interface UserProfile {
  user: PublicKey;
  identityHash: number[];
  registeredAt: BN;
  welcomeBonusClaimed: boolean;
  initialUbiClaimed: boolean;
  lastMonthlyClaim: BN;
  totalClaimed: BN;
  isVerified: boolean;
  isSuspended: boolean;
  referralCode: string | null;
  verificationScore: number;
  bump: number;
}

export interface FraudDetection {
  user: PublicKey;
  identityHash: number[];
  registrationTimestamp: BN;
  verificationAttempts: number;
  isFlagged: boolean;
  riskScore: number;
  lastActivity: BN;
  bump: number;
}

export interface Treasury {
  authority: PublicKey;
  tokenMint: PublicKey;
  totalFunded: BN;
  totalDistributed: BN;
  bump: number;
}

export interface InitializeUserParams {
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

export interface ReportFraudParams {
  reporterKeypair: Keypair;
  reportedUser: PublicKey;
  reason: string;
}

export interface VerifyUserParams {
  adminKeypair: Keypair;
  userToVerify: PublicKey;
  verificationScore: number;
}

export interface SuspendUserParams {
  adminKeypair: Keypair;
  userToSuspend: PublicKey;
  suspend: boolean;
  reason: string;
}

export interface UpdateUbiAmountsParams {
  adminKeypair: Keypair;
  welcomeBonus?: BN;
  initialUbi?: BN;
  monthlyUbi?: BN;
}

// UBI Service Class
export class UbiService {
  private program: Program<Idl>;
  private connectionPool = getConnectionPool();
  private programId: PublicKey;

  constructor(provider: AnchorProvider) {
    this.programId = new PublicKey(process.env.NEXT_PUBLIC_UBI_PROGRAM_ID || UbiProgramIdl.address);
    this.program = new Program(UbiProgramIdl as Idl, this.programId, provider);
  }

  // PDA derivation helpers
  private getUbiConfigPda(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('ubi_config')],
      this.programId
    );
  }

  private getUserProfilePda(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user_profile'), user.toBuffer()],
      this.programId
    );
  }

  private getFraudDetectionPda(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('fraud_detection'), user.toBuffer()],
      this.programId
    );
  }

  private getTreasuryPda(): [PublicKey, number] {
    const [ubiConfigPda] = this.getUbiConfigPda();
    return PublicKey.findProgramAddressSync(
      [Buffer.from('ubi_treasury'), ubiConfigPda.toBuffer()],
      this.programId
    );
  }

  // Get UBI configuration
  async getUbiConfig(): Promise<UbiConfig | null> {
    try {
      const [ubiConfigPda] = this.getUbiConfigPda();
      const config = await this.program.account.ubiConfig.fetch(ubiConfigPda);
      return config as UbiConfig;
    } catch (error) {
      console.error('Failed to fetch UBI config:', error);
      return null;
    }
  }

  // Get user profile
  async getUserProfile(user: PublicKey): Promise<UserProfile | null> {
    try {
      const [userProfilePda] = this.getUserProfilePda(user);
      const profile = await this.program.account.userProfile.fetch(userProfilePda);
      return profile as UserProfile;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  }

  // Get fraud detection data
  async getFraudDetection(user: PublicKey): Promise<FraudDetection | null> {
    try {
      const [fraudDetectionPda] = this.getFraudDetectionPda(user);
      const fraudDetection = await this.program.account.fraudDetection.fetch(fraudDetectionPda);
      return fraudDetection as FraudDetection;
    } catch (error) {
      console.error('Failed to fetch fraud detection:', error);
      return null;
    }
  }

  // Get treasury information
  async getTreasury(): Promise<Treasury | null> {
    try {
      const [treasuryPda] = this.getTreasuryPda();
      const treasury = await this.program.account.treasury.fetch(treasuryPda);
      return treasury as Treasury;
    } catch (error) {
      console.error('Failed to fetch treasury:', error);
      return null;
    }
  }

  // Get user token balance
  async getUserTokenBalance(user: PublicKey): Promise<number> {
    try {
      const config = await this.getUbiConfig();
      if (!config) return 0;

      const tokenAccount = await getAssociatedTokenAddress(config.tokenMint, user);
      const accountInfo = await this.connectionPool.getAccountInfo(tokenAccount);
      
      if (!accountInfo) return 0;
      
      // Parse token account data to get balance
      // This is a simplified version - in production you'd use proper token account parsing
      return 0; // Placeholder
    } catch (error) {
      console.error('Failed to get user token balance:', error);
      return 0;
    }
  }

  // Check if user can claim initial UBI
  async canClaimInitialUbi(user: PublicKey): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(user);
      if (!profile) return false;

      return !profile.initialUbiClaimed && profile.isVerified && !profile.isSuspended;
    } catch (error) {
      console.error('Failed to check initial UBI eligibility:', error);
      return false;
    }
  }

  // Check if user can claim monthly UBI
  async canClaimMonthlyUbi(user: PublicKey): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(user);
      if (!profile) return false;

      if (!profile.initialUbiClaimed || !profile.isVerified || profile.isSuspended) {
        return false;
      }

      // Check if enough time has passed since last claim
      const now = new BN(Math.floor(Date.now() / 1000));
      const monthInSeconds = new BN(30 * 24 * 60 * 60); // 30 days
      
      return now.sub(profile.lastMonthlyClaim).gte(monthInSeconds);
    } catch (error) {
      console.error('Failed to check monthly UBI eligibility:', error);
      return false;
    }
  }

  // Initialize new user
  async initializeUser(params: InitializeUserParams): Promise<string> {
    try {
      const { userKeypair, identityHash, referralCode } = params;
      
      const [ubiConfigPda] = this.getUbiConfigPda();
      const [userProfilePda, userProfileBump] = this.getUserProfilePda(userKeypair.publicKey);
      const [fraudDetectionPda, fraudDetectionBump] = this.getFraudDetectionPda(userKeypair.publicKey);
      const [treasuryPda] = this.getTreasuryPda();

      const config = await this.getUbiConfig();
      if (!config) throw new Error('UBI config not found');

      const treasuryTokenAccount = await getAssociatedTokenAddress(config.tokenMint, treasuryPda, true);
      const userTokenAccount = await getAssociatedTokenAddress(config.tokenMint, userKeypair.publicKey);

      const tx = await this.program.methods
        .initializeUser(identityHash, referralCode || null)
        .accounts({
          user: userKeypair.publicKey,
          ubiConfig: ubiConfigPda,
          userProfile: userProfilePda,
          fraudDetection: fraudDetectionPda,
          treasury: treasuryPda,
          treasuryTokenAccount,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to initialize user:', error);
      throw error;
    }
  }

  // Claim initial UBI
  async claimInitialUbi(params: ClaimUbiParams): Promise<string> {
    try {
      const { userKeypair, userTokenAccount } = params;
      
      const [ubiConfigPda] = this.getUbiConfigPda();
      const [userProfilePda] = this.getUserProfilePda(userKeypair.publicKey);
      const [fraudDetectionPda] = this.getFraudDetectionPda(userKeypair.publicKey);
      const [treasuryPda] = this.getTreasuryPda();

      const config = await this.getUbiConfig();
      if (!config) throw new Error('UBI config not found');

      const treasuryTokenAccount = await getAssociatedTokenAddress(config.tokenMint, treasuryPda, true);

      const tx = await this.program.methods
        .claimInitialUbi()
        .accounts({
          user: userKeypair.publicKey,
          ubiConfig: ubiConfigPda,
          userProfile: userProfilePda,
          fraudDetection: fraudDetectionPda,
          treasury: treasuryPda,
          treasuryTokenAccount,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([userKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to claim initial UBI:', error);
      throw error;
    }
  }

  // Claim monthly UBI
  async claimMonthlyUbi(params: ClaimUbiParams): Promise<string> {
    try {
      const { userKeypair, userTokenAccount } = params;
      
      const [ubiConfigPda] = this.getUbiConfigPda();
      const [userProfilePda] = this.getUserProfilePda(userKeypair.publicKey);
      const [fraudDetectionPda] = this.getFraudDetectionPda(userKeypair.publicKey);
      const [treasuryPda] = this.getTreasuryPda();

      const config = await this.getUbiConfig();
      if (!config) throw new Error('UBI config not found');

      const treasuryTokenAccount = await getAssociatedTokenAddress(config.tokenMint, treasuryPda, true);

      const tx = await this.program.methods
        .claimMonthlyUbi()
        .accounts({
          user: userKeypair.publicKey,
          ubiConfig: ubiConfigPda,
          userProfile: userProfilePda,
          fraudDetection: fraudDetectionPda,
          treasury: treasuryPda,
          treasuryTokenAccount,
          userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([userKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to claim monthly UBI:', error);
      throw error;
    }
  }

  // Report fraud
  async reportFraud(params: ReportFraudParams): Promise<string> {
    try {
      const { reporterKeypair, reportedUser, reason } = params;
      
      const [fraudDetectionPda] = this.getFraudDetectionPda(reportedUser);

      const tx = await this.program.methods
        .reportFraud(reportedUser, reason)
        .accounts({
          reporter: reporterKeypair.publicKey,
          fraudDetection: fraudDetectionPda,
        })
        .signers([reporterKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to report fraud:', error);
      throw error;
    }
  }

  // Admin functions

  // Fund treasury
  async fundTreasury(params: FundTreasuryParams): Promise<string> {
    try {
      const { adminKeypair, amount, adminTokenAccount } = params;
      
      const [ubiConfigPda] = this.getUbiConfigPda();
      const [treasuryPda] = this.getTreasuryPda();

      const config = await this.getUbiConfig();
      if (!config) throw new Error('UBI config not found');

      const treasuryTokenAccount = await getAssociatedTokenAddress(config.tokenMint, treasuryPda, true);

      const tx = await this.program.methods
        .fundTreasury(amount)
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig: ubiConfigPda,
          treasury: treasuryPda,
          adminTokenAccount,
          treasuryTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to fund treasury:', error);
      throw error;
    }
  }

  // Verify user
  async verifyUser(params: VerifyUserParams): Promise<string> {
    try {
      const { adminKeypair, userToVerify, verificationScore } = params;
      
      const [ubiConfigPda] = this.getUbiConfigPda();
      const [userProfilePda] = this.getUserProfilePda(userToVerify);

      const tx = await this.program.methods
        .verifyUser(verificationScore)
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig: ubiConfigPda,
          userProfile: userProfilePda,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to verify user:', error);
      throw error;
    }
  }

  // Suspend/unsuspend user
  async suspendUser(params: SuspendUserParams): Promise<string> {
    try {
      const { adminKeypair, userToSuspend, suspend, reason } = params;
      
      const [ubiConfigPda] = this.getUbiConfigPda();
      const [userProfilePda] = this.getUserProfilePda(userToSuspend);
      const [fraudDetectionPda] = this.getFraudDetectionPda(userToSuspend);

      const tx = await this.program.methods
        .suspendUser(suspend, reason)
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig: ubiConfigPda,
          userProfile: userProfilePda,
          fraudDetection: fraudDetectionPda,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to suspend user:', error);
      throw error;
    }
  }

  // Toggle program active state
  async toggleProgram(adminKeypair: Keypair, active: boolean): Promise<string> {
    try {
      const [ubiConfigPda] = this.getUbiConfigPda();

      const tx = await this.program.methods
        .toggleProgram(active)
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig: ubiConfigPda,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to toggle program:', error);
      throw error;
    }
  }

  // Update UBI amounts
  async updateUbiAmounts(params: UpdateUbiAmountsParams): Promise<string> {
    try {
      const { adminKeypair, welcomeBonus, initialUbi, monthlyUbi } = params;
      
      const [ubiConfigPda] = this.getUbiConfigPda();

      const tx = await this.program.methods
        .updateUbiAmounts(welcomeBonus || null, initialUbi || null, monthlyUbi || null)
        .accounts({
          admin: adminKeypair.publicKey,
          ubiConfig: ubiConfigPda,
        })
        .signers([adminKeypair])
        .rpc();

      return tx;
    } catch (error) {
      console.error('Failed to update UBI amounts:', error);
      throw error;
    }
  }

  // Event listeners
  async listenToEvents(callback: (event: any) => void): Promise<void> {
    try {
      this.program.addEventListener('UserInitialized', callback);
      this.program.addEventListener('InitialUbiClaimed', callback);
      this.program.addEventListener('MonthlyUbiClaimed', callback);
      this.program.addEventListener('FraudReported', callback);
      this.program.addEventListener('UserVerified', callback);
      this.program.addEventListener('UserSuspended', callback);
    } catch (error) {
      console.error('Failed to set up event listeners:', error);
      throw error;
    }
  }

  // Remove event listeners
  async removeEventListeners(): Promise<void> {
    try {
      this.program.removeEventListener('UserInitialized');
      this.program.removeEventListener('InitialUbiClaimed');
      this.program.removeEventListener('MonthlyUbiClaimed');
      this.program.removeEventListener('FraudReported');
      this.program.removeEventListener('UserVerified');
      this.program.removeEventListener('UserSuspended');
    } catch (error) {
      console.error('Failed to remove event listeners:', error);
    }
  }
}

export default UbiService;
