import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { Solflix } from "../target/types/solflix";
import { expect } from "chai";

describe("solflix", () => {
  // Provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let connection = provider.connection;

  const program = anchor.workspace.Solflix as Program<Solflix>;

  // Accounts
  const creator = Keypair.generate();
  const admin = Keypair.generate();
  const consumer = Keypair.generate();
  const config = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  )[0];

  // Constants
  const resourceKey = "8aa6b899-a671-4583-99bf-4df30a1a4b67";

  let resourceHash = "";

  // Airdrop SOL
  before("prepare", async () => {
    // Airdrop SOL
    await airdrop(connection, creator.publicKey);
    await airdrop(connection, admin.publicKey);
    await airdrop(connection, consumer.publicKey);

    // Create Resource Hash
    resourceHash = await sha256(resourceKey + 2 + creator.publicKey.toString());
  });

  it("Initialize Config", async () => {
    const tx = await program.methods
      .initialize()
      .accountsPartial({
        admin: admin.publicKey,
        config,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    console.log("Config created! Transaction signature: ", tx);
    const onChainConfig = await program.account.config.fetch(config);
    // checks
    expect(onChainConfig.chargePercentage).equal(10);
    expect(onChainConfig.admin.toString()).equals(admin.publicKey.toString());
  });

  it("Creates a Resource", async () => {
    // Resource PDA
    console.log(program.programId);
    const resource = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("create"),
        creator.publicKey.toBytes(),
        Buffer.from(resourceHash.substring(0, 31)),
      ],
      program.programId
    )[0];
    const tx = await program.methods
      .createResource(
        new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL), // price
        2, // num of days valid
        resourceKey, // resource unique key
        "Title",
        "Description",
        resourceHash.substring(0, 31) // resource seed (hash)
      )
      .accountsPartial({
        creator: creator.publicKey,
        createAccount: resource,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();
    console.log("Resource Created! Transaction signature: ", tx);
    const onChainResource = await program.account.create.fetch(resource);
    // checks
    expect(onChainResource.numOfDays).equal(2);
    expect(onChainResource.resourceKey).equals(resourceKey);
    expect(onChainResource.price.toNumber()).equal(
      0.5 * anchor.web3.LAMPORTS_PER_SOL
    );
  });

  it("Access the resource", async () => {
    const resource = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("create"),
        creator.publicKey.toBytes(),
        Buffer.from(resourceHash.substring(0, 31)),
      ],
      program.programId
    )[0];
    const accessAccount = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("access"),
        Buffer.from(resourceHash.substring(0, 31)),
        consumer.publicKey.toBytes(),
      ],
      program.programId
    )[0];

    // Pre balance of creator and admin
    const preTransferBalanceCreator = await connection.getBalance(
      creator.publicKey
    );
    const preBalanceAdmin = await connection.getBalance(admin.publicKey);

    // Resource create tx
    const tx = await program.methods
      .accessResource()
      .accountsPartial({
        accessor: consumer.publicKey,
        maker: creator.publicKey,
        admin: admin.publicKey,
        resourceAccount: resource,
        config,
        accessAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([consumer])
      .rpc();
    console.log("Access Granted! Transaction signature: ", tx);

    // Post balance of creator and admin
    const postTransferBalanceCreator = await connection.getBalance(
      creator.publicKey
    );
    const postBalanceAdmin = await connection.getBalance(admin.publicKey);

    // Calculate Price and Platform-Charges
    const price = 0.5 * anchor.web3.LAMPORTS_PER_SOL;
    const platformCharges = (price * 10) / 100;

    // Check Pre- & Post-balance of Creator and Admin
    expect(preTransferBalanceCreator + (price - platformCharges)).equal(
      postTransferBalanceCreator
    );
    expect(preBalanceAdmin + platformCharges).equals(postBalanceAdmin);

    const onChainAccessAccount = await program.account.access.fetch(
      accessAccount
    );
    // Accounts info check
    expect(onChainAccessAccount.resourceKey).equals(resourceKey);
    expect(onChainAccessAccount.numOfDaysValid).equals(2);
  });

  //   Unhappy Scenario
  it("Cannot set price to be 0", async () => {
    // Resource PDA
    const resource = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("create"),
        creator.publicKey.toBytes(),
        Buffer.from("ce63119f-db87-47fc-8bac-7f4b401"),
      ],
      program.programId
    )[0];
    try {
      const tx = await program.methods
        .createResource(
          new anchor.BN(0), // price
          200, // num of days valid
          resourceKey, // resource unique key
          "Title",
          "Description",
          "ce63119f-db87-47fc-8bac-7f4b401" // resource seed (hash) 3
        )
        .accountsPartial({
          creator: creator.publicKey,
          createAccount: resource,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
    } catch (_err) {
      const err = anchor.AnchorError.parse(_err.logs);
      expect(err.error.errorCode.code).equals("PriceCantBeZero");
    }
  });

  it("Cannot set num of days more than 365, while creating resource", async () => {
    // Resource PDA
    const resource = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("create"),
        creator.publicKey.toBytes(),
        Buffer.from("ce63119f-db87-47fc-8bac-7f4b401"),
      ],
      program.programId
    )[0];
    try {
      const tx = await program.methods
        .createResource(
          new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL), // price
          400, // num of days valid
          resourceKey, // resource unique key
          "Title",
          "Description",
          "ce63119f-db87-47fc-8bac-7f4b401" // resource seed (hash) 3
        )
        .accountsPartial({
          creator: creator.publicKey,
          createAccount: resource,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
    } catch (_err) {
      const err = anchor.AnchorError.parse(_err.logs);
      expect(err.error.errorCode.code).equals("IncorrectNumOfDays");
    }
  });

  it("Cannot set resource key more than size 50", async () => {
    // Resource PDA
    const resource = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("create"),
        creator.publicKey.toBytes(),
        Buffer.from("ce63119f-db87-47fc-8bac-7f4b401"),
      ],
      program.programId
    )[0];
    try {
      const tx = await program.methods
        .createResource(
          new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL), // price
          300, // num of days valid
          "ce63119f-db87-47fc-8bac-7f4b401-ce63119f-db87-47fc-8bac-7f4b401", // resource unique key (size = 62)
          "Title",
          "Description",
          "ce63119f-db87-47fc-8bac-7f4b401" // resource seed (hash)
        )
        .accountsPartial({
          creator: creator.publicKey,
          createAccount: resource,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
    } catch (_err) {
      const err = anchor.AnchorError.parse(_err.logs);
      expect(err.error.errorCode.code).equals("IncorrectSizeOfResourceKey");
    }
  });

  it("Cannot set seed less than 31, while creating resource", async () => {
    // Resource PDA
    const resource = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("create"),
        creator.publicKey.toBytes(),
        Buffer.from("ce63119f-db87-47fc-8bac-7f4b40"),
      ],
      program.programId
    )[0];
    try {
      const tx = await program.methods
        .createResource(
          new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL), // price
          2, // num of days valid
          resourceKey, // resource unique key
          "Title",
          "Description",
          "ce63119f-db87-47fc-8bac-7f4b40" // resource seed (hash) 30 (length)
        )
        .accountsPartial({
          creator: creator.publicKey,
          createAccount: resource,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
    } catch (_err) {
      const err = anchor.AnchorError.parse(_err.logs);
      expect(err.error.errorCode.code).equals("IncorrectSeedSize");
    }
  });
});

async function airdrop(connection: any, address: any, amount = 1000000000) {
  await connection.confirmTransaction(
    await connection.requestAirdrop(address, amount),
    "confirmed"
  );
}

async function sha256(message) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
