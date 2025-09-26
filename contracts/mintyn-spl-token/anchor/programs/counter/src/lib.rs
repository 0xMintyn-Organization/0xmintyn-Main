use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("11111111111111111111111111111112");

// Constants
const MAX_SUPPLY: u64 = 10_000_000_000_000_000_000; // 10 billion tokens (with 9 decimals)
const TOKEN_DECIMALS: u8 = 9;
const AUTHORITY_SEED: &[u8] = b"authority";
const TOKEN_CONFIG_SEED: &[u8] = b"token_config";
const MULTISIG_SEED: &[u8] = b"multisig";
const UBI_POOL_SEED: &[u8] = b"ubi_pool";
const MARKETPLACE_VAULT_SEED: &[u8] = b"marketplace_vault";
const GOVERNANCE_INTEGRATION_SEED: &[u8] = b"governance_integration";

// Integration Program IDs (to be updated with actual deployed program IDs)
pub const GOVERNANCE_PROGRAM_ID: Pubkey = pubkey!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");
pub const UBI_PROGRAM_ID: Pubkey = pubkey!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");
pub const MARKETPLACE_PROGRAM_ID: Pubkey = pubkey!("FqzkXZdwYjurnUKetJCAvaUw5WAqbwzU6gZEwydeEfqS");

#[program]
pub mod mintyn_spl_token {
    use super::*;

    /// Initialize the 0xMintyn token with comprehensive setup
    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        name: String,
        symbol: String,
        uri: String,
        max_supply: Option<u64>,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        // Validate inputs
        require!(name.len() <= 32, TokenError::NameTooLong);
        require!(symbol.len() <= 10, TokenError::SymbolTooLong);
        require!(uri.len() <= 200, TokenError::UriTooLong);
        
        let supply_cap = max_supply.unwrap_or(MAX_SUPPLY);
        require!(supply_cap <= MAX_SUPPLY, TokenError::SupplyCapTooHigh);
        
        // Initialize token configuration
        token_config.authority = ctx.accounts.authority.key();
        token_config.mint = ctx.accounts.mint.key();
        token_config.name = name.clone();
        token_config.symbol = symbol.clone();
        token_config.uri = uri;
        token_config.decimals = TOKEN_DECIMALS;
        token_config.max_supply = supply_cap;
        token_config.total_supply = 0;
        token_config.is_paused = false;
        token_config.transfer_fee_rate = 10; // 0.1% (10 basis points)
        token_config.treasury = ctx.accounts.treasury.key();
        token_config.burn_count = 0;
        token_config.transfer_restrictions = false;
        token_config.multisig_threshold = 1;
        token_config.multisig_signers = vec![ctx.accounts.authority.key()];
        token_config.bump = ctx.bumps.token_config;

        emit!(TokenInitialized {
            mint: ctx.accounts.mint.key(),
            authority: ctx.accounts.authority.key(),
            max_supply: supply_cap,
            decimals: TOKEN_DECIMALS,
            name: name.clone(),
            symbol,
        });

