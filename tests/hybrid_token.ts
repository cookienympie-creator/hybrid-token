import * as anchor from "@coral-xyz/anchor";
import { createMint, createAccount, mintTo } from "@solana/spl-token";

async function main() {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  // Use the correct program name with underscore
  const program = anchor.workspace.hybrid_token;
  
  console.log("Using program:", program.programId.toString());
  
  // Use the provider's wallet
  const user = (provider.wallet as anchor.Wallet).payer;
  
  // Create test token
  const mint = await createMint(
    provider.connection, 
    user,
    user.publicKey,
    null,
    9
  );

  // Create token account
  const userTokenAccount = await createAccount(
    provider.connection,
    user,
    mint,
    user.publicKey
  );

  // Mint test tokens
  await mintTo(
    provider.connection,
    user,
    mint,
    userTokenAccount,
    user,
    1000 * 10**9
  );
  
  // Try to call setup_delegation (check your actual instruction name)
  try {
    const tx = await program.methods
      .setupDelegation(new anchor.BN(1000 * 10**9), null) // max_amount, expiry_offset
      .accounts({
        user: user.publicKey,
        userTokenAccount: userTokenAccount,
        programAuthority: program.programId, // Your program as authority
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
      
    console.log("Delegation granted! TX:", tx);
    console.log("User pubkey:", user.publicKey.toString());
    console.log("Now bot can transfer from this account");
  } catch (error) {
    console.error("Error setting up delegation:", error);
    
    // Show available methods to see the correct names
    console.log("Available methods:", Object.keys(program.methods));
  }
}

main().catch(console.error);
