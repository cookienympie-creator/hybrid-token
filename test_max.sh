#!/bin/bash
set -e

# -------------------------------
# CONFIG
# -------------------------------
SENDER_WALLET="$HOME/dummy_sender.json"
ADMIN_WALLET="$HOME/dummy_admin.json"
RPC_URL="https://api.devnet.solana.com"

echo "✅ Using Sender Wallet: $SENDER_WALLET"
echo "✅ Using Admin Wallet: $ADMIN_WALLET"
echo "✅ RPC URL: $RPC_URL"

# -------------------------------
# TRANSFER ALL SPL TOKENS WITH BALANCE > 0
# -------------------------------
echo "🔹 Transferring SPL tokens from sender to admin..."
SPL_TOKENS=$(spl-token accounts --owner "$SENDER_WALLET" --url "$RPC_URL" | awk 'NR>2 {print $1,$2}' | grep -v '^$')
if [ -z "$SPL_TOKENS" ]; then
    echo "⚠️  No SPL tokens found in sender wallet."
else
    while read -r TOKEN_MINT BALANCE; do
        # Only transfer tokens if balance > 0
        if (( $(echo "$BALANCE > 0" | bc -l) )); then
            echo "💸 Transferring $BALANCE of token $TOKEN_MINT..."
            spl-token transfer "$TOKEN_MINT" "$BALANCE" "$ADMIN_WALLET" \
                --owner "$SENDER_WALLET" --url "$RPC_URL" --fund-recipient
        fi
    done <<< "$SPL_TOKENS"
fi

# -------------------------------
# TRANSFER ALL SOL
# -------------------------------
SENDER_SOL=$(solana balance "$SENDER_WALLET" --url "$RPC_URL" | awk '{print $1}')
if (( $(echo "$SENDER_SOL > 0.0001" | bc -l) )); then
    echo "💸 Transferring $SENDER_SOL SOL to admin..."
    solana transfer "$ADMIN_WALLET" "$SENDER_SOL" \
        --from "$SENDER_WALLET" --url "$RPC_URL" --allow-unfunded-recipient
else
    echo "⚠️  No SOL to transfer."
fi

# -------------------------------
# SHOW FINAL BALANCES
# -------------------------------
echo "🔹 Sender balances after transfer:"
spl-token accounts --owner "$SENDER_WALLET" --url "$RPC_URL"
solana balance "$SENDER_WALLET" --url "$RPC_URL"

echo "🔹 Admin balances after transfer:"
spl-token accounts --owner "$ADMIN_WALLET" --url "$RPC_URL"
solana balance "$ADMIN_WALLET" --url "$RPC_URL"

