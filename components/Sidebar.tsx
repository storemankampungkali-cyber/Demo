
import React from 'react';
import { LayoutDashboard, Package, Bot, Settings, LogOut, Hexagon, ShoppingCart, History, Ban, User as UserIcon } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout?: () => void;
  userName?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onLogout, userName }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.INVENTORY, label: 'Inventory', icon: Package },
    { id: AppView.TRANSACTION, label: 'Transaction', icon: ShoppingCart },
    { id: AppView.HISTORY, label: 'History', icon: History },
    { id: AppView.REJECT, label: 'Reject / Bad Stock', icon: Ban },
    { id: AppView.AI_INSIGHTS, label: 'AI Strategy', icon: Bot },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-20 lg:w-64 h-screen fixed left-0 top-0 bg-dark-bg border-r border-dark-border flex flex-col z-50 transition-all duration-300">
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-dark-border/50">
        <div className="w-10 h-10 bg-gradient-to-tr from-neon-teal to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,242,234,0.3)]">
           <Hexagon className="text-white w-6 h-6" />
        </div>
        <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight text-white">
          Neon<span className="text-neon-teal">Flow</span>
        </span>
      </div>

      {/* User Info (Mobile user icon only) */}
      <div className="lg:px-6 py-4 flex items-center justify-center lg:justify-start gap-3 border-b border-dark-border/30">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-dark-border overflow-hidden">
          <UserIcon className="w-4 h-4 text-slate-400" />
        </div>
        <div className="hidden lg:block min-w-0">
          <p className="text-xs font-bold text-white truncate">{userName || 'Active User'}</p>
          <p className="text-[10px] text-neon-teal font-medium">Session Active</p>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 py-6 flex flex-col gap-1 px-3">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`
                group flex items-center px-3 lg:px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-neon-teal/10 to-transparent text-neon-teal' 
                  : 'text-slate-400 hover:text-white hover:bg-dark-hover'}
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neon-teal rounded-r-full shadow-[0_0_10px_#00f2ea]" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_5px_rgba(0,242,234,0.5)]' : ''}`} />
              <span className={`hidden lg:block ml-4 text-sm font-medium ${isActive ? 'translate-x-1' : ''} transition-transform`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dark-border/50">
        <button 
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10 mb-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block ml-3 font-medium">Log Out</span>
        </button>
        <div className="hidden lg:block text-center">
            <span className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">v1.4 Archive</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
