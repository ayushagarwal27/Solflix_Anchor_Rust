use anchor_lang::prelude::*;
use crate::state::Create;
use crate::error::CustomError;

#[derive(Accounts)]
#[instruction(_price:u64,  num_of_days: u32, _resource_key:String,_title:String, _description:String, seed:String
)]
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
    pub fn create_resource(&mut self, price: u64, num_of_days: u32, resource_key: String, title: String, description: String, seed: String, bumps: &CreateResourceBumps) -> Result<()> {
        require!(price > 0, CustomError::PriceCantBeZero);
        require!(num_of_days > 0 && num_of_days <= 365, CustomError::IncorrectNumOfDays);
        require!(resource_key.len() >= 6 && resource_key.len() <= 50, CustomError::IncorrectSizeOfResourceKey);
        require!(seed.len() == 31, CustomError::IncorrectSeedSize);

        self.create_account.set_inner(Create {
            price,
            creator: self.creator.key(),
            resource_key,
            seed,
            title,
            description,
            num_of_days,
            bump: bumps.create_account,
        });
        Ok(())
    }
}