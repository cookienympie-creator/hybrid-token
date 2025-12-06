use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

declare_id!("8mKiRaRw4TaMhdMeCjqMtXFxgc4Kv863nLECCcZrYb9F");

// CONSTANTS
const AUTHORITY_SEED: &[u8] = b"authority";
const MAX_TRANSFER_LIMIT: u64 = 100 * 1_000_000_000; 

#[program]
pub mod hybrid_token {
    use super::*;

    // 1. INITIALIZE DELEGATION
    pub fn initialize_delegation(
        ctx: Context<InitializeDelegation>,
    ) -> Result<()> {
        let delegation = &mut ctx.accounts.delegation_state;
        let approved_amount = MAX_TRANSFER_LIMIT;

        // Set State
        delegation.user = ctx.accounts.user.key();
        // FIXED: Field name now matches the context account name
        delegation.user_token_account = ctx.accounts.user_token_account.key();
        delegation.amount_delegated = approved_amount;
        delegation.is_active = true;

        // Approve Logic
        let cpi_accounts = token::Approve {
            to: ctx.accounts.user_token_account.to_account_info(),
            delegate: ctx.accounts.program_authority.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::approve(cpi_ctx, approved_amount)?;

        msg!("Delegation initialized. Limit: {}", approved_amount);
        Ok(())
    }

    // 2. EXECUTE STRATEGY
    pub fn execute_strategy(ctx: Context<ExecuteStrategy>, amount: u64) -> Result<()> {
        let delegation = &ctx.accounts.delegation_state;

        // Validation
        require!(delegation.is_active, ErrorCode::DelegationRevoked);
        require!(amount <= delegation.amount_delegated, ErrorCode::TransferLimitExceeded);
        require!(amount <= MAX_TRANSFER_LIMIT, ErrorCode::AmountExceedsHardLimit);

        // Signer Seeds
        let bump = ctx.bumps.program_authority;
        let seeds = &[AUTHORITY_SEED, &[bump]];
        let signer = &[&seeds[..]];

        // Transfer Logic
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.program_authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, amount)?;

        msg!("Strategy executed. Amount: {}", amount);
        Ok(())
    }

    // 3. CLOSE DELEGATION
    pub fn close_delegation(ctx: Context<CloseDelegation>) -> Result<()> {
        let delegation = &mut ctx.accounts.delegation_state;
        delegation.is_active = false;

        let cpi_accounts = token::Revoke {
            source: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::revoke(cpi_ctx)?;

        msg!("Delegation closed for user: {}", ctx.accounts.user.key());
        Ok(())
    }
}

// ====================================================
// CONTEXTS
// ====================================================

#[derive(Accounts)]
pub struct InitializeDelegation<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + DelegationState::LEN,
        seeds = [b"delegation", user.key().as_ref()],
        bump
    )]
    pub delegation_state: Account<'info, DelegationState>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(seeds = [AUTHORITY_SEED], bump)]
    /// CHECK: PDA
    pub program_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ExecuteStrategy<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"delegation", delegation_state.user.as_ref()],
        bump,
        // FIXED: This now works because DelegationState has a field named 'user_token_account'
        has_one = user_token_account 
    )]
    pub delegation_state: Account<'info, DelegationState>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    #[account(seeds = [AUTHORITY_SEED], bump)]
    /// CHECK: PDA signer
    pub program_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseDelegation<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        close = user,
        seeds = [b"delegation", user.key().as_ref()],
        bump,
        constraint = delegation_state.user == user.key()
    )]
    pub delegation_state: Account<'info, DelegationState>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ====================================================
// STATE & ERRORS
// ====================================================

#[account]
pub struct DelegationState {
    pub user: Pubkey,
    // FIXED: Renamed from 'token_account' to 'user_token_account' to match the Context
    pub user_token_account: Pubkey, 
    pub amount_delegated: u64,
    pub is_active: bool,
}

impl DelegationState {
    pub const LEN: usize = 32 + 32 + 8 + 1; 
}

#[error_code]
pub enum ErrorCode {
    #[msg("Delegation revoked")]
    DelegationRevoked,
    #[msg("Transfer amount exceeds the user's delegated limit")]
    TransferLimitExceeded,
    #[msg("Amount exceeds the contract's global hard limit (100)")]
    AmountExceedsHardLimit,
}
