import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { Solflix } from "../target/types/solflix";
import { expect } from "chai";
import { randomBytes } from "crypto";

describe("solflix", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  let connection = provider.connection;

  const program = anchor.workspace.Solflix as Program<Solflix>;
  const creator = Keypair.generate();
  const resourceKey = "8aa6b899-a671-4583-99bf-4df30a1a4b67";
  const config = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  )[0];

  before("prepare", async () => {
    await airdrop(connection, creator.publicKey);
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
    // Add your test here.
    const hash = await sha256(
      "create" + resourceKey + 2 + creator.publicKey.toString()
    );
    // console.log(hash.length);
    const resource = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("create"),
        creator.publicKey.toBytes(),
        Buffer.from(hash.substring(0, 31)),
      ],
      program.programId
    )[0];

    console.log(hash.substring(0, 31));

    const tx = await program.methods
      .createResource(
        new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL),
        2,
        resourceKey,
        hash.substring(0, 31)
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
