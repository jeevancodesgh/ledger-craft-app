# Expert Accountant E2E Test Plan for Ledger Craft App
## Comprehensive Small Business Accounting Workflow Testing

### Executive Summary
This test plan simulates real-world small business accounting scenarios from invoice creation to IRD tax filing. It identifies gaps in the current implementation and provides a roadmap for achieving full accounting software compliance.

---

## Test Environment Setup

### Test Business Profile
**Company**: Auckland Professional Services Ltd  
**IRD Number**: 123-456-789  
**GST Registration**: Yes (15% standard rate)  
**Business Type**: Professional Services (Accounting/Consulting)  
**Financial Year**: April 1, 2024 - March 31, 2025  
**GST Period**: Quarterly (due 28th of month following quarter end)

---

## Phase 1: Core Business Operations Testing

### 1.1 Customer Management Workflow
**Priority**: HIGH  
**Expected Completion Time**: 10 minutes

**Test Scenarios**:
- Create new business customer with full tax details
- Set up individual customer with different tax requirements
- Add international customer (export sales - zero-rated GST)
- Verify customer tax classification affects invoice calculations

**Acceptance Criteria**:
- ✅ Customer creation with GST number validation
- ✅ Tax exemption status properly applied
- ✅ Export customer zero-rating works correctly
- ✅ Customer search and selection functions properly

### 1.2 Service/Product Catalog Setup
**Priority**: HIGH  
**Expected Completion Time**: 15 minutes

**Test Scenarios**:
- Create taxable services (consulting, accounting)
- Add non-taxable items (if applicable)
- Set up mixed packages (some taxable, some exempt)
- Configure discount structures

**Acceptance Criteria**:
- ✅ Tax rates applied correctly to different item types
- ✅ Discount calculations happen before tax
- ✅ Package pricing maintains tax compliance
- ✅ Item search and selection works efficiently

---

## Phase 2: Invoice Creation & Tax Compliance

### 2.1 Standard Professional Services Invoice
**Priority**: HIGH  
**Expected Completion Time**: 20 minutes

**Test Scenario**:
```
Customer: ABC Corporation Ltd
Services:
- Strategic Planning Consultation: 20 hours @ $150/hr = $3,000
- Financial Analysis Report: 1 item @ $800 = $800
- Meeting facilitation: 4 hours @ $120/hr = $480

Subtotal: $4,280
GST (15%): $642
Total: $4,922

Expected GST Liability: $642
```

**Acceptance Criteria**:
- ✅ Line-by-line tax calculations accurate
- ✅ Total GST calculation correct
- ✅ Invoice formatting professional and compliant
- ✅ Sequential invoice numbering
- ✅ Proper audit trail creation

### 2.2 Mixed Tax Rate Invoice (Complex Scenario)
**Priority**: HIGH  
**Expected Completion Time**: 25 minutes

**Test Scenario**:
```
Customer: Export Client (Overseas)
Services:
- Consulting (zero-rated for export): $2,000 + $0 GST
- Local training delivery: $1,500 + $225 GST
- Materials (exempt): $300 + $0 GST

Subtotal: $3,800
GST: $225
Total: $4,025

Expected GST Liability: $225 (only on local services)
```

**Acceptance Criteria**:
- ✅ Mixed tax rates calculated correctly
- ✅ Export sales marked as zero-rated
- ✅ GST only applies to appropriate items
- ✅ Compliance with IRD export rules

### 2.3 Tax-Inclusive Pricing Test
**Priority**: MEDIUM  
**Expected Completion Time**: 15 minutes

**Test Scenario**:
```
Retail-style pricing (tax-inclusive):
- Package Deal: $1,150 (includes GST)
- Breakdown: $1,000 + $150 GST

Expected calculations:
- Net amount: $1,000.00
- GST amount: $150.00
- Verification: $1,000 × 0.15 = $150
```

**Acceptance Criteria**:
- ✅ Tax-inclusive calculations accurate
- ✅ GST amount properly extracted
- ✅ Net amount calculation correct
- ✅ Rounding follows IRD standards

---

## Phase 3: Payment Processing & Receipt Management

