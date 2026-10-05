-- ==============================================================================
-- RESTAURANT DIGITAL ORDERING PLATFORM: PRODUCTION SECURITY & RLS MIGRATION
-- Multi-Tenant Isolation, Staff RBAC, Ephemeral Customer Sessions, & KDS Shield
-- ==============================================================================

-- 1. EXTENSIONS & CUSTOM ENUM TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE staff_role AS ENUM ('OWNER_ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'KITCHEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dining_session_status AS ENUM ('ACTIVE', 'PAYMENT_PENDING', 'PAID', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('UNPAID', 'PROCESSING', 'PAID', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_batch_status AS ENUM ('NEW', 'SUBMITTED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_request_type AS ENUM ('WATER', 'CLEAN_TABLE', 'CALL_WAITER', 'CUTLERY', 'BILL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. CORE SYSTEM TABLES

-- Restaurants (Tenants)
CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY DEFAULT ('resto_' || encode(gen_random_bytes(8), 'hex')),
    name TEXT NOT NULL,
    legal_name TEXT NOT NULL DEFAULT '',
    slug TEXT NOT NULL UNIQUE,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    gst_number TEXT NOT NULL,
    fssai TEXT NOT NULL DEFAULT '',
    service_charge_pct NUMERIC(4,2) NOT NULL DEFAULT 5.00,
    gst_tax_pct NUMERIC(4,2) NOT NULL DEFAULT 5.00,
    currency TEXT NOT NULL DEFAULT 'INR',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    settings JSONB NOT NULL DEFAULT '{"orderingEnabled": true, "serviceChargeEnabled": true}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staff Accounts
CREATE TABLE IF NOT EXISTS staff_users (
    id TEXT PRIMARY KEY DEFAULT ('staff_' || encode(gen_random_bytes(6), 'hex')),
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE, -- References auth.users(id) in Supabase
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role staff_role NOT NULL,
    pin_hash TEXT NOT NULL, -- Argon2 / bcrypt salted PIN hash
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT staff_email_tenant_unique UNIQUE (restaurant_id, email)
);

-- Physical Dining Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id TEXT PRIMARY KEY DEFAULT ('tbl_' || encode(gen_random_bytes(6), 'hex')),
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    capacity INT NOT NULL DEFAULT 4,
    section TEXT NOT NULL DEFAULT 'Main Dining',
    status dining_session_status NOT NULL DEFAULT 'AVAILABLE',
    active_session_id TEXT,
    qr_seed TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT table_tenant_unique UNIQUE (restaurant_id, table_number)
);

-- Dining Sessions (Created via table QR scan)
CREATE TABLE IF NOT EXISTS dining_sessions (
    id TEXT PRIMARY KEY DEFAULT ('ds_' || encode(gen_random_bytes(8), 'hex')),
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id TEXT NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    status dining_session_status NOT NULL DEFAULT 'ACTIVE',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    seated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    customer_token_hash TEXT NOT NULL, -- Cryptographic hash of ephemeral customer bearer token
    payment_status payment_status NOT NULL DEFAULT 'UNPAID',
    payment_method TEXT,
    payment_reference_id TEXT,
    discount_percentage NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY DEFAULT ('cat_' || encode(gen_random_bytes(6), 'hex')),
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu Catalog Items
CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY DEFAULT ('item_' || encode(gen_random_bytes(6), 'hex')),
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    base_price NUMERIC(10,2) NOT NULL,
    diet TEXT NOT NULL DEFAULT 'VEG', -- 'VEG' | 'NON_VEG'
    spice_level TEXT NOT NULL DEFAULT 'MEDIUM',
    prep_time_minutes INT NOT NULL DEFAULT 15,
    station TEXT NOT NULL DEFAULT 'TANDOOR',
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_bestseller BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kitchen / Order Batches (Rounds)
CREATE TABLE IF NOT EXISTS order_batches (
    id TEXT PRIMARY KEY DEFAULT ('batch_' || encode(gen_random_bytes(8), 'hex')),
    dining_session_id TEXT NOT NULL REFERENCES dining_sessions(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id TEXT NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    batch_sequence INT NOT NULL DEFAULT 1,
    round_number INT NOT NULL DEFAULT 1,
    status order_batch_status NOT NULL DEFAULT 'NEW',
    idempotency_key TEXT,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_minutes INT NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT batch_tenant_idempotency UNIQUE (restaurant_id, idempotency_key)
);

-- Order Line Items
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT ('oi_' || encode(gen_random_bytes(8), 'hex')),
    order_batch_id TEXT NOT NULL REFERENCES order_batches(id) ON DELETE CASCADE,
    dining_session_id TEXT NOT NULL REFERENCES dining_sessions(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    diet TEXT NOT NULL DEFAULT 'VEG',
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    selected_modifiers JSONB NOT NULL DEFAULT '[]'::jsonb,
    special_instructions TEXT NOT NULL DEFAULT '',
    station TEXT NOT NULL DEFAULT 'TANDOOR',
    kitchen_status TEXT NOT NULL DEFAULT 'QUEUED',
    is_cooked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Calls (Water, Waiter, Clean, Cutlery, Bill)
CREATE TABLE IF NOT EXISTS service_requests (
    id TEXT PRIMARY KEY DEFAULT ('req_' || encode(gen_random_bytes(8), 'hex')),
    dining_session_id TEXT NOT NULL REFERENCES dining_sessions(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id TEXT NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    type service_request_type NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_staff_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ
);

-- Payments & Invoices Audit
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT ('pay_' || encode(gen_random_bytes(8), 'hex')),
    dining_session_id TEXT NOT NULL REFERENCES dining_sessions(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    subtotal NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    service_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    gst_tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tip_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    provider TEXT NOT NULL DEFAULT 'CASH',
    provider_order_id TEXT,
    provider_payment_id TEXT,
    payment_method TEXT NOT NULL, -- 'UPI' | 'CARD' | 'CASH'
    payment_status payment_status NOT NULL DEFAULT 'PAID',
    reference_id TEXT NOT NULL,
    verification_reference TEXT,
    recorded_by_staff_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS

-- Extract current staff role from Supabase JWT auth claims
CREATE OR REPLACE FUNCTION current_staff_role() RETURNS staff_role AS $$
BEGIN
    RETURN (COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'staff_role',
        ''
    ))::staff_role;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Extract current tenant / restaurant ID from claims
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'restaurant_id',
        current_setting('request.jwt.claims', true)::jsonb ->> 'restaurant_id'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Extract customer active dining session ID from claims
CREATE OR REPLACE FUNCTION current_customer_session_id() RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.jwt.claims', true)::jsonb ->> 'customer_session_id';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. ENABLE RLS ON ALL TABLES
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 5. ACCESS POLICIES: MULTI-TENANT & ROLE-BASED ACCESS CONTROL (RBAC)

-- -----------------------------------------------------------------------------
-- RESTAURANTS: Public read for storefront info; Write reserved for OWNER_ADMIN
-- -----------------------------------------------------------------------------
CREATE POLICY "Public diner can view active restaurant details"
    ON restaurants FOR SELECT
    USING (is_active = true);

CREATE POLICY "Owner Admin can update restaurant settings"
    ON restaurants FOR UPDATE
    USING (id = current_tenant_id() AND current_staff_role() = 'OWNER_ADMIN')
    WITH CHECK (id = current_tenant_id() AND current_staff_role() = 'OWNER_ADMIN');

-- -----------------------------------------------------------------------------
-- STAFF_USERS: Zero customer access; Managers view; Only OWNER_ADMIN creates/edits
-- -----------------------------------------------------------------------------
CREATE POLICY "Staff directory visible to authenticated management"
    ON staff_users FOR SELECT
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER')
    );

CREATE POLICY "Only Owner Admin can manage staff directory"
    ON staff_users FOR ALL
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() = 'OWNER_ADMIN'
    )
    WITH CHECK (
        restaurant_id = current_tenant_id() AND
        current_staff_role() = 'OWNER_ADMIN'
    );

-- -----------------------------------------------------------------------------
-- MENU: Public read for active catalog; Write reserved for OWNER_ADMIN and MANAGER
-- -----------------------------------------------------------------------------
CREATE POLICY "Public menu read"
    ON menu_items FOR SELECT
    USING (is_available = true OR current_staff_role() IN ('OWNER_ADMIN', 'MANAGER', 'WAITER'));

CREATE POLICY "Management can modify menu items"
    ON menu_items FOR ALL
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER')
    );

-- -----------------------------------------------------------------------------
-- DINING SESSIONS: Customer scoped to active token; Staff scoped to tenant
-- Critical Guard: Closed sessions reject all customer modifications
-- -----------------------------------------------------------------------------
CREATE POLICY "Customer can read their active dining session"
    ON dining_sessions FOR SELECT
    USING (
        id = current_customer_session_id() AND
        status != 'CLOSED'
    );

CREATE POLICY "Staff can view all dining sessions in their restaurant"
    ON dining_sessions FOR SELECT
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER', 'WAITER', 'CASHIER')
    );

CREATE POLICY "Staff can update dining sessions in their restaurant"
    ON dining_sessions FOR UPDATE
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER', 'WAITER', 'CASHIER')
    );

-- -----------------------------------------------------------------------------
-- ORDERS: Customer can place orders ONLY on active session; Closed session blocked
-- -----------------------------------------------------------------------------
CREATE POLICY "Customer can place order batch on active session"
    ON order_batches FOR INSERT
    WITH CHECK (
        dining_session_id = current_customer_session_id() AND
        EXISTS (
            SELECT 1 FROM dining_sessions ds
            WHERE ds.id = current_customer_session_id()
            AND ds.status = 'ACTIVE'
        )
    );

CREATE POLICY "Customer can read their own order batches"
    ON order_batches FOR SELECT
    USING (
        dining_session_id = current_customer_session_id() AND
        EXISTS (
            SELECT 1 FROM dining_sessions ds
            WHERE ds.id = current_customer_session_id()
            AND ds.status != 'CLOSED'
        )
    );

CREATE POLICY "Staff can read all order batches for their restaurant"
    ON order_batches FOR SELECT
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER', 'WAITER', 'CASHIER', 'KITCHEN')
    );

CREATE POLICY "Staff can update order status (bump orders)"
    ON order_batches FOR UPDATE
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER', 'WAITER', 'KITCHEN')
    );