        Ok(())
    }

    /// Mint tokens with comprehensive validation and supply checks
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        // Validate state and permissions
        require!(!token_config.is_paused, TokenError::TokenPaused);
        require!(
            ctx.accounts.authority.key() == token_config.authority ||
            token_config.multisig_signers.contains(&ctx.accounts.authority.key()),
            TokenError::UnauthorizedMint
        );
        require!(amount > 0, TokenError::InvalidAmount);
        
        // Check supply constraints
        let new_supply = token_config.total_supply
            .checked_add(amount)
            .ok_or(TokenError::Overflow)?;
        require!(new_supply <= token_config.max_supply, TokenError::ExceedsMaxSupply);

        // Mint tokens using PDA authority
        let mint_key = ctx.accounts.mint.key();
        let authority_seeds = &[
            AUTHORITY_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let signer_seeds = &[&authority_seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        
        token::mint_to(cpi_ctx, amount)?;
        
        // Update total supply
        token_config.total_supply = new_supply;

        emit!(TokenMinted {
            mint: ctx.accounts.mint.key(),
            to: ctx.accounts.to.key(),
            amount,
            new_supply,
            authority: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Burn tokens for deflationary mechanism
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        require!(!token_config.is_paused, TokenError::TokenPaused);
        require!(amount > 0, TokenError::InvalidAmount);

        // Verify token account has sufficient balance
        require!(
            ctx.accounts.from.amount >= amount,
            TokenError::InsufficientBalance
        );

        // Burn tokens
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.from.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::burn(cpi_ctx, amount)?;
        
        // Update supply tracking
        token_config.total_supply = token_config.total_supply
            .checked_sub(amount)
            .ok_or(TokenError::Underflow)?;
        token_config.burn_count = token_config.burn_count
            .checked_add(amount)
            .ok_or(TokenError::Overflow)?;

        emit!(TokenBurned {
            mint: ctx.accounts.mint.key(),
            from: ctx.accounts.from.key(),
            amount,
            new_supply: token_config.total_supply,
            owner: ctx.accounts.owner.key(),
        });

        Ok(())
    }

    /// Transfer with restrictions and conditional logic
    pub fn transfer_with_restrictions(
        ctx: Context<TransferWithRestrictions>,
        amount: u64,
    ) -> Result<()> {
        let token_config = &ctx.accounts.token_config;
        
        require!(!token_config.is_paused, TokenError::TokenPaused);
        require!(amount > 0, TokenError::InvalidAmount);
        
        // Check if transfers are restricted
        if token_config.transfer_restrictions {
            require!(
                ctx.accounts.owner.key() == token_config.authority ||
                token_config.multisig_signers.contains(&ctx.accounts.owner.key()),
                TokenError::TransferRestricted
            );
        }

        // Verify sufficient balance
        require!(
            ctx.accounts.from.amount >= amount,
            TokenError::InsufficientBalance
        );

        // Calculate transfer fee
        let fee_amount = if token_config.transfer_fee_rate > 0 {
            amount
                .checked_mul(token_config.transfer_fee_rate as u64)
                .ok_or(TokenError::Overflow)?
            .checked_div(10000) // basis points
                .ok_or(TokenError::DivisionByZero)?
        } else {
            0
        };
        
        let transfer_amount = amount
            .checked_sub(fee_amount)
            .ok_or(TokenError::InsufficientFunds)?;

        // Execute main transfer
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, transfer_amount)?;

        // Transfer fee to treasury if applicable
        if fee_amount > 0 {
            let fee_cpi_accounts = Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            };
            let fee_cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                fee_cpi_accounts,
            );
            token::transfer(fee_cpi_ctx, fee_amount)?;
        }

        emit!(TokenTransferred {
            from: ctx.accounts.from.key(),
            to: ctx.accounts.to.key(),
            amount: transfer_amount,
            fee: fee_amount,
            owner: ctx.accounts.owner.key(),
        });

        Ok(())
    }

    /// Transfer authority with multi-signature support
    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_authority: Pubkey,
        new_multisig_threshold: u8,
        new_multisig_signers: Vec<Pubkey>,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        require!(
            ctx.accounts.authority.key() == token_config.authority,
            TokenError::UnauthorizedAuthorityTransfer
        );
        require!(new_multisig_threshold > 0, TokenError::InvalidThreshold);
        require!(
            new_multisig_signers.len() >= new_multisig_threshold as usize,
            TokenError::InsufficientSigners
        );
        require!(new_multisig_signers.len() <= 10, TokenError::TooManySigners);

        let old_authority = token_config.authority;
        token_config.authority = new_authority;
        token_config.multisig_threshold = new_multisig_threshold;
        token_config.multisig_signers = new_multisig_signers.clone();

        emit!(AuthorityTransferred {
            mint: ctx.accounts.mint.key(),
            old_authority,
            new_authority,
            multisig_threshold: new_multisig_threshold,
            multisig_signers: new_multisig_signers,
        });

        Ok(())
    }

    /// Update token metadata
    pub fn update_metadata(
        ctx: Context<UpdateMetadata>,
        name: Option<String>,
        symbol: Option<String>,
        uri: Option<String>,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        require!(
            ctx.accounts.authority.key() == token_config.authority,
            TokenError::UnauthorizedMetadataUpdate
        );

        if let Some(new_name) = name.clone() {
            require!(new_name.len() <= 32, TokenError::NameTooLong);
            token_config.name = new_name;
        }

        if let Some(new_symbol) = symbol.clone() {
            require!(new_symbol.len() <= 10, TokenError::SymbolTooLong);
            token_config.symbol = new_symbol;
        }

        if let Some(new_uri) = uri {
            require!(new_uri.len() <= 200, TokenError::UriTooLong);
            token_config.uri = new_uri;
        }

        emit!(MetadataUpdated {
            mint: ctx.accounts.mint.key(),
            authority: ctx.accounts.authority.key(),
            name,
            symbol,
        });

        Ok(())
    }

    /// Pause/unpause token operations
    pub fn set_pause_state(
        ctx: Context<SetPauseState>,
        paused: bool,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        require!(
            ctx.accounts.authority.key() == token_config.authority,
            TokenError::UnauthorizedPause
        );

        token_config.is_paused = paused;

        emit!(PauseStateChanged {
            mint: ctx.accounts.mint.key(),
            paused,
            authority: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Update transfer fee rate
    pub fn update_transfer_fee(
        ctx: Context<UpdateTransferFee>,
        new_fee_rate: u16,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        require!(
            ctx.accounts.authority.key() == token_config.authority,
            TokenError::UnauthorizedFeeUpdate
        );
        require!(new_fee_rate <= 1000, TokenError::FeeTooHigh); // Max 10%

        let old_fee_rate = token_config.transfer_fee_rate;
        token_config.transfer_fee_rate = new_fee_rate;

        emit!(TransferFeeUpdated {
            mint: ctx.accounts.mint.key(),
            old_rate: old_fee_rate,
            new_rate: new_fee_rate,
            authority: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Set transfer restrictions
    pub fn set_transfer_restrictions(
        ctx: Context<SetTransferRestrictions>,
        restricted: bool,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        require!(
            ctx.accounts.authority.key() == token_config.authority,
            TokenError::UnauthorizedRestriction
        );

        token_config.transfer_restrictions = restricted;

        emit!(TransferRestrictionsChanged {
            mint: ctx.accounts.mint.key(),
            restricted,
            authority: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    /// Get comprehensive token statistics
    pub fn get_token_stats(ctx: Context<GetTokenStats>) -> Result<TokenStats> {
        let token_config = &ctx.accounts.token_config;
        
        Ok(TokenStats {
            total_supply: token_config.total_supply,
            max_supply: token_config.max_supply,
            burn_count: token_config.burn_count,
            transfer_fee_rate: token_config.transfer_fee_rate,
            is_paused: token_config.is_paused,
            transfer_restrictions: token_config.transfer_restrictions,
            multisig_threshold: token_config.multisig_threshold,
            authority: token_config.authority,
            name: token_config.name.clone(),
            symbol: token_config.symbol.clone(),
            uri: token_config.uri.clone(),
        })
    }

    /// Initialize UBI distribution pool (integration with UBI program)
    pub fn initialize_ubi_pool(
        ctx: Context<InitializeUbiPool>,
        initial_allocation: u64,
    ) -> Result<()> {
        let token_config = &ctx.accounts.token_config;
        let ubi_pool = &mut ctx.accounts.ubi_pool;
        
        require!(
            ctx.accounts.authority.key() == token_config.authority,
            TokenError::UnauthorizedOperation
        );
        require!(initial_allocation > 0, TokenError::InvalidAmount);
        
        // Initialize UBI pool configuration
        ubi_pool.authority = ctx.accounts.authority.key();
        ubi_pool.mint = ctx.accounts.mint.key();
        ubi_pool.total_allocated = initial_allocation;
        ubi_pool.total_distributed = 0;
        ubi_pool.is_active = true;
        ubi_pool.distribution_rate = 1000; // Default 1000 tokens per distribution
        ubi_pool.bump = ctx.bumps.ubi_pool;
        
        // Mint initial allocation to UBI pool
        let mint_key = ctx.accounts.mint.key();
        let authority_seeds = &[
            AUTHORITY_SEED,
            mint_key.as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let signer_seeds = &[&authority_seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.ubi_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        
        token::mint_to(cpi_ctx, initial_allocation)?;

        emit!(UbiPoolInitialized {
            mint: ctx.accounts.mint.key(),
            authority: ctx.accounts.authority.key(),
            initial_allocation,
        });

        Ok(())
    }

    /// Distribute UBI tokens (called by UBI program via CPI)
    pub fn distribute_ubi(
        ctx: Context<DistributeUbi>,
        recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        let ubi_pool = &mut ctx.accounts.ubi_pool;
        
        // Validate caller is UBI program
        require!(
            ctx.accounts.ubi_program.key() == UBI_PROGRAM_ID,
            TokenError::UnauthorizedCaller
        );
        require!(ubi_pool.is_active, TokenError::UbiPoolInactive);
        require!(amount > 0, TokenError::InvalidAmount);
        require!(
            ubi_pool.total_distributed.checked_add(amount).unwrap_or(u64::MAX) 
            <= ubi_pool.total_allocated,
            TokenError::ExceedsUbiAllocation
        );

        // Transfer tokens from UBI pool to recipient
        let mint_key = ctx.accounts.mint.key();
        let ubi_pool_bump = ubi_pool.bump;
        let current_distributed = ubi_pool.total_distributed;
        
        let ubi_pool_seeds = &[
            UBI_POOL_SEED,
            mint_key.as_ref(),
            &[ubi_pool_bump],
        ];
        let signer_seeds = &[&ubi_pool_seeds[..]];

        let ubi_pool_info = ctx.accounts.ubi_pool.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.ubi_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ubi_pool_info,
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        
        token::transfer(cpi_ctx, amount)?;

        // Update distribution tracking
        let new_total_distributed = current_distributed
            .checked_add(amount)
            .ok_or(TokenError::Overflow)?;
        ubi_pool.total_distributed = new_total_distributed;

        emit!(UbiDistributed {
            mint: ctx.accounts.mint.key(),
            recipient,
            amount,
            total_distributed: new_total_distributed,
        });

        Ok(())
    }

    /// Initialize marketplace vault (integration with marketplace program)
    pub fn initialize_marketplace_vault(
        ctx: Context<InitializeMarketplaceVault>,
    ) -> Result<()> {
        let token_config = &ctx.accounts.token_config;
        let marketplace_vault = &mut ctx.accounts.marketplace_vault;
        
        require!(
            ctx.accounts.authority.key() == token_config.authority,
            TokenError::UnauthorizedOperation
        );
        
        marketplace_vault.authority = ctx.accounts.authority.key();
        marketplace_vault.mint = ctx.accounts.mint.key();
        marketplace_vault.total_volume = 0;
        marketplace_vault.fee_collected = 0;
        marketplace_vault.is_active = true;
        marketplace_vault.marketplace_fee_rate = 250; // 2.5% marketplace fee
        marketplace_vault.bump = ctx.bumps.marketplace_vault;

        emit!(MarketplaceVaultInitialized {
            mint: ctx.accounts.mint.key(),
            authority: ctx.accounts.authority.key(),
            fee_rate: marketplace_vault.marketplace_fee_rate,
        });

        Ok(())
    }

    /// Process marketplace payment (called by marketplace program via CPI)
    pub fn process_marketplace_payment(
        ctx: Context<ProcessMarketplacePayment>,
        buyer: Pubkey,
        seller: Pubkey,
        amount: u64,
        royalty_recipients: Vec<Pubkey>,
        royalty_amounts: Vec<u64>,
    ) -> Result<()> {
        let marketplace_vault = &mut ctx.accounts.marketplace_vault;
        
        // Validate caller is marketplace program
        require!(
            ctx.accounts.marketplace_program.key() == MARKETPLACE_PROGRAM_ID,
            TokenError::UnauthorizedCaller
        );
        require!(marketplace_vault.is_active, TokenError::MarketplaceVaultInactive);
        require!(amount > 0, TokenError::InvalidAmount);
        require!(
            royalty_recipients.len() == royalty_amounts.len(),
            TokenError::RoyaltyMismatch
        );

        // Calculate marketplace fee
        let marketplace_fee = amount
            .checked_mul(marketplace_vault.marketplace_fee_rate as u64)
            .ok_or(TokenError::Overflow)?
            .checked_div(10000)
            .ok_or(TokenError::DivisionByZero)?;

        let total_royalties: u64 = royalty_amounts.iter().sum();
        let seller_amount = amount
            .checked_sub(marketplace_fee)
            .ok_or(TokenError::InsufficientFunds)?
            .checked_sub(total_royalties)
            .ok_or(TokenError::InsufficientFunds)?;

        // Transfer to seller
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: ctx.accounts.marketplace_program.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, seller_amount)?;

        // Transfer marketplace fee
        if marketplace_fee > 0 {
            let fee_cpi_accounts = Transfer {
                from: ctx.accounts.buyer_token_account.to_account_info(),
                to: ctx.accounts.marketplace_token_account.to_account_info(),
                authority: ctx.accounts.marketplace_program.to_account_info(),
            };
            let fee_cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                fee_cpi_accounts,
            );
            token::transfer(fee_cpi_ctx, marketplace_fee)?;
        }

        // Update tracking
        marketplace_vault.total_volume = marketplace_vault.total_volume
            .checked_add(amount)
            .ok_or(TokenError::Overflow)?;
        marketplace_vault.fee_collected = marketplace_vault.fee_collected
            .checked_add(marketplace_fee)
            .ok_or(TokenError::Overflow)?;

        emit!(MarketplacePaymentProcessed {
            mint: ctx.accounts.mint.key(),
            buyer,
            seller,
            amount,
            marketplace_fee,
            total_royalties,
        });

        Ok(())
    }

    /// Enable governance control over token parameters
    pub fn governance_update_config(
        ctx: Context<GovernanceUpdateConfig>,
        new_transfer_fee_rate: Option<u16>,
        new_transfer_restrictions: Option<bool>,
        new_pause_state: Option<bool>,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        
        // Validate caller is governance program
        require!(
            ctx.accounts.governance_program.key() == GOVERNANCE_PROGRAM_ID,
            TokenError::UnauthorizedCaller
        );

        if let Some(fee_rate) = new_transfer_fee_rate {
            require!(fee_rate <= 1000, TokenError::FeeTooHigh); // Max 10%
            token_config.transfer_fee_rate = fee_rate;
        }

        if let Some(restrictions) = new_transfer_restrictions {
            token_config.transfer_restrictions = restrictions;
        }

        if let Some(paused) = new_pause_state {
            token_config.is_paused = paused;
        }

        emit!(GovernanceConfigUpdate {
            mint: ctx.accounts.mint.key(),
            governance_program: ctx.accounts.governance_program.key(),
            updated_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create a multisig transaction proposal
    pub fn create_multisig_proposal(
        ctx: Context<CreateMultisigProposal>,
        instruction_data: Vec<u8>,
        accounts: Vec<Pubkey>,
    ) -> Result<()> {
        let multisig_proposal = &mut ctx.accounts.multisig_proposal;
        let token_config = &ctx.accounts.token_config;
        
        require!(
            token_config.multisig_signers.contains(&ctx.accounts.proposer.key()),
            TokenError::UnauthorizedProposal
        );

        multisig_proposal.mint = ctx.accounts.mint.key();
        multisig_proposal.proposer = ctx.accounts.proposer.key();
        multisig_proposal.instruction_data = instruction_data;
        multisig_proposal.accounts = accounts;
        multisig_proposal.signatures = vec![];
        multisig_proposal.executed = false;
        multisig_proposal.created_at = Clock::get()?.unix_timestamp;

        let proposal_key = multisig_proposal.key();
        
        emit!(MultisigProposalCreated {
            mint: ctx.accounts.mint.key(),
            proposal: proposal_key,
            proposer: ctx.accounts.proposer.key(),
        });

        Ok(())
    }

    /// Sign a multisig proposal
    pub fn sign_multisig_proposal(
        ctx: Context<SignMultisigProposal>,
    ) -> Result<()> {
        let token_config = &ctx.accounts.token_config;
        let signer_key = ctx.accounts.signer.key();
        
        require!(
            token_config.multisig_signers.contains(&signer_key),
            TokenError::UnauthorizedSigner
        );
        
        let multisig_proposal = &mut ctx.accounts.multisig_proposal;
        require!(!multisig_proposal.executed, TokenError::ProposalAlreadyExecuted);
        require!(
            !multisig_proposal.signatures.contains(&signer_key),
            TokenError::AlreadySigned
        );

        let proposal_key = ctx.accounts.multisig_proposal.key();
        let mint_key = ctx.accounts.mint.key();
        
        multisig_proposal.signatures.push(signer_key);
        let signature_count = multisig_proposal.signatures.len() as u8;
        
        emit!(MultisigProposalSigned {
            mint: mint_key,
            proposal: proposal_key,
            signer: signer_key,
            signature_count,
        });

        Ok(())
    }

    /// Execute a multisig proposal
    pub fn execute_multisig_proposal(
        ctx: Context<ExecuteMultisigProposal>,
    ) -> Result<()> {
        let multisig_proposal = &mut ctx.accounts.multisig_proposal;
        let token_config = &ctx.accounts.token_config;
        
        require!(
            multisig_proposal.signatures.len() >= token_config.multisig_threshold as usize,
            TokenError::InsufficientSignatures
        );
        require!(!multisig_proposal.executed, TokenError::ProposalAlreadyExecuted);

        multisig_proposal.executed = true;
        multisig_proposal.executed_at = Some(Clock::get()?.unix_timestamp);

        emit!(MultisigProposalExecuted {
            mint: ctx.accounts.mint.key(),
            proposal: ctx.accounts.multisig_proposal.key(),
            executor: ctx.accounts.executor.key(),
        });

        Ok(())
    }
}

// Account Structures with proper PDA derivation

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,
    
    /// CHECK: PDA for mint authority
    #[account(
        seeds = [AUTHORITY_SEED, mint.key().as_ref()],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = authority,
        space = TokenConfig::LEN,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub treasury: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    /// CHECK: PDA for mint authority
    #[account(
        seeds = [AUTHORITY_SEED, mint.key().as_ref()],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,
    
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        mut,
        constraint = from.owner == owner.key() @ TokenError::InvalidOwner
    )]
    pub from: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferWithRestrictions<'info> {
    pub owner: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        mut,
        constraint = from.owner == owner.key() @ TokenError::InvalidOwner
    )]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        address = token_config.treasury @ TokenError::InvalidTreasury
    )]
    pub treasury: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    pub authority: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    pub authority: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

#[derive(Accounts)]
pub struct SetPauseState<'info> {
    pub authority: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

#[derive(Accounts)]
pub struct UpdateTransferFee<'info> {
    pub authority: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

#[derive(Accounts)]
pub struct SetTransferRestrictions<'info> {
    pub authority: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

#[derive(Accounts)]
pub struct GetTokenStats<'info> {
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

#[derive(Accounts)]
#[instruction(instruction_data: Vec<u8>, accounts: Vec<Pubkey>)]
pub struct CreateMultisigProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        init,
        payer = proposer,
        space = MultisigProposal::LEN,
        seeds = [MULTISIG_SEED, mint.key().as_ref(), proposer.key().as_ref()],
        bump
    )]
    pub multisig_proposal: Account<'info, MultisigProposal>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignMultisigProposal<'info> {
    pub signer: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(mut)]
    pub multisig_proposal: Account<'info, MultisigProposal>,
}

#[derive(Accounts)]
pub struct ExecuteMultisigProposal<'info> {
    pub executor: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(mut)]
    pub multisig_proposal: Account<'info, MultisigProposal>,
}

