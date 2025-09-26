use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("P2PE3ndUJwKy38f7CYqc5PTCD6MEYPNMdwbN");

// Constants
const EXCHANGE_FEE_BPS: u16 = 30; // 0.3% exchange fee
const MAX_ORDER_EXPIRY: i64 = 30 * 24 * 60 * 60; // 30 days maximum order expiry
const ESCROW_TIMEOUT: i64 = 24 * 60 * 60; // 24 hours escrow timeout
const DISPUTE_RESOLUTION_PERIOD: i64 = 7 * 24 * 60 * 60; // 7 days dispute resolution
const MIN_REPUTATION_SCORE: u16 = 50; // Minimum reputation to create orders

// Seeds for PDAs
const EXCHANGE_SEED: &[u8] = b"exchange";
const ORDER_SEED: &[u8] = b"order";
const TRADE_SEED: &[u8] = b"trade";
const ESCROW_SEED: &[u8] = b"escrow";
const USER_PROFILE_SEED: &[u8] = b"user_profile";
const DISPUTE_SEED: &[u8] = b"dispute";
const REPUTATION_SEED: &[u8] = b"reputation";

#[program]
pub mod p2p_exchange {
    use super::*;

    /// Initialize the P2P exchange
    pub fn initialize_exchange(
        ctx: Context<InitializeExchange>,
        admin: Pubkey,
        treasury: Pubkey,
        fee_bps: u16,
        supported_tokens: Vec<Pubkey>,
    ) -> Result<()> {
        require!(fee_bps <= 1000, ExchangeError::InvalidFee); // Max 10% fee
        require!(!supported_tokens.is_empty(), ExchangeError::NoSupportedTokens);
        require!(supported_tokens.len() <= 50, ExchangeError::TooManySupportedTokens);

        let exchange = &mut ctx.accounts.exchange;
        
        exchange.admin = admin;
        exchange.treasury = treasury;
        exchange.fee_bps = fee_bps;
        exchange.supported_tokens = supported_tokens.clone();
        exchange.total_orders = 0;
        exchange.total_trades = 0;
        exchange.total_volume = 0;
        exchange.is_active = true;
        exchange.created_at = Clock::get()?.unix_timestamp;
        exchange.bump = ctx.bumps.exchange;

        emit!(ExchangeInitialized {
            admin,
            treasury,
            fee_bps,
            supported_tokens: supported_tokens.len() as u8,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create user profile for trading
    pub fn create_user_profile(
        ctx: Context<CreateUserProfile>,
        username: String,
        contact_info: String,
        payment_methods: Vec<PaymentMethod>,
    ) -> Result<()> {
        require!(username.len() <= 32, ExchangeError::UsernameTooLong);
        require!(contact_info.len() <= 256, ExchangeError::ContactInfoTooLong);
        require!(!payment_methods.is_empty(), ExchangeError::NoPaymentMethods);
        require!(payment_methods.len() <= 10, ExchangeError::TooManyPaymentMethods);

        let user_profile = &mut ctx.accounts.user_profile;
        let reputation = &mut ctx.accounts.reputation;
        
        user_profile.user = ctx.accounts.user.key();
        user_profile.username = username.clone();
        user_profile.contact_info = contact_info;
        user_profile.payment_methods = payment_methods;
        user_profile.total_trades = 0;
        user_profile.is_verified = false;
        user_profile.is_suspended = false;
        user_profile.created_at = Clock::get()?.unix_timestamp;
        user_profile.bump = ctx.bumps.user_profile;

        // Initialize reputation
        reputation.user = ctx.accounts.user.key();
        reputation.score = 100; // Starting reputation score
        reputation.total_ratings = 0;
        reputation.positive_ratings = 0;
        reputation.negative_ratings = 0;
        reputation.last_updated = Clock::get()?.unix_timestamp;
        reputation.bump = ctx.bumps.reputation;

        emit!(UserProfileCreated {
            user: ctx.accounts.user.key(),
            username: username.clone(),
            payment_methods: payment_methods.len() as u8,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create a new order (buy or sell)
    pub fn create_order(
        ctx: Context<CreateOrder>,
        order_type: OrderType,
        token_mint: Pubkey,
        amount: u64,
        price_per_token: u64,
        fiat_currency: FiatCurrency,
        payment_method: PaymentMethod,
        min_amount: Option<u64>,
        max_amount: Option<u64>,
        expiry_time: Option<i64>,
        terms: String,
    ) -> Result<()> {
        require!(amount > 0, ExchangeError::InvalidAmount);
        require!(price_per_token > 0, ExchangeError::InvalidPrice);
        require!(terms.len() <= 512, ExchangeError::TermsTooLong);

        let exchange = &ctx.accounts.exchange;
        let user_profile = &ctx.accounts.user_profile;
        let reputation = &ctx.accounts.reputation;
        let order = &mut ctx.accounts.order;

        // Check if token is supported
        require!(
            exchange.supported_tokens.contains(&token_mint),
            ExchangeError::TokenNotSupported
        );

        // Check user reputation
        require!(
            reputation.score >= MIN_REPUTATION_SCORE,
            ExchangeError::InsufficientReputation
        );

        require!(!user_profile.is_suspended, ExchangeError::UserSuspended);

        // Validate amount limits
        if let Some(min) = min_amount {
            require!(min <= amount, ExchangeError::InvalidMinAmount);
        }
        if let Some(max) = max_amount {
            require!(max >= amount, ExchangeError::InvalidMaxAmount);
            if let Some(min) = min_amount {
                require!(min <= max, ExchangeError::InvalidAmountRange);
            }
        }

        // Validate expiry time
        let current_time = Clock::get()?.unix_timestamp;
        let expiry = expiry_time.unwrap_or(current_time + MAX_ORDER_EXPIRY);
        require!(
            expiry > current_time && expiry <= current_time + MAX_ORDER_EXPIRY,
            ExchangeError::InvalidExpiryTime
        );

        // For sell orders, lock tokens in escrow
        if order_type == OrderType::Sell {
            let cpi_accounts = Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            
            token::transfer(cpi_ctx, amount)?;
        }

        // Initialize order
        order.creator = ctx.accounts.user.key();
        order.order_type = order_type.clone();
        order.token_mint = token_mint;
        order.amount = amount;
        order.remaining_amount = amount;
        order.price_per_token = price_per_token;
        order.fiat_currency = fiat_currency.clone();
        order.payment_method = payment_method.clone();
        order.min_amount = min_amount;
        order.max_amount = max_amount;
        order.terms = terms.clone();
        order.status = OrderStatus::Active;
        order.created_at = current_time;
        order.expiry_time = expiry;
        order.total_filled = 0;
        order.bump = ctx.bumps.order;

        emit!(OrderCreated {
            order_id: order.key(),
            creator: ctx.accounts.user.key(),
            order_type: order_type.clone(),
            token_mint,
            amount,
            price_per_token,
            fiat_currency: fiat_currency.clone(),
            payment_method: payment_method.clone(),
            timestamp: current_time,
        });

        Ok(())
    }

    /// Accept an order and start a trade
    pub fn accept_order(
        ctx: Context<AcceptOrder>,
        trade_amount: u64,
    ) -> Result<()> {
        require!(trade_amount > 0, ExchangeError::InvalidAmount);

        let order = &mut ctx.accounts.order;
        let trade = &mut ctx.accounts.trade;
        let taker_profile = &ctx.accounts.taker_profile;
        let taker_reputation = &ctx.accounts.taker_reputation;

        require!(order.status == OrderStatus::Active, ExchangeError::OrderNotActive);
        require!(
            Clock::get()?.unix_timestamp <= order.expiry_time,
            ExchangeError::OrderExpired
        );
        require!(
            ctx.accounts.taker.key() != order.creator,
            ExchangeError::CannotAcceptOwnOrder
        );
        require!(
            taker_reputation.score >= MIN_REPUTATION_SCORE,
            ExchangeError::InsufficientReputation
        );
        require!(!taker_profile.is_suspended, ExchangeError::UserSuspended);

        // Validate trade amount
        require!(trade_amount <= order.remaining_amount, ExchangeError::InsufficientOrderAmount);
        
        if let Some(min) = order.min_amount {
            require!(trade_amount >= min, ExchangeError::BelowMinAmount);
        }
        if let Some(max) = order.max_amount {
            require!(trade_amount <= max, ExchangeError::AboveMaxAmount);
        }

        let current_time = Clock::get()?.unix_timestamp;
        let fiat_amount = trade_amount
            .checked_mul(order.price_per_token)
            .ok_or(ExchangeError::ArithmeticOverflow)?
            .checked_div(1_000_000_000) // Assuming 9 decimals
            .ok_or(ExchangeError::ArithmeticOverflow)?;

        // Initialize trade
        trade.order_id = order.key();
        trade.maker = order.creator;
        trade.taker = ctx.accounts.taker.key();
        trade.token_mint = order.token_mint;
        trade.token_amount = trade_amount;
        trade.fiat_amount = fiat_amount;
        trade.fiat_currency = order.fiat_currency.clone();
        trade.payment_method = order.payment_method.clone();
        trade.status = TradeStatus::Pending;
        trade.created_at = current_time;
        trade.expires_at = current_time + ESCROW_TIMEOUT;
        trade.maker_confirmed = false;
        trade.taker_confirmed = false;
        trade.bump = ctx.bumps.trade;

        // Update order
        order.remaining_amount = order.remaining_amount
            .checked_sub(trade_amount)
            .ok_or(ExchangeError::ArithmeticOverflow)?;
        
        if order.remaining_amount == 0 {
            order.status = OrderStatus::Filled;
        }

        // For buy orders, lock tokens from taker
        if order.order_type == OrderType::Buy {
            let cpi_accounts = Transfer {
                from: ctx.accounts.taker_token_account.to_account_info(),
                to: ctx.accounts.trade_escrow_token_account.to_account_info(),
                authority: ctx.accounts.taker.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            
            token::transfer(cpi_ctx, trade_amount)?;
        }

        emit!(OrderAccepted {
            order_id: order.key(),
            trade_id: trade.key(),
            maker: trade.maker,
            taker: ctx.accounts.taker.key(),
            token_amount: trade_amount,
            fiat_amount,
            timestamp: current_time,
        });

        Ok(())
    }

    /// Confirm fiat payment sent (buyer)
    pub fn confirm_payment_sent(
        ctx: Context<ConfirmPaymentSent>,
        payment_proof: String,
    ) -> Result<()> {
        require!(payment_proof.len() <= 256, ExchangeError::PaymentProofTooLong);

        let trade = &mut ctx.accounts.trade;
        
        require!(trade.status == TradeStatus::Pending, ExchangeError::InvalidTradeStatus);
        require!(
            Clock::get()?.unix_timestamp <= trade.expires_at,
            ExchangeError::TradeExpired
        );

        // Determine who should confirm payment based on order type
        let should_confirm = match ctx.accounts.order.order_type {
            OrderType::Buy => ctx.accounts.confirmer.key() == trade.maker, // Buyer confirms
            OrderType::Sell => ctx.accounts.confirmer.key() == trade.taker, // Buyer confirms
        };

        require!(should_confirm, ExchangeError::UnauthorizedConfirmation);

        trade.status = TradeStatus::PaymentSent;
        trade.payment_proof = Some(payment_proof.clone());
        trade.payment_sent_at = Some(Clock::get()?.unix_timestamp);

        emit!(PaymentSent {
            trade_id: trade.key(),
            sender: ctx.accounts.confirmer.key(),
            payment_proof: payment_proof.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Confirm fiat payment received and release tokens (seller)
    pub fn confirm_payment_received(
        ctx: Context<ConfirmPaymentReceived>,
    ) -> Result<()> {
        let trade = &mut ctx.accounts.trade;
        let order = &ctx.accounts.order;
        let exchange = &ctx.accounts.exchange;

        require!(
            trade.status == TradeStatus::PaymentSent,
            ExchangeError::InvalidTradeStatus
        );

        // Determine who should confirm receipt based on order type
        let should_confirm = match order.order_type {
            OrderType::Buy => ctx.accounts.confirmer.key() == trade.taker, // Seller confirms
            OrderType::Sell => ctx.accounts.confirmer.key() == trade.maker, // Seller confirms
        };

        require!(should_confirm, ExchangeError::UnauthorizedConfirmation);

        // Calculate fees
        let exchange_fee = trade.token_amount
            .checked_mul(exchange.fee_bps as u64)
            .ok_or(ExchangeError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(ExchangeError::ArithmeticOverflow)?;

        let seller_amount = trade.token_amount
            .checked_sub(exchange_fee)
            .ok_or(ExchangeError::ArithmeticOverflow)?;

        // Release tokens to buyer and fees to treasury
        let trade_key = trade.key();
        let escrow_seeds = match order.order_type {
            OrderType::Buy => &[
                ESCROW_SEED,
                trade_key.as_ref(),
                b"trade",
                &[ctx.accounts.trade_escrow.bump],
            ],
            OrderType::Sell => &[
                ESCROW_SEED,
                order.key().as_ref(),
                b"order",
                &[ctx.accounts.order_escrow.bump],
            ],
        };
        let signer_seeds = &[&escrow_seeds[..]];

        // Transfer to buyer
        let buyer_account = match order.order_type {
            OrderType::Buy => &ctx.accounts.maker_token_account,
            OrderType::Sell => &ctx.accounts.taker_token_account,
        };

        let escrow_account = match order.order_type {
            OrderType::Buy => &ctx.accounts.trade_escrow_token_account,
            OrderType::Sell => &ctx.accounts.order_escrow_token_account,
        };

        let escrow_authority = match order.order_type {
            OrderType::Buy => ctx.accounts.trade_escrow.to_account_info(),
            OrderType::Sell => ctx.accounts.order_escrow.to_account_info(),
        };

        let buyer_transfer = Transfer {
            from: escrow_account.to_account_info(),
            to: buyer_account.to_account_info(),
            authority: escrow_authority.clone(),
        };
        let buyer_cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            buyer_transfer,
            signer_seeds,
        );
        token::transfer(buyer_cpi_ctx, seller_amount)?;

        // Transfer fee to treasury
        if exchange_fee > 0 {
            let fee_transfer = Transfer {
                from: escrow_account.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: escrow_authority,
            };
            let fee_cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                fee_transfer,
                signer_seeds,
            );
            token::transfer(fee_cpi_ctx, exchange_fee)?;
        }

        // Update trade status
        trade.status = TradeStatus::Completed;
        trade.completed_at = Some(Clock::get()?.unix_timestamp);

        emit!(PaymentReceived {
            trade_id: trade.key(),
            receiver: ctx.accounts.confirmer.key(),
            token_amount: seller_amount,
            exchange_fee,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create a dispute
    pub fn create_dispute(
        ctx: Context<CreateDispute>,
        reason: String,
        evidence: String,
    ) -> Result<()> {
        require!(reason.len() <= 256, ExchangeError::ReasonTooLong);
        require!(evidence.len() <= 1024, ExchangeError::EvidenceTooLong);

        let trade = &ctx.accounts.trade;
        let dispute = &mut ctx.accounts.dispute;

        require!(
            ctx.accounts.disputer.key() == trade.maker ||
            ctx.accounts.disputer.key() == trade.taker,
            ExchangeError::UnauthorizedDisputer
        );
        require!(
            trade.status == TradeStatus::PaymentSent ||
            trade.status == TradeStatus::Pending,
            ExchangeError::InvalidTradeStatus
        );

        dispute.trade_id = trade.key();
        dispute.disputer = ctx.accounts.disputer.key();
        dispute.reason = reason.clone();
        dispute.evidence = evidence.clone();
        dispute.status = DisputeStatus::Open;
        dispute.created_at = Clock::get()?.unix_timestamp;
        dispute.resolution_deadline = Clock::get()?.unix_timestamp + DISPUTE_RESOLUTION_PERIOD;
        dispute.bump = ctx.bumps.dispute;

        emit!(DisputeCreated {
            dispute_id: dispute.key(),
            trade_id: trade.key(),
            disputer: ctx.accounts.disputer.key(),
            reason: reason.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Resolve dispute (admin only)
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: DisputeResolution,
        refund_percentage: u8,
        notes: String,
    ) -> Result<()> {
        require!(refund_percentage <= 100, ExchangeError::InvalidRefundPercentage);
        require!(notes.len() <= 512, ExchangeError::NotesTooLong);

        let dispute = &mut ctx.accounts.dispute;
        let trade = &mut ctx.accounts.trade;
        let exchange = &ctx.accounts.exchange;

        require!(
            ctx.accounts.admin.key() == exchange.admin,
            ExchangeError::UnauthorizedAdmin
        );
        require!(
            dispute.status == DisputeStatus::Open,
            ExchangeError::InvalidDisputeStatus
        );

        // Calculate resolution amounts
        let refund_amount = trade.token_amount
            .checked_mul(refund_percentage as u64)
            .ok_or(ExchangeError::ArithmeticOverflow)?
            .checked_div(100)
            .ok_or(ExchangeError::ArithmeticOverflow)?;

        let seller_amount = trade.token_amount
            .checked_sub(refund_amount)
            .ok_or(ExchangeError::ArithmeticOverflow)?;

        // Update dispute
        dispute.status = DisputeStatus::Resolved;
        dispute.resolution = Some(resolution.clone());
        dispute.refund_percentage = Some(refund_percentage);
        dispute.resolution_notes = Some(notes.clone());
        dispute.resolved_at = Some(Clock::get()?.unix_timestamp);
        dispute.resolved_by = Some(ctx.accounts.admin.key());

        // Update trade
        trade.status = match resolution {
            DisputeResolution::FavorBuyer => TradeStatus::Refunded,
            DisputeResolution::FavorSeller => TradeStatus::Completed,
            DisputeResolution::Partial => TradeStatus::PartialRefund,
        };

        emit!(DisputeResolved {
            dispute_id: dispute.key(),
            trade_id: trade.key(),
            resolution: resolution.clone(),
            refund_amount,
            seller_amount,
            resolved_by: ctx.accounts.admin.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Rate trading partner after completed trade
    pub fn rate_user(
        ctx: Context<RateUser>,
        rating: Rating,
        comment: Option<String>,
    ) -> Result<()> {
        if let Some(ref c) = comment {
            require!(c.len() <= 256, ExchangeError::CommentTooLong);
        }

        let trade = &ctx.accounts.trade;
        let reputation = &mut ctx.accounts.reputation;

        require!(
            trade.status == TradeStatus::Completed,
            ExchangeError::TradeNotCompleted
        );
        require!(
            ctx.accounts.rater.key() == trade.maker ||
            ctx.accounts.rater.key() == trade.taker,
            ExchangeError::UnauthorizedRater
        );

        // Update reputation
        reputation.total_ratings = reputation.total_ratings
            .checked_add(1)
            .ok_or(ExchangeError::ArithmeticOverflow)?;

        match rating {
            Rating::Positive => {
                reputation.positive_ratings = reputation.positive_ratings
                    .checked_add(1)
                    .ok_or(ExchangeError::ArithmeticOverflow)?;
                reputation.score = reputation.score.saturating_add(1);
            }
            Rating::Negative => {
                reputation.negative_ratings = reputation.negative_ratings
                    .checked_add(1)
                    .ok_or(ExchangeError::ArithmeticOverflow)?;
                reputation.score = reputation.score.saturating_sub(5);
            }
            Rating::Neutral => {
                // No score change for neutral ratings
            }
        }

        reputation.last_updated = Clock::get()?.unix_timestamp;

        emit!(UserRated {
            rater: ctx.accounts.rater.key(),
            rated_user: reputation.user,
            trade_id: trade.key(),
            rating: rating.clone(),
            new_score: reputation.score,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Cancel an active order
    pub fn cancel_order(
        ctx: Context<CancelOrder>,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;

        require!(
            ctx.accounts.creator.key() == order.creator,
            ExchangeError::UnauthorizedCancel
        );
        require!(
            order.status == OrderStatus::Active,
            ExchangeError::OrderNotActive
        );

        // For sell orders, return locked tokens
        if order.order_type == OrderType::Sell && order.remaining_amount > 0 {
            let order_key = order.key();
            let escrow_seeds = &[
                ESCROW_SEED,
                order_key.as_ref(),
                b"order",
                &[ctx.accounts.escrow.bump],
            ];
            let signer_seeds = &[&escrow_seeds[..]];

            let return_transfer = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.creator_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            };
            let return_cpi_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                return_transfer,
                signer_seeds,
            );
            token::transfer(return_cpi_ctx, order.remaining_amount)?;
        }

        order.status = OrderStatus::Cancelled;

        emit!(OrderCancelled {
            order_id: order.key(),
            creator: ctx.accounts.creator.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

// Account validation structs

#[derive(Accounts)]
pub struct InitializeExchange<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = Exchange::LEN,
        seeds = [EXCHANGE_SEED],
        bump
    )]
    pub exchange: Account<'info, Exchange>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = UserProfile::LEN,
        seeds = [USER_PROFILE_SEED, user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        init,
        payer = user,
        space = Reputation::LEN,
        seeds = [REPUTATION_SEED, user.key().as_ref()],
        bump
    )]
    pub reputation: Account<'info, Reputation>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateOrder<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [EXCHANGE_SEED],
        bump = exchange.bump
    )]
    pub exchange: Account<'info, Exchange>,
    
    #[account(
        seeds = [USER_PROFILE_SEED, user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        seeds = [REPUTATION_SEED, user.key().as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, Reputation>,
    
    #[account(
        init,
        payer = user,
        space = Order::LEN,
        seeds = [ORDER_SEED, user.key().as_ref(), exchange.total_orders.to_le_bytes().as_ref()],
        bump
    )]
    pub order: Account<'info, Order>,
    
    #[account(
        init,
        payer = user,
        space = Escrow::LEN,
        seeds = [ESCROW_SEED, order.key().as_ref(), b"order"],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptOrder<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    
    #[account(mut)]
    pub order: Account<'info, Order>,
    
    #[account(
        seeds = [USER_PROFILE_SEED, taker.key().as_ref()],
        bump = taker_profile.bump
    )]
    pub taker_profile: Account<'info, UserProfile>,
    
    #[account(
        seeds = [REPUTATION_SEED, taker.key().as_ref()],
        bump = taker_reputation.bump
    )]
    pub taker_reputation: Account<'info, Reputation>,
    
    #[account(
        init,
        payer = taker,
        space = Trade::LEN,
        seeds = [TRADE_SEED, order.key().as_ref(), taker.key().as_ref()],
        bump
    )]
    pub trade: Account<'info, Trade>,
    
    #[account(
        init,
        payer = taker,
        space = Escrow::LEN,
        seeds = [ESCROW_SEED, trade.key().as_ref(), b"trade"],
        bump
    )]
    pub trade_escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub taker_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub trade_escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmPaymentSent<'info> {
    pub confirmer: Signer<'info>,
    
    pub order: Account<'info, Order>,
    
    #[account(mut)]
    pub trade: Account<'info, Trade>,
}

#[derive(Accounts)]
pub struct ConfirmPaymentReceived<'info> {
    pub confirmer: Signer<'info>,
    
    #[account(
        seeds = [EXCHANGE_SEED],
        bump = exchange.bump
    )]
    pub exchange: Account<'info, Exchange>,
    
    pub order: Account<'info, Order>,
    
    #[account(mut)]
    pub trade: Account<'info, Trade>,
    
    #[account(
        seeds = [ESCROW_SEED, order.key().as_ref(), b"order"],
        bump = order_escrow.bump
    )]
    pub order_escrow: Account<'info, Escrow>,
    
    #[account(
        seeds = [ESCROW_SEED, trade.key().as_ref(), b"trade"],
        bump = trade_escrow.bump
    )]
    pub trade_escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub order_escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub trade_escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub maker_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub taker_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateDispute<'info> {
    #[account(mut)]
    pub disputer: Signer<'info>,
    
    pub trade: Account<'info, Trade>,
    
    #[account(
        init,
        payer = disputer,
        space = Dispute::LEN,
        seeds = [DISPUTE_SEED, trade.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    pub admin: Signer<'info>,
    
    #[account(
        seeds = [EXCHANGE_SEED],
        bump = exchange.bump
    )]
    pub exchange: Account<'info, Exchange>,
    
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    
    #[account(mut)]
    pub trade: Account<'info, Trade>,
}

