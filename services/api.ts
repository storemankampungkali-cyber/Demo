import { InventoryItem, TransactionRecord, RejectMasterItem, RejectRecord, User, AuthResponse } from "../types.ts";

// Helper to get dynamic API URL from settings or default to /api (Proxy)
export const getApiEndpoint = () => {
    try {
        const stored = localStorage.getItem('neonflow_api_endpoint');
        // Remove trailing slash if present
        if (stored) return stored.replace(/\/$/, "");
        return '/api';
    } catch {
        return '/api';
    }
};

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiEndpoint();
  
  try {
    // Add timestamp to prevent caching
    const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}t=${Date.now()}`;
    
    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      ...options
    });

    const contentType = response.headers.get("content-type");
    
    // Handling if response is NOT JSON (e.g. Proxy Error, 404 HTML)
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.warn(`⚠️ [API Error] Endpoint ${url} returned non-JSON.`);
      console.warn(`Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 502 || response.status === 504) {
         throw new Error("SERVER_CONNECTION_ERROR"); 
      }
      
      throw new Error(`INVALID_RESPONSE_FORMAT: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
  } catch (err: any) {
    console.error(`❌ Request Failed: ${endpoint}`, err);

    const isNetworkError = 
        err.message === 'Failed to fetch' || 
        err.message === 'SERVER_CONNECTION_ERROR' ||
        err.message.includes('NetworkError') ||
        err.name === 'TypeError';

    if (isNetworkError) {
      console.error("🌐 Backend Unreachable. Check API Endpoint configuration in Settings.");
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
      // Mock Fallback only for specific conditions
      if (err.message === "BACKEND_OFFLINE") {
        if (credentials.email === 'admin' && credentials.password === '22') {
           console.warn("⚠️ Entering Offline Mode");
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