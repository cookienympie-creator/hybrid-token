import * as anchor from "@coral-xyz/anchor";
import { createMint, createAccount, mintTo } from "@solana/spl-token";
import { readFileSync, writeFileSync } from 'fs';
import { Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Load IDL
  const idl = JSON.parse(readFileSync('./target/idl/hybrid_token.json', 'utf8'));
  const program = new anchor.Program(idl, provider);
  
  console.log("Program:", program.programId.toString());
  
  // Option 3: Create a NEW user keypair for a different PDA
  const newUser = anchor.web3.Keypair.generate();
  console.log("🆕 NEW User wallet:", newUser.publicKey.toString());
  
  // Save the new keypair to a file for future use
  const newWalletPath = './devnet-user2.json';
  writeFileSync(newWalletPath, JSON.stringify(Array.from(newUser.secretKey)));
  console.log("💾 New wallet saved to:", newWalletPath);
  
  // ========== FIX: AIRDROP SOL TO NEW WALLET ==========
  console.log("💰 Requesting airdrop for new wallet...");
  try {
    const airdropSignature = await provider.connection.requestAirdrop(
      newUser.publicKey,
      1 * LAMPORTS_PER_SOL // 1 SOL
    );
    
    // Wait for airdrop confirmation
    await provider.connection.confirmTransaction(airdropSignature, 'confirmed');
    console.log("✅ Airdrop successful! Transaction:", airdropSignature);
    
    // Check balance
    const balance = await provider.connection.getBalance(newUser.publicKey);
    console.log("💰 New wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");
    
  } catch (error) {
    console.error("❌ Airdrop failed:", error);
    // If airdrop fails, you might need to manually fund the wallet
    console.log("💡 If on devnet, the airdrop might be rate limited.");
    console.log("💡 If on localnet, make sure your validator is running with --rpc-pubsub-enable-block-subscription");
    return;
  }
  
  // Get PDA for the NEW user - this will be DIFFERENT from the old one
  const [delegationPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('delegation'), newUser.publicKey.toBuffer()],
    program.programId
  );
  
  console.log("🆕 NEW Delegation PDA:", delegationPda.toString());
  
  // Check if delegation already exists for this NEW user
  let existingDelegation = null;
  try {
    existingDelegation = await (program.account as any).delegation.fetch(delegationPda);
    console.log("❌ Delegation already exists for new user!");
    console.log("Delegation details:", {
      user: existingDelegation.user.toString(),
      expiration: new Date(Number(existingDelegation.expiration) * 1000),
      maxAmount: existingDelegation.maxAmount.toString(),
      isActive: existingDelegation.isActive
    });
    
    // Since we want a fresh start, let's revoke this one first
    console.log("Revoking existing delegation for new user...");
    
    // We need a token account to revoke, so let's create one
    const mint = await createMint(provider.connection, newUser, newUser.publicKey, null, 9);
    const userTokenAccount = await createAccount(provider.connection, newUser, mint, newUser.publicKey);
    
    const revokeTx = await program.methods.revokeDelegation()
      .accounts({
        user: newUser.publicKey,
        delegation: delegationPda,
        userTokenAccount: userTokenAccount,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([newUser])
      .rpc();
    
    console.log("✅ Old delegation revoked for new user!");
    console.log("Revoke transaction:", revokeTx); // FIXED: Changed revokeToken to revokeTx
    
    // Wait for revocation to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.log("✅ No existing delegation found for new user - perfect!");
    existingDelegation = null;
  }
  
  // Create fresh delegation for the NEW user
  console.log("\n🎯 Creating FRESH delegation for NEW user...");
  
  // Create test token for the NEW user
  console.log("Creating test token...");
  const mint = await createMint(provider.connection, newUser, newUser.publicKey, null, 9);
  console.log("🆕 New test token:", mint.toString());
  
  console.log("Creating token account...");
  const userTokenAccount = await createAccount(provider.connection, newUser, mint, newUser.publicKey);
  console.log("🆕 New user token account:", userTokenAccount.toString());
  
  console.log("Minting tokens...");
  await mintTo(provider.connection, newUser, mint, userTokenAccount, newUser, 1500 * 10**9); // Different amount
  console.log("✅ Tokens minted successfully");
  
  // Setup delegation for the NEW user
  console.log("Setting up delegation for NEW user...");
  try {
    const tx = await program.methods.setupDelegation(
      new anchor.BN(1500 * 10**9), // NEW max_amount (different from old user)
      new anchor.BN(21 * 24 * 60 * 60) // NEW duration: 21 days
    )
    .accounts({
      user: newUser.publicKey,
      delegation: delegationPda,
      userTokenAccount: userTokenAccount,
      programAuthority: program.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([newUser])
    .rpc();
    
    console.log("✅ 🆕 NEW delegation setup successful!");
    console.log("Transaction:", tx);
    
    // Verify the new delegation
    console.log("\n🔍 Verifying new delegation...");
    const newDelegation = await (program.account as any).delegation.fetch(delegationPda);
    console.log("🆕 NEW delegation details:", {
      user: newDelegation.user.toString(),
      expiration: new Date(Number(newDelegation.expiration) * 1000),
      maxAmount: newDelegation.maxAmount.toString(),
      isActive: newDelegation.isActive
    });
    
    console.log("\n🎉 SUCCESS! You now have:");
    console.log("   • OLD user: Futp97VJLQJLrvSDUXSfDUQo4GgXM6U5E91JTrmdTrBH");
    console.log("   • NEW user:", newUser.publicKey.toString());
    console.log("   • OLD PDA: DPwPB3vbY96dA6URvr2YGDAR3bDA4EtN4XTytj7bFAyP");
    console.log("   • NEW PDA:", delegationPda.toString());
    console.log("   • Different parameters: 1500 SOL max, 21 days duration");
    
  } catch (error) {
    console.error("❌ Error setting up new delegation:", error);
  }
}

main().catch(console.error);
