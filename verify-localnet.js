import { Connection, PublicKey } from '@solana/web3.js';

async function verifyLocalnetDelegation() {
  console.log('🔍 Verifying delegation on localnet...');
  
  const connection = new Connection('http://localhost:8899', 'confirmed');
  const programId = new PublicKey('8mKiRaRw4TaMhdMeCjqMtXFxgc4Kv863nLECCcZrYb9F');
  
  // Get all program accounts
  const allAccounts = await connection.getProgramAccounts(programId);
  console.log(`📊 Found ${allAccounts.length} program accounts on localnet`);
  
  for (const { pubkey, account } of allAccounts) {
    console.log(`   ${pubkey.toString()} - Size: ${account.data.length} bytes`);
  }
}

verifyLocalnetDelegation().catch(console.error);
