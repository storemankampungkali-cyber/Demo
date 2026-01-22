import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import InventoryList from './components/InventoryList.tsx';
import AIInsights from './components/AIInsights.tsx';
import TransactionModule from './components/TransactionModule.tsx';
import HistoryModule from './components/HistoryModule.tsx';
import RejectModule from './components/RejectModule.tsx';
import SettingsModule from './components/SettingsModule.tsx';
import MediaPlayer from './components/MediaPlayer.tsx';
import Login from './components/Login.tsx';
import { InventoryItem, AppView, TransactionRecord, RejectRecord, RejectMasterItem, User, PlaylistItem, AuthResponse } from './types.ts';
import { SAMPLE_PLAYLIST, INITIAL_INVENTORY, SAMPLE_HISTORY, SAMPLE_REJECT_MASTER_DATA, SAMPLE_REJECT_HISTORY, SAMPLE_USERS } from './data.ts';
import { useToast } from './components/ToastSystem.tsx';
import { api } from './services/api.ts';

const App: React.FC = () => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthResponse['user'] | null>(null);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<TransactionRecord[]>([]);
  const [rejectMasterData, setRejectMasterData] = useState<RejectMasterItem[]>([]);
  const [rejectHistory, setRejectHistory] = useState<RejectRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(SAMPLE_PLAYLIST);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // Clear HTML Fallback Loading Screen once App is ready
  useEffect(() => {
    const loadingScreen = document.getElementById('js-check');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      setTimeout(() => loadingScreen.remove(), 300);
    }
  }, []);

  const fetchData = async () => {
      try {
          const [invData, histData, rejMaster, rejHist, usrData] = await Promise.all([
              api.getInventory().catch(() => []),
              api.getHistory().catch(() => []),
              api.getRejectMaster().catch(() => []),
              api.getRejectHistory().catch(() => []),
              api.getUsers().catch(() => [])
          ]);

          setItems(invData.length > 0 ? invData : INITIAL_INVENTORY);
          setHistory(histData.length > 0 ? histData : SAMPLE_HISTORY);
          setRejectMasterData(rejMaster.length > 0 ? rejMaster : SAMPLE_REJECT_MASTER_DATA);
          setRejectHistory(rejHist.length > 0 ? rejHist : SAMPLE_REJECT_HISTORY);
          setUsers(usrData.length > 0 ? usrData : SAMPLE_USERS);

      } catch (error) {
          console.error("Data Fetch Error", error);
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
    try {
        const savedAuth = localStorage.getItem('neonflow_auth');
        if (savedAuth) {
            const authData = JSON.parse(savedAuth) as AuthResponse;
            setIsAuthenticated(true);
            setCurrentUser(authData.user);
        }
    } catch (e) {
        console.warn("Storage restricted or empty");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
      if (isAuthenticated) {
        fetchData();
      }
  }, [isAuthenticated]);

  const handleLoginSuccess = (authData: AuthResponse) => {
    try {
        localStorage.setItem('neonflow_auth', JSON.stringify(authData));
    } catch (e) {}
    setCurrentUser(authData.user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
        localStorage.removeItem('neonflow_auth');
    } catch (e) {}
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.info("Session terminated", "Logged Out");
  };

  const handleTransactionComplete = async (record: TransactionRecord) => {
    try {
        await api.createTransaction(record);
        toast.success("Transaction recorded", "Success");
        const [newInv, newHist] = await Promise.all([api.getInventory(), api.getHistory()]);
        setItems(newInv);
        setHistory(newHist);
    } catch (error: any) {
        toast.error(error.message || "Failed to sync transaction");
    }
  };

  const handleAddInventoryItems = async (newItems: InventoryItem[]) => {
      try {
          await api.addInventoryBulk(newItems);
          const updated = await api.getInventory();
          setItems(updated);
          toast.success(`Imported ${newItems.length} items`);
      } catch (error: any) {
          toast.error("Import failed");
      }
  };

  const handleEditTransaction = async (originalRecord: TransactionRecord, newRecord: TransactionRecord) => {
    try {
        await api.updateTransaction(originalRecord.id, newRecord);
        setHistory(prev => prev.map(rec => rec.id === originalRecord.id ? newRecord : rec));
        toast.success("Record updated");
    } catch (error: any) {
        toast.error("Update failed");
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
        await api.deleteTransaction(id);
        setHistory(prev => prev.filter(rec => rec.id !== id));
        toast.info("Record deleted");
    } catch (error: any) {
        toast.error("Delete failed");
    }
  };

  const handleRejectComplete = async (record: RejectRecord) => {
      try {
          await api.createRejectRecord(record);
          setRejectHistory(prev => [record, ...prev]);
          toast.success("Reject record saved");
      } catch (e: any) {
          toast.error("Save failed");
      }
  };

  const handleAddRejectMasterItems = async (newMasterItems: RejectMasterItem[]) => {
      try {
          await api.addRejectMasterBulk(newMasterItems);
          const updated = await api.getRejectMaster();
          setRejectMasterData(updated);
          toast.success("Reject DB updated");
      } catch (e: any) {
          toast.error("Import failed");
      }
  };

  const handleAddUser = async (newUser: User) => {
    try {
        await api.createUser(newUser);
        setUsers(prev => [...prev, newUser]);
        toast.success(`User ${newUser.name} created`);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
        await api.updateUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        toast.success("User profile updated");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === 'usr-1') {
      toast.error("Cannot delete root admin");
      return;
    }
    if (window.confirm("Delete user access?")) {
        try {
            await api.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success("User removed");
        } catch (e: any) { toast.error(e.message); }
    }
  };

  const handleAddToPlaylist = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;

      if (videoId) {
          const newItem: PlaylistItem = {
              id: `pl-${Date.now()}`,
              title: `Video ${videoId}`, 
              url: url,
              videoId: videoId
          };
          setPlaylist(prev => [...prev, newItem]);
          toast.success("Added to playlist");
      } else {
          toast.warning("Invalid YouTube URL");
      }
  };

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-neon-teal animate-pulse">
                <div className="w-16 h-16 border-4 border-neon-teal border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold tracking-widest">CONNECTING TO MAINFRAME...</h2>
            </div>
        );
    }

    if (!isAuthenticated) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard items={items} playlist={playlist} onAddToPlaylist={handleAddToPlaylist} onRemoveFromPlaylist={(id) => setPlaylist(p => p.filter(x => x.id !== id))} onPlayVideo={setCurrentVideoId} currentVideoId={currentVideoId} />;
      case AppView.INVENTORY:
        return <InventoryList items={items} history={history} onAddItems={handleAddInventoryItems} />;
      case AppView.TRANSACTION:
        return <TransactionModule items={items} onTransactionComplete={handleTransactionComplete} />;
      case AppView.HISTORY:
        return <HistoryModule history={history} inventoryItems={items} onDelete={handleDeleteHistory} onEditTransaction={handleEditTransaction} />;
      case AppView.REJECT:
        return <RejectModule masterData={rejectMasterData} rejectHistory={rejectHistory} onSaveReject={handleRejectComplete} onAddMasterItems={handleAddRejectMasterItems} />;
      case AppView.AI_INSIGHTS:
        return <AIInsights items={items} />;
      case AppView.SETTINGS:
        return <SettingsModule users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} />;
      default:
        return <Dashboard items={items} playlist={playlist} onAddToPlaylist={handleAddToPlaylist} onRemoveFromPlaylist={(id) => setPlaylist(p => p.filter(x => x.id !== id))} onPlayVideo={setCurrentVideoId} currentVideoId={currentVideoId} />;
    }
  };

  return (
    <div className="relative flex min-h-screen bg-dark-bg text-slate-200 font-sans selection:bg-neon-teal selection:text-black overflow-x-hidden">
      {isAuthenticated && (
        <Sidebar 
          currentView={currentView} 
          onChangeView={setCurrentView} 
          onLogout={handleLogout}
          userName={currentUser?.name}
        />
      )}
      <main className={`relative z-10 flex-1 ${isAuthenticated ? 'lg:ml-64 p-4 lg:p-8' : 'w-full'} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto mt-16 lg:mt-0">
          {renderContent()}
        </div>
      </main>
      {isAuthenticated && (
        <MediaPlayer videoId={currentVideoId} playlist={playlist} onPlay={setCurrentVideoId} onClose={() => setCurrentVideoId(null)} />
      )}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-900/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
};

export default App;