#[derive(Accounts)]
pub struct InitializeUbiPool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    /// CHECK: PDA for mint authority
    #[account(
        seeds = [AUTHORITY_SEED, mint.key().as_ref()],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,
    
    #[account(
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        init,
        payer = authority,
        space = UbiPool::LEN,
        seeds = [UBI_POOL_SEED, mint.key().as_ref()],
        bump
    )]
    pub ubi_pool: Account<'info, UbiPool>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = ubi_pool,
    )]
    pub ubi_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeUbi<'info> {
    /// CHECK: UBI program making the CPI call
    pub ubi_program: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [UBI_POOL_SEED, mint.key().as_ref()],
        bump = ubi_pool.bump
    )]
    pub ubi_pool: Account<'info, UbiPool>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = ubi_pool,
    )]
    pub ubi_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct InitializeMarketplaceVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        init,
        payer = authority,
        space = MarketplaceVault::LEN,
        seeds = [MARKETPLACE_VAULT_SEED, mint.key().as_ref()],
        bump
    )]
    pub marketplace_vault: Account<'info, MarketplaceVault>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessMarketplacePayment<'info> {
    /// CHECK: Marketplace program making the CPI call
    pub marketplace_program: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [MARKETPLACE_VAULT_SEED, mint.key().as_ref()],
        bump = marketplace_vault.bump
    )]
    pub marketplace_vault: Account<'info, MarketplaceVault>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = marketplace_vault,
    )]
    pub marketplace_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GovernanceUpdateConfig<'info> {
    /// CHECK: Governance program making the CPI call
    pub governance_program: Signer<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED, mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,
}