#[derive(Accounts)]
pub struct RateUser<'info> {
    pub rater: Signer<'info>,
    
    pub trade: Account<'info, Trade>,
    
    #[account(
        mut,
        seeds = [REPUTATION_SEED, reputation.user.as_ref()],
        bump = reputation.bump
    )]
    pub reputation: Account<'info, Reputation>,
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    pub creator: Signer<'info>,
    
    #[account(mut)]
    pub order: Account<'info, Order>,
    
    #[account(
        seeds = [ESCROW_SEED, order.key().as_ref(), b"order"],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// Data structures

#[account]
pub struct Exchange {
    pub admin: Pubkey,                    // 32
    pub treasury: Pubkey,                 // 32
    pub fee_bps: u16,                     // 2
    pub supported_tokens: Vec<Pubkey>,    // 4 + (50 * 32)
    pub total_orders: u64,                // 8
    pub total_trades: u64,                // 8
    pub total_volume: u64,                // 8
    pub is_active: bool,                  // 1
    pub created_at: i64,                  // 8
    pub bump: u8,                         // 1
}

impl Exchange {
    pub const LEN: usize = 8 + 32 + 32 + 2 + 4 + (50 * 32) + 8 + 8 + 8 + 1 + 8 + 1;
}

#[account]
pub struct UserProfile {
    pub user: Pubkey,                     // 32
    pub username: String,                 // 4 + 32
    pub contact_info: String,             // 4 + 256
    pub payment_methods: Vec<PaymentMethod>, // 4 + (10 * PaymentMethod::LEN)
    pub total_trades: u64,                // 8
    pub is_verified: bool,                // 1
    pub is_suspended: bool,               // 1
    pub created_at: i64,                  // 8
    pub bump: u8,                         // 1
}

