# End-to-End Encryption Security Plan for Ledger Craft

## Overview
This document outlines the comprehensive plan for implementing end-to-end encryption in the Ledger Craft expense tracking application to ensure that financial data is only accessible to customers, not even developers.

## Current State Analysis

### Sensitive Data Identified
- **Customer data**: Names, emails, addresses, phone numbers, business details
- **Invoice data**: Amounts, line items, payment terms, tax information
- **Business profiles**: Company details, bank information, tax IDs
- **Expense records**: Amounts, vendor details, receipts, categories
- **Financial calculations**: Totals, tax amounts, profit margins

### Current Architecture
- React frontend with Supabase backend
- Data stored in PostgreSQL with Row Level Security (RLS)
- Authentication via Supabase Auth
- File storage for receipts in Supabase Storage

## Proposed End-to-End Encryption Architecture

### 1. Encryption Strategy

**Client-Side Encryption Approach:**
- Use Web Crypto API (AES-256-GCM) for symmetric encryption
- Derive encryption keys from user master password using PBKDF2
- Each user has a unique encryption key derived from their password
- Data encrypted before sending to Supabase, decrypted after retrieval

### 2. Key Management System

**Master Key Derivation:**
```
User Password + Salt → PBKDF2 → Master Key → AES-256 Encryption Key
```

**Key Storage Strategy:**
- **Never store encryption keys on server**
- Derive keys from user password on each session
- Use secure browser session storage for temporary key caching
- Implement key stretching with high iteration counts (100,000+)

### 3. Data Classification & Encryption Scope

**Highly Sensitive Data (Full Encryption):**
- Customer personal information (names, addresses, phone)
- Invoice amounts and line item details
- Business banking information
- Expense amounts and vendor details
- Receipt file contents

**Metadata (Searchable, Minimal Encryption):**
- Invoice numbers (format preserved for sorting)
- Dates and timestamps
- Status fields (draft, sent, paid)
- User IDs and relationships

**Public Data (No Encryption):**
- Category names (standardized)
- Currency codes
- System metadata

### 4. Implementation Architecture

**Client-Side Components:**

1. **Encryption Service Layer**
   ```typescript
   // src/services/encryptionService.ts
   - generateUserKey(password: string, salt: string)
   - encryptData(data: any, key: CryptoKey)
   - decryptData(encryptedData: string, key: CryptoKey)
   - encryptFile(file: File, key: CryptoKey)
   - decryptFile(encryptedFile: ArrayBuffer, key: CryptoKey)
   ```

2. **Encrypted Data Wrapper Service**
   ```typescript
   // Wrapper around existing supabaseService.ts
   - Intercepts all data before database operations
   - Automatically encrypts sensitive fields
   - Decrypts data after retrieval
   - Maintains backward compatibility
   ```

3. **Secure Session Management**
   ```typescript
   // src/services/secureSessionService.ts
   - Manages encryption key lifecycle
   - Handles session timeout and re-authentication
   - Secure key derivation and caching
   ```

### 5. Database Schema Modifications

**New Tables:**
```sql
-- User encryption metadata
CREATE TABLE user_encryption_metadata (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  salt VARCHAR(255) NOT NULL,
  encryption_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Encrypted data audit log
CREATE TABLE encryption_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  table_name VARCHAR(100),
  operation VARCHAR(20),
  encrypted_fields JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**Modified Existing Tables:**
- Add `encrypted_data` JSONB column to store encrypted payloads
- Keep minimal searchable metadata in existing columns
- Add `encryption_version` field for future key rotation

### 6. User Experience Flow

**Registration/Setup:**
1. User creates account with Supabase Auth
2. User sets master password (different from login password)
3. System generates unique salt and derives encryption key
4. User guided through data migration process

**Daily Usage:**
1. User logs in with Supabase Auth
2. System prompts for master password to unlock encrypted data
3. Encryption key derived and cached in secure session storage
4. All data operations transparent to user
5. Auto-logout after inactivity with key clearing

**Password Management:**
1. Master password reset requires data re-encryption
2. Provide export/import functionality before password changes
3. Progressive migration for existing unencrypted data

### 7. Performance Considerations

**Optimization Strategies:**
- Encrypt data in chunks for large datasets
- Use Web Workers for encryption/decryption operations
- Implement progressive loading for encrypted content
- Cache decrypted data in memory during active sessions
- Use compression before encryption for large text data

**Estimated Performance Impact:**
- 50-100ms additional latency for encryption operations
- 10-20% increase in data storage size
- Minimal impact on small financial records
- Larger impact on receipt files and bulk operations

### 8. Migration Strategy

**Phase 1: Infrastructure Setup**
- Implement encryption service layer
- Add database schema changes
- Create user encryption onboarding flow

**Phase 2: Gradual Data Migration**
- Encrypt new data automatically
- Provide migration tool for existing users
- Maintain dual-read capability during transition

**Phase 3: Full Encryption Enforcement**
- All new users required to use encryption
- Legacy data migration completed
- Remove unencrypted data access

### 9. Security Features

**Additional Security Measures:**
- Key derivation rate limiting to prevent brute force
- Secure audit logging of all encryption operations
- Data integrity verification with HMAC
- Protection against timing attacks
- Secure memory management for keys

**Compliance Considerations:**
- GDPR compliance through encryption-based privacy
- Financial data protection standards
- Export/delete capabilities for encrypted data
- User consent management for encryption

### 10. Backup and Recovery

**Data Recovery Strategy:**
- Encrypted backup exports with user's master password
- Emergency recovery codes (encrypted with service key)
- Business continuity for lost master passwords
- Secure data destruction capabilities

## Implementation Effort Estimate

**Development Time:**
- **Phase 1 (Infrastructure)**: 3-4 weeks
- **Phase 2 (Migration Tools)**: 2-3 weeks  
- **Phase 3 (Full Implementation)**: 2-3 weeks
- **Testing & Security Audit**: 2-3 weeks

**Total Implementation**: 9-13 weeks

## Potential Challenges

1. **User Experience**: Additional password management complexity
2. **Performance**: Encryption overhead on large datasets
3. **Search Functionality**: Limited search on encrypted data
4. **Mobile Support**: Web Crypto API compatibility
5. **Browser Compatibility**: Ensuring consistent encryption across browsers

## Recommendations

1. **Start with new users** to test the encryption flow
2. **Implement progressive encryption** to minimize disruption
3. **Provide clear user education** about security benefits
4. **Create comprehensive backup/recovery procedures**
5. **Regular security audits** of encryption implementation
6. **Consider professional security audit** before production deployment

## Technical Implementation Details

### Web Crypto API Usage
```javascript
// Key derivation example
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}
```

### Data Flow Architecture
```
User Input → Client Encryption → Supabase → Database (Encrypted)
Database (Encrypted) → Supabase → Client Decryption → User Display
```

### Security Audit Checklist
- [ ] Key derivation function strength validation
- [ ] Encryption algorithm implementation review
- [ ] Side-channel attack protection
- [ ] Memory management security
- [ ] Authentication flow security
- [ ] Data integrity verification
- [ ] Recovery mechanism security
- [ ] Performance impact assessment

## Conclusion

This end-to-end encryption implementation will provide true zero-knowledge security for Ledger Craft users, ensuring that even with full database access, developers and potential attackers cannot access user financial data without the user's master password. The architecture balances security, performance, and user experience while maintaining the application's core functionality.