-- Order Items
CREATE POLICY "Customer can insert order items into active batch"
    ON order_items FOR INSERT
    WITH CHECK (
        dining_session_id = current_customer_session_id() AND
        EXISTS (
            SELECT 1 FROM dining_sessions ds
            WHERE ds.id = current_customer_session_id()
            AND ds.status = 'ACTIVE'
        )
    );

CREATE POLICY "Customer can read order items in their active session"
    ON order_items FOR SELECT
    USING (
        dining_session_id = current_customer_session_id() AND
        EXISTS (
            SELECT 1 FROM dining_sessions ds
            WHERE ds.id = current_customer_session_id()
            AND ds.status != 'CLOSED'
        )
    );

-- -----------------------------------------------------------------------------
-- SERVICE REQUESTS: Scoped to active dining session
-- -----------------------------------------------------------------------------
CREATE POLICY "Customer can summon service on active session"
    ON service_requests FOR INSERT
    WITH CHECK (
        dining_session_id = current_customer_session_id() AND
        EXISTS (
            SELECT 1 FROM dining_sessions ds
            WHERE ds.id = current_customer_session_id()
            AND ds.status = 'ACTIVE'
        )
    );

CREATE POLICY "Floor staff can view and manage service requests"
    ON service_requests FOR ALL
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER', 'WAITER')
    );

