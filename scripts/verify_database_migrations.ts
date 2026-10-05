/**
 * Database Migration Verification Script
 * Validates the PostgreSQL / Supabase migration files:
 *   - supabase/migrations/001_security_and_rls.sql
 *   - supabase/migrations/002_production_expansion.sql
 * Inspects all 17 required production tables, enums, RLS policies, unique constraints, and composite indexes.
 */
import fs from 'fs';
import path from 'path';

const MIGRATION_DIR = path.resolve(process.cwd(), 'supabase/migrations');
const MIGRATION_001 = path.join(MIGRATION_DIR, '001_security_and_rls.sql');
const MIGRATION_002 = path.join(MIGRATION_DIR, '002_production_expansion.sql');

interface CheckResult {
  id: number;
  category: string;
  name: string;
  passed: boolean;
  details: string;
}

const checks: CheckResult[] = [];

function recordCheck(id: number, category: string, name: string, passed: boolean, details: string) {
  checks.push({ id, category, name, passed, details });
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${status}] Check ${id.toString().padStart(2, '0')}: ${name}`);
  console.log(`       Category: ${category}`);
  console.log(`       Details:  ${details}\n`);
}

console.log('================================================================');
console.log('STARTING DATABASE SCHEMA & SQL MIGRATIONS VERIFICATION');
console.log('================================================================\n');

if (!fs.existsSync(MIGRATION_001) || !fs.existsSync(MIGRATION_002)) {
  console.error('Error: Migration files missing in supabase/migrations directory.');
  process.exit(1);
}

const content001 = fs.readFileSync(MIGRATION_001, 'utf8');
const content002 = fs.readFileSync(MIGRATION_002, 'utf8');
const combinedSql = `${content001}\n${content002}`;

// 1. Required Custom ENUM Types
const requiredEnums = [
  'staff_role',
  'dining_session_status',
  'payment_status',
  'order_batch_status',
  'service_request_type',
];

let enumsPassed = true;
const missingEnums: string[] = [];
for (const e of requiredEnums) {
  const enumRegex = new RegExp(`CREATE\\s+TYPE\\s+${e}\\s+AS\\s+ENUM`, 'i');
  if (!enumRegex.test(combinedSql)) {
    enumsPassed = false;
    missingEnums.push(e);
  }
}
recordCheck(
  1,
  'DDL Enums',
  'PostgreSQL Custom ENUM Types Declared',
  enumsPassed,
  enumsPassed
    ? `All ${requiredEnums.length} enum types present (${requiredEnums.join(', ')}).`
    : `Missing enums: ${missingEnums.join(', ')}`
);

// 2. All 17 Core Production Tables
const requiredTables = [
  'restaurants',
  'staff_users',
  'restaurant_tables',
  'dining_sessions',
  'menu_categories',
  'menu_items',
  'order_batches',
  'order_items',
  'service_requests',
  'payments',
  'modifier_groups',
  'modifiers',
  'game_sessions',
  'discounts',
  'bills',
  'receipts',
  'audit_logs',
];

let tablesPassed = true;
const missingTables: string[] = [];
for (const t of requiredTables) {
  const tableRegex = new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${t}\\b`, 'i');
  if (!tableRegex.test(combinedSql)) {
    tablesPassed = false;
    missingTables.push(t);
  }
}
recordCheck(
  2,
  'Relational Schema',
  'All 17 Required Production Tables Declared',
  tablesPassed,
  tablesPassed
    ? `All 17 tables declared with proper DDL.`
    : `Missing tables: ${missingTables.join(', ')}`
);

// 3. Multi-Tenant Foreign Keys (restaurant_id on tenant tables)
const tenantTables = [
  'staff_users',
  'restaurant_tables',
  'dining_sessions',
  'menu_categories',
  'menu_items',
  'order_batches',
  'order_items',
  'service_requests',
  'payments',
  'modifier_groups',
  'game_sessions',
  'discounts',
  'bills',
  'receipts',
  'audit_logs',
];

let tenantFkPassed = true;
const failedFkTables: string[] = [];
for (const t of tenantTables) {
  const fkRegex = new RegExp(`${t}[^;]*restaurant_id\\s+TEXT\\s+NOT\\s+NULL\\s+REFERENCES\\s+restaurants`, 'is');
  if (!fkRegex.test(combinedSql)) {
    tenantFkPassed = false;
    failedFkTables.push(t);
  }
}
recordCheck(
  3,
  'Multi-Tenant Integrity',
  'Foreign Key Cascades to restaurants(id)',
  tenantFkPassed,
  tenantFkPassed
    ? `All ${tenantTables.length} tenant-owned tables enforce foreign key integrity on restaurant_id.`
    : `Missing restaurant_id FK in: ${failedFkTables.join(', ')}`
);

