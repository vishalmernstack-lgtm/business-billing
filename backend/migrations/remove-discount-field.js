/**
 * Migration Script: Remove Discount Field from Bills
 * 
 * This script removes the discount field from all existing bills in the database
 * and recalculates the totalAmount to be subtotal + tax (without discount).
 * 
 * Run this script once after deploying the code changes.
 * 
 * Usage: node backend/migrations/remove-discount-field.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-software';

async function removeDiscountField() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Bill = mongoose.connection.collection('bills');

    // Get all bills
    const bills = await Bill.find({}).toArray();
    console.log(`\nFound ${bills.length} bills to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const bill of bills) {
      if (bill.discount !== undefined) {
        // Recalculate totalAmount without discount
        const newTotalAmount = (bill.subtotal || 0) + (bill.tax || 0);
        
        // Update the bill: remove discount and recalculate totalAmount
        await Bill.updateOne(
          { _id: bill._id },
          { 
            $unset: { discount: "" },
            $set: { 
              totalAmount: newTotalAmount,
              dueAmount: newTotalAmount - (bill.paidAmount || 0)
            }
          }
        );
        
        console.log(`✅ Updated bill ${bill.billNumber}: Removed discount ₹${bill.discount}, New total: ₹${newTotalAmount}`);
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total bills processed: ${bills.length}`);
    console.log(`Bills updated: ${updatedCount}`);
    console.log(`Bills skipped (no discount field): ${skippedCount}`);
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run the migration
removeDiscountField();
