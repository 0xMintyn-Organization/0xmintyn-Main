/**
 * Migration Script: Add Wallet Fields to Existing Users (JavaScript Version)
 * 
 * This script adds wallet-related fields (walletAddress, walletProvider, walletConnectedAt, walletPrivateKey)
 * to all existing users that don't have them, without overwriting existing values.
 * 
 * Run with: node scripts/addWalletFieldsToUsers.js
 */

/**
 * NOTE: This JavaScript version requires the TypeScript to be compiled first.
 * For easier execution, use the TypeScript version with ts-node:
 * npx ts-node scripts/addWalletFieldsToUsers.ts
 * 
 * Or use: npm run migrate:wallet-fields
 */

require('dotenv').config();
const mongoose = require('mongoose');

// This will work after TypeScript compilation
// For development, use the TypeScript version instead
let UserModel;
try {
  // Try to load from compiled build folder first
  try {
    const userModule = require('../build/models/user.mode');
    UserModel = userModule.default || userModule;
  } catch {
    // Fallback to source (requires ts-node)
    const userModule = require('../models/user.mode');
    UserModel = userModule.default || userModule;
  }
} catch (error) {
  console.error('Error loading UserModel:', error);
  console.error('Please use the TypeScript version: npx ts-node scripts/addWalletFieldsToUsers.ts');
  process.exit(1);
}

const DB_URI = process.env.DB_URI || process.env.DB_URI || 'mongodb://localhost:27017/your-database';

async function addWalletFieldsToUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await UserModel.find({});
    console.log(`📊 Found ${users.length} users to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updates = [];

    for (const user of users) {
      const updateFields = {};
      let needsUpdate = false;

      // Convert user to plain object to check field existence
      const userObj = user.toObject ? user.toObject() : user;
      const userKeys = Object.keys(userObj);

      // Check walletAddress - add if missing from document
      if (!userKeys.includes('walletAddress')) {
        updateFields.walletAddress = "";
        needsUpdate = true;
      }

      // Check walletProvider - add if missing from document
      if (!userKeys.includes('walletProvider')) {
        updateFields.walletProvider = "";
        needsUpdate = true;
      }

      // Check walletConnectedAt - add if missing from document
      if (!userKeys.includes('walletConnectedAt')) {
        updateFields.walletConnectedAt = null; // Keep as null for Date field
        needsUpdate = true;
      }

      // Check walletPrivateKey - add if missing from document
      if (!userKeys.includes('walletPrivateKey')) {
        updateFields.walletPrivateKey = "";
        needsUpdate = true;
      }

      if (needsUpdate) {
        // Use $set to only update missing fields, preserving existing values
        await UserModel.findByIdAndUpdate(
          user._id,
          { $set: updateFields },
          { new: true }
        );
        updatedCount++;
        updates.push({
          userId: user._id,
          email: user.email,
          updatedFields: Object.keys(updateFields)
        });
        console.log(`✅ Updated user: ${user.email} (${user._id}) - Added fields: ${Object.keys(updateFields).join(', ')}`);
      } else {
        skippedCount++;
        // Log if user already has all fields
        const hasAllFields = 
          user.walletAddress !== undefined &&
          user.walletProvider !== undefined &&
          user.walletConnectedAt !== undefined &&
          user.walletPrivateKey !== undefined;
        
        if (hasAllFields) {
          console.log(`⏭️  Skipped user: ${user.email} (${user._id}) - Already has all wallet fields`);
        }
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   ✅ Migration completed successfully!`);

    // Show sample of updated users
    if (updates.length > 0) {
      console.log('\n📋 Sample of updated users:');
      updates.slice(0, 5).forEach(update => {
        console.log(`   - ${update.email}: Added ${update.updatedFields.join(', ')}`);
      });
      if (updates.length > 5) {
        console.log(`   ... and ${updates.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
addWalletFieldsToUsers()
  .then(() => {
    console.log('\n✨ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });

