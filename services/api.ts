
import { InventoryItem, TransactionRecord, RejectMasterItem, RejectRecord, User, AuthResponse } from "../types";

// Dengan vercel.json proxy, kita cukup menggunakan path relatif '/api'
// Vercel akan meneruskan ini ke http://89.21.85.28:5000/api
const API_URL = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API Error');
  }
  return response.json();
}

export const api = {
  login: (credentials: { email: string, password: string }) => 
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
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
  // Fix: Added resetSystem to handle system-wide database reset functionality
  resetSystem: () => request<{ success: boolean; message: string }>('/system/reset', { method: 'POST' })
};
