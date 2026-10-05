import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  DiningSession,
  MenuItem,
  CartItem,
  SelectedModifier,
  OrderBatch,
  OrderItem,
  ServiceRequest,
  ServiceRequestType,
  PaymentMethod,
  BillBreakdown,
  RestaurantTable,
  StaffRole,
  ReceptionTab,
  OrderBatchStatus,
  AdminTab,
  StaffMember,
  GameSettings,
  RestaurantSettings,
  AnalyticsTimeRange,
  HistoricalOrder,
  AppView,
} from '../types';
import { SEED_MENU_ITEMS, SEED_CATEGORIES } from '../data/seedCatalog';
import { SEED_TABLES } from '../data/seedTables';
import {
  SEED_STAFF,
  SEED_RESTAURANT_SETTINGS,
  SEED_GAME_SETTINGS,
  SEED_HISTORICAL_ORDERS,
} from '../data/seedAdmin';
import { securityGateway } from '../services/securityGateway';
import { restaurantApi, BackendEvent } from '../services/restaurantApi';

interface CustomerContextType {
  session: DiningSession;
  menuItems: MenuItem[];
  categories: string[];
  activeCategory: string;
  searchQuery: string;
  dietaryFilter: 'ALL' | 'VEG' | 'NON_VEG' | 'BESTSELLER';
  selectedItemForDetail: MenuItem | null;
  
  // UI Panels
  isCartOpen: boolean;
  isTrackingOpen: boolean;
  isHelpOpen: boolean;
  isGameOpen: boolean;
  isBillOpen: boolean;
  isReceiptOpen: boolean;
  isItemUnavailableSheetOpen: boolean;
  unavailableItem: MenuItem | null;
  isOffline: boolean;
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  
  // Cart
  cartItems: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  
  // Navigation & Actions
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  setDietaryFilter: (filter: 'ALL' | 'VEG' | 'NON_VEG' | 'BESTSELLER') => void;
  openDetail: (item: MenuItem) => void;
  closeDetail: () => void;
  addToCart: (
    item: MenuItem,
    quantity: number,
    modifiers: SelectedModifier[],
    instructions: string
  ) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Orders
  placeOrder: () => Promise<boolean>;
  openTracking: () => void;
  closeTracking: () => void;
  
  // Help Requests
  openHelp: () => void;
  closeHelp: () => void;
  submitServiceRequest: (type: ServiceRequestType, note?: string) => void;
  
  // Gamification
  openGame: () => void;
  closeGame: () => void;
  submitGameScore: (score: number) => void;
  
  // Bill & Payment
  openBill: () => void;
  closeBill: () => void;
  openReceipt: () => void;
  closeReceipt: () => void;
  initiatePayment: (method: PaymentMethod, simulateFail?: boolean) => Promise<{ success: boolean; message: string }>;
  confirmCashPayment: () => void;
  finishDining: () => void;
  reopenSession: () => void;
  
  // Simulation / Edge cases
  simulateItemDepleted: (itemId: string) => void;
  simulateRestoreItem: (itemId: string) => void;
  simulateOfflineToggle: () => void;
  simulateSessionExpired: () => void;
  resolveUnavailableItem: (action: 'REPLACE' | 'REMOVE' | 'WAITER', replacementId?: string) => void;

  // ==================== VIEW & ROLES ====================
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentStaffRole: StaffRole;
  setCurrentStaffRole: (role: StaffRole) => void;

  // ==================== RECEPTION OPERATIONS ====================
  receptionTab: ReceptionTab;
  setReceptionTab: (tab: ReceptionTab) => void;
  tables: RestaurantTable[];
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  acknowledgeRequest: (tableId: string, requestId: string) => void;
  resolveRequest: (tableId: string, requestId: string) => void;
  updateOrderStatus: (tableId: string, batchId: string, status: OrderBatchStatus) => void;
  confirmTableCashPayment: (tableId: string, staffPin: string, tenderedAmount: number) => { success: boolean; message: string };
  clearTable: (tableId: string) => { success: boolean; message: string };
  addStaffOrderToTable: (
    tableId: string,
    items: {
      menuItem: MenuItem;
      quantity: number;
      selectedModifiers: SelectedModifier[];
      specialInstructions?: string;
    }[]
  ) => void;
  toggleMenuItemAvailability: (itemId: string) => void;

