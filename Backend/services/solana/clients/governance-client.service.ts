import { BaseProgramClientService } from './base-program-client.service';
import { SolanaConnectionManager } from '../connection.service';
import { PublicKey } from '@solana/web3.js';

export class GovernanceClientService extends BaseProgramClientService {
  constructor(connectionManager: SolanaConnectionManager, programId: string) {
    super(connectionManager, programId, '../../../idl/governance.json');
  }

  // Governance specific methods
  async getGovernanceConfig() {
    try {
      const [governancePda] = await PublicKey.findProgramAddress(
        [Buffer.from('governance')],
        new PublicKey(this.programId)
      );
      return await this.program.account.governanceConfig.fetch(governancePda);
    } catch (error) {
      console.error('Error fetching governance config:', error);
      return null;
    }
  }

  async getActiveProposals() {
    try {
      return await this.program.account.proposal.all([
        {
          memcmp: {
            offset: 8 + 8 + 32 + 104 + 1004 + 1004 + 644 + 8 + 8 + 8 + 8, // offset to state field
            bytes: 'Active'
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching active proposals:', error);
      return [];
    }
  }

  async getProposalsByProposer(proposer: PublicKey) {
    try {
      return await this.program.account.proposal.all([
        {
          memcmp: {
            offset: 8 + 8, // offset to proposer field
            bytes: proposer.toBase58()
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching proposer proposals:', error);
      return [];
    }
  }

  async getVotingPower(user: PublicKey) {
    try {
      const [stakeAccountPda] = await PublicKey.findProgramAddress(
        [Buffer.from('stake_account'), user.toBuffer()],
        new PublicKey(this.programId)
      );
      const stakeAccount = await this.program.account.stakeAccount.fetch(stakeAccountPda);
      return stakeAccount.stakedAmount;
    } catch (error) {
      console.error('Error fetching voting power:', error);
      return 0;
    }
  }

  async getUserVotes(user: PublicKey) {
    try {
      return await this.program.account.voteRecord.all([
        {
          memcmp: {
            offset: 8, // offset to voter field
            bytes: user.toBase58()
          }
        }
      ]);
    } catch (error) {
      console.error('Error fetching user votes:', error);
      return [];
    }
  }

  async getDelegationInfo(user: PublicKey) {
    try {
      const [delegationPda] = await PublicKey.findProgramAddress(
        [Buffer.from('delegation'), user.toBuffer()],
        new PublicKey(this.programId)
      );
      return await this.program.account.delegation.fetch(delegationPda);
    } catch (error) {
      console.error('Error fetching delegation info:', error);
      return null;
    }
  }

  // Event listeners
  onProposalCreated(callback: (event: any) => void) {
    this.program.addEventListener('ProposalCreated', callback);
  }

  onVoteCast(callback: (event: any) => void) {
    this.program.addEventListener('VoteCast', callback);
  }

  onProposalExecuted(callback: (event: any) => void) {
    this.program.addEventListener('ProposalExecuted', callback);
  }

  onTokensStaked(callback: (event: any) => void) {
    this.program.addEventListener('TokensStaked', callback);
  }

  onVoteDelegated(callback: (event: any) => void) {
    this.program.addEventListener('VoteDelegated', callback);
  }
}
