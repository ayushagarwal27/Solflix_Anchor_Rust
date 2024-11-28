use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Create {
    pub creator: Pubkey,
    pub price: u64,
    pub num_of_days: u32,
    pub bump: u8,
    #[max_len(31)]
    pub seed: String,
    #[max_len(50)]
    pub resource_key: String,
    #[max_len(50)]
    pub title: String,
    #[max_len(200)]
    pub description: String,
}