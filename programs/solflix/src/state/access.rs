use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Access {
    pub consumer: Pubkey,
    pub purchase_time: i64,
    pub num_of_days_valid: u32,
    pub bump: u8,
    #[max_len(50)]
    pub resource_key: String,
}