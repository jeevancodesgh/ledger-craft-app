# Ledger Craft: Complete IRD Tax Filing & Accounting Guide for New Zealand Businesses

*A comprehensive guide for managing your business finances and IRD compliance using Ledger Craft*

## Table of Contents

1. [Getting Started](#getting-started)
2. [Setting Up Your Chart of Accounts](#setting-up-your-chart-of-accounts)
3. [Daily Transaction Management](#daily-transaction-management)
4. [Monthly Financial Management](#monthly-financial-management)
5. [Quarterly GST Returns](#quarterly-gst-returns)
6. [Annual Income Tax Returns](#annual-income-tax-returns)
7. [IRD Compliance & Reporting](#ird-compliance--reporting)
8. [Best Practices & Tips](#best-practices--tips)
9. [Common Scenarios](#common-scenarios)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Initial Setup

1. **Create Your Account**
   - Sign up at Ledger Craft
   - Complete the onboarding process
   - Set your business profile (GST number, IRD number, business type)

2. **Configure Tax Settings**
   - Navigate to **Settings > Tax Configuration**
   - Set GST rate to 15% (standard NZ rate)
   - Configure your GST registration details
   - Set your financial year (typically April 1 - March 31 for NZ)

### Understanding Your Dashboard

- **Tax Overview**: Real-time GST position and upcoming deadlines
- **Financial Dashboard**: Income, expenses, and profit summaries
- **IRD Reporting**: Compliance status and return management

---

## Setting Up Your Chart of Accounts

### Pre-configured Accounts

Ledger Craft comes with a standard New Zealand chart of accounts:

#### Assets (1000s)
- **1110** - Business Checking Account
- **1200** - Accounts Receivable
- **1300** - Inventory
- **1500** - Office Equipment
- **1600** - Vehicles

#### Liabilities (2000s)
- **2100** - Accounts Payable
- **2200** - GST Payable ⚠️ *Critical for IRD reporting*
- **2300** - PAYE Payable
- **2400** - Credit Card

#### Equity (3000s)
- **3100** - Owner Equity
- **3200** - Retained Earnings

#### Revenue (4000s)
- **4000** - Service Revenue
- **4100** - Product Sales
- **4200** - Interest Income

#### Expenses (6000s)
- **6000** - Office Rent
- **6100** - Utilities
- **6200** - Office Supplies
- **6300** - Marketing & Advertising
- **6400** - Professional Services
- **6500** - Travel & Entertainment
- **6600** - Insurance
- **6700** - Bank Fees

### Customizing Your Chart of Accounts

1. Navigate to **Accounting > Accounts**
2. Review pre-configured accounts
3. Add industry-specific accounts as needed
4. Ensure all accounts have proper GST treatment configured

---

## Daily Transaction Management

### Recording Sales

#### Option 1: Using Invoices (Recommended)
1. Navigate to **Invoices > Create New**
2. Fill in customer details
3. Add line items with descriptions and amounts
4. **Critical**: Ensure GST is calculated correctly
   - Standard-rated (15%): Most goods and services
   - Zero-rated (0%): Exports, some foods
   - Exempt: Financial services, residential rent

**Example Invoice Entry:**
```
Customer: ABC Company Ltd
Description: Web development services
Amount: $1,000.00 (excl. GST)
GST: $150.00
Total: $1,150.00
```

#### Option 2: Direct Journal Entry
1. Navigate to **Accounting > Journal Entries**
2. Create new entry:
   - **Debit**: 1200 Accounts Receivable - $1,150
   - **Credit**: 4000 Service Revenue - $1,000
   - **Credit**: 2200 GST Payable - $150

### Recording Expenses

#### With Receipts
1. Navigate to **Expenses > Add Expense**
2. Upload receipt photo/PDF
3. Fill in details:
   - Vendor name
   - Amount (including GST)
   - Category
   - **Mark as "GST Claimable"** if applicable

#### GST Claimable Guidelines
✅ **Claimable:**
- Office supplies
- Business meals (entertainment limit applies)
- Professional services
- Equipment for business use

❌ **Not Claimable:**
- Personal expenses
- Entertainment over $300
- Private use portion of mixed-use items

### Recording Payments

#### Customer Payments
1. Navigate to **Payments > Record Payment**
2. Select invoice
3. Enter payment amount and method
4. This automatically:
   - Reduces Accounts Receivable
   - Increases Bank Account
   - Updates invoice status

#### Supplier Payments
1. Navigate to **Expenses** or use **Journal Entries**
2. Record payment:
   - **Debit**: 2100 Accounts Payable
   - **Credit**: 1110 Business Checking Account

---

## Monthly Financial Management

### Month-End Procedures

1. **Reconcile Bank Accounts**
   - Compare Ledger Craft records with bank statements
   - Record any missing transactions
   - Investigate discrepancies

2. **Review Expense Categories**
   - Ensure all expenses are properly categorized
   - Verify GST treatment is correct
   - Check for personal expenses to exclude

3. **Accounts Receivable Review**
   - Follow up on overdue invoices
   - Consider bad debt provisions for long-overdue amounts

4. **Generate Monthly Reports**
   - Profit & Loss Statement
   - Balance Sheet
   - GST Summary Report

### Key Monthly Metrics to Monitor

- **Cash Flow**: Monitor bank account balances
- **Accounts Receivable Aging**: Track overdue invoices
- **GST Position**: Running total of GST owed/refundable
- **Expense Trends**: Identify unusual spending patterns

---

## Quarterly GST Returns

### Preparation (Last Week of Quarter)

1. **Navigate to Tax Overview**
   - Review quarterly GST position
   - Check for any outstanding items

2. **Verify All Transactions**
   - Ensure all sales and purchases are recorded
   - Confirm GST rates are correct
   - Review mixed-use asset allocations

3. **Run GST Summary Report**
   - Go to **Reports > GST Summary**
   - Select quarter period
   - Review by category

### Creating Your GST Return

1. **Navigate to IRD Reporting**
2. **Click "New GST Return"**
3. **Select Period**: Choose the quarter
4. **Review Auto-Calculated Figures**:
   - **Box 5**: Total sales (including GST)
   - **Box 6**: Zero-rated supplies
   - **Box 7**: GST on sales
   - **Box 8**: GST on purchases
   - **Box 9**: Net GST

### GST Return Filing Process

#### Step 1: Review Calculations
```
Example Quarter Summary:
Sales (incl. GST): $46,000
GST on Sales: $6,000
Purchases (incl. GST): $11,500
GST on Purchases: $1,500
Net GST Owing: $4,500
```

#### Step 2: Make Adjustments (if needed)
- Bad debt adjustments
- Capital goods adjustments
- Error corrections from previous periods

#### Step 3: Submit to IRD
1. **Export GST Return** from Ledger Craft
2. **Log into myIR** (IRD online portal)
3. **Upload/Enter** GST return data
4. **Submit** before the 28th of the month following quarter-end

#### Step 4: Record GST Payment
1. **Pay GST liability** through myIR or bank
2. **Record payment** in Ledger Craft:
   - **Debit**: 2200 GST Payable
   - **Credit**: 1110 Business Checking Account

### Important GST Deadlines

| Quarter | Period End | Return Due | Payment Due |
|---------|------------|------------|-------------|
| Q1 | 31 March | 28 April | 7 May |
| Q2 | 30 June | 28 July | 7 August |
| Q3 | 30 September | 28 October | 7 November |
| Q4 | 31 December | 28 January | 7 February |

---

## Annual Income Tax Returns

### Preparation (March - June)

1. **Year-End Reconciliation**
   - Complete final bank reconciliation
   - Ensure all transactions for the year are recorded
   - Review and adjust accruals/prepayments

2. **Generate Annual Reports**
   - Navigate to **Reports > Financial Reports**
   - Generate Profit & Loss for full financial year
   - Generate Balance Sheet as at 31 March

3. **Gather Supporting Documents**
   - Bank statements
   - Supplier invoices
   - Customer invoices
   - GST returns filed during the year
   - Asset purchase records

### Creating Income Tax Return

1. **Navigate to IRD Reporting**
2. **Click "New Income Tax Return"**
3. **Select Period**: Financial year (1 April - 31 March)
4. **Review Auto-Calculated Figures**:

#### Key Income Tax Figures
- **Total Income**: All revenue accounts
- **Total Deductible Expenses**: Allowable business expenses
- **Taxable Income**: Income minus deductions
- **Tax Payable**: Based on company/individual rates

### Tax Calculation Examples

#### Company Tax (28% rate)
```
Gross Income: $120,000
Less: Deductible Expenses: $45,000
Taxable Income: $75,000
Tax Payable: $21,000 (28% × $75,000)
```

#### Individual Tax (Progressive Rates)
```
Up to $14,000: 10.5%
$14,001 - $48,000: 17.5%
$48,001 - $70,000: 30%
$70,001 - $180,000: 33%
Over $180,000: 39%
```

### Filing Process

1. **Export Income Tax Summary** from Ledger Craft
2. **Complete IR4 (Company)** or relevant return
3. **Submit through myIR** by 7 July
4. **Pay any tax owing** by due date

---

## IRD Compliance & Reporting

### Real-Time Compliance Monitoring

#### Tax Overview Dashboard
- **Compliance Score**: Real-time percentage
- **Outstanding Returns**: Overdue filings
- **Upcoming Deadlines**: Next 30 days
- **Tax Position**: Current GST owing/refund

#### Compliance Alerts
- GST return due in 15 days
- Income tax return approaching deadline
- Missing transactions detected
- Unusual GST ratios flagged

### Document Management

#### Required Records (7 years minimum)
- All invoices issued and received
- Bank statements and reconciliations
- GST returns and supporting documents
- Income tax returns
- Asset purchase/disposal records
- Employment records (if applicable)

#### Digital Record Keeping
- Upload receipts to expense entries
- Store bank statements in cloud storage
- Export regular backups of Ledger Craft data
- Maintain audit trail of all entries

### IRD Audit Preparation

#### If Selected for Audit
1. **Export comprehensive reports** from Ledger Craft
2. **Prepare reconciliations**:
   - Bank account reconciliations
   - GST reconciliations
   - Debtor/Creditor listings
3. **Gather physical documentation**
4. **Review journal entries** for supporting evidence

---

## Best Practices & Tips

### Daily Habits

1. **Enter transactions promptly** (within 24-48 hours)
2. **Photograph receipts immediately** using mobile app
3. **Reconcile bank accounts weekly**
4. **Review GST coding** on all transactions

### Monthly Discipline

1. **Run financial reports** by 10th of following month
2. **Review expense categories** for accuracy
3. **Follow up on overdue invoices**
4. **Check compliance dashboard**

### Quarterly Excellence

1. **Complete GST return preparation** one week early
2. **Review annual tax strategy**
3. **Update financial forecasts**
4. **Plan for seasonal variations**

### Annual Planning

1. **Review chart of accounts** for relevance
2. **Plan major asset purchases** for tax efficiency
3. **Consider provisional tax requirements**
4. **Review business structure** for tax optimization

---

## Common Scenarios

### Scenario 1: Mixed Personal/Business Expenses

**Situation**: Mobile phone bill $100/month, 70% business use

**Solution**:
1. Record full expense: $100 to Utilities
2. Create adjustment entry:
   - **Credit**: 6100 Utilities - $30
   - **Debit**: 3100 Owner Equity (drawings) - $30
3. Only claim $70 for GST purposes

### Scenario 2: Bad Debt Write-off

**Situation**: Customer owes $1,150 (incl. GST), unlikely to pay

**Solution**:
1. Create journal entry:
   - **Debit**: 6900 Other Expenses - $1,000
   - **Debit**: 2200 GST Payable - $150 (claim back GST)
   - **Credit**: 1200 Accounts Receivable - $1,150

### Scenario 3: Asset Purchase

**Situation**: Bought office computer for $2,300 (incl. GST)

**Solution**:
1. Record purchase:
   - **Debit**: 1500 Office Equipment - $2,000
   - **Debit**: 2200 GST Payable - $300 (claim GST)
   - **Credit**: 1110 Business Checking - $2,300

### Scenario 4: GST Rate Change

**Situation**: Rate changes (historically from 12.5% to 15%)

**Solution**:
1. Update tax configuration on effective date
2. Ensure old rate applies to pre-change transactions
3. New rate applies to post-change transactions
4. Review mixed contracts carefully

### Scenario 5: Zero-Rated Exports

**Situation**: Selling services to overseas client

**Solution**:
1. Set customer as "Export customer"
2. Apply 0% GST rate
3. Ensure proper documentation:
   - Export invoice
   - Evidence of service delivery offshore
   - Foreign exchange records

---

## Troubleshooting

### Common Issues

#### GST Calculations Don't Match IRD
**Symptoms**: Ledger Craft GST differs from manual calculation
**Solutions**:
1. Check all transactions have correct GST rates
2. Verify tax-inclusive vs tax-exclusive settings
3. Review adjustment entries
4. Check for timing differences (accrual vs cash)

#### Bank Reconciliation Won't Balance
**Symptoms**: Ledger Craft balance ≠ Bank statement
**Solutions**:
1. Check for missing transactions
2. Look for duplicate entries
3. Verify transaction dates (especially month-end)
4. Check for bank fees/interest not recorded

#### Missing Transactions in Reports
**Symptoms**: Some transactions don't appear in tax reports
**Solutions**:
1. Verify transaction dates are in report period
2. Check transaction status (posted vs draft)
3. Ensure proper account coding
4. Review filter settings on reports

#### Compliance Score Low
**Symptoms**: Dashboard shows poor compliance
**Solutions**:
1. Check for overdue GST returns
2. Verify all recent transactions are recorded
3. Review expense categorization
4. Update missing customer/supplier details

### Getting Help

#### Within Ledger Craft
- Use built-in help system
- Check video tutorials
- Review transaction templates

#### Professional Support
- Consult chartered accountant for complex transactions
- Engage tax advisor for optimization strategies
- Use IRD helpline for specific tax questions

#### IRD Resources
- IRD website (ird.govt.nz)
- IR guides and fact sheets
- myIR online portal
- IRD business helpline: 0800 377 774

---

## Quick Reference Cards

### Monthly Checklist
- [ ] Bank reconciliation completed
- [ ] All receipts uploaded and coded
- [ ] Overdue invoices followed up
- [ ] Monthly reports generated
- [ ] Cash flow forecast updated

### Quarterly Checklist
- [ ] GST return prepared and reviewed
- [ ] All quarterly transactions recorded
- [ ] Asset additions/disposals recorded
- [ ] Bad debt provisions reviewed
- [ ] GST return filed with IRD
- [ ] GST payment made if applicable

### Annual Checklist
- [ ] Year-end reconciliations completed
- [ ] Financial statements prepared
- [ ] Income tax return completed
- [ ] Provisional tax calculated
- [ ] Asset depreciation calculated
- [ ] Annual compliance review
- [ ] Backup of all financial data

### Emergency Contacts
- **IRD Business Helpline**: 0800 377 774
- **myIR Support**: Available through myIR portal
- **Your Accountant**: [Add contact details]
- **Ledger Craft Support**: [Add contact details]

---

*This guide is for general information only and should not replace professional accounting or tax advice. Always consult with a qualified professional for your specific circumstances.*

**Last Updated**: July 2025
**Version**: 1.0