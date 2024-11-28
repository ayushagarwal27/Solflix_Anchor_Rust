use anchor_lang::error_code;

#[error_code]
pub enum CustomError {
    #[msg("Price must be greater than 0")]
    PriceCantBeZero,
    #[msg("Resource key size must be between 6 to 50 character length")]
    IncorrectSizeOfResourceKey,
    #[msg("Number of days must be between 1 to 365 days")]
    IncorrectNumOfDays,
    #[msg("Seed size must be 31")]
    IncorrectSeedSize,
}