// Data Structures

#[account]
pub struct TokenConfig {
    pub authority: Pubkey,                  // 32
    pub mint: Pubkey,                      // 32
    pub name: String,                      // 4 + 32 = 36
    pub symbol: String,                    // 4 + 10 = 14
    pub uri: String,                       // 4 + 200 = 204
    pub decimals: u8,                      // 1
    pub max_supply: u64,                   // 8
    pub total_supply: u64,                 // 8
    pub burn_count: u64,                   // 8
    pub transfer_fee_rate: u16,            // 2 (basis points)
    pub treasury: Pubkey,                  // 32
    pub is_paused: bool,                   // 1
    pub transfer_restrictions: bool,        // 1
    pub multisig_threshold: u8,            // 1
    pub multisig_signers: Vec<Pubkey>,     // 4 + (32 * 10) = 324 (max 10 signers)
    pub bump: u8,                          // 1
}

impl TokenConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // mint
        36 + // name
        14 + // symbol
        204 + // uri
        1 + // decimals
        8 + // max_supply
        8 + // total_supply
        8 + // burn_count
        2 + // transfer_fee_rate
        32 + // treasury
        1 + // is_paused
        1 + // transfer_restrictions
        1 + // multisig_threshold
        324 + // multisig_signers
        1; // bump
}