  // ==================== ADMIN MANAGEMENT ====================
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  staffMembers: StaffMember[];
  addStaffMember: (member: Omit<StaffMember, 'id' | 'joinedDate'>) => void;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  toggleStaffStatus: (id: string) => void;
  removeStaffMember: (id: string) => void;
  gameSettings: GameSettings;
  updateGameSettings: (settings: Partial<GameSettings>) => void;
  restaurantSettings: RestaurantSettings;
  updateRestaurantSettings: (settings: Partial<RestaurantSettings>) => void;
  analyticsRange: AnalyticsTimeRange;
  setAnalyticsRange: (range: AnalyticsTimeRange) => void;
  historicalOrders: HistoricalOrder[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  addCategory: (name: string) => void;
  renameCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;
  addTable: (table: {
    tableNumber: string;
    capacity: number;
    section: 'Main Dining' | 'Terrace' | 'Rooftop';
    serverName: string;
  }) => void;
  updateTable: (id: string, updates: Partial<RestaurantTable>) => void;
  deactivateTable: (id: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const INITIAL_BILL: BillBreakdown = {
  foodSubtotal: 0,
  discountPercentage: 0,
  discountAmount: 0,
  netFoodAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  finalTotal: 0,
};

const INITIAL_SESSION: DiningSession = {
  sessionId: 'ds_8821_demo',
  restaurantId: 'resto_spice_pavilion',
  restaurantName: 'The Spice Pavilion',
  restaurantAddress: '42 Heritage Enclave, Indiranagar, Bengaluru',
  gstin: '29AABCT1332L1ZV',
  fssai: '11221334000452',
  tableId: 'tbl_04',
  tableNumber: 'Table 04',
  status: 'ACTIVE',
  guestCount: 4,
  startedAt: new Date().toISOString(),
  gameStatus: {
    hasPlayed: false,
    score: 0,
    discountPercentage: 0,
  },
  orderBatches: [],
  serviceRequests: [],
  bill: INITIAL_BILL,
  paymentStatus: 'UNPAID',
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<DiningSession>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table') || params.get('tableId');
      if (tableParam) {
        const tableNum = tableParam.startsWith('tbl_')
          ? `Table ${tableParam.replace('tbl_', '')}`
          : tableParam;
        return {
          ...INITIAL_SESSION,
          sessionId: `ds_${tableParam}_live`,
          tableId: tableParam,
          tableNumber: tableNum,
        };
      }
    }
    const saved = localStorage.getItem('resto_dining_session_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SESSION;
      }
    }
    return INITIAL_SESSION;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(SEED_MENU_ITEMS);
  const [categories, setCategories] = useState<string[]>(SEED_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'BESTSELLER'>('ALL');
  
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MenuItem | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('resto_cart_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // UI Panels
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isItemUnavailableSheetOpen, setIsItemUnavailableSheetOpen] = useState(false);
  const [unavailableItem, setUnavailableItem] = useState<MenuItem | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [rawTables, setRawTables] = useState<RestaurantTable[]>(SEED_TABLES);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Synchronize seated table with live customer session
  const tables = rawTables.map((t) => {
    if (t.id === session.tableId) {
      return {
        ...t,
        status: session.status,
        session: session,
      };
    }
    return t;
  });

  // Native Online / Offline Network Status Detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Realtime Backend Sync & Dynamic QR Bootstrap Across Physical Devices
  useEffect(() => {
    // 1. If table is specified in URL, bootstrap/join live session from server
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const tableParam = params ? params.get('table') || params.get('tableId') : null;
    const currentTableId = tableParam || session.tableId;

    if (currentTableId) {
      restaurantApi.bootstrapSession(currentTableId).then((res) => {
        if (res.success && res.session) {
          setSession(res.session);
        }
      });
    }

    // 2. Fetch latest backend state for tables and menu
    restaurantApi.fetchState().then(({ tables: backendTables, menuItems: backendMenu }) => {
      if (backendTables && backendTables.length > 0) setRawTables(backendTables);
      if (backendMenu && backendMenu.length > 0) setMenuItems(backendMenu);
    });

    const isMatchingSession = (s: DiningSession | null | undefined, evt: BackendEvent) => {
      if (!s) return false;
      if (evt.sessionId && evt.sessionId === s.sessionId) return true;
      if (evt.tableId && evt.tableId === s.tableId) return true;
      if (evt.payload?.sessionId && evt.payload.sessionId === s.sessionId) return true;
      if (evt.payload?.tableId && evt.payload.tableId === s.tableId) return true;
      if (evt.payload?.diningSessionId && evt.payload.diningSessionId === s.sessionId) return true;
      if (evt.payload?.session?.sessionId && evt.payload.session.sessionId === s.sessionId) return true;
      if (evt.payload?.session?.tableId && evt.payload.session.tableId === s.tableId) return true;
      return false;
    };

    // 3. Realtime event stream subscription across physical devices
    const unsubscribe = restaurantApi.subscribeToRealtimeEvents((event) => {
      if (event.type === 'STATE_SYNC') {
        if (event.payload.tables) setRawTables(event.payload.tables);
        if (event.payload.menuItems) setMenuItems(event.payload.menuItems);
      } else if (event.type === 'SESSION_BOOTSTRAPPED') {
        const { table, session: newSess } = event.payload;
        setSession((prev) => {
          if (table.id === prev.tableId || newSess.sessionId === prev.sessionId) {
            return newSess;
          }
          return prev;
        });
        setRawTables((prev) =>
          prev.map((t) => (t.id === table.id ? { ...t, status: 'ACTIVE', session: newSess } : t))
        );
      } else if (event.type === 'ORDER_PLACED') {
        const { batch, session: updatedSession } = event.payload;
        setSession((prev) => {
          if (!isMatchingSession(prev, event)) return prev;
          if (updatedSession?.orderBatches) {
            return {
              ...prev,
              ...updatedSession,
              orderBatches: updatedSession.orderBatches,
            };
          }
          if (prev.orderBatches.some((b) => b.batchId === batch.batchId)) return prev;
          return {
            ...prev,
            orderBatches: [...prev.orderBatches, batch],
          };
        });
        setRawTables((prev) =>
          prev.map((t) => {
            if (t.id === event.tableId || t.session?.sessionId === event.sessionId) {
              const prevBatches = t.session?.orderBatches || [];
              const exists = prevBatches.some((b) => b.batchId === batch.batchId);
              const newBatches = exists ? prevBatches : [...prevBatches, batch];
              return {
                ...t,
                status: 'ACTIVE',
                session: t.session
                  ? { ...(updatedSession || t.session), orderBatches: updatedSession?.orderBatches || newBatches }
                  : { ...(updatedSession || prev), orderBatches: updatedSession?.orderBatches || newBatches },
              };
            }
            return t;
          })
        );
      } else if (event.type === 'ORDER_BUMPED' || event.type === 'ORDER_STATUS_UPDATED') {
        const batchId = event.payload?.batchId || event.payload?.orderBatchId;
        const newStatus: OrderBatchStatus = event.payload?.status || event.payload?.newStatus;

        setSession((prev) => {
          if (!isMatchingSession(prev, event)) return prev;

          // If backend provided authoritative updated session, use its batches directly
          if (event.payload?.session?.orderBatches) {
            return {
              ...prev,
              ...event.payload.session,
              orderBatches: event.payload.session.orderBatches,
            };
          }

          // Otherwise update the specific batch directly
          const updatedBatches = prev.orderBatches.map((b) =>
            b.batchId === batchId ? { ...b, status: newStatus } : b
          );
          return {
            ...prev,
            orderBatches: updatedBatches,
          };
        });

        setRawTables((prev) =>
          prev.map((t) => {
            if ((t.id === event.tableId || t.session?.sessionId === event.sessionId) && t.session) {
              const updatedBatches = t.session.orderBatches.map((b) =>
                b.batchId === batchId ? { ...b, status: newStatus } : b
              );
              return {
                ...t,
                session: {
                  ...t.session,
                  orderBatches: event.payload?.session?.orderBatches || updatedBatches,
                },
              };
            }
            return t;
          })
        );
      } else if (event.type === 'SERVICE_REQUEST_CREATED') {
        const { request } = event.payload;
        setSession((prev) => {
          if (!isMatchingSession(prev, event)) return prev;
          return {
            ...prev,
            serviceRequests: [request, ...prev.serviceRequests.filter((r) => r.id !== request.id)],
          };
        });
        setRawTables((prev) =>
          prev.map((t) => {
            if (t.id === event.tableId && t.session) {
              return {
                ...t,
                session: {
                  ...t.session,
                  serviceRequests: [request, ...t.session.serviceRequests.filter((r) => r.id !== request.id)],
                },
              };
            }
            return t;
          })
        );
      } else if (event.type === 'SERVICE_REQUEST_UPDATED') {
        const { requestId, status: reqStatus } = event.payload;
        setSession((prev) => {
          if (!isMatchingSession(prev, event)) return prev;
          return {
            ...prev,
            serviceRequests: prev.serviceRequests.map((r) =>
              r.id === requestId ? { ...r, status: reqStatus } : r
            ),
          };
        });
        setRawTables((prev) =>
          prev.map((t) => {
            if (t.id === event.tableId && t.session) {
              return {
                ...t,
                session: {
                  ...t.session,
                  serviceRequests: t.session.serviceRequests.map((r) =>
                    r.id === requestId ? { ...r, status: reqStatus } : r
                  ),
                },
              };
            }
            return t;
          })
        );
      } else if (event.type === 'MENU_UPDATED') {
        const { itemId, isAvailable } = event.payload;
        setMenuItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isAvailable } : i))
        );
      } else if (event.type === 'GAME_DISCOUNT_APPLIED') {
        const { discountPercentage, bill } = event.payload;
        setSession((prev) => {
          if (!isMatchingSession(prev, event)) return prev;
          return {
            ...prev,
            gameStatus: { ...prev.gameStatus, discountPercentage },
            bill: bill || prev.bill,
          };
        });
      } else if (event.type === 'PAYMENT_SETTLED') {
        const { paymentReferenceId } = event.payload;
        setSession((prev) => {
          if (!isMatchingSession(prev, event)) return prev;
          return {
            ...prev,
            status: 'PAID',
            paymentStatus: 'PAID',
            paymentReferenceId: paymentReferenceId || prev.paymentReferenceId,
          };
        });
        setRawTables((prev) =>
          prev.map((t) => {
            if (t.id === event.tableId) {
              return {
                ...t,
                status: 'PAID',
                session: t.session
                  ? { ...t.session, status: 'PAID', paymentStatus: 'PAID', paymentReferenceId }
                  : t.session,
              };
            }
            return t;
          })
        );
      } else if (event.type === 'TABLE_CLEARED') {
        setSession((prev) => {
          if (!isMatchingSession(prev, event)) return prev;
          setCartItems([]);
          try {
            localStorage.removeItem('resto_cart_v1');
            localStorage.removeItem('resto_dining_session_v1');
          } catch {}
          return {
            ...prev,
            status: 'CLOSED',
          };
        });
        setRawTables((prev) =>
          prev.map((t) => {
            if (t.id === event.tableId) {
              return {
                ...t,
                status: 'AVAILABLE',
                seatedDurationMinutes: 0,
                session: undefined,
              };
            }
            return t;
          })
        );
      }
    });