impl UserProfile {
    pub const LEN: usize = 8 + 32 + 4 + 32 + 4 + 256 + 4 + (10 * 100) + 8 + 1 + 1 + 8 + 1;
}

#[account]
pub struct Order {
    pub creator: Pubkey,                  // 32
    pub order_type: OrderType,            // 1
    pub token_mint: Pubkey,               // 32
    pub amount: u64,                      // 8
    pub remaining_amount: u64,            // 8
    pub price_per_token: u64,             // 8
    pub fiat_currency: FiatCurrency,      // 1
    pub payment_method: PaymentMethod,    // PaymentMethod::LEN
    pub min_amount: Option<u64>,          // 1 + 8
    pub max_amount: Option<u64>,          // 1 + 8
    pub terms: String,                    // 4 + 512
    pub status: OrderStatus,              // 1
    pub created_at: i64,                  // 8
    pub expiry_time: i64,                 // 8
    pub total_filled: u64,                // 8
    pub bump: u8,                         // 1
}

impl Order {
    pub const LEN: usize = 8 + 32 + 1 + 32 + 8 + 8 + 8 + 1 + 100 + 1 + 8 + 1 + 8 + 4 + 512 + 1 + 8 + 8 + 8 + 1;
}

#[account]
pub struct Trade {
    pub order_id: Pubkey,                 // 32
    pub maker: Pubkey,                    // 32
    pub taker: Pubkey,                    // 32
    pub token_mint: Pubkey,               // 32
    pub token_amount: u64,                // 8
    pub fiat_amount: u64,                 // 8
    pub fiat_currency: FiatCurrency,      // 1
    pub payment_method: PaymentMethod,    // PaymentMethod::LEN
    pub status: TradeStatus,              // 1
    pub created_at: i64,                  // 8
    pub expires_at: i64,                  // 8
    pub payment_proof: Option<String>,    // 1 + 4 + 256
    pub payment_sent_at: Option<i64>,     // 1 + 8
    pub completed_at: Option<i64>,        // 1 + 8
    pub maker_confirmed: bool,            // 1
    pub taker_confirmed: bool,            // 1
    pub bump: u8,                         // 1
}