#[account]
pub struct MultisigProposal {
    pub mint: Pubkey,                      // 32
    pub proposer: Pubkey,                  // 32
    pub instruction_data: Vec<u8>,         // 4 + 1000 = 1004
    pub accounts: Vec<Pubkey>,             // 4 + (32 * 20) = 644 (max 20 accounts)
    pub signatures: Vec<Pubkey>,           // 4 + (32 * 10) = 324 (max 10 signatures)
    pub executed: bool,                    // 1
    pub created_at: i64,                   // 8
    pub executed_at: Option<i64>,          // 1 + 8 = 9
}

impl MultisigProposal {
    pub const LEN: usize = 8 + // discriminator
        32 + // mint
        32 + // proposer
        1004 + // instruction_data
        644 + // accounts
        324 + // signatures
        1 + // executed
        8 + // created_at
        9; // executed_at
}

#[account]
pub struct UbiPool {
    pub authority: Pubkey,                  // 32
    pub mint: Pubkey,                      // 32
    pub total_allocated: u64,              // 8
    pub total_distributed: u64,            // 8
    pub distribution_rate: u64,            // 8
    pub is_active: bool,                   // 1
    pub bump: u8,                          // 1
}

impl UbiPool {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct MarketplaceVault {
    pub authority: Pubkey,                  // 32
    pub mint: Pubkey,                      // 32
    pub total_volume: u64,                 // 8
    pub fee_collected: u64,                // 8
    pub marketplace_fee_rate: u16,         // 2 (basis points)
    pub is_active: bool,                   // 1
    pub bump: u8,                          // 1
}

impl MarketplaceVault {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 2 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TokenStats {
    pub total_supply: u64,
    pub max_supply: u64,
    pub burn_count: u64,
    pub transfer_fee_rate: u16,
    pub is_paused: bool,
    pub transfer_restrictions: bool,
    pub multisig_threshold: u8,
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

// Events

#[event]
pub struct TokenInitialized {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub max_supply: u64,
    pub decimals: u8,
    pub name: String,
    pub symbol: String,
}

#[event]
pub struct TokenMinted {
    pub mint: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub new_supply: u64,
    pub authority: Pubkey,
}

#[event]
pub struct TokenBurned {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub amount: u64,
    pub new_supply: u64,
    pub owner: Pubkey,
}

#[event]
pub struct TokenTransferred {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub owner: Pubkey,
}

#[event]
pub struct AuthorityTransferred {
    pub mint: Pubkey,
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
    pub multisig_threshold: u8,
    pub multisig_signers: Vec<Pubkey>,
}

#[event]
pub struct MetadataUpdated {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub name: Option<String>,
    pub symbol: Option<String>,
}

#[event]
pub struct PauseStateChanged {
    pub mint: Pubkey,
    pub paused: bool,
    pub authority: Pubkey,
}

#[event]
pub struct TransferFeeUpdated {
    pub mint: Pubkey,
    pub old_rate: u16,
    pub new_rate: u16,
    pub authority: Pubkey,
}

#[event]
pub struct TransferRestrictionsChanged {
    pub mint: Pubkey,
    pub restricted: bool,
    pub authority: Pubkey,
}

#[event]
pub struct MultisigProposalCreated {
    pub mint: Pubkey,
    pub proposal: Pubkey,
    pub proposer: Pubkey,
}

#[event]
pub struct MultisigProposalSigned {
    pub mint: Pubkey,
    pub proposal: Pubkey,
    pub signer: Pubkey,
    pub signature_count: u8,
}

#[event]
pub struct MultisigProposalExecuted {
    pub mint: Pubkey,
    pub proposal: Pubkey,
    pub executor: Pubkey,
}

#[event]
pub struct UbiPoolInitialized {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub initial_allocation: u64,
}

#[event]
pub struct UbiDistributed {
    pub mint: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub total_distributed: u64,
}

#[event]
pub struct MarketplaceVaultInitialized {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub fee_rate: u16,
}

#[event]
pub struct MarketplacePaymentProcessed {
    pub mint: Pubkey,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub amount: u64,
    pub marketplace_fee: u64,
    pub total_royalties: u64,
}

#[event]
pub struct GovernanceConfigUpdate {
    pub mint: Pubkey,
    pub governance_program: Pubkey,
    pub updated_at: i64,
}

// Comprehensive Error Types

#[error_code]
pub enum TokenError {
    #[msg("Token operations are currently paused")]
    TokenPaused,
    
