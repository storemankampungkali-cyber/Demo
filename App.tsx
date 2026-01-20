import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import AIInsights from './components/AIInsights';
import TransactionModule from './components/TransactionModule';
import HistoryModule from './components/HistoryModule';
import RejectModule from './components/RejectModule';
import SettingsModule from './components/SettingsModule';
import MediaPlayer from './components/MediaPlayer';
import { InventoryItem, AppView, TransactionRecord, RejectRecord, RejectMasterItem, User, PlaylistItem } from './types';
import { INITIAL_INVENTORY, SAMPLE_HISTORY, SAMPLE_REJECT_HISTORY, SAMPLE_REJECT_MASTER_DATA, SAMPLE_USERS, SAMPLE_PLAYLIST } from './data';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // 1. Main Inventory Data
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [history, setHistory] = useState<TransactionRecord[]>(SAMPLE_HISTORY);
  
  // 2. ISOLATED Reject Data
  const [rejectMasterData, setRejectMasterData] = useState<RejectMasterItem[]>(SAMPLE_REJECT_MASTER_DATA);
  const [rejectHistory, setRejectHistory] = useState<RejectRecord[]>(SAMPLE_REJECT_HISTORY);

  // 3. User Management Data
  const [users, setUsers] = useState<User[]>(SAMPLE_USERS);

  // 4. Media Player State (Global)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(SAMPLE_PLAYLIST);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // --- Main Inventory Handlers ---
  const handleTransactionComplete = (record: TransactionRecord) => {
    setHistory(prev => [record, ...prev]);
    const multiplier = record.type === 'IN' ? 1 : -1;
    setItems(prevItems => prevItems.map(invItem => {
        const transactionItem = record.items.find(tItem => tItem.id === invItem.id);
        if (transactionItem) {
            const qtyChange = transactionItem.orderQuantity * transactionItem.selectedUnit.ratio * multiplier;
            return { ...invItem, quantity: Math.max(0, invItem.quantity + qtyChange) };
        }
        return invItem;
    }));
  };

  const handleAddInventoryItems = (newItems: InventoryItem[]) => {
      setItems(prev => [...prev, ...newItems]);
      alert(`Successfully imported ${newItems.length} items to Main Inventory.`);
  };

  const handleEditTransaction = (originalRecord: TransactionRecord, newRecord: TransactionRecord) => {
    setHistory(prev => prev.map(rec => rec.id === originalRecord.id ? newRecord : rec));
    setItems(currentItems => {
        return currentItems.map(invItem => {
            let newQuantity = invItem.quantity;
            const oldItem = originalRecord.items.find(i => i.id === invItem.id);
            if (oldItem) {
                const oldTotalQty = oldItem.orderQuantity * oldItem.selectedUnit.ratio;
                const revertMultiplier = originalRecord.type === 'IN' ? -1 : 1; 
                newQuantity += (oldTotalQty * revertMultiplier);
            }
            const newItem = newRecord.items.find(i => i.id === invItem.id);
            if (newItem) {
                const newTotalQty = newItem.orderQuantity * newItem.selectedUnit.ratio;
                const applyMultiplier = newRecord.type === 'IN' ? 1 : -1;
                newQuantity += (newTotalQty * applyMultiplier);
            }
            return { ...invItem, quantity: Math.max(0, newQuantity) };
        });
    });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(rec => rec.id !== id));
  };

  // --- Reject Module Handlers (Independent) ---
  const handleRejectComplete = (record: RejectRecord) => {
      setRejectHistory(prev => [record, ...prev]);
  };

  const handleAddRejectMasterItems = (newMasterItems: RejectMasterItem[]) => {
      setRejectMasterData(prev => [...prev, ...newMasterItems]);
      alert(`Successfully imported ${newMasterItems.length} items to REJECT Master Database.`);
  };

  // --- User Management Handlers ---
  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === 'usr-1') {
      alert("Cannot delete the Super Admin account.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user? Access will be revoked immediately.")) {
        setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  // --- Media Player Handlers ---
  const getYoutubeId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddToPlaylist = (url: string) => {
      const videoId = getYoutubeId(url);
      if (videoId) {
          const newItem: PlaylistItem = {
              id: `pl-${Date.now()}`,
              title: `Video ${videoId}`, // In a real app, use API to fetch title
              url: url,
              videoId: videoId
          };
          setPlaylist(prev => [...prev, newItem]);
      } else {
          alert("Invalid YouTube URL");
      }
  };

  const handleRemoveFromPlaylist = (id: string) => {
      setPlaylist(prev => prev.filter(p => p.id !== id));
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
            <Dashboard 
                items={items} 
                playlist={playlist}
                onAddToPlaylist={handleAddToPlaylist}
                onRemoveFromPlaylist={handleRemoveFromPlaylist}
                onPlayVideo={setCurrentVideoId}
                currentVideoId={currentVideoId}
            />
        );
      case AppView.INVENTORY:
        return (
            <InventoryList 
                items={items} 
                history={history}
                onAddItems={handleAddInventoryItems} 
            />
        );
      case AppView.TRANSACTION:
        return <TransactionModule items={items} onTransactionComplete={handleTransactionComplete} />;
      case AppView.HISTORY:
        return (
            <HistoryModule 
                history={history} 
                inventoryItems={items} 
                onDelete={handleDeleteHistory} 
                onEditTransaction={handleEditTransaction} 
            />
        );
      case AppView.REJECT:
        return (
            <RejectModule 
                masterData={rejectMasterData} 
                rejectHistory={rejectHistory}
                onSaveReject={handleRejectComplete}
                onAddMasterItems={handleAddRejectMasterItems} 
            />
        );
      case AppView.AI_INSIGHTS:
        return <AIInsights items={items} />;
      case AppView.SETTINGS:
        return (
          <SettingsModule 
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      default:
        return <Dashboard 
            items={items} 
            playlist={playlist}
            onAddToPlaylist={handleAddToPlaylist}
            onRemoveFromPlaylist={handleRemoveFromPlaylist}
            onPlayVideo={setCurrentVideoId}
            currentVideoId={currentVideoId}
        />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-bg text-slate-200 font-sans selection:bg-neon-teal selection:text-black">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto mt-16 lg:mt-0">
          {renderContent()}
        </div>
      </main>

      {/* Persistent Media Player */}
      <MediaPlayer 
        videoId={currentVideoId} 
        playlist={playlist}
        onPlay={setCurrentVideoId}
        onClose={() => setCurrentVideoId(null)} 
      />

      {/* Background ambient effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};

export default App;