### 3.1 Full Payment Processing
**Priority**: HIGH  
**Expected Completion Time**: 15 minutes

**Test Scenarios**:
- Record bank transfer payment (full amount)
- Process credit card payment with fees
- Handle cash payment with change
- Multiple payment methods for single invoice

**Acceptance Criteria**:
- ✅ Payment allocation correct
- ✅ Invoice status updates to "Paid"
- ✅ Receipt generation automatic
- ✅ Payment reconciliation accurate
- ✅ Audit trail complete

### 3.2 Partial Payment Workflow
**Priority**: MEDIUM  
**Expected Completion Time**: 20 minutes

**Test Scenario**:
```
Invoice Total: $4,922
Payment 1: $2,000 (partial)
Payment 2: $2,922 (final)

Expected:
- Outstanding balance tracking
- Proper receipt generation for each payment
- Final receipt showing full payment history
```

**Acceptance Criteria**:
- ✅ Outstanding balance calculated correctly
- ✅ Multiple receipts generated
- ✅ Payment history maintained
- ✅ Final settlement recorded properly

### 3.3 Receipt Download & Distribution
**Priority**: HIGH  
**Expected Completion Time**: 10 minutes

**Test Scenarios**:
- Download receipt as PDF
- Email receipt to customer
- Print receipt formatting
- Receipt sequence numbering

**Acceptance Criteria**:
- ✅ PDF generation works (under 3 seconds)
- ✅ Email delivery successful
- ✅ Print formatting professional
- ✅ No gaps in receipt numbering

---

## Phase 4: Expense Management & GST Input Credits

### 4.1 Business Expense Recording
**Priority**: HIGH  
**Expected Completion Time**: 25 minutes

**Test Scenarios**:
```
Expenses for the month:
1. Office Rent: $2,300 (GST inclusive $300)
2. Software Subscription: $230 + $34.50 GST
3. Business Lunch: $89 + $13.35 GST
4. Fuel: $156 + $23.40 GST
5. Professional Development: $1,150 (GST inclusive $150)

Expected GST Credits: $521.25
Expected Total Expenses: $3,925
```

**Acceptance Criteria**:
- ✅ GST input credits calculated correctly
- ✅ Expense categorization appropriate
- ✅ Receipt attachment functionality
- ✅ GST-inclusive/exclusive handling correct
- ✅ Expense approval workflow (if applicable)

### 4.2 Mixed Business/Personal Expenses
**Priority**: MEDIUM  
**Expected Completion Time**: 15 minutes

**Test Scenarios**:
- Vehicle expenses (80% business use)
- Home office costs (25% business use)
- Mobile phone (60% business use)

**Expected Behavior**:
- ✅ Business portion calculation correct
- ✅ GST claims on business portion only
- ✅ Personal portion excluded from deductions
- ✅ Audit trail for apportionment basis

### 4.3 Non-Claimable GST Scenarios
**Priority**: MEDIUM  
**Expected Completion Time**: 10 minutes

**Test Scenarios**:
- Entertainment expenses (50% claimable rule)
- Motor vehicle purchases (threshold rules)
- Penalties and fines (non-deductible)

**Acceptance Criteria**:
- ✅ GST claims restricted appropriately
- ✅ Warning messages for non-claimable items
- ✅ Proper categorization maintained

---

## Phase 5: Tax Reporting & IRD Compliance

### 5.1 GST Return Generation
**Priority**: HIGH  
**Expected Completion Time**: 30 minutes

**Test Scenario - Quarterly Return**:
```
Period: April 1 - June 30, 2024

Sales:
- Total Sales (GST inclusive): $65,450
- GST Collected: $8,537.50
- Zero-rated exports: $12,000
- Exempt sales: $0

Purchases:
- Total Purchases (GST inclusive): $15,890
- GST on Purchases: $2,076.50
- Non-claimable GST: $156.50

Expected GST Return:
- GST on Sales: $8,537.50
- GST on Purchases: $1,920.00
- Net GST Payable: $6,617.50
```

**Acceptance Criteria**:
- ✅ All sales transactions included
- ✅ All purchase transactions included
- ✅ Zero-rated sales excluded from GST calculation
- ✅ Non-claimable purchases excluded
- ✅ Net position calculated correctly
- ✅ IRD-compliant formatting
- ✅ Electronic filing format available

