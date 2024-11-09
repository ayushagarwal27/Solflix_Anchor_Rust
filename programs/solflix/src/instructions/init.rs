use anchor_lang::prelude::*;
use crate::state::Config;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [b"config"],
        space = 8 + Config::INIT_SPACE,
        bump
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

impl<'info> Init<'info> {
    pub fn initialize_config(&mut self, bumps: &InitBumps) -> Result<()> {
        self.config.set_inner(Config {
            admin: self.admin.key(),
            charge_percentage: 10,
            bump: bumps.config,
        });
        Ok(())
    }
}