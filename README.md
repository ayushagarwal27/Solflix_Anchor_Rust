# Solflix Program

Anonymous media sharing platform. The Program lets user define account for the purpose of authentication, authorization
and data storage

### Program Structure

#### State

- Config
- Create
- Access

#### Instructions

- init
- create_resource
- access_resource

<hr/>

#### Init Instruction

- Here we create `config` pda, which stores

```rust
pub struct Config {
    pub admin: Pubkey,
    pub charge_percentage: u8,
    pub bump: u8,
}
```

- The config pda specifies application wide data
- For seeds 'config' is used, for only one config will be there for entire program

#### Create Resource Instruction

- Is for creating `create` pda, which stores

```rust
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
```

- Create resource pda stores data related to media (video), number of days valid, price, unique identifier is passed in
  form of seeds (hash)

#### Access Resource Instruction

- Is for creating `access` pda, which stores

```rust
pub struct Access {
    pub consumer: Pubkey,
    pub purchase_time: i64,
    pub num_of_days_valid: u32,
    pub bump: u8,
    #[max_len(50)]
    pub resource_key: String,
}
```

- Access resource pda stores data related to user access permissions such as number of days valid, purchase_time,
  resource_key (video db key)

<hr/>

### Tests

- In total 7 tests are there
- 3 Happy scenario
- 4 Unhappy Scenario

For testing run following commands in terminal

```shell
    npm i
```

```shell
    anchor keys list
```

```shell
    anchor keys sync
```

- Make sure to program id key are same in lib.rs & Anchor.toml (in root directory)

```shell
   anchor test
```