    #[msg("Unauthorized mint operation")]
    UnauthorizedMint,
    
    #[msg("Arithmetic overflow occurred")]
    Overflow,
    
    #[msg("Arithmetic underflow occurred")]
    Underflow,
    
    #[msg("Division by zero")]
    DivisionByZero,
    
    #[msg("Insufficient funds for operation")]
    InsufficientFunds,
    
    #[msg("Insufficient token balance")]
    InsufficientBalance,
    
    #[msg("Transfer operations are restricted")]
    TransferRestricted,
    
    #[msg("Unauthorized pause operation")]
    UnauthorizedPause,
    
    #[msg("Unauthorized fee update")]
    UnauthorizedFeeUpdate,
    
    #[msg("Fee rate too high (max 10%)")]
    FeeTooHigh,
    
    #[msg("Unauthorized restriction change")]
    UnauthorizedRestriction,
    
    #[msg("Unauthorized authority transfer")]
    UnauthorizedAuthorityTransfer,
    
    #[msg("Unauthorized metadata update")]
    UnauthorizedMetadataUpdate,
    
    #[msg("Token name too long (max 32 characters)")]
    NameTooLong,
    
    #[msg("Token symbol too long (max 10 characters)")]
    SymbolTooLong,
    
    #[msg("Token URI too long (max 200 characters)")]
    UriTooLong,
    
