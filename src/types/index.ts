// TypeScript Type Definitions for Restaurant Digital Ordering Platform (Customer Interface)

export type DietaryType = 'VEG' | 'NON_VEG' | 'EGG';

export type DiningSessionStatus = 'AVAILABLE' | 'ACTIVE' | 'PAYMENT_PENDING' | 'PAID' | 'CLOSED';

export type OrderBatchStatus = 'SUBMITTED' | 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CARD' | 'CASH';

export type PaymentStatus = 'UNPAID' | 'PROCESSING' | 'PAID' | 'FAILED';

export type ServiceRequestType = 'WATER' | 'CUTLERY' | 'WAITER' | 'BILL' | 'OTHER';

export type ServiceRequestStatus = 'REQUESTED' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface ModifierOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
}

export type KitchenStation =
  | 'TANDOOR'
  | 'CURRY'
  | 'PAN_FRY'
  | 'BEVERAGE'
  | 'PANTRY'
  | 'DESSERT'
  | 'CHINESE'
  | 'ASIAN';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  diet: DietaryType;
  basePrice: number;
  isBestseller: boolean;
  isAvailable: boolean;
  imageUrl: string;
  station: KitchenStation;
  prepTimeMinutes?: number;
  spiceLevel?: 0 | 1 | 2 | 3;
  modifierGroups?: ModifierGroup[];
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  item: MenuItem;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  specialInstructions: string;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderItem {
  orderItemId: string;
  menuItemId: string;
  name: string;
  diet: DietaryType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedModifiers: SelectedModifier[];
  specialInstructions?: string;
  isCooked?: boolean;
}

export interface OrderBatch {
  batchId: string;
  batchSequence: number;
  placedAt: string;
  status: OrderBatchStatus;
  items: OrderItem[];
  batchSubtotal: number;
  estimatedMinutes?: number;
}

export interface ServiceRequest {
  id: string;
  type: ServiceRequestType;
  note?: string;
  status: ServiceRequestStatus;
  requestedAt: string;
  assignedStaff?: string;
}

export interface GameStatus {
  hasPlayed: boolean;
  score: number;
  discountPercentage: number;
  playedAt?: string;
}

export interface BillBreakdown {
  foodSubtotal: number;
  discountPercentage: number;
  discountAmount: number;
  netFoodAmount: number;
  cgstAmount: number; // 2.5%
  sgstAmount: number; // 2.5%
  finalTotal: number;
}

export interface DiningSession {
  sessionId: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  gstin: string;
  fssai: string;
  tableId: string;
  tableNumber: string;
  status: DiningSessionStatus;
  guestCount: number;
  startedAt: string;
  gameStatus: GameStatus;
  orderBatches: OrderBatch[];
  serviceRequests: ServiceRequest[];
  bill: BillBreakdown;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReferenceId?: string;
}

export type AppView = 'CUSTOMER' | 'RECEPTION' | 'KITCHEN' | 'ADMIN' | 'STAFF_LOGIN';

export type StaffRole = 'OWNER_ADMIN' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'KITCHEN';

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  capacity: number;
  section: 'Main Dining' | 'Terrace' | 'Rooftop';
  status: DiningSessionStatus;
  serverName: string;
  seatedDurationMinutes: number;
  session?: DiningSession;
}

export type ReceptionTab =
  | 'OVERVIEW'
  | 'TABLES'
  | 'ORDERS'
  | 'REQUESTS'
  | 'PAYMENTS'
  | 'MENU_STOCK';

export type AdminTab =
  | 'OVERVIEW'
  | 'MENU'
  | 'TABLES_QR'
  | 'ORDERS'
  | 'PAYMENTS'
  | 'GAME_DISCOUNTS'
  | 'STAFF'
  | 'ANALYTICS'
  | 'SETTINGS';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: string;
  pin: string;
  avatarUrl?: string;
}

export interface GameSettings {
  enabled: boolean;
  maxDiscountPercentage: number;
  minOrderAmount: number;
  scoreThreshold: number;
  gameTitle: string;
}

export interface RestaurantSettings {
  name: string;
  legalName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  fssai: string;
  currency: string;
  taxRate: number; // e.g. 5%
  orderingEnabled: boolean;
  serviceChargeEnabled: boolean;
  serviceChargePercent: number;
}

export type AnalyticsTimeRange = 'TODAY' | 'YESTERDAY' | '7D' | '30D';

export interface HistoricalOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  section: string;
  createdAt: string;
  itemsCount: number;
  subtotal: number;
  discount: number;
  taxes: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderBatchStatus;
  source: 'QR_CUSTOMER' | 'STAFF_WAITER';
  itemsSummary: string;
}