### 5.2 Income Tax Calculation (Provisional)
**Priority**: HIGH  
**Expected Completion Time**: 20 minutes

**Test Scenario**:
```
Annual Income Estimate: $180,000
Less: Business Expenses: $45,000
Net Profit: $135,000

Expected Tax Calculation:
- First $14,000: $14,000 × 10.5% = $1,470
- Next $34,000: $34,000 × 17.5% = $5,950
- Next $22,000: $22,000 × 30% = $6,600
- Remaining $65,000: $65,000 × 33% = $21,450
Total Income Tax: $35,470

Provisional Tax (1/3): $11,823.33
```

**Acceptance Criteria**:
- ✅ Tax brackets applied correctly
- ✅ Provisional tax calculation accurate
- ✅ Payment scheduling available
- ✅ Comparison with prior year option

### 5.3 Financial Statements Generation
**Priority**: HIGH  
**Expected Completion Time**: 25 minutes

**Required Reports**:
1. **Profit & Loss Statement**
   - Revenue breakdown by type
   - Expense categories with GST analysis
   - Net profit calculation
   - Monthly/quarterly comparisons

2. **Balance Sheet**
   - Assets, liabilities, equity
   - GST payable/receivable
   - Debtors and creditors aging

3. **Cash Flow Statement**
   - Operating, investing, financing activities
   - GST payment impacts
   - Working capital analysis

4. **GST Summary Report**
   - Sales by tax rate
   - Purchases by GST status
   - Input credit utilization

**Acceptance Criteria**:
- ✅ All reports mathematically balanced
- ✅ GST positions reconcile across reports
- ✅ Export capabilities (PDF, Excel)
- ✅ Professional formatting
- ✅ Drill-down functionality to source transactions

---

## Phase 6: IRD Filing & Compliance Monitoring

### 6.1 Electronic Filing Preparation
**Priority**: HIGH  
**Expected Completion Time**: 20 minutes

**Test Scenarios**:
- GST return in IRD electronic format
- Income tax return preparation
- FBT return (if applicable)
- Student loan deduction calculations

**Acceptance Criteria**:
- ✅ IRD-compliant file formats
- ✅ Validation against IRD business rules
- ✅ Filing deadline tracking
- ✅ Submission status monitoring

### 6.2 Compliance Dashboard
**Priority**: MEDIUM  
**Expected Completion Time**: 15 minutes

**Required Features**:
- Current GST position (payable/refundable)
- Next filing deadlines
- Outstanding compliance issues
- Penalty risk indicators
- Cash flow impact of tax obligations

**Acceptance Criteria**:
- ✅ Real-time compliance status
- ✅ Automated deadline reminders
- ✅ Risk scoring system
- ✅ Action item prioritization

### 6.3 Audit Trail & Record Keeping
**Priority**: HIGH  
**Expected Completion Time**: 15 minutes

**Required Capabilities**:
- Complete transaction history
- User action logging
- Document attachment system
- Change tracking and approval workflow
- Backup and restoration

**Acceptance Criteria**:
- ✅ 7-year record retention compliance
- ✅ Search and filter capabilities
- ✅ Document linkage to transactions
- ✅ Export for external audit
- ✅ Data integrity verification

---

## Phase 7: Advanced Features & Edge Cases

### 7.1 Multi-Entity Support
**Priority**: MEDIUM  
**Expected Completion Time**: 30 minutes

**Test Scenarios**:
- Trading through trust structure
- Partnership income distribution
- Company vs sole trader comparison
- Consolidated group reporting

### 7.2 International Transactions
**Priority**: MEDIUM  
**Expected Completion Time**: 25 minutes

**Test Scenarios**:
- Export sales (zero-rated)
- Import purchases with duty
- Foreign exchange gains/losses
- Overseas supplier withholding tax

### 7.3 Capital Assets & Depreciation
**Priority**: MEDIUM  
**Expected Completion Time**: 20 minutes

**Test Scenarios**:
- Asset purchase and GST treatment
- Depreciation calculations (various methods)
- Asset disposal and GST implications
- Low-value asset pooling

