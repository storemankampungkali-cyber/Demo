import { InventoryItem, TransactionRecord, RejectMasterItem, RejectRecord, User, AuthResponse } from "../types.ts";

// Menggunakan relative path '/api' agar Vercel Proxy (rewrites) bisa menangkap dan meneruskan ke Backend IP
const API_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    const contentType = response.headers.get("content-type");
    
    // Safety check: Jika response bukan JSON (misal error HTML dari proxy 502/404), throw error spesifik
    if (!contentType || !contentType.includes("application/json")) {
      // Kita baca sedikit teksnya untuk debugging di console, tapi jangan diekspos ke UI jika sensitif
      const text = await response.text();
      console.warn(`[API Proxy Warning] Endpoint ${endpoint} returned non-JSON. Response start: ${text.substring(0, 100)}...`);
      throw new Error("SERVER_CONNECTION_ERROR");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }

    return response.json();
  } catch (err: any) {
    // Handling khusus jika backend tidak bisa dihubungi sama sekali
    if (err.message === 'Failed to fetch' || err.message === 'SERVER_CONNECTION_ERROR') {
      console.error("🌐 Backend Unreachable via Vercel Proxy.");
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
      // Mock Auth Fallback hanya jika Backend Offline total
      if (err.message === "BACKEND_OFFLINE" || err.message === "SERVER_CONNECTION_ERROR") {
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