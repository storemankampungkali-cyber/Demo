import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { Shield, Users, Lock, Plus, Edit2, Trash2, Check, X, Search, UserCircle, Key, AlertTriangle, Database, RefreshCw, Save, Globe } from 'lucide-react';
import { api, getApiEndpoint } from '../services/api';
import { useToast } from './ToastSystem';

interface SettingsModuleProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'USERS' | 'SECURITY'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  
  // Connection Settings State
  const [apiEndpoint, setApiEndpoint] = useState('/api');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STAFF' as UserRole,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  useEffect(() => {
    setApiEndpoint(getApiEndpoint());
  }, []);

  const handleSaveEndpoint = () => {
    localStorage.setItem('neonflow_api_endpoint', apiEndpoint);
    toast.success(`Endpoint updated to: ${apiEndpoint}. Reloading...`, "Configuration Saved");
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'STAFF',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData });
    } else {
      onAddUser({ id: `usr-${Date.now()}`, lastActive: 'Never', ...formData });
    }
    handleCloseModal();
  };

  const handleDeepReset = async () => {
    const confirmation = window.confirm("PERINGATAN KRITIS: Anda akan menghapus SELURUH database (Inventory, Transaksi, Reject, dan User). Tindakan ini tidak dapat dibatalkan.\n\nApakah Anda yakin ingin melanjutkan?");
    
    if (confirmation) {
      const confirmText = window.prompt("Ketik 'KONFIRMASI HAPUS' untuk melanjutkan penghapusan total:");
      
      if (confirmText === 'KONFIRMASI HAPUS') {
        setIsResetLoading(true);
        try {
          const res = await api.resetSystem();
          toast.success(res.message, "Database Direset");
          // Refresh page to clear local states and redirect to initial dashboard
          setTimeout(() => window.location.reload(), 2000);
        } catch (err: any) {
          toast.error(err.message || "Gagal melakukan penghapusan database", "Error");
        } finally {
          setIsResetLoading(false);
        }
      } else {
        toast.info("Tindakan dibatalkan. Teks konfirmasi tidak sesuai.");
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Key className="w-8 h-8 text-slate-400" />
            System Settings
          </h1>
          <p className="text-slate-400 mt-2">Konfigurasi Sistem, Akses User & Kontrol Database.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden">
        {/* Sidebar Settings Menu */}
        <div className="w-full lg:w-64 bg-dark-card border border-dark-border rounded-2xl p-4 h-fit">
          <div className="space-y-2">
            <button 
                onClick={() => setActiveTab('GENERAL')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'GENERAL' ? 'bg-white/10 text-white border border-white/20 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Database className="w-4 h-4" />
                General & Maintenance
            </button>
            <button 
                onClick={() => setActiveTab('USERS')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Users className="w-4 h-4" />
                User Management
            </button>
            <button 
                onClick={() => setActiveTab('SECURITY')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'SECURITY' ? 'bg-white/10 text-white border border-white/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Shield className="w-4 h-4" />
                Security Logs
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-dark-card border border-dark-border rounded-2xl p-6 glass-panel overflow-y-auto custom-scrollbar">
          
          {activeTab === 'GENERAL' && (
            <div className="space-y-12">
               <div>
                  <h2 className="text-xl font-bold text-white">Application Maintenance</h2>
                  <p className="text-sm text-slate-400">Pengaturan metadata dan kesehatan database.</p>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-sm text-slate-500 font-bold uppercase tracking-wider">Database Status</label>
                          <div className="flex items-center gap-3 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl">
                              <Database className="w-5 h-5 text-neon-teal" />
                              <div className="flex-1">
                                  <div className="text-sm text-white font-mono">neonflow_inventory</div>
                                  <div className="text-[10px] text-green-400 font-bold uppercase">Online & Connected</div>
                              </div>
                          </div>
                      </div>
                      
                      {/* Editable Backend Endpoint */}
                      <div className="space-y-2">
                          <label className="text-sm text-slate-500 font-bold uppercase tracking-wider">Backend Connection</label>
                          <div className="flex gap-2">
                              <div className="flex-1 relative">
                                  <input 
                                    type="text" 
                                    value={apiEndpoint}
                                    onChange={(e) => setApiEndpoint(e.target.value)}
                                    placeholder="/api"
                                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 pl-10 text-white font-mono text-sm focus:border-neon-teal outline-none transition-all"
                                  />
                                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              </div>
                              <button 
                                onClick={handleSaveEndpoint}
                                className="px-4 py-2 bg-dark-card border border-dark-border hover:bg-dark-hover hover:border-neon-teal text-white rounded-xl transition-all shadow-lg"
                                title="Save & Reconnect"
                              >
                                  <Save className="w-5 h-5 text-neon-teal" />
                              </button>
                          </div>
                          <p className="text-[10px] text-slate-500">
                             Default: <code className="text-neon-teal bg-white/5 px-1 rounded">/api</code>. Set <code className="text-neon-teal bg-white/5 px-1 rounded">/</code> jika backend di root, atau full URL jika tanpa proxy.
                          </p>
                      </div>
                  </div>
               </div>

               {/* Danger Zone */}
               <div className="pt-8 border-t border-red-500/20">
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                    <div>
                        <h3 className="text-xl font-bold">Danger Zone</h3>
                        <p className="text-sm text-slate-500">Tindakan berikut akan menghapus data secara permanen.</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-8 border border-red-500/30 bg-red-500/5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-8 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
                      <div className="max-w-lg">
                          <h4 className="font-bold text-white text-lg">Hapus Semua Database (Reset Total)</h4>
                          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                              Ini akan melakukan <code>DROP TABLES</code> pada seluruh database MySQL Anda. Semua item inventaris, log transaksi, riwayat reject, dan akun pengguna akan dihapus selamanya. Sistem akan menyisakan satu akun Super Admin default untuk akses kembali.
                          </p>
                      </div>
                      <button 
                        onClick={handleDeepReset}
                        disabled={isResetLoading}
                        className="w-full md:w-auto px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isResetLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                        HAPUS SEMUA DATA
                      </button>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'USERS' && (
            <div className="space-y-6 h-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h2 className="text-xl font-bold text-white">Users & Roles</h2>
                      <p className="text-sm text-slate-400">Manage system access and permissions.</p>
                  </div>
                  <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-neon-purple text-white rounded-lg hover:bg-purple-600 transition-colors shadow-lg shadow-purple-900/40"
                  >
                    <Plus className="w-4 h-4" /> Add User
                  </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl pl-10 pr-4 py-2 text-white focus:border-neon-purple outline-none"
                />
              </div>

              {/* Table with Sticky Header */}
              <div className="overflow-hidden rounded-xl border border-dark-border flex-1 flex flex-col max-h-[calc(100vh-350px)]">
                <div className="overflow-auto custom-scrollbar flex-1 relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-[#0f111a] text-slate-400 text-xs uppercase font-bold shadow-sm">
                                <th className="p-4 bg-[#0f111a]">User Identity</th>
                                <th className="p-4 bg-[#0f111a]">Role</th>
                                <th className="p-4 bg-[#0f111a]">Status</th>
                                <th className="p-4 bg-[#0f111a]">Last Active</th>
                                <th className="p-4 text-right bg-[#0f111a]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">
                                                {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full" /> : <UserCircle />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-teal-500/20 text-teal-400 border-teal-500/30'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`flex items-center gap-1.5 text-xs font-medium ${user.status === 'ACTIVE' ? 'text-green-400' : 'text-slate-500'}`}>
                                            <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-slate-600'}`}></span>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-400">
                                        {user.lastActive}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(user)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {user.id !== 'usr-1' && (
                                                <button 
                                                    onClick={() => onDeleteUser(user.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SECURITY' && (
             <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Lock className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-slate-300">Restricted Access</h3>
                <p>Security audit logs are currently restricted to Super Admins.</p>
             </div>
          )}
        </div>
      </div>

      {/* ADD/EDIT USER MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md shadow-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-white">{editingUser ? 'Edit User' : 'Create New User'}</h3>
                      <button onClick={handleCloseModal} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-sm text-slate-400">Full Name</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:border-neon-purple outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-sm text-slate-400">Email Address</label>
                          <input 
                            required
                            type="email" 
                            className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:border-neon-purple outline-none"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-sm text-slate-400">Role (RBAC)</label>
                              <select 
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:border-neon-purple outline-none"
                                value={formData.role}
                                onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                              >
                                  <option value="STAFF">Staff</option>
                                  <option value="ADMIN">Admin</option>
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-sm text-slate-400">Status</label>
                              <select 
                                className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white focus:border-neon-purple outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                              >
                                  <option value="ACTIVE">Active</option>
                                  <option value="INACTIVE">Inactive</option>
                              </select>
                          </div>
                      </div>

                      {formData.role === 'ADMIN' && (
                          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex gap-3 items-start">
                              <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-purple-300">
                                  <strong>Admin Privileges:</strong> User will have full access to settings, user management, and sensitive system configurations.
                              </p>
                          </div>
                      )}

                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={handleCloseModal} className="flex-1 py-2 rounded-lg border border-dark-border text-slate-300 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                          <button type="submit" className="flex-1 py-2 rounded-lg bg-neon-purple text-white font-bold hover:bg-purple-600 transition-colors shadow-lg shadow-purple-900/40">
                              {editingUser ? 'Save Changes' : 'Create User'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsModule;