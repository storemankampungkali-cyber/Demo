import { InventoryItem, TransactionRecord, RejectMasterItem, RejectRecord, User } from "../types";

// Smart URL detection:
// If running locally (npm run dev), use localhost:5000.
// If built and running on VPS (Production), use relative path '/api' which Nginx will handle.
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

// Helper for Fetch
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || `Request failed with status ${response.status}`);
        }
        
        return response.json() as Promise<T>;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

export const api = {
    // Inventory
    getInventory: () => request<InventoryItem[]>('/inventory'),
    addInventoryBulk: (items: InventoryItem[]) => request<InventoryItem[]>('/inventory/bulk', {
        method: 'POST',
        body: JSON.stringify(items)
    }),

    // Transactions
    getHistory: () => request<TransactionRecord[]>('/transactions'),
    createTransaction: (record: TransactionRecord) => request<{message: string, transaction: TransactionRecord}>('/transactions', {
        method: 'POST',
        body: JSON.stringify(record)
    }),
    updateTransaction: (id: string, record: TransactionRecord) => request<TransactionRecord>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(record)
    }),
    deleteTransaction: (id: string) => request<{message: string}>(`/transactions/${id}`, {
        method: 'DELETE'
    }),

    // Reject Module
    getRejectMaster: () => request<RejectMasterItem[]>('/reject/master'),
    addRejectMasterBulk: (items: RejectMasterItem[]) => request<RejectMasterItem[]>('/reject/master', {
        method: 'POST',
        body: JSON.stringify(items)
    }),
    getRejectHistory: () => request<RejectRecord[]>('/reject/history'),
    createRejectRecord: (record: RejectRecord) => request<RejectRecord>('/reject/record', {
        method: 'POST',
        body: JSON.stringify(record)
    }),

    // Users
    getUsers: () => request<User[]>('/users'),
    createUser: (user: User) => request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(user)
    }),
    updateUser: (user: User) => request<User>(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(user)
    }),
    deleteUser: (id: string) => request<{message: string}>(`/users/${id}`, {
        method: 'DELETE'
    })
};