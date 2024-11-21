use anchor_lang::prelude::*;
use crate::state::Create;

#[derive(Accounts)]
#[instruction(_price:u64,  num_of_days: u32, _resource_key:String, seed:String)]
pub struct CreateResource<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        seeds = [b"create", creator.key().as_ref(), seed.as_str().as_bytes()],
        space = 8 + Create::INIT_SPACE,
        bump,
    )]
    pub create_account: Account<'info, Create>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateResource<'info> {
    pub fn create_resource(&mut self, price: u64, num_of_days: u32, resource_key: String, seed: String, bumps: &CreateResourceBumps) -> Result<()> {
        self.create_account.set_inner(Create {
            price,
            creator: self.creator.key(),
            resource_key,
            seed,
            num_of_days,
            bump: bumps.create_account,
        });
        Ok(())
    }
}