    #[msg("Supply cap exceeds maximum allowed (10 billion)")]
    SupplyCapTooHigh,
    
    #[msg("Minting would exceed maximum supply")]
    ExceedsMaxSupply,
    
    #[msg("Invalid amount (must be greater than 0)")]
    InvalidAmount,
    
    #[msg("Invalid token account owner")]
    InvalidOwner,
    
    #[msg("Invalid treasury account")]
    InvalidTreasury,
    
    #[msg("Invalid multisig threshold")]
    InvalidThreshold,
    
    #[msg("Insufficient signers for multisig threshold")]
    InsufficientSigners,
    
    #[msg("Too many signers (max 10)")]
    TooManySigners,
    
    #[msg("Unauthorized proposal creation")]
    UnauthorizedProposal,
    
    #[msg("Unauthorized signer")]
    UnauthorizedSigner,
    
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    
    #[msg("Already signed this proposal")]
    AlreadySigned,
    
    #[msg("Insufficient signatures for execution")]
    InsufficientSignatures,
    
    #[msg("Unauthorized operation")]
    UnauthorizedOperation,
    
    #[msg("Unauthorized caller program")]
    UnauthorizedCaller,
    
    #[msg("UBI pool is inactive")]
    UbiPoolInactive,
    
    #[msg("Exceeds UBI allocation")]
    ExceedsUbiAllocation,
    
    #[msg("Marketplace vault is inactive")]
    MarketplaceVaultInactive,
    
    #[msg("Royalty recipients and amounts mismatch")]
    RoyaltyMismatch,
    
    #[msg("UBI pool already initialized")]
    UbiPoolAlreadyInitialized,
    
    #[msg("Marketplace vault already initialized")]
    MarketplaceVaultAlreadyInitialized,
}