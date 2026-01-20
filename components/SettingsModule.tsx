import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, Users, Lock, Plus, Edit2, Trash2, Check, X, Search, UserCircle, Key } from 'lucide-react';

interface SettingsModuleProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'USERS' | 'SECURITY'>('USERS');
  const [searchTerm, setSearchTerm] = useState('');
  
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
      // Edit Mode
      onUpdateUser({
        ...editingUser,
        ...formData
      });
    } else {
      // Create Mode
      onAddUser({
        id: `usr-${Date.now()}`,
        lastActive: 'Never',
        ...formData
      });
    }
    handleCloseModal();
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
          <p className="text-slate-400 mt-2">Configuration, User Access & RBAC Controls.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 h-full overflow-hidden">
        {/* Sidebar Settings Menu */}
        <div className="w-full lg:w-64 bg-dark-card border border-dark-border rounded-2xl p-4 h-fit">
          <div className="space-y-2">
            <button 
                onClick={() => setActiveTab('GENERAL')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'GENERAL' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                General
            </button>
            <button 
                onClick={() => setActiveTab('USERS')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Users className="w-4 h-4" />
                User Management
            </button>
            <button 
                onClick={() => setActiveTab('SECURITY')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'SECURITY' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                Security Logs
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-dark-card border border-dark-border rounded-2xl p-6 glass-panel overflow-y-auto">
          {activeTab === 'USERS' ? (
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
                                            {/* Simple RBAC protection: Don't allow deleting ID 'usr-1' (Super Admin) */}
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
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Lock className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-slate-300">Restricted Access</h3>
                <p>This section is currently locked or under development.</p>
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