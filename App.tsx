import React, { useState, useEffect } from 'react';
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
import { SAMPLE_PLAYLIST, INITIAL_INVENTORY, SAMPLE_HISTORY, SAMPLE_REJECT_MASTER_DATA, SAMPLE_REJECT_HISTORY, SAMPLE_USERS } from './data'; // Keep as fallback
import { useToast } from './components/ToastSystem';
import { api } from './services/api';

const App: React.FC = () => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  
  // 1. Main Inventory Data
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  
  // 2. ISOLATED Reject Data
  const [rejectMasterData, setRejectMasterData] = useState<RejectMasterItem[]>([]);
  const [rejectHistory, setRejectHistory] = useState<RejectRecord[]>([]);

  // 3. User Management Data
  const [users, setUsers] = useState<User[]>([]);

  // 4. Media Player State (Global)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(SAMPLE_PLAYLIST);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // --- INITIAL DATA FETCHING ---
  const fetchData = async () => {
      setIsLoading(true);
      try {
          // Fetch all data in parallel
          const [invData, histData, rejMaster, rejHist, usrData] = await Promise.all([
              api.getInventory(),
              api.getHistory(),
              api.getRejectMaster(),
              api.getRejectHistory(),
              api.getUsers()
          ]);

          // Use DB data if available, otherwise fallback to mock (for demo purposes)
          setItems(invData.length > 0 ? invData : INITIAL_INVENTORY);
          setHistory(histData.length > 0 ? histData : SAMPLE_HISTORY);
          setRejectMasterData(rejMaster.length > 0 ? rejMaster : SAMPLE_REJECT_MASTER_DATA);
          setRejectHistory(rejHist.length > 0 ? rejHist : SAMPLE_REJECT_HISTORY);
          setUsers(usrData.length > 0 ? usrData : SAMPLE_USERS);

          if (invData.length === 0) toast.info("Connected to DB, but it's empty. Loaded sample data.");
      } catch (error) {
          console.error("Failed to connect to backend", error);
          toast.error("Backend Connection Failed. Using Offline Mode.", "Network Error");
          // Fallback
          setItems(INITIAL_INVENTORY);
          setHistory(SAMPLE_HISTORY);
          setRejectMasterData(SAMPLE_REJECT_MASTER_DATA);
          setRejectHistory(SAMPLE_REJECT_HISTORY);
          setUsers(SAMPLE_USERS);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // --- Main Inventory Handlers ---
  const handleTransactionComplete = async (record: TransactionRecord) => {
    try {
        await api.createTransaction(record);
        toast.success("Transaction recorded & Stock updated in DB", "Success");
        // Re-fetch to ensure sync
        const [newInv, newHist] = await Promise.all([api.getInventory(), api.getHistory()]);
        setItems(newInv);
        setHistory(newHist);
    } catch (error: any) {
        toast.error(error.message || "Failed to save transaction", "Database Error");
    }
  };

  const handleAddInventoryItems = async (newItems: InventoryItem[]) => {
      try {
          await api.addInventoryBulk(newItems);
          const updated = await api.getInventory();
          setItems(updated);
          toast.success(`Imported ${newItems.length} items to Database`, "Import Successful");
      } catch (error: any) {
          toast.error(error.message, "Import Failed");
      }
  };

  const handleEditTransaction = async (originalRecord: TransactionRecord, newRecord: TransactionRecord) => {
    // Note: Backend endpoint for full logic not fully implemented in this demo, 
    // assuming optimistic UI update or simple PUT
    try {
        await api.updateTransaction(originalRecord.id, newRecord);
        // Simple state update for now
        setHistory(prev => prev.map(rec => rec.id === originalRecord.id ? newRecord : rec));
        toast.success("Transaction Record Updated", "Sync Complete");
        // Ideal: Re-fetch inventory to check consistency
    } catch (error: any) {
        toast.error(error.message, "Update Failed");
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
        await api.deleteTransaction(id);
        setHistory(prev => prev.filter(rec => rec.id !== id));
        toast.info("Transaction log deleted from DB.", "Record Deleted");
    } catch (error: any) {
        toast.error(error.message, "Delete Failed");
    }
  };

  // --- Reject Module Handlers (Independent) ---
  const handleRejectComplete = async (record: RejectRecord) => {
      try {
          await api.createRejectRecord(record);
          setRejectHistory(prev => [record, ...prev]);
          toast.success("Reject record saved to DB");
      } catch (e: any) {
          toast.error(e.message, "Save Failed");
      }
  };

  const handleAddRejectMasterItems = async (newMasterItems: RejectMasterItem[]) => {
      try {
          await api.addRejectMasterBulk(newMasterItems);
          const updated = await api.getRejectMaster();
          setRejectMasterData(updated);
          toast.success(`Imported ${newMasterItems.length} items to Reject DB`, "Database Updated");
      } catch (e: any) {
          toast.error(e.message, "Import Failed");
      }
  };

  // --- User Management Handlers ---
  const handleAddUser = async (newUser: User) => {
    try {
        await api.createUser(newUser);
        setUsers(prev => [...prev, newUser]);
        toast.success(`User ${newUser.name} created`, "User Added");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
        await api.updateUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        toast.success("User profile updated", "Changes Saved");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === 'usr-1') {
      toast.error("Cannot delete the Super Admin account.", "Action Denied");
      return;
    }
    if (window.confirm("Are you sure you want to delete this user? Access will be revoked immediately.")) {
        try {
            await api.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success("User removed from system", "User Deleted");
        } catch (e: any) { toast.error(e.message); }
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
          toast.success("Video added to playlist", "Added");
      } else {
          toast.warning("Please enter a valid YouTube URL", "Invalid Link");
      }
  };

  const handleRemoveFromPlaylist = (id: string) => {
      setPlaylist(prev => prev.filter(p => p.id !== id));
      toast.info("Removed from playlist");
  };

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-neon-teal animate-pulse">
                <div className="w-16 h-16 border-4 border-neon-teal border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold tracking-widest">CONNECTING TO MAINFRAME...</h2>
                <p className="text-xs text-slate-500 mt-2">Checking database status</p>
            </div>
        );
    }

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