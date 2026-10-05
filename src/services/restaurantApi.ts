import {
  DiningSession,
  RestaurantTable,
  MenuItem,
  OrderBatch,
  ServiceRequest,
  ServiceRequestType,
  ServiceRequestStatus,
  OrderBatchStatus,
} from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface BackendEvent {
  type:
    | 'STATE_SYNC'
    | 'SESSION_BOOTSTRAPPED'
    | 'ORDER_PLACED'
    | 'ORDER_BUMPED'
    | 'ORDER_STATUS_UPDATED'
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

class RestaurantApiService {
  private apiBaseUrl = (() => {
    const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
    if (!envBase) return '/api';
    const cleaned = envBase.replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  })();

  // 1. Subscribe to Cross-Device Realtime Events (SSE + Supabase Realtime)
  public subscribeToRealtimeEvents(onEvent: (event: BackendEvent) => void): () => void {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`${this.apiBaseUrl}/events`);
      eventSource.onmessage = (e) => {
        try {
          const parsed: BackendEvent = JSON.parse(e.data);
          onEvent(parsed);
        } catch (err) {
          console.error('Error parsing SSE event payload:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('Realtime event stream reconnecting...', err);
      };
    } catch (err) {
      console.warn('EventSource initialization deferred:', err);
    }

    // If Supabase is configured with live cloud credentials, also connect Supabase Realtime Channel
    let supabaseChannel: any = null;
    if (isSupabaseConfigured) {
      try {
        supabaseChannel = supabase
          .channel('restaurant-live')
          .on('broadcast', { event: 'restaurant-update' }, (payload) => {
            onEvent(payload.payload as BackendEvent);
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription error:', err);
      }
    }

    // Return cleanup unsubscribe function
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }

  // 2. Fetch Initial State Snapshot
  public async fetchState(): Promise<{
    tables: RestaurantTable[];
    menuItems: MenuItem[];
  }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/state`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Could not fetch backend state, using initial context:', err);
    }
    return { tables: [], menuItems: [] };
  }

  // 3. Dynamic QR Bootstrap / Join Session
  public async bootstrapSession(tableId: string, restaurantId?: string): Promise<{
    success: boolean;
    session?: DiningSession;
    table?: RestaurantTable;
    token: string;
    isNew: boolean;
    message?: string;
  }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/session/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, restaurantId }),
      });
      return await res.json();
    } catch {
      return { success: false, token: '', isNew: false, message: 'Network connection failed' };
    }
  }

  // 4. Submit Order Batch (with Idempotency key)
  public async submitOrder(params: {
    sessionId: string;
    tableId: string;
    items: {
      menuItemId: string;
      quantity: number;
      selectedModifiers: any[];
      specialInstructions?: string;
    }[];
    idempotencyKey?: string;
  }): Promise<{ success: boolean; batch?: OrderBatch; message?: string; soldOutItem?: MenuItem }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/order/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Failed to dispatch order to server.' };
    }
  }

  // 5. Bump Order Status
  public async bumpOrderStatus(tableId: string, batchId: string, status: OrderBatchStatus): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/order/bump`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, batchId, status }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  // 6. Service Requests
  public async createServiceRequest(
    tableId: string,
    type: ServiceRequestType,
    note?: string
  ): Promise<ServiceRequest | null> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/service-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, type, note }),
      });
      const data = await res.json();
      return data.request || null;
    } catch {
      return null;
    }
  }

  public async updateServiceRequestStatus(
    tableId: string,
    requestId: string,
    status: ServiceRequestStatus
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/service-request/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, requestId, status }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  // 7. Authoritative Game Score Submit
  public async submitGameScore(
    sessionId: string,
    score: number
  ): Promise<{ success: boolean; discountPercentage: number; discountAmount: number; bill: any }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/game/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, score }),
      });
      return await res.json();
    } catch {
      return { success: false, discountPercentage: 0, discountAmount: 0, bill: null };
    }
  }

  // 8. 86-ing Stock Toggle
  public async toggleStock(itemId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/menu/stock-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  // 9. Staff Cash Confirmation
  public async confirmCashPayment(params: {
    tableId: string;
    staffPin: string;
    tenderedAmount: number;
  }): Promise<{ success: boolean; message: string; changeDue?: number }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/payment/cash-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Server communication error.' };
    }
  }

  // 10. Online Payment Settlement (Webhook fallback)
  public async confirmOnlinePayment(
    sessionId: string,
    paymentMethod: 'UPI' | 'CARD',
    referenceId: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/payment/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, paymentMethod, referenceId }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  }

  // 10b. Razorpay Order Creation
  public async createRazorpayOrder(sessionId: string): Promise<{
    success: boolean;
    orderId?: string;
    amount?: number;
    currency?: string;
    keyId?: string;
    message?: string;
  }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/payment/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Could not connect to payment gateway.' };
    }
  }

  // 10c. Razorpay Cryptographic Verification
  public async verifyRazorpayPayment(params: {
    sessionId: string;
    orderId: string;
    paymentId: string;
    signature: string;
    paymentMethod?: 'UPI' | 'CARD';
  }): Promise<{ success: boolean; message: string; referenceId?: string }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/payment/razorpay/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Cryptographic payment verification failed.' };
    }
  }

  // 10d. Demo Payment Processing (Simulated Client Presentation)
  public async processDemoPayment(params: {
    sessionId: string;
    paymentMethod: 'UPI' | 'CARD' | 'CASH';
    simulateFail?: boolean;
  }): Promise<{ success: boolean; code?: string; message: string; referenceId?: string }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/payment/demo/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Server communication error during demo payment.' };
    }
  }

  // 11. Table Reset
  public async clearTable(tableId: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/table/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId }),
      });
      return await res.json();
    } catch {
      return { success: false, message: 'Server communication error.' };
    }
  }
}

export const restaurantApi = new RestaurantApiService();
