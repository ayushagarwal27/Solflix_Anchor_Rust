use anchor_lang::prelude::*;

#[derive(account)]
#[derive(InitSpace)]
pub struct Create {
    pub creator: Pubkey,
    #[max_len(50)]
    pub price: u64,
    pub num_of_days: u32,
    pub bump: u8,
    pub resource_key: String,
}