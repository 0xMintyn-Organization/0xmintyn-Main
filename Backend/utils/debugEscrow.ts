/**
 * Debug utility to check escrow account data and verify PDA derivation
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { RPC_URL } from "./mintynPayment";
import { ESCROW_PROGRAM_ID, deriveEscrowPDAs, objectIdToBytes } from "./escrowContract";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { getAdminKeypair } from "./mintynPayment";
import fs from "fs";
import path from "path";

/**
 * Fetch and decode escrow account data from blockchain
 */
export async function debugEscrowAccount(
  buyerWallet: PublicKey,
  sellerWallet: PublicKey,
  offerId: string
): Promise<void> {
  try {
    console.log("\n=== ESCROW DEBUG INFO ===\n");
    
    const connection = new Connection(RPC_URL, "confirmed");
    const adminKeypair = getAdminKeypair();
    const wallet = new Wallet(adminKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });

    // Load IDL
    const idlPath = path.join(
      process.cwd(),
      "..",
      "Frontend",
      "public",
      "idl",
      "escrow_updated.json"
    );
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const program = new Program(idl as any, ESCROW_PROGRAM_ID, provider);

    // Convert offer ID to bytes
    const offerIdBytes = objectIdToBytes(offerId);
    console.log("📋 Offer ID Info:");
    console.log("   Offer ID (string):", offerId);
    console.log("   Offer ID (hex):", Buffer.from(offerId, 'hex').toString('hex'));
    console.log("   Offer ID (bytes):", offerIdBytes);
    console.log("   Offer ID (bytes hex):", Buffer.from(offerIdBytes).toString('hex'));
    console.log("");

    // Derive PDAs
    const { escrowAccount, escrowVault } = deriveEscrowPDAs(buyerWallet, sellerWallet, offerId);
    console.log("🔑 PDA Addresses:");
    console.log("   Escrow Account:", escrowAccount.toString());
    console.log("   Escrow Vault:", escrowVault.toString());
    console.log("");

    // Check if escrow account exists
    const escrowAccountInfo = await connection.getAccountInfo(escrowAccount);
    if (!escrowAccountInfo) {
      console.log("❌ Escrow account does NOT exist on-chain!");
      console.log("   This means the escrow was never created or the PDA derivation is wrong.");
      return;
    }

    console.log("✅ Escrow account exists on-chain");
    console.log("   Account owner:", escrowAccountInfo.owner.toString());
    console.log("   Account data length:", escrowAccountInfo.data.length, "bytes");
    console.log("");

    // Try to decode escrow account data
    try {
      const escrowData = await program.account.escrowAccount.fetch(escrowAccount);
      console.log("📊 Escrow Account Data:");
      console.log("   Buyer:", escrowData.buyer.toString());
      console.log("   Seller:", escrowData.seller.toString());
      console.log("   Admin:", escrowData.admin.toString());
      console.log("   Amount:", escrowData.amount.toString());
      console.log("   Status:", escrowData.status.toString(), "(0=Pending, 1=Completed, 2=Refunded)");
      console.log("   Offer ID (on-chain):", Buffer.from(escrowData.offerId).toString('hex'));
      console.log("   Bump:", escrowData.bump);
      console.log("");

      // Compare offer IDs
      const onChainOfferId = Buffer.from(escrowData.offerId).toString('hex');
      const providedOfferId = Buffer.from(offerIdBytes).toString('hex');
      console.log("🔍 Offer ID Comparison:");
      console.log("   On-chain offer_id (hex):", onChainOfferId);
      console.log("   Provided offer_id (hex):", providedOfferId);
      if (onChainOfferId === providedOfferId) {
        console.log("   ✅ Offer IDs MATCH!");
      } else {
        console.log("   ❌ Offer IDs DO NOT MATCH!");
        console.log("   This is the problem! The offer_id bytes don't match.");
      }
      console.log("");

      // Compare buyer/seller
      console.log("🔍 Buyer/Seller Comparison:");
      console.log("   On-chain buyer:", escrowData.buyer.toString());
      console.log("   Provided buyer:", buyerWallet.toString());
      if (escrowData.buyer.toString() === buyerWallet.toString()) {
        console.log("   ✅ Buyer addresses MATCH!");
      } else {
        console.log("   ❌ Buyer addresses DO NOT MATCH!");
      }
      console.log("   On-chain seller:", escrowData.seller.toString());
      console.log("   Provided seller:", sellerWallet.toString());
      if (escrowData.seller.toString() === sellerWallet.toString()) {
        console.log("   ✅ Seller addresses MATCH!");
      } else {
        console.log("   ❌ Seller addresses DO NOT MATCH!");
      }
      console.log("");

      // Verify vault PDA derivation
      console.log("🔍 Vault PDA Verification:");
      const ESCROW_SEED = Buffer.from("escrow");
      const VAULT_SEED = Buffer.from("vault");
      const [derivedVault, vaultBump] = PublicKey.findProgramAddressSync(
        [
          ESCROW_SEED,
          escrowData.buyer.toBuffer(),
          escrowData.seller.toBuffer(),
          Buffer.from(escrowData.offerId),
          VAULT_SEED
        ],
        ESCROW_PROGRAM_ID
      );
      console.log("   Derived vault (from on-chain data):", derivedVault.toString());
      console.log("   Expected vault (from provided data):", escrowVault.toString());
      if (derivedVault.toString() === escrowVault.toString()) {
        console.log("   ✅ Vault PDAs MATCH!");
      } else {
        console.log("   ❌ Vault PDAs DO NOT MATCH!");
        console.log("   This means the vault PDA derivation is wrong.");
      }
      console.log("");

      // Check vault token account
      const vaultAccountInfo = await connection.getAccountInfo(escrowVault);
      if (vaultAccountInfo) {
        console.log("✅ Vault token account exists");
        // Try to get token account data
        try {
          const { getAccount } = await import("@solana/spl-token");
          const vaultTokenAccount = await getAccount(connection, escrowVault);
          console.log("   Vault balance:", vaultTokenAccount.amount.toString());
          console.log("   Vault owner (authority):", vaultTokenAccount.owner.toString());
          console.log("   Expected owner (escrow program):", ESCROW_PROGRAM_ID.toString());
          if (vaultTokenAccount.owner.toString() === ESCROW_PROGRAM_ID.toString()) {
            console.log("   ✅ Vault owner is correct (escrow program)");
          } else {
            console.log("   ❌ Vault owner is WRONG!");
            console.log("   This means the vault was created with wrong PDA seeds.");
          }
        } catch (tokenError: any) {
          console.log("   ⚠️  Could not fetch token account data:", tokenError.message);
        }
      } else {
        console.log("❌ Vault token account does NOT exist!");
        console.log("   This means the vault was never created or the PDA derivation is wrong.");
      }

    } catch (decodeError: any) {
      console.log("❌ Failed to decode escrow account:", decodeError.message);
      console.log("   This might mean the account structure is wrong or the program ID is incorrect.");
    }

    console.log("\n=== END DEBUG INFO ===\n");

  } catch (error: any) {
    console.error("❌ Debug error:", error.message);
    throw error;
  }
}

