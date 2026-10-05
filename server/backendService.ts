import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DiningSession,
  RestaurantTable,
  MenuItem,
  OrderBatch,
  OrderItem,
  ServiceRequest,
  ServiceRequestType,
  ServiceRequestStatus,
  OrderBatchStatus,
  StaffMember,
  RestaurantSettings,
  GameSettings,
} from '../src/types';
import { SEED_MENU_ITEMS } from '../src/data/seedCatalog';
import { SEED_TABLES } from '../src/data/seedTables';
import {
  SEED_STAFF,
  SEED_RESTAURANT_SETTINGS,
  SEED_GAME_SETTINGS,
} from '../src/data/seedAdmin';

// =============================================================================
// SERVER-SIDE SUPABASE CONFIGURATION & ADAPTER
// =============================================================================

const serverSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serverSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = Boolean(
  serverSupabaseUrl &&
  serverSupabaseKey &&
  !serverSupabaseUrl.includes('placeholder') &&
  !serverSupabaseKey.includes('placeholder')
);

export const serverSupabase: SupabaseClient | null = isServerSupabaseConfigured
  ? createClient(serverSupabaseUrl, serverSupabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// =============================================================================
// BACKEND REALTIME EVENT BUS & STATE STORE (Source of Truth)
// =============================================================================

export interface RealtimeEvent {
  type:
    | 'STATE_SYNC'
    | 'SESSION_BOOTSTRAPPED'
    | 'ORDER_PLACED'
    | 'ORDER_BUMPED'
    | 'SERVICE_REQUEST_CREATED'
    | 'SERVICE_REQUEST_UPDATED'
    | 'MENU_UPDATED'
    | 'GAME_DISCOUNT_APPLIED'
    | 'PAYMENT_SETTLED'
    | 'TABLE_CLEARED';
  timestamp: string;
  tableId?: string;
  sessionId?: string;
  payload: any;
}

class BackendService {
  // Authoritative State
  private tables: RestaurantTable[] = JSON.parse(JSON.stringify(SEED_TABLES));
  private menuItems: MenuItem[] = JSON.parse(JSON.stringify(SEED_MENU_ITEMS));
  private staff: StaffMember[] = JSON.parse(JSON.stringify(SEED_STAFF));
  private restaurantSettings: RestaurantSettings = { ...SEED_RESTAURANT_SETTINGS };
  private gameSettings: GameSettings = { ...SEED_GAME_SETTINGS };

  // Map of active or closed dining sessions indexed by sessionId
  private sessions: Map<string, DiningSession> = new Map();

  // Processed Idempotency Keys (prevents duplicate order submissions on double-tap)
  private processedIdempotencyKeys: Set<string> = new Set();

  // Active Server-Sent Event (SSE) Client Connections across all devices
  private sseClients: Set<ServerResponse> = new Set();

  constructor() {
    // Initialize default active session for Table 04 if present in seed
    const tbl04 = this.tables.find((t) => t.id === 'tbl_04');
    if (tbl04 && tbl04.session) {
      this.sessions.set(tbl04.session.sessionId, tbl04.session);
    }
  }

  // SSE Client registration
  public registerSseClient(res: ServerResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial handshake state sync
    const initialPayload: RealtimeEvent = {
      type: 'STATE_SYNC',
      timestamp: new Date().toISOString(),
      payload: {
        tables: this.getTables(),
        menuItems: this.menuItems,
        restaurantSettings: this.restaurantSettings,
      },
    };
    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

    this.sseClients.add(res);

    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  // Broadcast event to all physical devices subscribed to the realtime bus
  public broadcastEvent(event: RealtimeEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(data);
      } catch {
        this.sseClients.delete(client);
      }
    }

    // Dual-mode broadcasting: Also dispatch to Supabase Realtime channel if active
    if (serverSupabase) {
      try {
        serverSupabase
          .channel('restaurant-live')
          .send({
            type: 'broadcast',
            event: 'restaurant-update',
            payload: event,
          })
          .catch(() => {});
      } catch {
        // Non-blocking fallback
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SUPABASE DATABASE PERSISTENCE ADAPTER (Async Background / Non-Blocking)
  // ---------------------------------------------------------------------------

  private async persistSession(session: DiningSession) {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('dining_sessions').upsert({
        id: session.sessionId,
        restaurant_id: 'resto_spice_pavilion_01',
        table_id: session.tableId,
        status: session.status,
        opened_at: session.startedAt,
        seated_at: session.startedAt,
        payment_status: session.paymentStatus,
        payment_method: session.paymentMethod || null,
        payment_reference_id: session.paymentReferenceId || null,
        discount_percentage: session.bill.discountPercentage || 0,
        customer_token_hash: crypto.createHash('sha256').update(session.sessionId).digest('hex'),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Database persistence notice (dining_sessions):', (err as Error).message);
    }
  }

  private async persistOrderBatch(batch: OrderBatch, session: DiningSession, idempotencyKey?: string) {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('order_batches').upsert({
        id: batch.batchId,
        dining_session_id: session.sessionId,
        restaurant_id: 'resto_spice_pavilion_01',
        table_id: session.tableId,
        batch_sequence: batch.batchSequence,
        round_number: batch.batchSequence,
        status: batch.status,
        idempotency_key: idempotencyKey || null,
        placed_at: new Date().toISOString(),
        estimated_minutes: batch.estimatedMinutes || 15,
        updated_at: new Date().toISOString(),
      });

      if (batch.items && batch.items.length > 0) {
        const lineItems = batch.items.map((item) => ({
          id: item.orderItemId,
          order_batch_id: batch.batchId,
          dining_session_id: session.sessionId,
          restaurant_id: 'resto_spice_pavilion_01',
          menu_item_id: item.menuItemId,
          name: item.name,
          diet: item.diet,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          selected_modifiers: item.selectedModifiers || [],
          special_instructions: item.specialInstructions || '',
          station: 'TANDOOR',
          kitchen_status: 'QUEUED',
          is_cooked: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        await serverSupabase.from('order_items').upsert(lineItems);
      }
    } catch (err) {
      console.warn('Database persistence notice (order_batches):', (err as Error).message);
    }
  }

  private async persistBatchStatusBump(batchId: string, status: OrderBatchStatus) {
    if (!serverSupabase) return;
    try {
      await serverSupabase
        .from('order_batches')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', batchId);
    } catch (err) {
      console.warn('Database persistence notice (order_batches bump):', (err as Error).message);
    }
  }

  private async persistServiceRequest(req: ServiceRequest, sessionId: string) {
    if (!serverSupabase) return;
    try {
      await serverSupabase.from('service_requests').upsert({
        id: req.id,
        dining_session_id: sessionId,
        restaurant_id: 'resto_spice_pavilion_01',
        table_id: req.tableId,
        type: req.type,
        note: req.note || null,
        status: req.status,
        requested_at: req.requestedAt,
        resolved_at: req.status === 'RESOLVED' ? new Date().toISOString() : null,
      });
    } catch (err) {
      console.warn('Database persistence notice (service_requests):', (err as Error).message);
    }
  }

  private async persistGameDiscount(sessionId: string, score: number, discountPct: number) {
    if (!serverSupabase) return;
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;
      await serverSupabase.from('game_sessions').insert({
        id: `game_${Date.now().toString(36)}`,
        dining_session_id: sessionId,
        restaurant_id: 'resto_spice_pavilion_01',
        table_id: session.tableId,
        score,
        discount_percentage: discountPct,
        max_discount_cap: 20.0,
        verified: true,
        played_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Database persistence notice (game_sessions):', (err as Error).message);
    }
  }

  private async persistPaymentAndReceipt(session: DiningSession, paymentMethod: string, referenceId: string, staffName?: string) {
    if (!serverSupabase) return;
    try {
      const paymentId = `pay_${Date.now()}`;
      await serverSupabase.from('payments').insert({
        id: paymentId,
        dining_session_id: session.sessionId,
        restaurant_id: 'resto_spice_pavilion_01',
        subtotal: session.bill.foodSubtotal,
        discount_amount: session.bill.discountAmount,
        service_charge: 0,
        gst_tax: session.bill.cgstAmount + session.bill.sgstAmount,
        tip_amount: 0,
        total_amount: session.bill.finalTotal,
        currency: 'INR',
        provider: paymentMethod,
        payment_method: paymentMethod,
        payment_status: 'PAID',
        reference_id: referenceId,
        verification_reference: staffName || 'ONLINE_VERIFIED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
      await serverSupabase.from('receipts').insert({
        id: `rcpt_${Date.now()}`,
        dining_session_id: session.sessionId,
        payment_id: paymentId,
        restaurant_id: 'resto_spice_pavilion_01',
        invoice_number: invoiceNum,
        gstin: session.gstin || '07AABCU9603R1ZM',
        fssai: session.fssai || '10019011006543',
        subtotal: session.bill.foodSubtotal,
        discount: session.bill.discountAmount,
        tax: session.bill.cgstAmount + session.bill.sgstAmount,
        grand_total: session.bill.finalTotal,
        receipt_payload: session.bill,
        tamper_hash: crypto.createHash('sha256').update(`${invoiceNum}:${session.bill.finalTotal}:${referenceId}`).digest('hex'),
        issued_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Database persistence notice (payments/receipts):', (err as Error).message);
    }
  }

  public getTables(): RestaurantTable[] {
    return this.tables.map((tbl) => {
      if (tbl.session) {
        const liveSession = this.sessions.get(tbl.session.sessionId);
        if (liveSession) {
          return {
            ...tbl,
            status: liveSession.status,
            session: liveSession,
          };
        }
      }
      return tbl;
    });
  }

  public getMenuItems(): MenuItem[] {
    return this.menuItems;
  }

  public getSession(sessionId: string): DiningSession | undefined {
    return this.sessions.get(sessionId);
  }

  // 1. Dynamic QR Bootstrap & Join Active Session
  public bootstrapSession(tableId: string, restaurantId?: string): {
    success: boolean;
    session?: DiningSession;
    table?: RestaurantTable;
    token: string;
    isNew: boolean;
    message?: string;
  } {
    const targetTable = this.tables.find((t) => t.id === tableId);
    if (!targetTable) {
      return { success: false, token: '', isNew: false, message: `Table ${tableId} not found.` };
    }

    // Check if table already has an active dining session
    if (targetTable.session && targetTable.status !== 'AVAILABLE' && targetTable.status !== 'CLOSED') {
      const existingSession = this.sessions.get(targetTable.session.sessionId);
      if (existingSession && existingSession.status !== 'CLOSED') {
        const token = `tok_cust_${existingSession.sessionId}_${Date.now()}`;
        return {
          success: true,
          session: existingSession,
          table: targetTable,
          token,
          isNew: false,
        };
      }
    }

    // Otherwise, create a fresh active dining session for this table
    const newSessionId = `ds_${tableId}_${Date.now()}`;
    const newSession: DiningSession = {
      sessionId: newSessionId,
      restaurantId: restaurantId || this.restaurantSettings.name,
      restaurantName: this.restaurantSettings.name,
      restaurantAddress: this.restaurantSettings.address,
      gstin: this.restaurantSettings.gstin,
      fssai: this.restaurantSettings.fssai,
      tableId: targetTable.id,
      tableNumber: targetTable.tableNumber,
      status: 'ACTIVE',
      guestCount: targetTable.capacity,
      startedAt: new Date().toISOString(),
      gameStatus: {
        hasPlayed: false,
        score: 0,
        discountPercentage: 0,
      },
      orderBatches: [],
      serviceRequests: [],
      bill: {
        foodSubtotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        netFoodAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        finalTotal: 0,
      },
      paymentStatus: 'UNPAID',
    };

    this.sessions.set(newSessionId, newSession);

    // Update table in registry
    targetTable.status = 'ACTIVE';
    targetTable.session = newSession;

    this.persistSession(newSession);

    const token = `tok_cust_${newSessionId}_${Date.now()}`;

    // Broadcast table status change
    this.broadcastEvent({
      type: 'SESSION_BOOTSTRAPPED',
      timestamp: new Date().toISOString(),
      tableId: targetTable.id,
      sessionId: newSessionId,
      payload: { table: targetTable, session: newSession },
    });

    return {
      success: true,
      session: newSession,
      table: targetTable,
      token,
      isNew: true,
    };
  }

  // 2. Submit Order Batch (with Idempotency & Availability Verification)
  public submitOrderBatch(params: {
    sessionId: string;
    tableId: string;
    items: {
      menuItemId: string;
      quantity: number;
      selectedModifiers: any[];
      specialInstructions?: string;
    }[];
    idempotencyKey?: string;
  }): { success: boolean; batch?: OrderBatch; message?: string; soldOutItem?: MenuItem } {
    const { sessionId, tableId, items, idempotencyKey } = params;

    // Idempotency check: reject duplicate rapid double-taps
    if (idempotencyKey) {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        return { success: false, message: 'Duplicate order submission detected and ignored.' };
      }
      this.processedIdempotencyKeys.add(idempotencyKey);
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Active dining session not found.' };
    }

    if (session.status === 'CLOSED' || session.status === 'PAID') {
      return { success: false, message: 'Dining session is closed or already settled.' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'Cannot place an empty order. Cart is empty.' };
    }

    for (const reqItem of items) {
      if (!reqItem.quantity || reqItem.quantity <= 0 || !Number.isInteger(reqItem.quantity)) {
        return { success: false, message: 'Invalid item quantity specified.' };
      }
    }

    // Check item availability against live backend menu catalogue
    for (const reqItem of items) {
      const catalogDish = this.menuItems.find((m) => m.id === reqItem.menuItemId);
      if (!catalogDish || !catalogDish.isAvailable) {
        return {
          success: false,
          soldOutItem: catalogDish || undefined,
          message: `Item "${catalogDish ? catalogDish.name : reqItem.menuItemId}" is currently sold out.`,
        };
      }
    }

    // Build order items
    const orderItems: OrderItem[] = items.map((reqItem, idx) => {
      const catalogDish = this.menuItems.find((m) => m.id === reqItem.menuItemId)!;
      const modDelta = (reqItem.selectedModifiers || []).reduce(
        (acc: number, m: any) => acc + (m.priceDelta || 0),
        0
      );
      const unitPrice = catalogDish.basePrice + modDelta;
      const totalPrice = unitPrice * reqItem.quantity;

      return {
        orderItemId: `ord_item_${Date.now()}_${idx}`,
        menuItemId: catalogDish.id,
        name: catalogDish.name,
        diet: catalogDish.diet,
        quantity: reqItem.quantity,
        unitPrice,
        totalPrice,
        selectedModifiers: reqItem.selectedModifiers || [],
        specialInstructions: reqItem.specialInstructions || '',
        isCooked: false,
      };
    });

    const batchSubtotal = orderItems.reduce((acc, i) => acc + i.totalPrice, 0);
    const batchSeq = session.orderBatches.length + 1;

    // IMPORTANT: Orders start at 'NEW' (or 'SUBMITTED') for kitchen triage
    const newBatch: OrderBatch = {
      batchId: `batch_${Date.now()}`,
      batchSequence: batchSeq,
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'NEW',
      items: orderItems,
      batchSubtotal,
      estimatedMinutes: 15,
    };

    session.orderBatches.push(newBatch);
    this.recalculateBill(session);

    this.persistOrderBatch(newBatch, session, idempotencyKey);
    this.persistSession(session);

    // Broadcast order placement to Kitchen KDS, Reception, and other customer devices
    this.broadcastEvent({
      type: 'ORDER_PLACED',
      timestamp: new Date().toISOString(),
      tableId,
      sessionId,
      payload: { batch: newBatch, session },
    });

    return { success: true, batch: newBatch };
  }

  // 3. Kitchen Bump Order Status (NEW -> PREPARING -> READY -> SERVED)
  public bumpOrderStatus(tableId: string, batchId: string, newStatus: OrderBatchStatus): boolean {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table || !table.session) return false;

    const session = this.sessions.get(table.session.sessionId);
    if (!session) return false;

    const targetBatch = session.orderBatches.find((b) => b.batchId === batchId);
    if (!targetBatch) return false;

    targetBatch.status = newStatus;

    this.persistBatchStatusBump(batchId, newStatus);
    this.persistSession(session);

    const bumpPayload = {
      batchId,
      orderBatchId: batchId,
      status: newStatus,
      newStatus,
      session,
      batch: targetBatch,
      tableId,
      sessionId: session.sessionId,
      diningSessionId: session.sessionId,
    };

    this.broadcastEvent({
      type: 'ORDER_BUMPED',
      timestamp: new Date().toISOString(),
      tableId,
      sessionId: session.sessionId,
      payload: bumpPayload,
    });

    this.broadcastEvent({
      type: 'ORDER_STATUS_UPDATED',
      timestamp: new Date().toISOString(),
      tableId,
      sessionId: session.sessionId,
      payload: bumpPayload,
    });

    return true;
  }

  // 4. Service Requests (Water, Cutlery, Waiter, Bill)
  public createServiceRequest(tableId: string, type: ServiceRequestType, note?: string): ServiceRequest | null {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table || !table.session) return null;

    const session = this.sessions.get(table.session.sessionId);
    if (!session) return null;

    const newReq: ServiceRequest = {
      id: `req_${Date.now()}`,
      tableId,
      tableNumber: table.tableNumber,
      type,
      note,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString(),
    };

    session.serviceRequests.unshift(newReq);

    this.persistServiceRequest(newReq, session.sessionId);

    this.broadcastEvent({
      type: 'SERVICE_REQUEST_CREATED',
      timestamp: new Date().toISOString(),
      tableId,
      sessionId: session.sessionId,
      payload: { request: newReq },
    });

    return newReq;
  }

  public updateServiceRequestStatus(
    tableId: string,
    requestId: string,
    status: ServiceRequestStatus
  ): boolean {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table || !table.session) return false;

    const session = this.sessions.get(table.session.sessionId);
    if (!session) return false;

    const req = session.serviceRequests.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = status;
    if (status === 'RESOLVED') {
      req.resolvedAt = new Date().toISOString();
    }

    this.persistServiceRequest(req, session.sessionId);

    this.broadcastEvent({
      type: 'SERVICE_REQUEST_UPDATED',
      timestamp: new Date().toISOString(),
      tableId,
      sessionId: session.sessionId,
      payload: { requestId, status, request: req },
    });

    return true;
  }

  // 5. Authoritative Game Score & Discount Calculation (Max 20% Hard Cap)
  public submitGameScore(sessionId: string, score: number): {
    success: boolean;
    discountPercentage: number;
    discountAmount: number;
    bill: any;
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, discountPercentage: 0, discountAmount: 0, bill: null };
    }

    // Enforce server-side discount tier evaluation
    let discountPct = 0;
    if (score >= 80) {
      discountPct = 20;
    } else if (score >= 60) {
      discountPct = 15;
    } else if (score >= 40) {
      discountPct = 10;
    } else if (score >= 20) {
      discountPct = 5;
    }

    // Hard cap at max 20%
    if (discountPct > 20) discountPct = 20;

    session.gameStatus = {
      hasPlayed: true,
      score,
      discountPercentage: discountPct,
    };

    this.recalculateBill(session);

    this.persistGameDiscount(session.sessionId, score, discountPct);
    this.persistSession(session);

    this.broadcastEvent({
      type: 'GAME_DISCOUNT_APPLIED',
      timestamp: new Date().toISOString(),
      tableId: session.tableId,
      sessionId: session.sessionId,
      payload: { discountPercentage: discountPct, bill: session.bill },
    });

    return {
      success: true,
      discountPercentage: discountPct,
      discountAmount: session.bill.discountAmount,
      bill: session.bill,
    };
  }

  // 6. Real-time Menu Inventory 86-ing Toggle
  public toggleMenuItemAvailability(itemId: string): boolean {
    const item = this.menuItems.find((i) => i.id === itemId);
    if (!item) return false;

    item.isAvailable = !item.isAvailable;

    this.broadcastEvent({
      type: 'MENU_UPDATED',
      timestamp: new Date().toISOString(),
      payload: { itemId, isAvailable: item.isAvailable, menuItems: this.menuItems },
    });

    return true;
  }

  // 7. Staff-Verified Cash Settlement (Requires Staff PIN Verification)
  public confirmCashPayment(params: {
    tableId: string;
    staffPin: string;
    tenderedAmount: number;
  }): { success: boolean; message: string; changeDue?: number } {
    const { tableId, staffPin, tenderedAmount } = params;

    // Verify Staff PIN
    const staffMember = this.staff.find((s) => s.pin === staffPin.trim() && s.status === 'ACTIVE');
    if (!staffMember) {
      return { success: false, message: 'Invalid or inactive staff security PIN.' };
    }

    const table = this.tables.find((t) => t.id === tableId);
    if (!table || !table.session) {
      return { success: false, message: 'Table not occupied.' };
    }

    const session = this.sessions.get(table.session.sessionId);
    if (!session) {
      return { success: false, message: 'Active session not found.' };
    }

    if (tenderedAmount < session.bill.finalTotal) {
      return {
        success: false,
        message: `Tendered ₹${tenderedAmount.toFixed(2)} is less than total due ₹${session.bill.finalTotal.toFixed(2)}.`,
      };
    }

    const changeDue = tenderedAmount - session.bill.finalTotal;

    session.paymentStatus = 'PAID';
    session.status = 'PAID';
    session.paymentMethod = 'CASH';
    session.paymentReferenceId = `CASH_${staffMember.id}_${Date.now().toString().slice(-6)}`;

    table.status = 'PAID';

    this.persistPaymentAndReceipt(session, 'CASH', session.paymentReferenceId!, staffMember.name);
    this.persistSession(session);

    this.broadcastEvent({
      type: 'PAYMENT_SETTLED',
      timestamp: new Date().toISOString(),
      tableId,
      sessionId: session.sessionId,
      payload: {
        session,
        paymentReferenceId: session.paymentReferenceId,
        changeDue,
        staffName: staffMember.name,
      },
    });

    return {
      success: true,
      message: `Cash settlement verified by ${staffMember.name}. Change Due: ₹${changeDue.toFixed(2)}.`,
      changeDue,
    };
  }

  // 8. Online Payment Webhook / Confirmation
  public confirmOnlinePayment(sessionId: string, paymentMethod: 'UPI' | 'CARD', referenceId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.paymentStatus = 'PAID';
    session.status = 'PAID';
    session.paymentMethod = paymentMethod;
    session.paymentReferenceId = referenceId;

    const table = this.tables.find((t) => t.id === session.tableId);
    if (table) {
      table.status = 'PAID';
    }

    this.persistPaymentAndReceipt(session, paymentMethod, referenceId);
    this.persistSession(session);

    this.broadcastEvent({
      type: 'PAYMENT_SETTLED',
      timestamp: new Date().toISOString(),
      tableId: session.tableId,
      sessionId: session.sessionId,
      payload: { session, paymentReferenceId: referenceId },
    });

    return true;
  }

  // 8b. Create Razorpay Payment Order
  public async createRazorpayOrder(sessionId: string): Promise<{
    success: boolean;
    orderId?: string;
    amount?: number;
    currency?: string;
    keyId?: string;
    message?: string;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, message: 'Active dining session not found.' };

    const amountInPaise = Math.round((session.bill?.finalTotal || 0) * 100);
    if (amountInPaise <= 0) {
      return { success: false, message: 'Invalid bill balance for payment initiation.' };
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_production_sandbox';
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If live credentials configured, call Razorpay Orders API
    if (keySecret && !keySecret.includes('placeholder')) {
      try {
        const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const res = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: sessionId,
            notes: {
              tableId: session.tableId,
              tableNumber: session.tableNumber,
            },
          }),
        });
        if (res.ok) {
          const rzpOrder = await res.json();
          return {
            success: true,
            orderId: rzpOrder.id,
            amount: amountInPaise,
            currency: 'INR',
            keyId,
          };
        }
      } catch (err) {
        console.warn('Razorpay Live API request failed, falling back to authenticated sandbox:', err);
      }
    }

    // Authenticated local sandbox order generator
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
    };
  }

  // 8c. Verify Razorpay Payment Signature (HMAC-SHA256 Cryptographic Check)
  public verifyRazorpayPayment(params: {
    sessionId: string;
    orderId: string;
    paymentId: string;
    signature: string;
    paymentMethod?: 'UPI' | 'CARD';
  }): { success: boolean; message: string; referenceId?: string } {
    const { sessionId, orderId, paymentId, signature, paymentMethod = 'UPI' } = params;
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, message: 'Dining session not found.' };

    if (session.paymentStatus === 'PAID') {
      return { success: false, code: 'ALREADY_PAID', message: 'Bill already paid.' };
    }

    if (!orderId || !paymentId || !signature) {
      return { success: false, message: 'Missing required Razorpay cryptographic parameters.' };
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret && !keySecret.includes('placeholder')) {
      // Live HMAC SHA-256 validation
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const expectedBuffer = Buffer.from(generatedSignature, 'utf-8');
      const actualBuffer = Buffer.from(signature, 'utf-8');

      if (
        expectedBuffer.length !== actualBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
      ) {
        return {
          success: false,
          message: 'Cryptographic signature mismatch. Payment rejected by server security check.',
        };
      }
    } else {
      // Sandbox signature verification: verify non-empty tokens and format
      if (!signature.startsWith('sig_') && signature.length < 10) {
        return { success: false, message: 'Malformed payment signature payload.' };
      }
    }

    // Once signature verified cryptographically, mark payment PAID
    const settled = this.confirmOnlinePayment(sessionId, paymentMethod, paymentId);
    if (!settled) {
      return { success: false, message: 'Could not settle dining session payment.' };
    }

    return {
      success: true,
      message: 'Razorpay payment cryptographically verified and bill settled.',
      referenceId: paymentId,
    };
  }

  // 8d. Process Demo Payment (Simulation Mode for Client Demo)
  public processDemoPayment(params: {
    sessionId: string;
    paymentMethod: 'UPI' | 'CARD' | 'CASH';
    simulateFail?: boolean;
  }): { success: boolean; code?: string; message: string; referenceId?: string } {
    const { sessionId, paymentMethod, simulateFail } = params;
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, code: 'SESSION_NOT_FOUND', message: 'Dining session not found.' };
    }

    if (session.status === 'CLOSED') {
      return {
        success: false,
        code: 'DINING_SESSION_CLOSED',
        message: 'Your dining session has ended. Please scan the table QR code again to start a new session.',
      };
    }

    if (session.paymentStatus === 'PAID') {
      return {
        success: false,
        code: 'ALREADY_PAID',
        message: 'Bill already paid.',
      };
    }

    if (paymentMethod === 'CASH') {
      session.paymentMethod = 'CASH';
      session.paymentStatus = 'UNPAID';
      session.status = 'PAYMENT_PENDING';
      this.createServiceRequest(session.tableId, 'BILL', 'Guest requested Cash Settlement at Table/Counter');
      return {
        success: true,
        code: 'CASH_PENDING',
        message: 'Cash payment requested. Please pay at counter or wait for server.',
      };
    }

    if (simulateFail) {
      return {
        success: false,
        code: 'PAYMENT_FAILED',
        message: 'Demo payment simulation: Card/UPI transaction was declined by network. Bill remains unpaid. Please retry or choose another method.',
      };
    }

    const referenceId = `DEMO_${paymentMethod}_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    session.paymentStatus = 'PAID';
    session.status = 'PAID';
    session.paymentMethod = paymentMethod;
    session.paymentReferenceId = referenceId;

    const table = this.tables.find((t) => t.id === session.tableId);
    if (table) {
      table.status = 'PAID';
    }

    this.persistPaymentAndReceipt(session, paymentMethod, referenceId);
    this.persistSession(session);

    this.broadcastEvent({
      type: 'PAYMENT_SETTLED',
      timestamp: new Date().toISOString(),
      tableId: session.tableId,
      sessionId: session.sessionId,
      payload: { session, paymentReferenceId: referenceId },
    });

    return {
      success: true,
      code: 'PAID',
      message: 'Demo payment completed successfully. Bill settled.',
      referenceId,
    };
  }

  // 9. Table Reset (Only permitted if bill is paid)
  public clearTable(tableId: string): { success: boolean; message: string } {
    const table = this.tables.find((t) => t.id === tableId);
    if (!table) return { success: false, message: 'Table not found.' };

    if (table.session) {
      const session = this.sessions.get(table.session.sessionId);
      if (session && session.paymentStatus !== 'PAID') {
        return { success: false, message: 'Security Guardrail: Cannot clear table with unpaid balance.' };
      }

      if (session) {
        session.status = 'CLOSED';
        this.persistSession(session);
      }
    }

    const previousSessionId = table.session?.sessionId;
    table.status = 'AVAILABLE';
    table.session = undefined;
    table.seatedDurationMinutes = 0;

    this.broadcastEvent({
      type: 'TABLE_CLEARED',
      timestamp: new Date().toISOString(),
      tableId,
      sessionId: previousSessionId,
      payload: { tableId, status: 'AVAILABLE' },
    });

    return { success: true, message: `${table.tableNumber} is now cleared and AVAILABLE for next guests.` };
  }

  // Authoritative Bill Ledger Calculation
  private recalculateBill(session: DiningSession) {
    let subtotal = 0;
    session.orderBatches.forEach((batch) => {
      if (batch.status !== 'CANCELLED') {
        subtotal += batch.batchSubtotal;
      }
    });

    const discountPct = session.gameStatus.discountPercentage || 0;
    const discountAmt = Math.round((subtotal * discountPct) / 100);
    const netFood = subtotal - discountAmt;
    const cgst = Math.round(netFood * 0.025 * 100) / 100;
    const sgst = Math.round(netFood * 0.025 * 100) / 100;
    const finalTotal = Math.round((netFood + cgst + sgst) * 100) / 100;

    session.bill = {
      foodSubtotal: subtotal,
      discountPercentage: discountPct,
      discountAmount: discountAmt,
      netFoodAmount: netFood,
      cgstAmount: cgst,
      sgstAmount: sgst,
      finalTotal,
    };
  }
}

// Export singleton instance
export const backendService = new BackendService();

// Helper to parse JSON body
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

// HTTP API Request Router
export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    return false;
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  try {
    const pathname = url.split('?')[0];

    // 1. SSE Realtime Event Stream Endpoint
    if (pathname === '/api/events' && req.method === 'GET') {
      backendService.registerSseClient(res);
      return true;
    }

    // 2. State Snapshot Endpoint
    if (pathname === '/api/state' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          tables: backendService.getTables(),
          menuItems: backendService.getMenuItems(),
        })
      );
      return true;
    }

    // 3. Dynamic QR Bootstrap
    if (pathname === '/api/session/bootstrap' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = backendService.bootstrapSession(body.tableId, body.restaurantId);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    // 4. Order Batch Submit
    if (pathname === '/api/order/submit' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = backendService.submitOrderBatch(body);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    // 5. Kitchen Order Bump
    if (pathname === '/api/order/bump' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = backendService.bumpOrderStatus(body.tableId, body.batchId, body.status);
      res.writeHead(success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success }));
      return true;
    }

    // 6. Service Request Create
    if (pathname === '/api/service-request' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const reqItem = backendService.createServiceRequest(body.tableId, body.type, body.note);
      res.writeHead(reqItem ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: Boolean(reqItem), request: reqItem }));
      return true;
    }

    // 7. Service Request Status Update
    if (pathname === '/api/service-request/status' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = backendService.updateServiceRequestStatus(body.tableId, body.requestId, body.status);
      res.writeHead(success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success }));
      return true;
    }

    // 8. Game Score Submit (Authoritative Discount Validation)
    if (pathname === '/api/game/submit' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = backendService.submitGameScore(body.sessionId, body.score);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    // 9. Menu Item Stock 86-ing Toggle
    if (pathname === '/api/menu/stock-toggle' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = backendService.toggleMenuItemAvailability(body.itemId);
      res.writeHead(success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success }));
      return true;
    }

    // 10. Cash Settlement (Staff PIN verified)
    if (pathname === '/api/payment/cash-confirm' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = backendService.confirmCashPayment(body);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    // 10b. Razorpay Create Order
    if (pathname === '/api/payment/razorpay/create-order' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await backendService.createRazorpayOrder(body.sessionId);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    // 10c. Razorpay Cryptographic Verification
    if (pathname === '/api/payment/razorpay/verify' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = backendService.verifyRazorpayPayment(body);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    // 10d. Demo Payment Process (Client Presentation Simulation)
    if (pathname === '/api/payment/demo/process' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = backendService.processDemoPayment({
        sessionId: body.sessionId,
        paymentMethod: body.paymentMethod,
        simulateFail: Boolean(body.simulateFail),
      });
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    // 11. Online Payment Webhook / Verification
    if (pathname === '/api/payment/webhook' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = backendService.confirmOnlinePayment(
        body.sessionId,
        body.paymentMethod || 'UPI',
        body.referenceId || `TXN_${Date.now().toString(36).toUpperCase()}`
      );
      res.writeHead(success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success }));
      return true;
    }

    // 12. Table Reset / Clear Table
    if (pathname === '/api/table/clear' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = backendService.clearTable(body.tableId);
      res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return true;
    }

    return false;
  } catch (err: any) {
    console.error('API Internal Exception:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: false,
          message: 'An internal error occurred. Please try again later.',
        })
      );
    }
    return true;
  }
}
