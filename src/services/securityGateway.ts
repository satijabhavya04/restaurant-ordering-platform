import { DiningSession, OrderBatch } from '../types';
import { StaffSessionToken, CustomerSessionToken, StaffPermission, ROLE_PERMISSIONS } from '../types/auth';

export interface KitchenSanitizedItem {
  orderItemId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  selectedModifiers: { optionName: string }[];
  specialInstructions?: string;
  station?: string;
  isCooked?: boolean;
}

export interface KitchenSanitizedBatch {
  tableId: string;
  tableNumber: string;
  section: string;
  serverName: string;
  batchId: string;
  batchSequence: number;
  status: OrderBatch['status'];
  placedAt: string;
  estimatedMinutes?: number;
  items: KitchenSanitizedItem[];
}

export interface AuthorizationResult {
  allowed: boolean;
  code?: 'AUTHORIZED' | 'DINING_SESSION_CLOSED' | 'SESSION_SETTLED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'IDOR_VIOLATION' | 'INVALID_TENANT' | 'UNPAID_BALANCE';
  message?: string;
}

class SecurityGatewayService {
  /**
   * Validates Customer Dining Action against the current session state.
   * Prevents mutations on closed, expired, or settled dining sessions.
   */
  public authorizeCustomerAction(session: DiningSession | null, action: string): AuthorizationResult {
    if (!session || !session.sessionId) {
      return {
        allowed: false,
        code: 'DINING_SESSION_CLOSED',
        message: 'No active dining session found. Please scan the table QR code to start dining.',
      };
    }

    // Closed session protection invariant
    if (session.status === 'CLOSED') {
      return {
        allowed: false,
        code: 'DINING_SESSION_CLOSED',
        message: 'Your dining session has ended. Please scan the table QR code again to start a new session.',
      };
    }

    // If bill has already been marked PAID, ordering and new service calls are blocked
    if (session.status === 'PAID' || session.paymentStatus === 'PAID') {
      if (action === 'INITIATE_PAYMENT') {
        return {
          allowed: false,
          code: 'SESSION_SETTLED',
          message: 'Bill already paid.',
        };
      }
      const settledBlockedActions = [
        'ORDER',
        'PLACE_ORDER',
        'CART_ADD',
        'ADD_TO_CART',
        'GAME_CLAIM',
        'SUBMIT_GAME_SCORE',
      ];
      if (settledBlockedActions.includes(action)) {
        return {
          allowed: false,
          code: 'SESSION_SETTLED',
          message: 'Your dining bill has already been settled. Please request table reset from staff if you wish to order again.',
        };
      }
    }

    // Customer can NEVER directly set payment status to PAID
    if (action === 'MARK_PAID' || action === 'SET_PAYMENT_PAID') {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        message: 'Security Guardrail: Customer cannot directly transition payment status to PAID.',
      };
    }