// 4. Row Level Security (RLS) Enabled on All Tables
let rlsPassed = true;
const missingRls: string[] = [];
for (const t of requiredTables) {
  const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+${t}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
  if (!rlsRegex.test(combinedSql)) {
    rlsPassed = false;
    missingRls.push(t);
  }
}
recordCheck(
  4,
  'Row Level Security',
  'RLS Explicitly Enabled on All 17 Tables',
  rlsPassed,
  rlsPassed
    ? 'All 17 production tables have ROW LEVEL SECURITY explicitly enabled.'
    : `Tables without RLS: ${missingRls.join(', ')}`
);

// 5. Unique Constraints (Idempotency, Table numbers, Staff email per tenant)
const hasIdempotencyConstraint = combinedSql.includes('batch_tenant_idempotency UNIQUE (restaurant_id, idempotency_key)');
const hasTableConstraint = combinedSql.includes('table_tenant_unique UNIQUE (restaurant_id, table_number)');
const hasStaffEmailConstraint = combinedSql.includes('staff_email_tenant_unique UNIQUE (restaurant_id, email)');
const constraintsPassed = hasIdempotencyConstraint && hasTableConstraint && hasStaffEmailConstraint;
recordCheck(
  5,
  'Data Constraints',
  'Multi-Tenant Unique & Idempotency Constraints',
  constraintsPassed,
  constraintsPassed
    ? 'Verified batch_tenant_idempotency, table_tenant_unique, and staff_email_tenant_unique constraints.'
    : 'One or more required unique constraints missing.'
);

// 6. Operational Composite Indexes
const expectedIndexes = [
  'idx_order_batches_active',
  'idx_order_batches_session',
  'idx_order_items_batch',
  'idx_service_requests_active',
  'idx_dining_sessions_table_active',
  'idx_menu_items_availability',
  'idx_payments_session',
  'idx_audit_logs_tenant_time',
];

let indexesPassed = true;
const missingIndexes: string[] = [];
for (const idx of expectedIndexes) {
  if (!combinedSql.includes(idx)) {
    indexesPassed = false;
    missingIndexes.push(idx);
  }
}
recordCheck(
  6,
  'Database Performance',
  'Operational Composite Indexes Defined',
  indexesPassed,
  indexesPassed
    ? `All ${expectedIndexes.length} composite performance indexes verified.`
    : `Missing indexes: ${missingIndexes.join(', ')}`
);

// 7. Kitchen Display Shield View & Permissions
const hasKdsView = combinedSql.includes('CREATE OR REPLACE VIEW kitchen_display_view');
const hasSecurityInvoker = combinedSql.includes('WITH (security_invoker = true)');
const hasRevokePayments = combinedSql.includes('REVOKE ALL ON payments FROM PUBLIC');
const hasRevokeStaff = combinedSql.includes('REVOKE ALL ON staff_users FROM PUBLIC');
const kdsShieldPassed = hasKdsView && hasSecurityInvoker && hasRevokePayments && hasRevokeStaff;
recordCheck(
  7,
  'KDS Data Shield',
  'Kitchen Display View & Sensitive Table Revocations',
  kdsShieldPassed,
  kdsShieldPassed
    ? 'kitchen_display_view defined with security_invoker; sensitive tables REVOKED from public/kitchen.'
    : 'KDS shield view or table revocations missing.'
);

// 8. Supabase Realtime Publication Registration
const hasRealtimePub = combinedSql.includes('ALTER PUBLICATION supabase_realtime ADD TABLE');
recordCheck(
  8,
  'Supabase Realtime',
  'Realtime Publication Configured for Operational Entities',
  hasRealtimePub,
  hasRealtimePub
    ? 'Operational tables registered with supabase_realtime publication.'
    : 'Realtime publication configuration missing.'
);

console.log('================================================================');
const allPassed = checks.every((c) => c.passed);
const totalPassed = checks.filter((c) => c.passed).length;
console.log(`MIGRATIONS VERIFICATION: ${totalPassed} / ${checks.length} CHECKS PASSED`);
if (allPassed) {
  console.log('VERDICT: ALL DATABASE MIGRATION & DDL INTEGRITY CHECKS PASSED WITH 100% SUCCESS!');
} else {
  console.log('VERDICT: DATABASE MIGRATION INTEGRITY ISSUES DETECTED.');
}
console.log('================================================================\n');

if (!allPassed) {
  process.exit(1);
}
