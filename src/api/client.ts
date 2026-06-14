import axios from 'axios';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// We need a way to trigger logout from the interceptor without circular imports.
// We'll use a custom event.
export const AUTH_ERROR_EVENT = 'mrt:auth-error';

client.interceptors.request.use((config) => {
  // In a real app, this should probably come from the Zustand store's state,
  // but for simplicity in this demo we read from localStorage or passed via state.
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT));
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (credentials: any) => client.post('/auth/login', credentials),
  
  // Products
  getProducts: () => client.get('/products'),
  createProduct: (data: any) => client.post('/products', data),
  updateProduct: (id: string, data: any) => client.patch(`/products/${id}`, data),
  
  // Clients
  getClients: () => client.get('/clients'),
  createClient: (data: any) => client.post('/clients', data),
  archiveClient: (id: string) => client.post(`/clients/${id}/archive`),
  resetPassword: (id: string, data: any) => client.post(`/clients/${id}/reset-password`, data),
  
  // Orders
  getOrders: () => client.get('/orders'),
  createOrder: (data: any) => client.post('/orders', data),
  updateOrder: (id: string, data: any) => client.patch(`/orders/${id}`, data),
  confirmDelivery: (id: string, data: any) => client.post(`/orders/${id}/confirm`, data),
  
  // Payments
  settlePayment: (orderId: string, data: any) => client.post(`/orders/${orderId}/settle`, data),
  
  // Notifications
  getNotifications: () => client.get('/notifications'),
  markRead: (id: string) => client.patch(`/notifications/${id}/read`),
};
