use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("3wwzXoF3tK7Y97uyaGWdAv1SjTaw9edCeP7tYfMczfKL");

// Constants
const MARKETPLACE_FEE_BPS: u16 = 250; // 2.5% marketplace fee
const MAX_ROYALTY_BPS: u16 = 1000; // 10% max creator royalty
const ESCROW_DURATION: i64 = 7 * 24 * 60 * 60; // 7 days
const DISPUTE_RESOLUTION_PERIOD: i64 = 14 * 24 * 60 * 60; // 14 days

// Seeds for PDAs
const MARKETPLACE_SEED: &[u8] = b"marketplace";
const PRODUCT_SEED: &[u8] = b"product";
const PURCHASE_SEED: &[u8] = b"purchase";
const ESCROW_SEED: &[u8] = b"escrow";
const CREATOR_PROFILE_SEED: &[u8] = b"creator_profile";
const DISPUTE_SEED: &[u8] = b"dispute";

#[program]
pub mod marketplace {
    use super::*;

    /// Initialize the marketplace
    pub fn initialize_marketplace(
        ctx: Context<InitializeMarketplace>,
        admin: Pubkey,
        treasury: Pubkey,
        fee_bps: u16,
    ) -> Result<()> {
        let marketplace = &mut ctx.accounts.marketplace;
        
        require!(fee_bps <= 1000, MarketplaceError::InvalidFee); // Max 10% fee
        
        marketplace.admin = admin;
        marketplace.treasury = treasury;
        marketplace.fee_bps = fee_bps;
        marketplace.total_products = 0;
        marketplace.total_sales = 0;
        marketplace.total_volume = 0;
        marketplace.is_active = true;
        marketplace.created_at = Clock::get()?.unix_timestamp;
        marketplace.bump = ctx.bumps.marketplace;

        emit!(MarketplaceInitialized {
            admin,
            treasury,
            fee_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create creator profile
    pub fn create_creator_profile(
        ctx: Context<CreateCreatorProfile>,
        name: String,
        description: String,
        image_uri: String,
        external_url: Option<String>,
        royalty_bps: u16,
    ) -> Result<()> {
        require!(name.len() <= 64, MarketplaceError::NameTooLong);
        require!(description.len() <= 256, MarketplaceError::DescriptionTooLong);
        require!(royalty_bps <= MAX_ROYALTY_BPS, MarketplaceError::InvalidRoyalty);
        
        let creator_profile = &mut ctx.accounts.creator_profile;
        
        creator_profile.creator = ctx.accounts.creator.key();
        creator_profile.name = name;
        creator_profile.description = description;
        creator_profile.image_uri = image_uri;
        creator_profile.external_url = external_url;
        creator_profile.royalty_bps = royalty_bps;
        creator_profile.total_products = 0;
        creator_profile.total_sales = 0;
        creator_profile.total_earnings = 0;
        creator_profile.is_verified = false;
        creator_profile.created_at = Clock::get()?.unix_timestamp;
        creator_profile.bump = ctx.bumps.creator_profile;

        emit!(CreatorProfileCreated {
            creator: ctx.accounts.creator.key(),
            name: creator_profile.name.clone(),
            royalty_bps,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// List a digital product
    pub fn list_product(
        ctx: Context<ListProduct>,
        name: String,
        description: String,
        image_uri: String,
        price: u64,
        category: ProductCategory,
        metadata_uri: String,
        is_digital: bool,
        max_supply: Option<u32>,
    ) -> Result<()> {
        require!(name.len() <= 64, MarketplaceError::NameTooLong);
        require!(description.len() <= 512, MarketplaceError::DescriptionTooLong);
        require!(price > 0, MarketplaceError::InvalidPrice);
        
        let product = &mut ctx.accounts.product;
        let marketplace = &mut ctx.accounts.marketplace;
        let creator_profile = &mut ctx.accounts.creator_profile;
        
        product.creator = ctx.accounts.creator.key();
        product.name = name;
        product.description = description;
        product.image_uri = image_uri;
        product.price = price;
        product.category = category.clone();
        product.metadata_uri = metadata_uri;
        product.is_digital = is_digital;
        product.max_supply = max_supply;
        product.current_supply = 0;
        product.total_sales = 0;
        product.is_active = true;
        product.created_at = Clock::get()?.unix_timestamp;
        product.updated_at = Clock::get()?.unix_timestamp;
        product.bump = ctx.bumps.product;

        // Update counters
        marketplace.total_products = marketplace.total_products
            .checked_add(1)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        
        creator_profile.total_products = creator_profile.total_products
            .checked_add(1)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;

        emit!(ProductListed {
            product_id: product.key(),
            creator: ctx.accounts.creator.key(),
            name: product.name.clone(),
            price,
            category: category.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Purchase a product with escrow
    pub fn purchase_product(
        ctx: Context<PurchaseProduct>,
        quantity: u32,
    ) -> Result<()> {
        require!(quantity > 0, MarketplaceError::InvalidQuantity);
        
        let product = &ctx.accounts.product;
        let purchase = &mut ctx.accounts.purchase;
        let escrow = &mut ctx.accounts.escrow;
        let marketplace = &ctx.accounts.marketplace;
        
        require!(product.is_active, MarketplaceError::ProductNotActive);
        
        // Check supply limits
        if let Some(max_supply) = product.max_supply {
            require!(
                product.current_supply
                    .checked_add(quantity)
                    .ok_or(MarketplaceError::ArithmeticOverflow)? <= max_supply,
                MarketplaceError::InsufficientSupply
            );
        }
        
        let total_amount = product.price
            .checked_mul(quantity as u64)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        
        let marketplace_fee = total_amount
            .checked_mul(marketplace.fee_bps as u64)
            .ok_or(MarketplaceError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        
        // Initialize purchase record
        purchase.buyer = ctx.accounts.buyer.key();
        purchase.product = product.key();
        purchase.quantity = quantity;
        purchase.total_amount = total_amount;
        purchase.marketplace_fee = marketplace_fee;
        purchase.status = PurchaseStatus::Pending;
        purchase.created_at = Clock::get()?.unix_timestamp;
        purchase.bump = ctx.bumps.purchase;

        // Initialize escrow
        escrow.purchase = purchase.key();
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = product.creator;
        escrow.amount = total_amount;
        escrow.status = EscrowStatus::Funded;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.expires_at = Clock::get()?.unix_timestamp + ESCROW_DURATION;
        escrow.bump = ctx.bumps.escrow;

        // Transfer funds to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, total_amount)?;

        emit!(ProductPurchased {
            purchase_id: purchase.key(),
            buyer: ctx.accounts.buyer.key(),
            product_id: product.key(),
            quantity,
            total_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Confirm delivery and release escrow
    pub fn confirm_delivery(
        ctx: Context<ConfirmDelivery>,
    ) -> Result<()> {
        let purchase = &mut ctx.accounts.purchase;
        let escrow = &mut ctx.accounts.escrow;
        let product = &mut ctx.accounts.product;
        let marketplace = &mut ctx.accounts.marketplace;
        let creator_profile = &mut ctx.accounts.creator_profile;
        
        require!(
            ctx.accounts.buyer.key() == purchase.buyer,
            MarketplaceError::UnauthorizedBuyer
        );
        require!(
            purchase.status == PurchaseStatus::Pending,
            MarketplaceError::InvalidPurchaseStatus
        );
        require!(
            escrow.status == EscrowStatus::Funded,
            MarketplaceError::InvalidEscrowStatus
        );
        
        // Calculate amounts
        let creator_royalty = purchase.total_amount
            .checked_mul(creator_profile.royalty_bps as u64)
            .ok_or(MarketplaceError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        
        let seller_amount = purchase.total_amount
            .checked_sub(purchase.marketplace_fee)
            .ok_or(MarketplaceError::ArithmeticOverflow)?
            .checked_sub(creator_royalty)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;

        // Update states
        purchase.status = PurchaseStatus::Completed;
        purchase.completed_at = Some(Clock::get()?.unix_timestamp);
        
        escrow.status = EscrowStatus::Released;
        escrow.released_at = Some(Clock::get()?.unix_timestamp);
        
        // Update product stats
        product.total_sales = product.total_sales
            .checked_add(purchase.quantity as u64)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        product.current_supply = product.current_supply
            .checked_add(purchase.quantity)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        
        // Update marketplace stats
        marketplace.total_sales = marketplace.total_sales
            .checked_add(1)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        marketplace.total_volume = marketplace.total_volume
            .checked_add(purchase.total_amount)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        
        // Update creator stats
        creator_profile.total_sales = creator_profile.total_sales
            .checked_add(1)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        creator_profile.total_earnings = creator_profile.total_earnings
            .checked_add(seller_amount)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;

        // Release funds using escrow PDA as authority
        let purchase_key = purchase.key();
        let escrow_seeds = &[
            ESCROW_SEED,
            purchase_key.as_ref(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&escrow_seeds[..]];

        // Transfer to seller
        let seller_transfer = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let seller_cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            seller_transfer,
            signer_seeds,
        );
        token::transfer(seller_cpi_ctx, seller_amount)?;

        // Transfer marketplace fee to treasury
        let treasury_transfer = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let treasury_cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            treasury_transfer,
            signer_seeds,
        );
        token::transfer(treasury_cpi_ctx, purchase.marketplace_fee)?;

        // Transfer creator royalty if applicable
        if creator_royalty > 0 && ctx.accounts.creator_token_account.key() != ctx.accounts.seller_token_account.key() {
            let royalty_transfer = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.creator_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            let royalty_cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                royalty_transfer,
                signer_seeds,
            );
            token::transfer(royalty_cpi_ctx, creator_royalty)?;
        }

        emit!(DeliveryConfirmed {
            purchase_id: purchase.key(),
            buyer: ctx.accounts.buyer.key(),
            seller_amount,
            marketplace_fee: purchase.marketplace_fee,
            creator_royalty,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create a dispute
    pub fn create_dispute(
        ctx: Context<CreateDispute>,
        reason: String,
        evidence_uri: String,
    ) -> Result<()> {
        require!(reason.len() <= 512, MarketplaceError::ReasonTooLong);
        
        let dispute = &mut ctx.accounts.dispute;
        let purchase = &ctx.accounts.purchase;
        let escrow = &mut ctx.accounts.escrow;
        
        require!(
            ctx.accounts.disputer.key() == purchase.buyer || 
            ctx.accounts.disputer.key() == ctx.accounts.product.creator,
            MarketplaceError::UnauthorizedDisputer
        );
        require!(
            purchase.status == PurchaseStatus::Pending,
            MarketplaceError::InvalidPurchaseStatus
        );
        require!(
            escrow.status == EscrowStatus::Funded,
            MarketplaceError::InvalidEscrowStatus
        );
        
        dispute.purchase = purchase.key();
        dispute.disputer = ctx.accounts.disputer.key();
        dispute.reason = reason;
        dispute.evidence_uri = evidence_uri;
        dispute.status = DisputeStatus::Open;
        dispute.created_at = Clock::get()?.unix_timestamp;
        dispute.resolution_deadline = Clock::get()?.unix_timestamp + DISPUTE_RESOLUTION_PERIOD;
        dispute.bump = ctx.bumps.dispute;
        
        // Update escrow status
        escrow.status = EscrowStatus::Disputed;

        emit!(DisputeCreated {
            dispute_id: dispute.key(),
            purchase_id: purchase.key(),
            disputer: ctx.accounts.disputer.key(),
            reason: dispute.reason.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Resolve dispute (admin only)
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: DisputeResolution,
        refund_percentage: u8,
        resolution_notes: String,
    ) -> Result<()> {
        require!(refund_percentage <= 100, MarketplaceError::InvalidRefundPercentage);
        
        let dispute = &mut ctx.accounts.dispute;
        let purchase = &mut ctx.accounts.purchase;
        let escrow = &mut ctx.accounts.escrow;
        let marketplace = &ctx.accounts.marketplace;
        
        require!(
            ctx.accounts.admin.key() == marketplace.admin,
            MarketplaceError::UnauthorizedAdmin
        );
        require!(
            dispute.status == DisputeStatus::Open,
            MarketplaceError::InvalidDisputeStatus
        );
        
        dispute.status = DisputeStatus::Resolved;
        dispute.resolution = Some(resolution.clone());
        dispute.refund_percentage = Some(refund_percentage);
        dispute.resolution_notes = Some(resolution_notes.clone());
        dispute.resolved_at = Some(Clock::get()?.unix_timestamp);
        dispute.resolved_by = Some(ctx.accounts.admin.key());
        
        // Calculate refund and remaining amounts
        let refund_amount = purchase.total_amount
            .checked_mul(refund_percentage as u64)
            .ok_or(MarketplaceError::ArithmeticOverflow)?
            .checked_div(100)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;
        
        let seller_amount = purchase.total_amount
            .checked_sub(refund_amount)
            .ok_or(MarketplaceError::ArithmeticOverflow)?;

        // Execute resolution
        let purchase_key = purchase.key();
        let escrow_seeds = &[
            ESCROW_SEED,
            purchase_key.as_ref(),
            &[escrow.bump],
        ];
        let signer_seeds = &[&escrow_seeds[..]];

        if refund_amount > 0 {
            // Refund to buyer
            let refund_transfer = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            let refund_cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                refund_transfer,
                signer_seeds,
            );
            token::transfer(refund_cpi_ctx, refund_amount)?;
        }

        if seller_amount > 0 {
            // Pay seller remaining amount
            let seller_transfer = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: escrow.to_account_info(),
            };
            let seller_cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                seller_transfer,
                signer_seeds,
            );
            token::transfer(seller_cpi_ctx, seller_amount)?;
        }

        // Update purchase and escrow status
        purchase.status = match resolution {
            DisputeResolution::BuyerWins => PurchaseStatus::Refunded,
            DisputeResolution::SellerWins => PurchaseStatus::Completed,
            DisputeResolution::Partial => PurchaseStatus::PartialRefund,
        };
        
        escrow.status = EscrowStatus::Released;
        escrow.released_at = Some(Clock::get()?.unix_timestamp);

        emit!(DisputeResolved {
            dispute_id: dispute.key(),
            resolution: resolution.clone(),
            refund_amount,
            seller_amount,
            resolved_by: ctx.accounts.admin.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update product information
    pub fn update_product(
        ctx: Context<UpdateProduct>,
        name: Option<String>,
        description: Option<String>,
        price: Option<u64>,
        is_active: Option<bool>,
    ) -> Result<()> {
        let product = &mut ctx.accounts.product;
        
        require!(
            ctx.accounts.creator.key() == product.creator,
            MarketplaceError::UnauthorizedCreator
        );
        
        if let Some(new_name) = name {
            require!(new_name.len() <= 64, MarketplaceError::NameTooLong);
            product.name = new_name;
        }
        
        if let Some(new_description) = description {
            require!(new_description.len() <= 512, MarketplaceError::DescriptionTooLong);
            product.description = new_description;
        }
        
        if let Some(new_price) = price {
            require!(new_price > 0, MarketplaceError::InvalidPrice);
            product.price = new_price;
        }
        
        if let Some(active) = is_active {
            product.is_active = active;
        }
        
        product.updated_at = Clock::get()?.unix_timestamp;

        emit!(ProductUpdated {
            product_id: product.key(),
            creator: ctx.accounts.creator.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Verify creator (admin only)
    pub fn verify_creator(
        ctx: Context<VerifyCreator>,
        verification_status: bool,
    ) -> Result<()> {
        let marketplace = &ctx.accounts.marketplace;
        let creator_profile = &mut ctx.accounts.creator_profile;
        
        require!(
            ctx.accounts.admin.key() == marketplace.admin,
            MarketplaceError::UnauthorizedAdmin
        );
        
        creator_profile.is_verified = verification_status;

        emit!(CreatorVerified {
            creator: creator_profile.creator,
            verified: verification_status,
            admin: ctx.accounts.admin.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// Account validation structs

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = Marketplace::LEN,
        seeds = [MARKETPLACE_SEED],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateCreatorProfile<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = CreatorProfile::LEN,
        seeds = [CREATOR_PROFILE_SEED, creator.key().as_ref()],
        bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct ListProduct<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [MARKETPLACE_SEED],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    
    #[account(
        mut,
        seeds = [CREATOR_PROFILE_SEED, creator.key().as_ref()],
        bump = creator_profile.bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    
    #[account(
        init,
        payer = creator,
        space = Product::LEN,
        seeds = [PRODUCT_SEED, creator.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub product: Account<'info, Product>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseProduct<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(
        seeds = [MARKETPLACE_SEED],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    
    pub product: Account<'info, Product>,
    
    #[account(
        init,
        payer = buyer,
        space = Purchase::LEN,
        seeds = [PURCHASE_SEED, buyer.key().as_ref(), product.key().as_ref()],
        bump
    )]
    pub purchase: Account<'info, Purchase>,
    
    #[account(
        init,
        payer = buyer,
        space = Escrow::LEN,
        seeds = [ESCROW_SEED, purchase.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmDelivery<'info> {
    pub buyer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [MARKETPLACE_SEED],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    
    #[account(mut)]
    pub product: Account<'info, Product>,
    
    #[account(
        mut,
        seeds = [PURCHASE_SEED, buyer.key().as_ref(), product.key().as_ref()],
        bump = purchase.bump
    )]
    pub purchase: Account<'info, Purchase>,
    
    #[account(
        mut,
        seeds = [ESCROW_SEED, purchase.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        mut,
        seeds = [CREATOR_PROFILE_SEED, product.creator.as_ref()],
        bump = creator_profile.bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateDispute<'info> {
    pub disputer: Signer<'info>,
    
    pub product: Account<'info, Product>,
    
    #[account(
        seeds = [PURCHASE_SEED, purchase.buyer.as_ref(), product.key().as_ref()],
        bump = purchase.bump
    )]
    pub purchase: Account<'info, Purchase>,
    
    #[account(
        mut,
        seeds = [ESCROW_SEED, purchase.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        init,
        payer = disputer,
        space = Dispute::LEN,
        seeds = [DISPUTE_SEED, purchase.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    pub admin: Signer<'info>,
    
    #[account(
        seeds = [MARKETPLACE_SEED],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    
    #[account(
        mut,
        seeds = [DISPUTE_SEED, purchase.key().as_ref()],
        bump = dispute.bump
    )]
    pub dispute: Account<'info, Dispute>,
    
    #[account(mut)]
    pub purchase: Account<'info, Purchase>,
    
    #[account(
        mut,
        seeds = [ESCROW_SEED, purchase.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateProduct<'info> {
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PRODUCT_SEED, creator.key().as_ref(), product.name.as_bytes()],
        bump = product.bump
    )]
    pub product: Account<'info, Product>,
}

#[derive(Accounts)]
pub struct VerifyCreator<'info> {
    pub admin: Signer<'info>,
    
    #[account(
        seeds = [MARKETPLACE_SEED],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    
    #[account(
        mut,
        seeds = [CREATOR_PROFILE_SEED, creator_profile.creator.as_ref()],
        bump = creator_profile.bump
    )]
    pub creator_profile: Account<'info, CreatorProfile>,
}

// Data structures

#[account]
pub struct Marketplace {
    pub admin: Pubkey,                    // 32
    pub treasury: Pubkey,                 // 32
    pub fee_bps: u16,                     // 2
    pub total_products: u64,              // 8
    pub total_sales: u64,                 // 8
    pub total_volume: u64,                // 8
    pub is_active: bool,                  // 1
    pub created_at: i64,                  // 8
    pub bump: u8,                         // 1
}

impl Marketplace {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 8 + 8 + 8 + 1 + 8 + 1;
}

#[account]
pub struct CreatorProfile {
    pub creator: Pubkey,                  // 32
    pub name: String,                     // 4 + 64
    pub description: String,              // 4 + 256
    pub image_uri: String,                // 4 + 200
    pub external_url: Option<String>,     // 1 + 4 + 200
    pub royalty_bps: u16,                 // 2
    pub total_products: u32,              // 4
    pub total_sales: u64,                 // 8
    pub total_earnings: u64,              // 8
    pub is_verified: bool,                // 1
    pub created_at: i64,                  // 8
    pub bump: u8,                         // 1
}

impl CreatorProfile {
    pub const LEN: usize = 8 + 32 + 4 + 64 + 4 + 256 + 4 + 200 + 1 + 4 + 200 + 2 + 4 + 8 + 8 + 1 + 8 + 1;
}

#[account]
pub struct Product {
    pub creator: Pubkey,                  // 32
    pub name: String,                     // 4 + 64
    pub description: String,              // 4 + 512
    pub image_uri: String,                // 4 + 200
    pub price: u64,                       // 8
    pub category: ProductCategory,        // 1
    pub metadata_uri: String,             // 4 + 200
    pub is_digital: bool,                 // 1
    pub max_supply: Option<u32>,          // 1 + 4
    pub current_supply: u32,              // 4
    pub total_sales: u64,                 // 8
    pub is_active: bool,                  // 1
    pub created_at: i64,                  // 8
    pub updated_at: i64,                  // 8
    pub bump: u8,                         // 1
}

impl Product {
    pub const LEN: usize = 8 + 32 + 4 + 64 + 4 + 512 + 4 + 200 + 8 + 1 + 4 + 200 + 1 + 1 + 4 + 4 + 8 + 1 + 8 + 8 + 1;
}

#[account]
pub struct Purchase {
    pub buyer: Pubkey,                    // 32
    pub product: Pubkey,                  // 32
    pub quantity: u32,                    // 4
    pub total_amount: u64,                // 8
    pub marketplace_fee: u64,             // 8
    pub status: PurchaseStatus,           // 1
    pub created_at: i64,                  // 8
    pub completed_at: Option<i64>,        // 1 + 8
    pub bump: u8,                         // 1
}

impl Purchase {
    pub const LEN: usize = 8 + 32 + 32 + 4 + 8 + 8 + 1 + 8 + 1 + 8 + 1;
}

#[account]
pub struct Escrow {
    pub purchase: Pubkey,                 // 32
    pub buyer: Pubkey,                    // 32
    pub seller: Pubkey,                   // 32
    pub amount: u64,                      // 8
    pub status: EscrowStatus,             // 1
    pub created_at: i64,                  // 8
    pub expires_at: i64,                  // 8
    pub released_at: Option<i64>,         // 1 + 8
    pub bump: u8,                         // 1
}

impl Escrow {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 1 + 8 + 8 + 1 + 8 + 1;
}

#[account]
pub struct Dispute {
    pub purchase: Pubkey,                 // 32
    pub disputer: Pubkey,                 // 32
    pub reason: String,                   // 4 + 512
    pub evidence_uri: String,             // 4 + 200
    pub status: DisputeStatus,            // 1
    pub resolution: Option<DisputeResolution>, // 1 + 1
    pub refund_percentage: Option<u8>,    // 1 + 1
    pub resolution_notes: Option<String>, // 1 + 4 + 256
    pub created_at: i64,                  // 8
    pub resolution_deadline: i64,         // 8
    pub resolved_at: Option<i64>,         // 1 + 8
    pub resolved_by: Option<Pubkey>,      // 1 + 32
    pub bump: u8,                         // 1
}

impl Dispute {
    pub const LEN: usize = 8 + 32 + 32 + 4 + 512 + 4 + 200 + 1 + 1 + 1 + 1 + 1 + 1 + 4 + 256 + 8 + 8 + 1 + 8 + 1 + 32 + 1;
}

// Enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ProductCategory {
    Digital,
    Physical,
    Service,
    NFT,
    Software,
    Course,
    Ebook,
    Music,
    Video,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PurchaseStatus {
    Pending,
    Completed,
    Refunded,
    PartialRefund,
    Disputed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EscrowStatus {
    Funded,
    Released,
    Disputed,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum DisputeStatus {
    Open,
    Resolved,
    Escalated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum DisputeResolution {
    BuyerWins,
    SellerWins,
    Partial,
}

// Events

#[event]
pub struct MarketplaceInitialized {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct CreatorProfileCreated {
    pub creator: Pubkey,
    pub name: String,
    pub royalty_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct ProductListed {
    pub product_id: Pubkey,
    pub creator: Pubkey,
    pub name: String,
    pub price: u64,
    pub category: ProductCategory,
    pub timestamp: i64,
}

#[event]
pub struct ProductPurchased {
    pub purchase_id: Pubkey,
    pub buyer: Pubkey,
    pub product_id: Pubkey,
    pub quantity: u32,
    pub total_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct DeliveryConfirmed {
    pub purchase_id: Pubkey,
    pub buyer: Pubkey,
    pub seller_amount: u64,
    pub marketplace_fee: u64,
    pub creator_royalty: u64,
    pub timestamp: i64,
}

#[event]
pub struct DisputeCreated {
    pub dispute_id: Pubkey,
    pub purchase_id: Pubkey,
    pub disputer: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub dispute_id: Pubkey,
    pub resolution: DisputeResolution,
    pub refund_amount: u64,
    pub seller_amount: u64,
    pub resolved_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProductUpdated {
    pub product_id: Pubkey,
    pub creator: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CreatorVerified {
    pub creator: Pubkey,
    pub verified: bool,
    pub admin: Pubkey,
    pub timestamp: i64,
}

// Error codes

#[error_code]
pub enum MarketplaceError {
    #[msg("Invalid fee percentage")]
    InvalidFee,
    
    #[msg("Name is too long")]
    NameTooLong,
    
    #[msg("Description is too long")]
    DescriptionTooLong,
    
    #[msg("Invalid royalty percentage")]
    InvalidRoyalty,
    
    #[msg("Invalid price")]
    InvalidPrice,
    
    #[msg("Invalid quantity")]
    InvalidQuantity,
    
    #[msg("Product is not active")]
    ProductNotActive,
    
    #[msg("Insufficient supply")]
    InsufficientSupply,
    
    #[msg("Unauthorized buyer")]
    UnauthorizedBuyer,
    
    #[msg("Unauthorized creator")]
    UnauthorizedCreator,
    
    #[msg("Unauthorized admin")]
    UnauthorizedAdmin,
    
    #[msg("Unauthorized disputer")]
    UnauthorizedDisputer,
    
    #[msg("Invalid purchase status")]
    InvalidPurchaseStatus,
    
    #[msg("Invalid escrow status")]
    InvalidEscrowStatus,
    
    #[msg("Invalid dispute status")]
    InvalidDisputeStatus,
    
    #[msg("Invalid refund percentage")]
    InvalidRefundPercentage,
    
    #[msg("Reason is too long")]
    ReasonTooLong,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}

