# Multi-User Strategy Plan for EasyBizInvoice

## Overview

This document outlines the comprehensive strategy for transforming EasyBizInvoice from a single-user application into a collaborative multi-user business management platform. The plan focuses on organization-based multi-tenancy with role-based access control.

## Current State Analysis

### Existing Architecture
- **Single-tenant architecture**: Each user has isolated data via `user_id` foreign keys
- **Supabase Auth**: Individual user authentication with email/password
- **Row Level Security**: Data isolation enforced at database level
- **Business Profile**: One profile per user for company information

### Key Findings
- All data tables use `user_id` for data isolation
- Authentication context manages individual user sessions
- Services layer handles user-specific data queries
- No existing multi-user or organization concepts

## Proposed Multi-Tenant Strategy

### 1. Organization-Based Multi-Tenancy

**Core Concept**: Transform from user-centric to organization-centric data model

```
Organization (Business)
├── Users (Team Members)
├── Invoices
├── Customers  
├── Expenses
├── Items & Categories
└── Business Profile
```

**Benefits**:
- Natural business entity grouping
- Scalable team collaboration
- Clear data ownership boundaries
- Flexible user management

### 2. User Roles & Permissions System

#### Role Hierarchy
- **Owner**: Full access, billing, user management
- **Admin**: All business operations, user invites (no billing)
- **Manager**: Create/edit invoices, customers, reports
- **Staff**: View-only access, basic invoice creation
- **Accountant**: Financial data access, reports, expenses

#### Permission Matrix

| Feature          | Owner | Admin | Manager | Staff | Accountant |
|------------------|-------|-------|---------|-------|------------|
| User Management  |   ✓   |   ✓   |    ✗    |   ✗   |     ✗      |
| Billing Settings |   ✓   |   ✗   |    ✗    |   ✗   |     ✗      |
| Business Profile |   ✓   |   ✓   |    ✗    |   ✗   |     ✗      |
| Create Invoices  |   ✓   |   ✓   |    ✓    |   ✓   |     ✗      |
| Edit Invoices    |   ✓   |   ✓   |    ✓    |   ✗   |     ✗      |
| Delete Invoices  |   ✓   |   ✓   |    ✗    |   ✗   |     ✗      |
| Customer Mgmt    |   ✓   |   ✓   |    ✓    |   ✓   |     ✗      |
| Expense Mgmt     |   ✓   |   ✓   |    ✓    |   ✗   |     ✓      |
| Financial Reports|   ✓   |   ✓   |    ✓    |   ✗   |     ✓      |

### 3. Database Schema Changes

#### New Tables

```sql
-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    max_users INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization memberships (many-to-many: users ↔ organizations)
CREATE TABLE organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'staff', 'accountant')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- User invitations
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'accountant')),
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    invited_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Schema Modifications

```sql
-- Add organization_id to existing tables
ALTER TABLE business_profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE customers ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE invoices ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE expenses ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE items ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE item_categories ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE expense_categories ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE accounts ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- Update RLS policies to use organization_id instead of user_id
-- Create indexes for performance
CREATE INDEX idx_customers_organization_id ON customers(organization_id);
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX idx_organization_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX idx_organization_memberships_org_id ON organization_memberships(organization_id);
```

### 4. User Invitation & Management Flow

#### Invitation Process
1. **Owner/Admin** sends email invitation with role
2. **Email sent** with secure token link
3. **Recipient clicks** link → registration/login page
4. **Account creation** (if new user) or login
5. **Auto-join organization** with assigned role
6. **Welcome flow** with role-specific onboarding

#### User Management Features
- View team members with roles
- Change user roles (with permission checks)
- Suspend/reactivate users
- Remove users from organization
- Resend invitations
- Bulk user operations

#### Security Considerations
- Invitation tokens expire after 7 days
- Email verification required
- Role changes require owner/admin privileges
- Audit log for all user management actions

### 5. UI/UX Changes

#### New Pages/Components
- **Organization Settings** page
- **Team Management** page with user list, roles, invitations
- **User Role Badge** component throughout app
- **Permission-gated** components and buttons
- **Organization Switcher** (if user belongs to multiple orgs)
- **Invitation Acceptance** page
- **Role-based Dashboard** variations

#### Navigation Updates
```
Dashboard (role-specific widgets)
├── Invoices (create/edit based on role)
├── Customers (view/edit based on role)
├── Expenses (accountant/manager access)
├── Reports (role-filtered data)
├── Team (admin/owner only)
└── Settings
    ├── Organization Profile
    ├── Team Management
    └── Billing (owner only)
