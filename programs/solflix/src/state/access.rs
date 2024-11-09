use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Access {
    pub consumer: Pubkey,
    pub time: u64,
    pub bump: u8,
    #[max_len(50)]
    pub resource_key: String,
}