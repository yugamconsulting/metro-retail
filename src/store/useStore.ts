import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Product, Order, Client, Notification, OrderStatus, VendorType, Bulletin } from '../types';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SAVED' | 'ERROR';

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: string;
  status: 'SUCCESS' | 'FAILED';
  details: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  adminCredentials: { email: string; password: string };
  vendorType: VendorType;
  vendorBranding: { logoUrl?: string; primaryColor: string };
  clients: Client[];
  products: Product[];
  categories: string[];
  orders: Order[];
  bulletins: Bulletin[];
  drivers: User[];
  notifications: Notification[];
  syncStatus: SyncStatus;
  syncLog: SyncLogEntry[];
  lastSyncedAt: string | null;
  featureFlags: Record<string, boolean>;
  userAnalytics: Record<string, number>;
  activeBranchId: string | null;

  // System
  setSyncStatus: (status: SyncStatus) => void;
  addSyncLog: (entry: SyncLogEntry) => void;
  setLastSyncedAt: (timestamp: string) => void;
  setVendorType: (type: VendorType) => void;
  setVendorBranding: (branding: Partial<{ logoUrl: string; primaryColor: string }>) => void;
  setActiveBranchId: (id: string | null) => void;
  updateAdminCredentials: (creds: { email?: string; password?: string }) => void;
  trackEvent: (name: string, properties?: any) => void;
  incrementActionCount: (action: string) => void;

  // Drivers
  addDriver: (driver: User) => void;
  deleteDriver: (id: string) => void;

  // Bulletins
  addBulletin: (bulletin: Bulletin) => void;
  deleteBulletin: (id: string) => void;
  toggleBulletinStatus: (id: string) => void;

  // Auth
  setUser: (user: User | null, token?: string) => void;
  logout: () => void;

  // Products
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Categories
  addCategory: (category: string) => void;

  // Clients
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  resetClientPassword: (clientId: string, newPassword: string) => void;
  resetUserPassword: (clientId: string, userId: string, newPassword: string) => void;
  updateFirstLoginPassword: (clientId: string, userId: string | null, newPassword: string) => void;
  archiveClient: (clientId: string) => void;
  restoreClient: (clientId: string) => void;
  addClientUser: (clientId: string, user: User) => void;
  addClientBranch: (clientId: string, branch: any) => void;

  // Orders
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  confirmDelivery: (orderId: string, userId: string) => void;
  reportDeliveryIssue: (orderId: string, userId: string, issue: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  bulkUpdateOrderStatus: (orderIds: string[], status: OrderStatus) => void;

  // Notifications
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      adminCredentials: { email: 'admin@platform.com', password: 'admin' },
      vendorType: VendorType.DAIRY,
      vendorBranding: { primaryColor: '#4f46e5' },
      clients: [],
      products: [],
      categories: ['Dairy', 'Frozen Foods', 'Meat', 'FMCG', 'Beverages'],
      orders: [],
      bulletins: [
        { id: 'b1', title: 'Welcome', message: 'Welcome to MRT Platform.', type: 'INFO', active: true, timestamp: new Date().toISOString() }
      ],
      drivers: [],
      notifications: [],
      syncStatus: 'IDLE',
      syncLog: [],
      lastSyncedAt: null,
      activeBranchId: null,
      featureFlags: { 'beta-analytics': true, 'dark-mode': false },
      userAnalytics: {},

      setSyncStatus: (status) => set({ syncStatus: status }),
      addSyncLog: (entry) => set((state) => ({ syncLog: [entry, ...state.syncLog].slice(0, 50) })),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
      setVendorType: (type) => set({ vendorType: type }),
      setVendorBranding: (branding) => set((state) => ({ vendorBranding: { ...state.vendorBranding, ...branding } })),
      setActiveBranchId: (id) => set({ activeBranchId: id }),
      updateAdminCredentials: (creds) => set((state) => ({ adminCredentials: { ...state.adminCredentials, ...creds } })),
      trackEvent: (name, properties) => console.log(`[Analytics] ${name}`, properties),
      incrementActionCount: (action) => set((state) => ({
        userAnalytics: { ...state.userAnalytics, [action]: (state.userAnalytics[action] || 0) + 1 }
      })),

      addDriver: (d) => set((state) => ({ drivers: [...state.drivers, d] })),
      deleteDriver: (id) => set((state) => ({ drivers: state.drivers.filter(d => d.id !== id) })),

      addBulletin: (b) => set((state) => ({ bulletins: [b, ...state.bulletins] })),
      deleteBulletin: (id) => set((state) => ({ bulletins: state.bulletins.filter(b => b.id !== id) })),
      toggleBulletinStatus: (id) => set((state) => ({ 
        bulletins: state.bulletins.map(b => b.id === id ? { ...b, active: !b.active } : b)
      })),

      setUser: (user, token) => set({ user, token: token ?? null }),
      logout: () => set({ user: null, token: null }),

      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      addCategory: (category) =>
        set((state) => ({
          categories: state.categories.includes(category)
            ? state.categories
            : [...state.categories, category],
        })),

      addClient: (client) =>
        set((state) => {
          const maxNum = state.clients.reduce((max, c) => {
            const num = parseInt(c.clientNumber?.split('-')[1] ?? '1000', 10);
            return isNaN(num) ? max : Math.max(max, num);
          }, 1000);
          const clientNumber = `CLI-${maxNum + 1}`;
          return {
            clients: [
              ...state.clients,
              { ...client, clientNumber, password: 'client123', firstLogin: true },
            ],
          };
        }),

      updateClient: (id, updates) =>
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      resetClientPassword: (clientId, newPassword) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId ? { ...c, password: newPassword, firstLogin: false } : c
          ),
          notifications: [
            ...state.notifications,
            {
              id: `nt-${Date.now()}`,
              userId: clientId,
              title: 'Security Update',
              message: 'Your account password was reset by an administrator.',
              type: 'WARNING' as const,
              read: false,
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      resetUserPassword: (clientId, userId, newPassword) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  users: c.users.map((u) =>
                    u.id === userId ? { ...u, password: newPassword, firstLogin: false } : u
                  ),
                }
              : c
          ),
        })),

      updateFirstLoginPassword: (clientId, userId, newPassword) =>
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.id !== clientId) return c;
            if (!userId) {
              return { ...c, password: newPassword, firstLogin: false };
            }
            return {
              ...c,
              users: c.users.map((u) =>
                u.id === userId ? { ...u, password: newPassword, firstLogin: false } : u
              ),
            };
          }),
        })),

      addClientUser: (clientId, newUser) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId
              ? { ...c, users: [...c.users, { ...newUser, password: 'user123', firstLogin: true }] }
              : c
          ),
        })),

      addClientBranch: (clientId, branch) => set((state) => ({
        clients: state.clients.map(c => c.id === clientId ? { ...c, branches: [...(c.branches || []), branch] } : c)
      })),

      archiveClient: (clientId) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId
              ? { ...c, isArchived: true, archivedAt: new Date().toISOString() }
              : c
          ),
        })),

      restoreClient: (clientId) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === clientId ? { ...c, isArchived: false, archivedAt: undefined } : c
          ),
        })),

      setOrders: (orders) => set({ orders }),

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),

      updateOrder: (id, updates) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        })),

      confirmDelivery: (orderId, userId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'DELIVERED',
                  deliveryConfirmed: true,
                  deliveryConfirmedBy: userId,
                  deliveryConfirmedAt: new Date().toISOString(),
                  auditLog: [
                    ...o.auditLog,
                    {
                      timestamp: new Date().toISOString(),
                      userId,
                      action: 'DELIVERY_CONFIRMED',
                      details: 'Client confirmed receipt of delivery',
                    },
                  ],
                }
              : o
          ),
        })),

      reportDeliveryIssue: (orderId, userId, issue) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'ISSUE',
                  deliveryConfirmed: true,
                  deliveryIssue: issue,
                  auditLog: [
                    ...o.auditLog,
                    {
                      timestamp: new Date().toISOString(),
                      userId,
                      action: 'ISSUE_REPORTED',
                      details: `Client reported: ${issue}`,
                    },
                  ],
                }
              : o
          ),
        })),

      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),

      bulkUpdateOrderStatus: (orderIds, status) => set((state) => ({
        orders: state.orders.map((o) => (orderIds.includes(o.id) ? { ...o, status } : o))
      })),

      addNotification: (notification) =>
        set((state) => ({ notifications: [notification, ...state.notifications] })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'mrt-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { user, token, syncStatus, lastSyncedAt, ...rest } = state;
        return rest;
      },
    }
  )
);