```

#### Mobile Considerations
- Responsive team management interface
- Role-based mobile navigation
- Touch-friendly user management controls
- Mobile-optimized invitation flow

### 6. Implementation Strategy

#### Phase 1: Foundation (2-3 weeks)
- Create organization & membership tables
- Implement basic multi-tenancy
- Migration script for existing users
- Update RLS policies
- Basic organization context

**Deliverables**:
- Database schema updates
- Migration scripts
- Updated service layer
- Organization context provider

#### Phase 2: User Management (2 weeks)
- Invitation system
- Role-based permissions
- Team management UI
- Email notifications

**Deliverables**:
- Invitation service
- Team management page
- Email templates
- Permission guards

#### Phase 3: Enhanced Features (2-3 weeks)
- Role-based dashboard
- Advanced permissions
- Audit logging
- UI/UX polish

**Deliverables**:
- Role-specific dashboards
- Audit trail system
- Enhanced team management
- Mobile optimizations

#### Phase 4: Advanced Multi-Org (Optional)
- Multiple organization membership
- Organization switching
- Cross-org features
- Advanced reporting

**Deliverables**:
- Multi-org support
- Organization switcher
- Cross-org analytics
- Enterprise features

### 7. Migration Strategy

#### For Existing Users
1. **Auto-create organization** for each existing user
2. **Set user as owner** of their organization
3. **Migrate all data** to their organization
4. **Preserve all existing functionality**
5. **Zero downtime migration**

#### Migration Script Example
```sql
-- Create organizations for existing users
INSERT INTO organizations (id, name, slug)
SELECT 
    gen_random_uuid(),
    COALESCE(bp.name, 'My Business'),
    'org_' || SUBSTRING(u.id::text, 1, 8)
FROM auth.users u
LEFT JOIN business_profiles bp ON bp.user_id = u.id;

-- Create organization memberships
INSERT INTO organization_memberships (organization_id, user_id, role, status, joined_at)
SELECT 
    o.id,
    u.id,
    'owner',
    'active',
    NOW()
FROM auth.users u
JOIN organizations o ON o.slug = 'org_' || SUBSTRING(u.id::text, 1, 8);

-- Update existing data with organization_ids
UPDATE business_profiles SET organization_id = (
    SELECT om.organization_id 
    FROM organization_memberships om 
    WHERE om.user_id = business_profiles.user_id
);
```

### 8. Pricing Strategy

#### Plan Limits
- **Free**: 1 user, 10 invoices/month, basic features
- **Starter**: 3 users, 50 invoices/month, team collaboration
- **Professional**: 10 users, unlimited invoices, advanced reports
- **Enterprise**: Unlimited users, custom features, priority support

#### Revenue Impact
- **Subscription Model**: Monthly/yearly billing per organization
- **User-based Pricing**: Additional cost per user beyond plan limits
- **Feature Gating**: Premium features for higher tiers
- **Migration Path**: Existing users grandfathered or upgraded

### 9. Technical Considerations

#### Performance Optimizations
- Database indexing on organization_id
- Query optimization for multi-tenant data
- Caching strategies for organization data
- Connection pooling considerations

#### Security Measures
- Enhanced RLS policies
- Organization-level data isolation
- Secure invitation tokens
- Role-based API authentication
- Audit logging for compliance

#### Monitoring & Analytics
- User engagement metrics per organization
- Feature usage by role
- Invitation conversion rates
- Performance monitoring
- Error tracking and alerting

### 10. Success Metrics

#### User Adoption
- **Organization Creation Rate**: New orgs created per week
- **Invitation Acceptance Rate**: % of invites accepted within 7 days
- **Team Size Growth**: Average users per organization over time
- **Feature Utilization**: Usage of collaboration features by role

#### Business Impact
- **Revenue per Organization**: Monthly recurring revenue
- **User Retention**: Monthly/yearly retention rates
- **Support Ticket Reduction**: Self-service team management
- **Customer Satisfaction**: NPS scores for multi-user features

## Conclusion

This multi-user strategy transforms EasyBizInvoice from a single-user invoicing tool into a comprehensive collaborative business management platform. The organization-based multi-tenancy approach provides:

- **Scalable Architecture**: Support for growing teams
- **Flexible Permissions**: Role-based access control
- **Business Value**: Team collaboration and productivity
- **Revenue Growth**: Subscription-based pricing model

The phased implementation approach ensures minimal disruption to existing users while providing a clear path to advanced collaboration features.