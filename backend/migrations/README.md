# Database Migrations

This folder contains database migration scripts for the billing software.

## Available Migrations

### 1. Remove Discount Field Migration

**File:** `remove-discount-field.js`

**Purpose:** Removes the `discount` field from all bills in the database and recalculates the `totalAmount` to be `subtotal + tax` (without discount).

**When to run:** After deploying the code changes that remove the discount field from the Bill model.

**How to run:**

```bash
# From the project root directory
node backend/migrations/remove-discount-field.js
```

**What it does:**
1. Connects to the MongoDB database
2. Finds all bills with a `discount` field
3. Removes the `discount` field from each bill
4. Recalculates `totalAmount` = `subtotal + tax`
5. Recalculates `dueAmount` = `totalAmount - paidAmount`
6. Provides a summary of updated bills

---

### 2. Add Initial Payments to History Migration

**File:** `add-initial-payments-to-history.js`

**Purpose:** Adds initial payments to the `paymentHistory` array for bills that have `paidAmount > 0` but no payment history entries.

**When to run:** After deploying the code changes that automatically add payments to payment history.

**How to run:**

```bash
# From the project root directory
node backend/migrations/add-initial-payments-to-history.js
```

**What it does:**
1. Connects to the MongoDB database
2. Finds all bills with `paidAmount > 0` but empty `paymentHistory`
3. Creates a payment history entry for each bill with:
   - Amount: `paidAmount`
   - Date: `paymentDate` or `createdAt`
   - Method: 'Cash' (default)
   - Notes: 'Initial payment (migrated from paidAmount)'
4. Provides a summary of updated bills

**Why this is needed:**
- The payment modal and payment history display only show entries from the `paymentHistory` array
- Older bills may have `paidAmount` set but no corresponding payment history entry
- This migration ensures all payments are visible in the payment history

---

## Running Migrations

1. Ensure your `.env` file has the correct `MONGODB_URI`
2. Run the migration script from the project root
3. Check the console output for success/error messages
4. Verify the changes in your database

## Migration Order

If running multiple migrations, run them in this order:
1. `remove-discount-field.js` (if needed)
2. `add-initial-payments-to-history.js`

## Best Practices

- Always backup your database before running migrations
- Test migrations on a development/staging environment first
- Review the migration code before running in production
- Keep migration scripts for historical reference
- Migrations are idempotent (safe to run multiple times)