impl Trade {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 1 + 100 + 1 + 8 + 8 + 1 + 4 + 256 + 1 + 8 + 1 + 8 + 1 + 1 + 1;
}

#[account]
pub struct Escrow {
    pub trade_or_order: Pubkey,           // 32
    pub token_mint: Pubkey,               // 32
    pub amount: u64,                      // 8
    pub created_at: i64,                  // 8
    pub bump: u8,                         // 1
}

impl Escrow {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

#[account]
pub struct Reputation {
    pub user: Pubkey,                     // 32
    pub score: u16,                       // 2
    pub total_ratings: u32,               // 4
    pub positive_ratings: u32,            // 4
    pub negative_ratings: u32,            // 4
    pub last_updated: i64,                // 8
    pub bump: u8,                         // 1
}

impl Reputation {
    pub const LEN: usize = 8 + 32 + 2 + 4 + 4 + 4 + 8 + 1;
}

#[account]
pub struct Dispute {
    pub trade_id: Pubkey,                 // 32
    pub disputer: Pubkey,                 // 32
    pub reason: String,                   // 4 + 256
    pub evidence: String,                 // 4 + 1024
    pub status: DisputeStatus,            // 1
    pub resolution: Option<DisputeResolution>, // 1 + 1
    pub refund_percentage: Option<u8>,    // 1 + 1
    pub resolution_notes: Option<String>, // 1 + 4 + 512
    pub created_at: i64,                  // 8
    pub resolution_deadline: i64,         // 8
    pub resolved_at: Option<i64>,         // 1 + 8
    pub resolved_by: Option<Pubkey>,      // 1 + 32
    pub bump: u8,                         // 1
}

impl Dispute {
    pub const LEN: usize = 8 + 32 + 32 + 4 + 256 + 4 + 1024 + 1 + 1 + 1 + 1 + 1 + 1 + 4 + 512 + 8 + 8 + 1 + 8 + 1 + 32 + 1;
}

// Custom types and enums

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub struct PaymentMethod {
    pub method_type: PaymentMethodType,   // 1
    pub details: String,                  // 4 + 64
    pub is_active: bool,                  // 1
}

impl PaymentMethod {
    pub const LEN: usize = 1 + 4 + 64 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PaymentMethodType {
    BankTransfer,
    PayPal,
    Wise,
    Revolut,
    CashApp,
    Venmo,
    Zelle,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum OrderType {
    Buy,
    Sell,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum OrderStatus {
    Active,
    Filled,
    Cancelled,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum TradeStatus {
    Pending,
    PaymentSent,
    Completed,
    Disputed,
    Refunded,
    PartialRefund,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum FiatCurrency {
    USD,
    EUR,
    GBP,
    CAD,
    AUD,
    JPY,
    CHF,
    CNY,
    INR,
    BRL,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum DisputeStatus {
    Open,
    Resolved,
    Escalated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum DisputeResolution {
    FavorBuyer,
    FavorSeller,
    Partial,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum Rating {
    Positive,
    Negative,
    Neutral,
}

// Events

#[event]
pub struct ExchangeInitialized {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub supported_tokens: u8,
    pub timestamp: i64,
}

#[event]
pub struct UserProfileCreated {
    pub user: Pubkey,
    pub username: String,
    pub payment_methods: u8,
    pub timestamp: i64,
}

#[event]
pub struct OrderCreated {
    pub order_id: Pubkey,
    pub creator: Pubkey,
    pub order_type: OrderType,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub price_per_token: u64,
    pub fiat_currency: FiatCurrency,
    pub payment_method: PaymentMethod,
    pub timestamp: i64,
}

#[event]
pub struct OrderAccepted {
    pub order_id: Pubkey,
    pub trade_id: Pubkey,
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub token_amount: u64,
    pub fiat_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct PaymentSent {
    pub trade_id: Pubkey,
    pub sender: Pubkey,
    pub payment_proof: String,
    pub timestamp: i64,
}

#[event]
pub struct PaymentReceived {
    pub trade_id: Pubkey,
    pub receiver: Pubkey,
    pub token_amount: u64,
    pub exchange_fee: u64,
    pub timestamp: i64,
}

#[event]
pub struct DisputeCreated {
    pub dispute_id: Pubkey,
    pub trade_id: Pubkey,
    pub disputer: Pubkey,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct DisputeResolved {
    pub dispute_id: Pubkey,
    pub trade_id: Pubkey,
    pub resolution: DisputeResolution,
    pub refund_amount: u64,
    pub seller_amount: u64,
    pub resolved_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UserRated {
    pub rater: Pubkey,
    pub rated_user: Pubkey,
    pub trade_id: Pubkey,
    pub rating: Rating,
    pub new_score: u16,
    pub timestamp: i64,
}

#[event]
pub struct OrderCancelled {
    pub order_id: Pubkey,
    pub creator: Pubkey,
    pub timestamp: i64,
}

// Error codes

#[error_code]
pub enum ExchangeError {
    #[msg("Invalid fee percentage")]
    InvalidFee,
    
    #[msg("No supported tokens provided")]
    NoSupportedTokens,
    
    #[msg("Too many supported tokens")]
    TooManySupportedTokens,
    
    #[msg("Username too long")]
    UsernameTooLong,
    
    #[msg("Contact info too long")]
    ContactInfoTooLong,
    
    #[msg("No payment methods provided")]
    NoPaymentMethods,
    
    #[msg("Too many payment methods")]
    TooManyPaymentMethods,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Invalid price")]
    InvalidPrice,
    
    #[msg("Terms too long")]
    TermsTooLong,
    
    #[msg("Token not supported")]
    TokenNotSupported,
    
    #[msg("Insufficient reputation")]
    InsufficientReputation,
    
    #[msg("User is suspended")]
    UserSuspended,
    
    #[msg("Invalid minimum amount")]
    InvalidMinAmount,
    
    #[msg("Invalid maximum amount")]
    InvalidMaxAmount,
    
    #[msg("Invalid amount range")]
    InvalidAmountRange,
    
    #[msg("Invalid expiry time")]
    InvalidExpiryTime,
    
    #[msg("Order not active")]
    OrderNotActive,
    
    #[msg("Order expired")]
    OrderExpired,
    
    #[msg("Cannot accept own order")]
    CannotAcceptOwnOrder,
    
    #[msg("Insufficient order amount")]
    InsufficientOrderAmount,
    
    #[msg("Below minimum amount")]
    BelowMinAmount,
    
    #[msg("Above maximum amount")]
    AboveMaxAmount,
    
    #[msg("Payment proof too long")]
    PaymentProofTooLong,
    
    #[msg("Invalid trade status")]
    InvalidTradeStatus,
    
    #[msg("Trade expired")]
    TradeExpired,
    
    #[msg("Unauthorized confirmation")]
    UnauthorizedConfirmation,
    
    #[msg("Reason too long")]
    ReasonTooLong,
    
    #[msg("Evidence too long")]
    EvidenceTooLong,
    
    #[msg("Unauthorized disputer")]
    UnauthorizedDisputer,
    
    #[msg("Invalid dispute status")]
    InvalidDisputeStatus,
    
    #[msg("Invalid refund percentage")]
    InvalidRefundPercentage,
    
    #[msg("Notes too long")]
    NotesTooLong,
    
    #[msg("Unauthorized admin")]
    UnauthorizedAdmin,
    
    #[msg("Comment too long")]
    CommentTooLong,
    
    #[msg("Trade not completed")]
    TradeNotCompleted,
    
    #[msg("Unauthorized rater")]
    UnauthorizedRater,
    
    #[msg("Unauthorized to cancel")]
    UnauthorizedCancel,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}

