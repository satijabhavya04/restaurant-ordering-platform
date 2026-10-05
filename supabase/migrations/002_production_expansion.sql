-- ==============================================================================
-- RESTAURANT DIGITAL ORDERING PLATFORM: PRODUCTION EXPANSION & NORMALIZATION
-- Phase 2: Modifier Groups, Bills, Receipts, Game Sessions, and Realtime Replication
-- ==============================================================================

-- 1. MODIFIER GROUPS & MODIFIER OPTIONS
CREATE TABLE IF NOT EXISTS modifier_groups (
    id TEXT PRIMARY KEY DEFAULT ('modgrp_' || encode(gen_random_bytes(6), 'hex')),
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id TEXT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'RADIO',
    required BOOLEAN NOT NULL DEFAULT false,
    min_selection INT NOT NULL DEFAULT 0,
    max_selection INT NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS modifiers (
    id TEXT PRIMARY KEY DEFAULT ('mod_' || encode(gen_random_bytes(6), 'hex')),
    modifier_group_id TEXT NOT NULL REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_delta NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_available BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. GAME SESSIONS & CHEF CHALLENGE AUDIT
CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY DEFAULT ('game_' || encode(gen_random_bytes(6), 'hex')),
    dining_session_id TEXT NOT NULL REFERENCES dining_sessions(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id TEXT NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    discount_percentage NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    max_discount_cap NUMERIC(4,2) NOT NULL DEFAULT 20.00,
    verified BOOLEAN NOT NULL DEFAULT true,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DISCOUNTS APPLIED LEDGER
CREATE TABLE IF NOT EXISTS discounts (
    id TEXT PRIMARY KEY DEFAULT ('disc_' || encode(gen_random_bytes(6), 'hex')),
    dining_session_id TEXT NOT NULL REFERENCES dining_sessions(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'GAME_CHEF' | 'PROMO' | 'STAFF_COMP'
    percentage NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    authorized_by_staff_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AUTHORITATIVE BILL LEDGER
CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY DEFAULT ('bill_' || encode(gen_random_bytes(8), 'hex')),
    dining_session_id TEXT NOT NULL UNIQUE REFERENCES dining_sessions(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id TEXT NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
    food_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount_percentage NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    net_food_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    service_charge_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    final_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_settled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. LEGAL TAX INVOICE RECEIPTS
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY DEFAULT ('rcpt_' || encode(gen_random_bytes(8), 'hex')),
    dining_session_id TEXT NOT NULL REFERENCES dining_sessions(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    gstin TEXT NOT NULL,
    fssai TEXT NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    receipt_payload JSONB NOT NULL,
    tamper_hash TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SECURITY & AUDIT TRAIL LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT ('audit_' || encode(gen_random_bytes(8), 'hex')),
    restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    staff_user_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'STAFF_LOGIN' | 'CASH_CONFIRM' | 'TABLE_CLEAR' | '86_ITEM' | 'PIN_REJECT'
    entity_type TEXT NOT NULL, -- 'TABLE' | 'BILL' | 'STAFF' | 'MENU_ITEM'
    entity_id TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ENABLE ROW LEVEL SECURITY ON EXPANDED TABLES
ALTER TABLE modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Customer Read Policies for Modifiers & Bills
CREATE POLICY "Public Read Active Modifiers" ON modifier_groups
    FOR SELECT USING (true);

CREATE POLICY "Public Read Modifier Options" ON modifiers
    FOR SELECT USING (is_available = true);

CREATE POLICY "Customer Read Active Table Bill" ON bills
    FOR SELECT USING (
        dining_session_id IN (
            SELECT id FROM dining_sessions WHERE status != 'CLOSED'
        )
    );

CREATE POLICY "Customer Read Confirmed Receipt" ON receipts
    FOR SELECT USING (true);

-- Staff Policies for Audit & Management
CREATE POLICY "Staff Manage Modifiers" ON modifier_groups
    FOR ALL USING (current_staff_role() IN ('OWNER_ADMIN', 'MANAGER'));

CREATE POLICY "Staff Insert Audit Logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Manager View Audit Logs" ON audit_logs
    FOR SELECT USING (current_staff_role() IN ('OWNER_ADMIN', 'MANAGER'));

-- 8. REALTIME REPLICATION PUBLICATION
-- Enable Supabase Realtime for operational tables
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE dining_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE order_batches;
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE service_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
    ALTER PUBLICATION supabase_realtime ADD TABLE bills;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;

-- 9. OPERATIONAL COMPOSITE INDEXES
CREATE INDEX IF NOT EXISTS idx_order_batches_active ON order_batches (restaurant_id, status, placed_at);
CREATE INDEX IF NOT EXISTS idx_order_batches_session ON order_batches (dining_session_id, batch_sequence);
CREATE INDEX IF NOT EXISTS idx_order_items_batch ON order_items (order_batch_id, station);
CREATE INDEX IF NOT EXISTS idx_service_requests_active ON service_requests (restaurant_id, status, requested_at);
CREATE INDEX IF NOT EXISTS idx_dining_sessions_table_active ON dining_sessions (restaurant_id, table_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON menu_items (restaurant_id, category_id, is_available);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments (restaurant_id, dining_session_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_time ON audit_logs (restaurant_id, created_at DESC);
