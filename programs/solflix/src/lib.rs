use anchor_lang::prelude::*;

declare_id!("BFpFTmDwDNygSW9iL1UErkpDGTDiJFcjZh73DJ1vRu47");

mod state;

#[program]
pub mod solflix {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