    return { allowed: true, code: 'AUTHORIZED' };
  }

  /**
   * Validates whether a receipt / tax invoice can be legitimately issued.
   * Requirement 16: Receipt cannot be generated from an unpaid payment.
   */
  public validateReceiptGeneration(session: DiningSession | null): AuthorizationResult {
    if (!session) {
      return {
        allowed: false,
        code: 'DINING_SESSION_CLOSED',
        message: 'No dining session provided for receipt issuance.',
      };
    }
    if (session.paymentStatus !== 'PAID' && session.status !== 'PAID') {
      return {
        allowed: false,
        code: 'UNPAID_BALANCE',
        message: 'Receipt generation rejected: session has unpaid balance.',
      };
    }
    return { allowed: true, code: 'AUTHORIZED' };
  }

  /**
   * Prevents IDOR (Insecure Direct Object Reference) access.
   * Ensures a customer device cannot access or mutate another table's or restaurant's data.
   */
  public validateCustomerTableScope(
    session: { restaurantId?: string; tableId: string },
    targetTableId: string,
    targetRestaurantId?: string
  ): AuthorizationResult {
    if (targetRestaurantId && session.restaurantId && session.restaurantId !== targetRestaurantId) {
      return {
        allowed: false,
        code: 'INVALID_TENANT',
        message: 'Cross-restaurant access violation. Invalid tenant scope.',
      };
    }

    if (session.tableId !== targetTableId) {
      return {
        allowed: false,
        code: 'IDOR_VIOLATION',
        message: 'Cross-table access violation detected. Scoped to your seated table only.',
      };
    }

    return { allowed: true, code: 'AUTHORIZED' };
  }

  private resolveStation(itemName: string): string {
    const lower = itemName.toLowerCase();
    if (lower.includes('tikka') || lower.includes('kebab') || lower.includes('tandoor') || lower.includes('naan') || lower.includes('roti') || lower.includes('kulcha')) {
      return 'TANDOOR';
    }
    if (lower.includes('curry') || lower.includes('masala') || lower.includes('paneer') || lower.includes('dal') || lower.includes('biryani') || lower.includes('korma')) {
      return 'CURRY';
    }
    if (lower.includes('noodle') || lower.includes('manchurian') || lower.includes('fried rice') || lower.includes('chilli') || lower.includes('soup')) {
      return 'CHINESE';
    }
    if (lower.includes('dosa') || lower.includes('tawa') || lower.includes('pan') || lower.includes('fry') || lower.includes('omelette')) {
      return 'PAN_FRY';
    }
    if (lower.includes('salad') || lower.includes('raita') || lower.includes('papad') || lower.includes('chutney') || lower.includes('chaat')) {
      return 'PANTRY';
    }
    if (lower.includes('lassi') || lower.includes('shake') || lower.includes('water') || lower.includes('soda') || lower.includes('tea') || lower.includes('chai') || lower.includes('coffee') || lower.includes('juice') || lower.includes('mojito')) {
      return 'BEVERAGE';
    }
    if (lower.includes('kulfi') || lower.includes('jamun') || lower.includes('halwa') || lower.includes('ice cream') || lower.includes('rasmalai') || lower.includes('dessert')) {
      return 'DESSERT';
    }
    return 'CURRY';
  }

  /**
   * Sanitizes order data for the Kitchen Display System (KDS).
   * Strips all financial figures (prices, subtotals, discounts, taxes), customer names,
   * phone numbers, and payment details to guarantee operational privacy & data isolation.
   */
  public sanitizeOrdersForKitchen(
    rawTables: Array<{
      id: string;
      tableNumber: string;
      section: string;
      serverName: string;
      session?: DiningSession;
    }>
  ): KitchenSanitizedBatch[] {
    const sanitized: KitchenSanitizedBatch[] = [];

    rawTables.forEach((table) => {
      if (table.session?.orderBatches) {
        table.session.orderBatches.forEach((batch) => {
          sanitized.push({
            tableId: table.id,
            tableNumber: table.tableNumber,
            section: table.section,
            serverName: table.serverName,
            batchId: batch.batchId,
            batchSequence: batch.batchSequence,
            status: batch.status,
            placedAt: batch.placedAt,
            estimatedMinutes: batch.estimatedMinutes,
            items: batch.items.map((item) => ({
              orderItemId: item.orderItemId,
              menuItemId: item.menuItemId,
              name: item.name,
              quantity: item.quantity,
              selectedModifiers: (item.selectedModifiers || []).map((m) => ({
                optionName: m.optionName,
              })),
              specialInstructions: item.specialInstructions,
              station: this.resolveStation(item.name),
              isCooked: item.isCooked,
            })),
          });
        });
      }
    });

    // Oldest active ticket first (FIFO line expediting)
    return sanitized.sort(
      (a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
    );
  }

  /**
   * Validates Staff Authorization for a privileged operational action.
   */
  public authorizeStaffAction(
    staffToken: StaffSessionToken | null,
    requiredPermission: StaffPermission,
    context?: { tableStatus?: string; status?: string; tenderedAmount?: number; finalTotal?: number }
  ): AuthorizationResult {
    if (!staffToken || !staffToken.token) {
      return {
        allowed: false,
        code: 'UNAUTHENTICATED',
        message: 'Staff authentication required to execute this operation.',
      };
    }

    if (Date.now() > staffToken.expiresAt) {
      return {
        allowed: false,
        code: 'UNAUTHENTICATED',
        message: 'Staff authentication token has expired. Please sign in again.',
      };
    }

    const permitted =
      staffToken.permissions.includes(requiredPermission) ||
      ROLE_PERMISSIONS[staffToken.role]?.includes(requiredPermission);

    if (!permitted) {
      return {
        allowed: false,
        code: 'FORBIDDEN',
        message: `Your staff role (${staffToken.role}) does not have permission to execute ${requiredPermission}.`,
      };
    }

    // Safety Guardrail: Clearing table requires PAID status
    const effectiveTableStatus = context?.tableStatus || context?.status;
    if (requiredPermission === 'CLEAR_TABLE' && effectiveTableStatus) {
      if (effectiveTableStatus !== 'PAID') {
        return {
          allowed: false,
          code: 'UNPAID_BALANCE',
          message: 'Security Guardrail: Cannot clear table with outstanding unpaid balance. Settle bill first.',
        };
      }
    }

    return { allowed: true, code: 'AUTHORIZED' };
  }

  /**
   * Generates a signed-simulated staff bearer token.
   */
  public issueStaffToken(
    staffId: string,
    restaurantId: string,
    role: StaffSessionToken['role'],
    name: string,
    email: string
  ): StaffSessionToken {
    const permissions = ROLE_PERMISSIONS[role] || [];
    const expiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
    const token = `staff_jwt_${btoa(`${staffId}:${role}:${Date.now()}`)}`;

    return {
      token,
      staffId,
      restaurantId,
      name,
      email,
      role,
      permissions,
      expiresAt,
    };
  }

  /**
   * Generates an ephemeral customer session token for a specific table QR scan.
   */
  public issueCustomerToken(
    restaurantId: string,
    tableId: string,
    tableNumber: string,
    sessionId: string
  ): CustomerSessionToken {
    const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours active dining window
    const token = `cust_qr_${btoa(`${restaurantId}:${tableId}:${sessionId}:${Date.now()}`)}`;

    return {
      token,
      restaurantId,
      tableId,
      tableNumber,
      sessionId,
      expiresAt,
    };
  }
}

export const securityGateway = new SecurityGatewayService();