---

## Gap Analysis & Missing Features

### Critical Gaps Identified

#### 1. Bank Feed Integration
**Impact**: High  
**Current State**: Manual transaction entry  
**Required**: Automated bank transaction import  
**Implementation Priority**: HIGH

#### 2. Receipt OCR & Auto-Categorization
**Impact**: Medium  
**Current State**: Manual receipt processing  
**Required**: Automated data extraction and categorization  
**Implementation Priority**: MEDIUM

#### 3. Payroll Integration (PAYE)
**Impact**: High (for businesses with employees)  
**Current State**: Not available  
**Required**: Full payroll processing with PAYE calculations  
**Implementation Priority**: HIGH

#### 4. Fixed Asset Register
**Impact**: Medium  
**Current State**: Basic asset tracking  
**Required**: Comprehensive depreciation management  
**Implementation Priority**: MEDIUM

#### 5. IRD API Integration
**Impact**: High  
**Current State**: Manual filing preparation  
**Required**: Direct electronic filing to IRD  
**Implementation Priority**: HIGH

#### 6. Advanced Reporting & Analytics
**Impact**: Medium  
**Current State**: Basic reports  
**Required**: Business intelligence and forecasting  
**Implementation Priority**: LOW

---

## Implementation Roadmap

### Phase 1 (0-3 months): Core Compliance
- [ ] Complete invoice-to-payment-to-receipt workflow testing
- [ ] GST calculation accuracy verification
- [ ] IRD return format compliance
- [ ] Basic audit trail functionality

### Phase 2 (3-6 months): Automation
- [ ] Bank feed integration
- [ ] Automated expense categorization
- [ ] Receipt OCR implementation
- [ ] Enhanced compliance monitoring

### Phase 3 (6-12 months): Advanced Features
- [ ] IRD API integration
- [ ] Payroll module
- [ ] Advanced analytics
- [ ] Multi-entity support

---

## Success Metrics

### Accuracy Targets
- **Tax Calculations**: 100% accuracy (±$0.01)
- **GST Returns**: 100% IRD compliance
- **Financial Reports**: Mathematical balancing
- **Audit Trail**: Complete transaction history

### Performance Targets
- **Invoice Creation**: < 2 minutes for complex invoice
- **Payment Processing**: < 30 seconds
- **Receipt Generation**: < 5 seconds
- **Report Generation**: < 10 seconds for quarterly report

### User Experience Targets
- **Learning Curve**: Productive within 2 hours
- **Error Rate**: < 1% user errors
- **Task Completion**: 95% successful completion rate
- **Support Requests**: < 5% of users require assistance

---

## Test Execution Schedule

### Daily Testing (2 hours/day)
- Core invoice creation workflows
- Payment processing scenarios
- Basic reporting functionality

### Weekly Testing (4 hours/week)
- Complete monthly close process
- GST return preparation
- Advanced feature validation

### Monthly Testing (8 hours/month)
- End-to-end quarterly workflow
- IRD compliance verification
- Performance benchmarking

### Quarterly Testing (16 hours/quarter)
- Complete annual close simulation
- Full feature regression testing
- Gap analysis and enhancement planning

---

## Risk Assessment

### High Risk Areas
1. **Tax Calculation Accuracy**: Critical for IRD compliance
2. **Data Integrity**: Essential for audit trail
3. **Security**: Protecting financial data
4. **Performance**: Handling growing transaction volumes

### Mitigation Strategies
1. **Automated Testing**: Comprehensive test coverage
2. **Regular Updates**: Stay current with IRD changes
3. **User Training**: Comprehensive documentation and tutorials
4. **Professional Review**: Regular accountant validation

---

## Conclusion

This comprehensive E2E test plan ensures Ledger Craft meets the exacting standards required by professional accountants and small business owners. The systematic approach validates every aspect of the accounting workflow from initial transaction to final IRD filing.

**Key Success Factors**:
- Complete workflow automation
- IRD compliance assurance
- Professional-grade accuracy
- User-friendly interface
- Comprehensive audit capabilities

**Expected Outcome**: A production-ready accounting solution that empowers small businesses to manage their finances with confidence and IRD compliance.