/**
 * Migration Script: Add Initial Payments to Payment History
 * 
 * This script adds initial payments to the paymentHistory array for bills
 * that have paidAmount > 0 but no payment history entries.
 * 
 * Run this script once after deploying the code changes.
 * 
 * Usage: node backend/migrations/add-initial-payments-to-history.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-software';

async function addInitialPaymentsToHistory() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Bill = mongoose.connection.collection('bills');

    // Find bills with paidAmount > 0 but empty or no paymentHistory
    const bills = await Bill.find({
      paidAmount: { $gt: 0 },
      $or: [
        { paymentHistory: { $exists: false } },
        { paymentHistory: { $size: 0 } }
      ]
    }).toArray();

    console.log(`\nFound ${bills.length} bills with payments but no payment history`);

    let updatedCount = 0;

    for (const bill of bills) {
      const paymentEntry = {
        _id: new mongoose.Types.ObjectId(),
        amount: bill.paidAmount,
        paymentDate: bill.paymentDate || bill.createdAt || new Date(),
        paymentMethod: 'Cash',
        notes: 'Initial payment (migrated from paidAmount)',
        recordedBy: bill.createdBy,
        createdAt: bill.createdAt || new Date(),
        updatedAt: new Date()
      };

      await Bill.updateOne(
        { _id: bill._id },
        { 
          $set: { 
            paymentHistory: [paymentEntry]
          }
        }
      );

      console.log(`✅ Added payment history for bill ${bill.billNumber}: ₹${bill.paidAmount}`);
      updatedCount++;
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total bills processed: ${bills.length}`);
    console.log(`Bills updated: ${updatedCount}`);
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
addInitialPaymentsToHistory();
