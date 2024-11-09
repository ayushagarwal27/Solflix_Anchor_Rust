use anchor_lang::prelude::*;
use crate::state::Create;

#[derive(Accounts)]
#[instruction(num_of_days: u32, resource_key:String)]
pub struct CreateResource<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        seeds = [b"create", creator.key().as_ref(), resource_key.as_str().as_bytes() , num_of_days.to_le_bytes().as_ref()],
        space = 8 + Create::INIT_SPACE,
        bump,
    )]
    pub create_account: Account<'info, Create>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateResource<'info> {
    pub fn create_resource_account(&mut self, price: u64, resource_key: String, num_of_days: u32, bumps: &CreateResourceBumps) -> Result<()> {
        self.create_account.set_inner(Create {
            price,
            creator: self.creator.key(),
            resource_key,
            num_of_days,
            bump: bumps.create_account,
        });
        Ok(())
    }
}