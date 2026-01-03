/**
 * Migration Script: Add Wallet Fields to Existing Users
 * 
 * This script adds wallet-related fields (walletAddress, walletProvider, walletConnectedAt)
 * to all existing users that don't have them, without overwriting existing values.
 * 
 * Run with: npx ts-node scripts/addWalletFieldsToUsers.ts
 */

require('dotenv').config();
import mongoose from 'mongoose';
import UserModel from '../models/user.mode';


const DB_URI = process.env.DB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';

async function addWalletFieldsToUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users as lean objects to get actual database state
    const users = await UserModel.find({}).lean();
    console.log(`📊 Found ${users.length} users to process`);
    
    // Debug: Check first user's keys
    if (users.length > 0) {
      console.log(`\n🔍 [DEBUG] Sample user keys: ${Object.keys(users[0]).join(', ')}`);
      console.log(`🔍 [DEBUG] Sample user has walletAddress: ${Object.keys(users[0]).includes('walletAddress')}`);
      console.log(`🔍 [DEBUG] Sample user has walletProvider: ${Object.keys(users[0]).includes('walletProvider')}`);
      console.log(`🔍 [DEBUG] Sample user has walletConnectedAt: ${Object.keys(users[0]).includes('walletConnectedAt')}`);
      console.log(`🔍 [DEBUG] Sample user has walletPrivateKey: ${Object.keys(users[0]).includes('walletPrivateKey')}\n`);
    }

    let updatedCount = 0;
    let skippedCount = 0;
    const updates: any[] = [];

    for (const user of users) {
      const updateFields: any = {};
      let needsUpdate = false;

      // Get actual keys from the document (lean() gives us the raw document)
      const userKeys = Object.keys(user);

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
        // Check if user has all 4 fields
        const hasAllFields = 
          userKeys.includes('walletAddress') &&
          userKeys.includes('walletProvider') &&
          userKeys.includes('walletConnectedAt') &&
          userKeys.includes('walletPrivateKey');
        
        if (hasAllFields) {
          console.log(`⏭️  Skipped user: ${user.email} (${user._id}) - Already has all wallet fields`);
        } else {
          // This shouldn't happen, but log it for debugging
          const missingFields = [];
          if (!userKeys.includes('walletAddress')) missingFields.push('walletAddress');
          if (!userKeys.includes('walletProvider')) missingFields.push('walletProvider');
          if (!userKeys.includes('walletConnectedAt')) missingFields.push('walletConnectedAt');
          if (!userKeys.includes('walletPrivateKey')) missingFields.push('walletPrivateKey');
          console.log(`⚠️  Warning: User ${user.email} skipped but missing: ${missingFields.join(', ')}`);
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

  } catch (error: any) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  addWalletFieldsToUsers()
    .then(() => {
      console.log('\n✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default addWalletFieldsToUsers;

