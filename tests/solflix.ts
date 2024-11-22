import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { Solflix } from "../target/types/solflix";
import { expect } from "chai";

describe("solflix", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let connection = provider.connection;

  const program = anchor.workspace.Solflix as Program<Solflix>;
  const creator = Keypair.generate();
  const consumer = Keypair.generate();
  const resourceKey = "8aa6b899-a671-4583-99bf-4df30a1a4b67";
  const config = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  )[0];

  before("prepare", async () => {
    await airdrop(connection, creator.publicKey);
    await airdrop(connection, consumer.publicKey);
    console.log("airdropped");
  });

  it("Initialize Config", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accountsPartial({
        admin: provider.wallet.publicKey,
        config,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    const onChain_config = await program.account.config.fetch(config);
    expect(onChain_config.chargePercentage).equal(10);
    expect(onChain_config.admin.toString()).equals(
      provider.wallet.publicKey.toString()
    );
  });

  it("Creates a Resource", async () => {
    let resourceHash = await sha256(
      resourceKey + 2 + creator.publicKey.toString()
    );

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
        new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL),
        2,
        resourceKey,
        resourceHash.substring(0, 31)
      )
      .accountsPartial({
        creator: creator.publicKey,
        createAccount: resource,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();
    console.log("Your transaction signature", tx);
    const onChainResource = await program.account.create.fetch(resource);
    expect(onChainResource.numOfDays).equal(2);
    expect(onChainResource.resourceKey).equals(resourceKey);
    expect(onChainResource.price.toNumber()).equal(
      0.5 * anchor.web3.LAMPORTS_PER_SOL
    );
  });

  it("Access the resource", async () => {
    let resourceHash = await sha256(
      resourceKey + 2 + creator.publicKey.toString()
    );

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
    const preBalance = await connection.getBalance(creator.publicKey);
    const preBalanceAdmin = await connection.getBalance(
      provider.wallet.publicKey
    );
    console.log("Pre:");
    console.log(preBalance / anchor.web3.LAMPORTS_PER_SOL);
    console.log(preBalanceAdmin / anchor.web3.LAMPORTS_PER_SOL);

    const tx = await program.methods
      .accessResource()
      .accountsPartial({
        accessor: consumer.publicKey,
        maker: creator.publicKey,
        admin: provider.wallet.publicKey,
        resourceAccount: resource,
        config,
        accessAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([consumer])
      .rpc();
    console.log("Your transaction signature", tx);
    console.log("Post: ");
    const postBalance = await connection.getBalance(creator.publicKey);
    const postBalanceAdmin = await connection.getBalance(
      provider.wallet.publicKey
    );
    console.log(postBalance / anchor.web3.LAMPORTS_PER_SOL);
    console.log(postBalanceAdmin / anchor.web3.LAMPORTS_PER_SOL);

    const onChainAccessAccount = await program.account.access.fetch(
      accessAccount
    );
    expect(onChainAccessAccount.resourceKey).equals(resourceKey);
    expect(onChainAccessAccount.numOfDaysValid).equals(2);
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
