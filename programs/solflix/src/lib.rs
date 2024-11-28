use anchor_lang::prelude::*;

declare_id!("BFpFTmDwDNygSW9iL1UErkpDGTDiJFcjZh73DJ1vRu47");

mod state;
mod instructions;
mod error;

use instructions::*;

#[program]
pub mod solflix {
    use super::*;

    pub fn initialize(ctx: Context<Init>) -> Result<()> {
        ctx.accounts.initialize_config(&ctx.bumps)?;
        Ok(())
    }

    pub fn create_resource(ctx: Context<CreateResource>, price: u64, num_of_days: u32, resource_key: String, title: String, description: String, seed: String) -> Result<()> {
        ctx.accounts.create_resource(price, num_of_days, resource_key, title, description, seed, &ctx.bumps)?;
        Ok(())
    }

    pub fn access_resource(ctx: Context<AccessResource>) -> Result<()> {
        ctx.accounts.access_resource(&ctx.bumps)?;
        Ok(())
    }
}