-- -----------------------------------------------------------------------------
-- PAYMENTS: Customers can initiate payments; Kitchen staff STRICTLY BLOCKED
-- -----------------------------------------------------------------------------
CREATE POLICY "Customer can view payments for their dining session"
    ON payments FOR SELECT
    USING (
        dining_session_id = current_customer_session_id()
    );

CREATE POLICY "Management and Cashier can view all restaurant payments"
    ON payments FOR SELECT
    USING (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER', 'CASHIER')
    );

CREATE POLICY "Cashier and Management can record payments"
    ON payments FOR INSERT
    WITH CHECK (
        restaurant_id = current_tenant_id() AND
        current_staff_role() IN ('OWNER_ADMIN', 'MANAGER', 'CASHIER')
    );

-- 6. KITCHEN DISPLAY SYSTEM (KDS) SHIELD VIEW
-- Crucial Security Requirement: Kitchen line cooks must NEVER receive customer PII,
-- pricing, totals, bills, GST, discounts, or tips at the database layer.
CREATE OR REPLACE VIEW kitchen_display_view
WITH (security_invoker = true) AS
SELECT
    ob.id AS batch_id,
    ob.dining_session_id,
    ob.restaurant_id,
    ob.table_id,
    rt.table_number,
    rt.section,
    ob.batch_sequence,
    ob.status AS batch_status,
    ob.placed_at,
    ob.estimated_minutes,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'order_item_id', oi.id,
                'menu_item_id', oi.menu_item_id,
                'name', oi.name,
                'quantity', oi.quantity,
                'selected_modifiers', oi.selected_modifiers,
                'special_instructions', oi.special_instructions,
                'station', oi.station,
                'is_cooked', oi.is_cooked
            )
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'::jsonb
    ) AS items
FROM order_batches ob
JOIN restaurant_tables rt ON rt.id = ob.table_id
LEFT JOIN order_items oi ON oi.order_batch_id = ob.id
GROUP BY
    ob.id,
    ob.dining_session_id,
    ob.restaurant_id,
    ob.table_id,
    rt.table_number,
    rt.section,
    ob.batch_sequence,
    ob.status,
    ob.placed_at,
    ob.estimated_minutes;

-- REVOKE direct access on sensitive financial tables from kitchen role
REVOKE ALL ON payments FROM PUBLIC;
REVOKE ALL ON staff_users FROM PUBLIC;
GRANT SELECT ON kitchen_display_view TO PUBLIC;