    return () => unsubscribe();
  }, [session.tableId, session.sessionId]);

  // Tab visibility and reconnection recovery: sync with backend when user returns to tab or active orders exist
  useEffect(() => {
    const handleSync = () => {
      const curTable = sessionRef.current?.tableId;
      if (curTable && document.visibilityState === 'visible') {
        restaurantApi.bootstrapSession(curTable).then((res) => {
          if (res.success && res.session) {
            setSession((prev) => {
              if (JSON.stringify(prev.orderBatches) !== JSON.stringify(res.session!.orderBatches)) {
                return { ...prev, ...res.session! };
              }
              return prev;
            });
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    const interval = setInterval(() => {
      const cur = sessionRef.current;
      if (!cur || !cur.tableId) return;
      const hasActiveOrders = cur.orderBatches?.some(
        (b) => b.status === 'NEW' || b.status === 'SUBMITTED' || b.status === 'PREPARING' || b.status === 'READY'
      );
      if (hasActiveOrders) {
        restaurantApi.bootstrapSession(cur.tableId).then((res) => {
          if (res.success && res.session) {
            setSession((prev) => {
              if (JSON.stringify(prev.orderBatches) !== JSON.stringify(res.session!.orderBatches)) {
                return { ...prev, ...res.session! };
              }
              return prev;
            });
          }
        });
      }
    }, 4000);

    return () => {
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
  }, []);

  // Sync to local storage for persistence across reloads / accidental browser closes
  useEffect(() => {
    localStorage.setItem('resto_dining_session_v1', JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem('resto_cart_v1', JSON.stringify(cartItems));
  }, [cartItems]);

  // Recalculate bill whenever batches or game discount change
  useEffect(() => {
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

    setSession((prev) => ({
      ...prev,
      bill: {
        foodSubtotal: subtotal,
        discountPercentage: discountPct,
        discountAmount: discountAmt,
        netFoodAmount: netFood,
        cgstAmount: cgst,
        sgstAmount: sgst,
        finalTotal: finalTotal,
      },
    }));
  }, [session.orderBatches, session.gameStatus.discountPercentage]);

  // Cart Computations
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  // ==================== MODAL NAVIGATION & BROWSER HISTORY SYNC ====================
  const openModalsRef = useRef<string[]>([]);
  const isProgrammaticBackRef = useRef<boolean>(false);

  const pushModal = (modalKey: string) => {
    if (openModalsRef.current[openModalsRef.current.length - 1] !== modalKey) {
      openModalsRef.current.push(modalKey);
      if (typeof window !== 'undefined') {
        window.history.pushState({ restaurantModal: modalKey, depth: openModalsRef.current.length }, '');
      }
    }
  };

  const popModal = (modalKey: string) => {
    const idx = openModalsRef.current.lastIndexOf(modalKey);
    if (idx !== -1) {
      openModalsRef.current.splice(idx, 1);
      if (typeof window !== 'undefined' && window.history.state?.restaurantModal) {
        isProgrammaticBackRef.current = true;
        window.history.back();
      }
    }
  };

  const closeSpecificModalDirect = (modalKey: string) => {
    if (modalKey === 'detail') setSelectedItemForDetail(null);
    else if (modalKey === 'cart') setIsCartOpen(false);
    else if (modalKey === 'tracking') setIsTrackingOpen(false);
    else if (modalKey === 'help') setIsHelpOpen(false);
    else if (modalKey === 'game') setIsGameOpen(false);
    else if (modalKey === 'bill') setIsBillOpen(false);
    else if (modalKey === 'receipt') setIsReceiptOpen(false);
    else if (modalKey === 'unavailable') setIsItemUnavailableSheetOpen(false);
    else if (modalKey === 'search') setIsSearchOpen(false);
  };

  // Synchronize Browser Back button (popstate) and Keyboard Escape with open modals
  useEffect(() => {
    const handlePopState = () => {
      if (isProgrammaticBackRef.current) {
        isProgrammaticBackRef.current = false;
        return;
      }
      if (openModalsRef.current.length > 0) {
        const topModal = openModalsRef.current.pop();
        if (topModal) {
          closeSpecificModalDirect(topModal);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModalsRef.current.length > 0) {
        e.preventDefault();
        const topModal = openModalsRef.current.pop();
        if (topModal) {
          closeSpecificModalDirect(topModal);
          if (typeof window !== 'undefined' && window.history.state?.restaurantModal) {
            isProgrammaticBackRef.current = true;
            window.history.back();
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Modal Actions
  const openDetail = (item: MenuItem) => {
    setSelectedItemForDetail(item);
    pushModal('detail');
  };

  const closeDetail = () => {
    setSelectedItemForDetail(null);
    popModal('detail');
  };

  const openCart = () => {
    setIsCartOpen(true);
    pushModal('cart');
  };

  const closeCart = () => {
    setIsCartOpen(false);
    popModal('cart');
  };

  const openTracking = () => {
    setIsTrackingOpen(true);
    pushModal('tracking');
  };

  const closeTracking = () => {
    setIsTrackingOpen(false);
    popModal('tracking');
  };

  const openHelp = () => {
    setIsHelpOpen(true);
    pushModal('help');
  };

  const closeHelp = () => {
    setIsHelpOpen(false);
    popModal('help');
  };

  const openGame = () => {
    setIsGameOpen(true);
    pushModal('game');
  };

  const closeGame = () => {
    setIsGameOpen(false);
    popModal('game');
  };

  const openBill = () => {
    setIsBillOpen(true);
    pushModal('bill');
  };

  const closeBill = () => {
    setIsBillOpen(false);
    popModal('bill');
  };

  const openReceipt = () => {
    setIsReceiptOpen(true);
    pushModal('receipt');
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    popModal('receipt');
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    pushModal('search');
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    popModal('search');
  };

  const addToCart = (
    item: MenuItem,
    quantity: number,
    modifiers: SelectedModifier[],
    instructions: string
  ) => {
    const auth = securityGateway.authorizeCustomerAction(session, 'ADD_TO_CART');
    if (!auth.allowed) {
      console.warn('Security Gateway rejected addToCart:', auth.message);
      return;
    }

    const modifierTotal = modifiers.reduce((acc, mod) => acc + mod.priceDelta, 0);
    const unitPrice = item.basePrice + modifierTotal;
    const totalPrice = unitPrice * quantity;

    // Create a stable cartItemId based on item + modifiers signature
    const modSig = modifiers
      .map((m) => m.optionId)
      .sort()
      .join('-');
    const cartItemId = `${item.id}_${modSig}_${instructions.trim().slice(0, 10)}`;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return updated;
      }
      return [
        ...prev,
        {
          cartItemId,
          menuItemId: item.id,
          item,
          quantity,
          selectedModifiers: modifiers,
          specialInstructions: instructions,
          unitPrice,
          totalPrice,
        },
      ];
    });

    closeDetail();
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((ci) => {
          if (ci.cartItemId === cartItemId) {
            const newQty = ci.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...ci,
              quantity: newQty,
              totalPrice: newQty * ci.unitPrice,
            };
          }
          return ci;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.cartItemId !== cartItemId));
  };

  const clearCart = () => setCartItems([]);

  // Place Order with Idempotency UUID
  const placeOrder = async (): Promise<boolean> => {
    if (isPlacingOrder) return false;
    const auth = securityGateway.authorizeCustomerAction(session, 'PLACE_ORDER');
    if (!auth.allowed) {
      console.warn('Security Gateway rejected placeOrder:', auth.message);
      return false;
    }

    if (cartItems.length === 0) return false;

    // Check if any item in cart is sold out
    const soldOutItem = cartItems.find((ci) => {
      const live = menuItems.find((m) => m.id === ci.menuItemId);
      return live ? !live.isAvailable : !ci.item.isAvailable;
    });
    if (soldOutItem) {
      setUnavailableItem(soldOutItem.item);
      setIsItemUnavailableSheetOpen(true);
      return false;
    }

    setIsPlacingOrder(true);
    try {
      const idempotencyKey = `ord_idem_${session.sessionId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const orderPayloadItems = cartItems.map((ci) => ({
        menuItemId: ci.menuItemId,
        quantity: ci.quantity,
        selectedModifiers: ci.selectedModifiers,
        specialInstructions: ci.specialInstructions,
      }));

      const res = await restaurantApi.submitOrder({
        sessionId: session.sessionId,
        tableId: session.tableId,
        items: orderPayloadItems,
        idempotencyKey,
      });

      if (!res.success) {
        if (res.soldOutItem) {
          setUnavailableItem(res.soldOutItem);
          setIsItemUnavailableSheetOpen(true);
          pushModal('unavailable');
        }
        return false;
      }

      if (res.batch) {
        setSession((prev) => {
          const exists = prev.orderBatches.some((b) => b.batchId === res.batch!.batchId);
          if (exists) return prev;
          return {
            ...prev,
            orderBatches: [...prev.orderBatches, res.batch!],
          };
        });
      }

      clearCart();
      setIsCartOpen(false);
      setIsTrackingOpen(true);
      const cartIdx = openModalsRef.current.lastIndexOf('cart');
      if (cartIdx !== -1) {
        openModalsRef.current[cartIdx] = 'tracking';
      } else {
        pushModal('tracking');
      }
      return true;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Service Request
  const submitServiceRequest = async (type: ServiceRequestType, note?: string) => {
    const auth = securityGateway.authorizeCustomerAction(session, 'SERVICE_REQUEST');
    if (!auth.allowed) {
      console.warn('Security Gateway rejected submitServiceRequest:', auth.message);
      return;
    }

    const created = await restaurantApi.createServiceRequest(session.tableId, type, note);
    if (created) {
      setSession((prev) => ({
        ...prev,
        serviceRequests: [created, ...prev.serviceRequests.filter((r) => r.id !== created.id)],
      }));
    } else {
      const newReq: ServiceRequest = {
        id: `req_${Date.now()}`,
        type,
        note,
        status: 'REQUESTED',
        requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        assignedStaff: 'Ramesh (Table Server)',
      };

      setSession((prev) => ({
        ...prev,
        serviceRequests: [newReq, ...prev.serviceRequests],
      }));
    }
  };

  // Gamification
  const submitGameScore = async (score: number) => {
    const auth = securityGateway.authorizeCustomerAction(session, 'SUBMIT_GAME_SCORE');
    if (!auth.allowed) {
      console.warn('Security Gateway rejected submitGameScore:', auth.message);
      return;
    }

    const res = await restaurantApi.submitGameScore(session.sessionId, score);
    const finalPct = res.success ? res.discountPercentage : Math.min(20, Math.floor(score / 4));

    setSession((prev) => ({
      ...prev,
      gameStatus: {
        hasPlayed: true,
        score,
        discountPercentage: finalPct,
        playedAt: new Date().toISOString(),
      },
      bill: res.bill || prev.bill,
    }));
  };

  // Payment
  const initiatePayment = async (
    method: PaymentMethod,
    simulateFail?: boolean
  ): Promise<{ success: boolean; message: string }> => {
    const auth = securityGateway.authorizeCustomerAction(session, 'INITIATE_PAYMENT');
    if (!auth.allowed) {
      console.warn('Security Gateway rejected initiatePayment:', auth.message);
      return { success: false, message: auth.message || 'Bill already paid.' };
    }

    setSession((prev) => ({
      ...prev,
      paymentMethod: method,
      paymentStatus: method === 'CASH' ? 'UNPAID' : 'PROCESSING',
      status: 'PAYMENT_PENDING',
    }));

    if (method === 'CASH') {
      await submitServiceRequest('BILL', 'Guest requested Cash Settlement at Counter');
      const res = await restaurantApi.processDemoPayment({
        sessionId: session.sessionId,
        paymentMethod: 'CASH',
      });
      return { success: res.success, message: res.message || 'Cash payment requested.' };
    }

    // Process simulated demo payment via backend state machine
    const demoRes = await restaurantApi.processDemoPayment({
      sessionId: session.sessionId,
      paymentMethod: method,
      simulateFail,
    });

    if (demoRes.success) {
      setSession((prev) => ({
        ...prev,
        paymentStatus: 'PAID',
        status: 'PAID',
        paymentReferenceId: demoRes.referenceId || `DEMO_${method}_${Date.now()}`,
      }));
      return { success: true, message: demoRes.message || 'Payment confirmed.' };
    } else {
      if (demoRes.code === 'ALREADY_PAID') {
        return { success: false, message: 'Bill already paid.' };
      }
      setSession((prev) => ({
        ...prev,
        paymentStatus: 'FAILED',
      }));
      return {
        success: false,
        message: demoRes.message || 'Demo payment declined. You can retry or choose another payment method.',
      };
    }
  };

  const confirmCashPayment = () => {
    setSession((prev) => ({
      ...prev,
      paymentStatus: 'PAID',
      status: 'PAID',
      paymentReferenceId: `CASH_PIN_${Math.floor(1000 + Math.random() * 9000)}`,
    }));
  };

  const finishDining = () => {
    setSession((prev) => ({
      ...prev,
      status: 'CLOSED',
    }));
    try {
      localStorage.removeItem('resto_customer_token_v1');
    } catch {
      // Ignore storage errors
    }
    setIsBillOpen(false);
    setIsReceiptOpen(false);
    setIsTrackingOpen(false);
  };

  const reopenSession = () => {
    setSession({
      ...INITIAL_SESSION,
      sessionId: `ds_${Date.now()}`,
      startedAt: new Date().toISOString(),
    });
    setCartItems([]);
  };

  // Edge cases
  const simulateItemDepleted = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isAvailable: false } : item))
    );
  };

  const simulateRestoreItem = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isAvailable: true } : item))
    );
  };

  const simulateOfflineToggle = () => {
    setIsOffline((prev) => !prev);
  };

  const simulateSessionExpired = () => {
    setSession((prev) => ({
      ...prev,
      status: 'CLOSED',
    }));
  };

  const resolveUnavailableItem = (action: 'REPLACE' | 'REMOVE' | 'WAITER', replacementId?: string) => {
    if (unavailableItem) {
      if (action === 'REMOVE') {
        setCartItems((prev) => prev.filter((ci) => ci.menuItemId !== unavailableItem.id));
      } else if (action === 'REPLACE' && replacementId) {
        const repItem = menuItems.find((m) => m.id === replacementId);
        if (repItem) {
          setCartItems((prev) =>
            prev.map((ci) => {
              if (ci.menuItemId === unavailableItem.id) {
                return {
                  ...ci,
                  menuItemId: repItem.id,
                  item: repItem,
                  unitPrice: repItem.basePrice,
                  totalPrice: repItem.basePrice * ci.quantity,
                };
              }
              return ci;
            })
          );
        }
      } else if (action === 'WAITER') {
        submitServiceRequest('WAITER', `Help needed: Item ${unavailableItem.name} is unavailable`);
      }
    }
    setIsItemUnavailableSheetOpen(false);
    popModal('unavailable');
    setUnavailableItem(null);
  };

  // ==================== ROUTING & VIEW STATE ====================
  const [currentView, setCurrentViewState] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/staff/login')) return 'STAFF_LOGIN';
      if (path.startsWith('/reception')) return 'RECEPTION';
      if (path.startsWith('/kitchen')) return 'KITCHEN';
      if (path.startsWith('/admin')) return 'ADMIN';
      if (path.startsWith('/customer')) return 'CUSTOMER';
    }
    return 'CUSTOMER';
  });

  const setCurrentView = (view: AppView) => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      const pathMap: Record<AppView, string> = {
        CUSTOMER: '/customer',
        RECEPTION: '/reception',
        KITCHEN: '/kitchen',
        ADMIN: '/admin',
        STAFF_LOGIN: '/staff/login',
      };
      const targetPath = pathMap[view];
      if (!window.location.pathname.toLowerCase().startsWith(targetPath)) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/staff/login')) setCurrentViewState('STAFF_LOGIN');
      else if (path.startsWith('/reception')) setCurrentViewState('RECEPTION');
      else if (path.startsWith('/kitchen')) setCurrentViewState('KITCHEN');
      else if (path.startsWith('/admin')) setCurrentViewState('ADMIN');
      else setCurrentViewState('CUSTOMER');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [currentStaffRole, setCurrentStaffRole] = useState<StaffRole>('MANAGER');
  const [receptionTab, setReceptionTab] = useState<ReceptionTab>('OVERVIEW');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const acknowledgeRequest = async (tableId: string, requestId: string) => {
    await restaurantApi.updateServiceRequestStatus(tableId, requestId, 'ACKNOWLEDGED');
    if (tableId === session.tableId) {
      setSession((prev) => ({
        ...prev,
        serviceRequests: prev.serviceRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'ACKNOWLEDGED' } : r
        ),
      }));
    }
    setRawTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === tableId && tbl.session) {
          return {
            ...tbl,
            session: {
              ...tbl.session,
              serviceRequests: tbl.session.serviceRequests.map((r) =>
                r.id === requestId ? { ...r, status: 'ACKNOWLEDGED' } : r
              ),
            },
          };
        }
        return tbl;
      })
    );
  };

  const resolveRequest = async (tableId: string, requestId: string) => {
    await restaurantApi.updateServiceRequestStatus(tableId, requestId, 'RESOLVED');
    if (tableId === session.tableId) {
      setSession((prev) => ({
        ...prev,
        serviceRequests: prev.serviceRequests.map((r) =>
          r.id === requestId ? { ...r, status: 'RESOLVED' } : r
        ),
      }));
    }
    setRawTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === tableId && tbl.session) {
          return {
            ...tbl,
            session: {
              ...tbl.session,
              serviceRequests: tbl.session.serviceRequests.map((r) =>
                r.id === requestId ? { ...r, status: 'RESOLVED' } : r
              ),
            },
          };
        }
        return tbl;
      })
    );
  };

  const updateOrderStatus = async (tableId: string, batchId: string, status: OrderBatchStatus) => {
    await restaurantApi.bumpOrderStatus(tableId, batchId, status);
    setSession((prev) => {
      if (tableId === prev.tableId) {
        return {
          ...prev,
          orderBatches: prev.orderBatches.map((b) =>
            b.batchId === batchId ? { ...b, status } : b
          ),
        };
      }
      return prev;
    });
    setRawTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === tableId && tbl.session) {
          return {
            ...tbl,
            session: {
              ...tbl.session,
              orderBatches: tbl.session.orderBatches.map((b) =>
                b.batchId === batchId ? { ...b, status } : b
              ),
            },
          };
        }
        return tbl;
      })
    );
  };

  const confirmTableCashPayment = (
    tableId: string,
    staffPin: string,
    tenderedAmount: number
  ): { success: boolean; message: string } => {
    if (!staffPin || staffPin.trim().length < 4) {
      return { success: false, message: 'Invalid Staff PIN. Please enter a 4-digit security PIN.' };
    }

    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable || !targetTable.session) {
      return { success: false, message: 'Table session not found.' };
    }

    const billTotal = targetTable.session.bill.finalTotal;
    if (tenderedAmount < billTotal) {
      return {
        success: false,
        message: `Tendered amount ₹${tenderedAmount.toFixed(2)} is less than bill amount ₹${billTotal.toFixed(2)}.`,
      };
    }

    const changeDue = tenderedAmount - billTotal;

    // Authoritative backend cash settlement
    restaurantApi.confirmCashPayment({
      tableId,
      staffPin,
      tenderedAmount,
    });

    const paymentRef = `CASH_PIN_${staffPin.trim()}`;

    if (tableId === session.tableId) {
      setSession((prev) => ({
        ...prev,
        paymentStatus: 'PAID',
        status: 'PAID',
        paymentMethod: 'CASH',
        paymentReferenceId: paymentRef,
      }));
    }

    setRawTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === tableId && tbl.session) {
          return {
            ...tbl,
            status: 'PAID',
            session: {
              ...tbl.session,
              paymentStatus: 'PAID',
              status: 'PAID',
              paymentMethod: 'CASH',
              paymentReferenceId: paymentRef,
            },
          };
        }
        return tbl;
      })
    );

    return {
      success: true,
      message: `Cash payment of ₹${tenderedAmount.toFixed(2)} recorded. Change Due: ₹${changeDue.toFixed(2)}.`,
    };
  };

  const clearTable = (tableId: string): { success: boolean; message: string } => {
    const targetTable = tables.find((t) => t.id === tableId);
    if (!targetTable) {
      return { success: false, message: 'Table not found.' };
    }

    // Critical Operational Guardrail: Table MUST be PAID and zero unpaid balance
    if (targetTable.status !== 'PAID') {
      return {
        success: false,
        message: `Cannot clear table: Bill has not been paid yet! Current status is ${targetTable.status}.`,
      };
    }

    // Authoritative backend table clear
    restaurantApi.clearTable(tableId);

    if (tableId === session.tableId) {
      finishDining();
    }

    setRawTables((prev) =>
      prev.map((tbl) => {
        if (tbl.id === tableId) {
          return {
            ...tbl,
            status: 'AVAILABLE',
            seatedDurationMinutes: 0,
            session: undefined,
          };
        }
        return tbl;
      })
    );

    setSelectedTableId(null);
    return {
      success: true,
      message: `${targetTable.tableNumber} is now cleared, sanitized and marked AVAILABLE.`,
    };
  };

  const addStaffOrderToTable = (
    tableId: string,
    items: {
      menuItem: MenuItem;
      quantity: number;
      selectedModifiers: SelectedModifier[];
      specialInstructions?: string;
    }[]
  ) => {
    if (items.length === 0) return;

    const orderItems: OrderItem[] = items.map((i, idx) => ({
      orderItemId: `ord_staff_${Date.now()}_${idx}`,
      menuItemId: i.menuItem.id,
      name: i.menuItem.name,
      diet: i.menuItem.diet,
      quantity: i.quantity,
      unitPrice: i.menuItem.basePrice + i.selectedModifiers.reduce((acc, m) => acc + m.priceDelta, 0),
      totalPrice:
        (i.menuItem.basePrice + i.selectedModifiers.reduce((acc, m) => acc + m.priceDelta, 0)) *
        i.quantity,
      selectedModifiers: i.selectedModifiers,
      specialInstructions: i.specialInstructions ? `[STAFF ASSISTED] ${i.specialInstructions}` : '[STAFF ASSISTED]',
      isCooked: false,
    }));

    const batchSubtotal = orderItems.reduce((acc, i) => acc + i.totalPrice, 0);

    if (tableId === session.tableId) {
      const newBatchSeq = session.orderBatches.length + 1;
      const newBatch: OrderBatch = {
        batchId: `batch_staff_${Date.now()}`,
        batchSequence: newBatchSeq,
        placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'PREPARING',
        items: orderItems,
        batchSubtotal,
        estimatedMinutes: 15,
      };

      setSession((prev) => ({
        ...prev,
        status: 'ACTIVE',
        orderBatches: [...prev.orderBatches, newBatch],
      }));
    } else {
      setRawTables((prev) =>
        prev.map((tbl) => {
          if (tbl.id === tableId) {
            const existingBatches = tbl.session?.orderBatches || [];
            const newBatch: OrderBatch = {
              batchId: `batch_staff_${Date.now()}`,
              batchSequence: existingBatches.length + 1,
              placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'PREPARING',
              items: orderItems,
              batchSubtotal,
              estimatedMinutes: 15,
            };

            const updatedBatches = [...existingBatches, newBatch];
            let subtotal = 0;
            updatedBatches.forEach((b) => (subtotal += b.batchSubtotal));
            const netFood = subtotal;
            const tax = Math.round(netFood * 0.05 * 100) / 100;
            const finalTotal = Math.round((netFood + tax) * 100) / 100;

            const existingSession = tbl.session || {
              sessionId: `ds_${tableId}_${Date.now()}`,
              restaurantId: 'resto_spice_pavilion',
              restaurantName: 'The Spice Pavilion',
              restaurantAddress: '42 Heritage Enclave, Indiranagar, Bengaluru',
              gstin: '29AABCT1332L1ZV',
              fssai: '11221334000452',
              tableId: tbl.id,
              tableNumber: tbl.tableNumber,
              status: 'ACTIVE' as const,
              guestCount: tbl.capacity,
              startedAt: new Date().toISOString(),
              gameStatus: { hasPlayed: false, score: 0, discountPercentage: 0 },
              orderBatches: [],
              serviceRequests: [],
              bill: {
                foodSubtotal: subtotal,
                discountPercentage: 0,
                discountAmount: 0,
                netFoodAmount: netFood,
                cgstAmount: tax / 2,
                sgstAmount: tax / 2,
                finalTotal,
              },
              paymentStatus: 'UNPAID' as const,
            };

            return {
              ...tbl,
              status: 'ACTIVE',
              session: {
                ...existingSession,
                status: 'ACTIVE',
                orderBatches: updatedBatches,
                bill: {
                  foodSubtotal: subtotal,
                  discountPercentage: 0,
                  discountAmount: 0,
                  netFoodAmount: netFood,
                  cgstAmount: tax / 2,
                  sgstAmount: tax / 2,
                  finalTotal,
                },
              },
            };
          }
          return tbl;
        })
      );
    }
  };

  const toggleMenuItemAvailability = (itemId: string) => {
    restaurantApi.toggleStock(itemId);
    setMenuItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item))
    );
  };

  // ==================== ADMIN STATE & METHODS ====================
  const [adminTab, setAdminTab] = useState<AdminTab>('OVERVIEW');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(SEED_STAFF);
  const [gameSettings, setGameSettings] = useState<GameSettings>(SEED_GAME_SETTINGS);
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>(SEED_RESTAURANT_SETTINGS);
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsTimeRange>('TODAY');
  const [historicalOrders] = useState<HistoricalOrder[]>(SEED_HISTORICAL_ORDERS);

  const addStaffMember = (member: Omit<StaffMember, 'id' | 'joinedDate'>) => {
    const newStaff: StaffMember = {
      ...member,
      id: `stf_${Date.now()}`,
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setStaffMembers((prev) => [newStaff, ...prev]);
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffMembers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const toggleStaffStatus = (id: string) => {
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : s))
    );
  };

  const removeStaffMember = (id: string) => {
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
  };

  const updateGameSettings = (settings: Partial<GameSettings>) => {
    setGameSettings((prev) => {
      const updated = { ...prev, ...settings };
      if (updated.maxDiscountPercentage > 20) updated.maxDiscountPercentage = 20;
      if (updated.maxDiscountPercentage < 0) updated.maxDiscountPercentage = 0;
      return updated;
    });
  };

  const updateRestaurantSettings = (settings: Partial<RestaurantSettings>) => {
    setRestaurantSettings((prev) => {
      const updated = { ...prev, ...settings };
      setSession((s) => ({
        ...s,
        restaurantName: updated.name,
        restaurantAddress: updated.address,
        gstin: updated.gstin,
        fssai: updated.fssai,
      }));
      return updated;
    });
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `item_${Date.now()}`,
    };
    setMenuItems((prev) => [newItem, ...prev]);
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories((prev) => [...prev, trimmed]);
  };

  const renameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    setCategories((prev) => prev.map((c) => (c === oldName ? trimmed : c)));
    setMenuItems((prev) =>
      prev.map((item) => (item.category === oldName ? { ...item, category: trimmed } : item))
    );
  };

  const deleteCategory = (name: string) => {
    setCategories((prev) => prev.filter((c) => c !== name));
  };

  const addTable = (table: {
    tableNumber: string;
    capacity: number;
    section: 'Main Dining' | 'Terrace' | 'Rooftop';
    serverName: string;
  }) => {
    const newTbl: RestaurantTable = {
      id: `tbl_${Date.now()}`,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      section: table.section,
      serverName: table.serverName,
      status: 'AVAILABLE',
      seatedDurationMinutes: 0,
    };
    setRawTables((prev) => [...prev, newTbl]);
  };

  const updateTable = (id: string, updates: Partial<RestaurantTable>) => {
    setRawTables((prev) => prev.map((tbl) => (tbl.id === id ? { ...tbl, ...updates } : tbl)));
  };

  const deactivateTable = (id: string) => {
    setRawTables((prev) =>
      prev.map((tbl) => (tbl.id === id ? { ...tbl, status: 'CLOSED' } : tbl))
    );
  };

  return (
    <CustomerContext.Provider
      value={{
        session,
        menuItems,
        categories,
        activeCategory,
        searchQuery,
        dietaryFilter,
        selectedItemForDetail,
        isCartOpen,
        isTrackingOpen,
        isHelpOpen,
        isGameOpen,
        isBillOpen,
        isReceiptOpen,
        isItemUnavailableSheetOpen,
        unavailableItem,
        isOffline,
        isSearchOpen,
        openSearch,
        closeSearch,
        cartItems,
        cartCount,
        cartSubtotal,
        setActiveCategory,
        setSearchQuery,
        setDietaryFilter,
        openDetail,
        closeDetail,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        openCart,
        closeCart,
        placeOrder,
        openTracking,
        closeTracking,
        openHelp,
        closeHelp,
        submitServiceRequest,
        openGame,
        closeGame,
        submitGameScore,
        openBill,
        closeBill,
        openReceipt,
        closeReceipt,
        initiatePayment,
        confirmCashPayment,
        finishDining,
        reopenSession,
        simulateItemDepleted,
        simulateRestoreItem,
        simulateOfflineToggle,
        simulateSessionExpired,
        resolveUnavailableItem,

        // Reception
        currentView,
        setCurrentView,
        currentStaffRole,
        setCurrentStaffRole,
        receptionTab,
        setReceptionTab,
        tables,
        selectedTableId,
        setSelectedTableId,
        selectedOrderId,
        setSelectedOrderId,
        acknowledgeRequest,
        resolveRequest,
        updateOrderStatus,
        confirmTableCashPayment,
        clearTable,
        addStaffOrderToTable,
        toggleMenuItemAvailability,

        // Admin
        adminTab,
        setAdminTab,
        staffMembers,
        addStaffMember,
        updateStaffMember,
        toggleStaffStatus,
        removeStaffMember,
        gameSettings,
        updateGameSettings,
        restaurantSettings,
        updateRestaurantSettings,
        analyticsRange,
        setAnalyticsRange,
        historicalOrders,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addCategory,
        renameCategory,
        deleteCategory,
        addTable,
        updateTable,
        deactivateTable,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
