# Payment System Integration

## Overview

The payment system has been fully integrated with the existing Ledger Craft application, providing real-time payment processing, receipt generation, and accounting integration.

## How It Works

### 1. Invoice Payment Flow

When an invoice is created and sent to a customer, the following payment workflow is available:

```
Invoice (Unpaid) → Payment Record → Receipt Generation → Invoice Status Update
```

### 2. Database Integration

The system uses the existing Supabase database with new tables:
- `payments` - Stores all payment records
- `receipts` - Auto-generated receipts for each payment
- `journal_entries` - Double-entry bookkeeping records
- `tax_configurations` - Tax settings and IRD compliance

### 3. Real Data Flow

#### Payment Creation Process:
1. **Select Invoice**: Choose from invoices with outstanding balances
2. **Record Payment**: Enter payment details (amount, method, date, reference)
3. **Automatic Processing**:
   - Payment record created in database
   - Invoice payment status updated (unpaid → partially_paid → paid)
   - Receipt automatically generated
   - Journal entries created for accounting
   - Email notification sent (optional)

#### Database Updates:
```sql
-- Payment record
INSERT INTO payments (invoice_id, amount, payment_method, payment_date, ...)

-- Update invoice totals
UPDATE invoices SET 
  total_paid = (SELECT SUM(amount) FROM payments WHERE invoice_id = ?),
  payment_status = CASE 
    WHEN total_paid >= total THEN 'paid'
    WHEN total_paid > 0 THEN 'partially_paid'
    ELSE 'unpaid'
  END

-- Generate receipt
INSERT INTO receipts (payment_id, receipt_number, receipt_data, ...)
```

### 4. Real-Time State Management

The AppContext provides real-time data synchronization:

```typescript
const {
  payments,           // All user payments
  receipts,          // All generated receipts
  invoices,          // Updated invoice statuses
  createPayment,     // Record new payment
  refreshPayments,   // Sync latest data
  getInvoicesWithBalance  // Get unpaid invoices
} = useAppContext();
```

### 5. Payment Pages Integration

#### Payments Page (`/payments`)
- **Real Data**: Shows actual payments from database
- **Live Updates**: Invoice statuses update immediately after payment
- **Quick Payment**: Select unpaid invoices and record payments instantly

#### Receipts Page (`/receipts`)
- **Auto-Generated**: Receipts created automatically for each payment
- **Email Tracking**: Track which receipts have been emailed
- **Professional Format**: Includes business details, customer info, payment breakdown

#### Invoice Integration
- **Payment Status**: Invoices show real payment status (unpaid/partial/paid)
- **Balance Tracking**: Displays remaining balance due
- **Payment History**: View all payments made against an invoice

### 6. Key Features

#### Automatic Receipt Generation
- Professional PDF-ready format
- Includes business branding
- Customer and payment details
- Tax breakdown (NZ GST compliant)
- Unique receipt numbers (REC-YYYYMM-NNNN format)

#### Payment Methods Supported
- Bank Transfer
- Cash
- Cheque
- Credit Card
- Online Payment

#### Invoice Status Updates
- **Unpaid**: No payments recorded
- **Partially Paid**: Some payments, balance remaining
- **Paid**: Full amount received
- **Overdue**: Past due date with outstanding balance

#### Email Integration
- Automatic receipt email notifications
- Track email delivery status
- Resend receipts as needed

### 7. Usage Examples

#### Recording a Payment
```typescript
// From the Payments page
const paymentData = {
  invoiceId: 'inv-123',
  amount: 1500.00,
  paymentMethod: 'bank_transfer',
  paymentDate: '2024-01-15',
  referenceNumber: 'TXN-001',
  notes: 'Payment via bank transfer'
};

await createPayment(paymentData);
// → Payment recorded
// → Receipt generated  
// → Invoice status updated
// → Email notification sent
```

#### Checking Invoice Status
```typescript
// Invoice automatically updated after payment
const invoice = invoices.find(inv => inv.id === 'inv-123');
console.log(invoice.paymentStatus); // 'paid'
console.log(invoice.totalPaid);     // 1500.00
console.log(invoice.balanceDue);    // 0.00
```

### 8. Financial Reporting

The payment system integrates with financial reporting:
- **Cash Flow**: Track money coming in
- **Accounts Receivable**: Monitor outstanding invoices
- **Tax Reporting**: GST calculations for IRD compliance
- **Journal Entries**: Double-entry bookkeeping records

### 9. New Zealand Compliance

Built specifically for NZ businesses:
- **GST Integration**: 15% GST calculations
- **IRD Reporting**: Generate tax returns
- **Receipt Standards**: Comply with NZ receipt requirements
- **Date Formats**: NZ date and currency formats

### 10. Mobile Responsive

All payment interfaces are fully responsive:
- Mobile-first design
- Touch-friendly payment forms
- Responsive receipt viewing
- Quick payment processing on mobile

## Next Steps

The payment system is now fully functional with real data. Users can:

1. **Record Payments**: Via the Payments page or invoice details
2. **View Receipts**: Professional receipts with all details
3. **Track Status**: Real-time invoice payment status
4. **Generate Reports**: Financial reporting with actual payment data
5. **Email Receipts**: Send professional receipts to customers

The system automatically handles all database updates, receipt generation, and status synchronization without any manual intervention required.