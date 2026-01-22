import { InventoryItem, TransactionRecord, RejectMasterItem, RejectRecord, User, AuthResponse } from "../types.ts";

// Menggunakan relative path '/api'. 
// Di Localhost: Ditangani oleh vite.config.ts (Proxy ke IP)
// Di Vercel: Ditangani oleh vercel.json (Rewrites ke IP)
const API_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    // Tambahkan timestamp untuk mencegah caching agresif browser pada GET request
    const url = `${API_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}t=${Date.now()}`;
    
    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      ...options
    });

    const contentType = response.headers.get("content-type");
    
    // Handling jika response BUKAN JSON (Biasanya error dari Proxy Vercel, Nginx, atau 404 HTML page)
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.warn(`⚠️ [API Error] Endpoint ${endpoint} returned non-JSON.`);
      console.warn(`Status: ${response.status} ${response.statusText}`);
      console.warn(`Response Preview: ${text.substring(0, 200)}...`);
      
      // Jika error 404/502/504 dari Vercel/Proxy, itu berarti Backend tidak bisa dijangkau dari Proxy
      if (response.status === 502 || response.status === 504) {
         throw new Error("SERVER_CONNECTION_ERROR"); 
      }
      
      // Jika status OK (200) tapi bukan JSON, ini aneh.
      throw new Error(`INVALID_RESPONSE_FORMAT: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  } catch (err: any) {
    console.error(`❌ Request Failed: ${endpoint}`, err);

    // Deteksi Spesifik Error Koneksi
    const isNetworkError = 
        err.message === 'Failed to fetch' || 
        err.message === 'SERVER_CONNECTION_ERROR' ||
        err.message.includes('NetworkError') ||
        err.name === 'TypeError'; // Fetch sering melempar TypeError saat network mati

    if (isNetworkError) {
      console.error("🌐 Backend Unreachable. Pastikan IP Backend benar dan Firewall mengizinkan port 3000.");
      throw new Error("BACKEND_OFFLINE");
    }
    
    throw err;
  }
}

export const api = {
  login: async (credentials: { email: string, password: string }): Promise<AuthResponse> => {
    try {
      return await request<AuthResponse>('/auth/login', { 
        method: 'POST', 
        body: JSON.stringify(credentials) 
      });
    } catch (err: any) {
      // Mock Auth Fallback HANYA jika Backend benar-benar Offline/Mati
      if (err.message === "BACKEND_OFFLINE") {
        console.warn("⚠️ Menggunakan Mode Offline Mock karena Backend tidak merespon.");
        if (credentials.email === 'admin' && credentials.password === '22') {
          return {
            token: "mock-session-token-offline",
            user: { id: "usr-1", name: "Super Admin (Offline Mode)", email: "admin", role: "ADMIN" }
          };
        }
      }
      throw err;
    }
  },
  getInventory: () => request<InventoryItem[]>('/inventory'),
  addInventoryBulk: (items: InventoryItem[]) => request<InventoryItem[]>('/inventory/bulk', { method: 'POST', body: JSON.stringify(items) }),
  getHistory: () => request<TransactionRecord[]>('/transactions'),
  createTransaction: (record: TransactionRecord) => request<{transaction: TransactionRecord}>('/transactions', { method: 'POST', body: JSON.stringify(record) }),
  updateTransaction: (id: string, record: TransactionRecord) => request<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(record) }),
  deleteTransaction: (id: string) => request<any>(`/transactions/${id}`, { method: 'DELETE' }),
  getRejectMaster: () => request<RejectMasterItem[]>('/reject/master'),
  addRejectMasterBulk: (items: RejectMasterItem[]) => request<RejectMasterItem[]>('/reject/master', { method: 'POST', body: JSON.stringify(items) }),
  getRejectHistory: () => request<RejectRecord[]>('/reject/history'),
  createRejectRecord: (record: RejectRecord) => request<RejectRecord>('/reject/record', { method: 'POST', body: JSON.stringify(record) }),
  getUsers: () => request<User[]>('/users'),
  createUser: (user: User) => request<User>('/users', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (user: User) => request<User>(`/users/${user.id}`, { method: 'PUT', body: JSON.stringify(user) }),
  deleteUser: (userId: string) => request<any>(`/users/${userId}`, { method: 'DELETE' }),
  resetSystem: () => request<{ success: boolean; message: string }>('/system/reset', { method: 'POST' })
};