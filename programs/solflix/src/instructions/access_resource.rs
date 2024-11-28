use anchor_lang::prelude::*;
use anchor_lang::system_program::{Transfer, transfer};
use crate::state::{Access, Config, Create};

#[derive(Accounts)]
pub struct AccessResource<'info> {
    #[account(mut)]
    pub accessor: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    #[account(mut)]
    pub admin: SystemAccount<'info>,
    #[account(
        init,
        payer = accessor,
        space = 8 + Access::INIT_SPACE,
        seeds = [b"access", resource_account.seed.as_str().as_bytes(), accessor.key().as_ref()],
        bump
    )]
    pub access_account: Account<'info, Access>,
    #[account(
        seeds = [b"create", resource_account.creator.key().as_ref(), resource_account.seed.as_str().as_bytes()],
        bump = resource_account.bump,
    )]
    pub resource_account: Account<'info, Create>,
    #[account(
        seeds = [b"config"],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

impl<'info> AccessResource<'info> {
    pub fn access_resource(&mut self, bumps: &AccessResourceBumps) -> Result<()> {
        // Transfer price amount from accessor to creator
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.accessor.to_account_info(),
            to: self.maker.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        let mut platform_charges = self.resource_account.price.checked_mul(self.config.charge_percentage as u64).unwrap();
        platform_charges = platform_charges.checked_div(100).unwrap();
        let transfer_amount_to_creator = self.resource_account.price.checked_sub(platform_charges).unwrap();
        msg!("{}", platform_charges);
        msg!("{}", transfer_amount_to_creator);
        transfer(cpi_context, transfer_amount_to_creator)?;

        // Transfer to platform
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: self.accessor.to_account_info(),
            to: self.admin.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_context, platform_charges)?;

        // Create Access PDA
        self.access_account.set_inner(Access {
            resource_key: self.resource_account.resource_key.clone(),
            consumer: self.accessor.key(),
            purchase_time: Clock::get()?.unix_timestamp,
            num_of_days_valid: self.resource_account.num_of_days,
            bump: bumps.access_account,
        });
        Ok(())
    }
}