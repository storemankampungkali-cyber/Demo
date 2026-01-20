import React, { useState, useRef, useEffect } from 'react';
import { RejectMasterItem, RejectCartItem, UnitDefinition, RejectRecord } from '../types';
import { Search, Trash2, Calendar, ClipboardCopy, Building2, Ban, Plus, Save, History as HistoryIcon, Download, FileSpreadsheet, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

interface RejectModuleProps {
  masterData: RejectMasterItem[]; // Completely separate from InventoryItem
  rejectHistory: RejectRecord[];
  onSaveReject: (record: RejectRecord) => void;
  onAddMasterItems: (items: RejectMasterItem[]) => void;
}

// Independent Units for Reject System
const REJECT_UNITS: UnitDefinition[] = [
  { name: 'Pcs', ratio: 1 },
  { name: 'Kg', ratio: 1 },
  { name: 'Liter', ratio: 1 },
  { name: 'Karung', ratio: 1 },
  { name: 'Ikat', ratio: 1 },
  { name: 'Kardus', ratio: 1 },
  { name: 'Jerrycan', ratio: 1 },
];

const RejectModule: React.FC<RejectModuleProps> = ({ masterData, rejectHistory, onSaveReject, onAddMasterItems }) => {
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'HISTORY'>('ENTRY');
  
  // -- ENTRY STATE --
  const [outletName, setOutletName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rejectList, setRejectList] = useState<RejectCartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter for Autocomplete (USING ISOLATED MASTER DATA)
  const searchResults = masterData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Add Item Logic ---
  const addToRejectList = (item: RejectMasterItem) => {
    const newItem: RejectCartItem = {
      ...item,
      cartId: crypto.randomUUID(),
      selectedUnit: REJECT_UNITS.find(u => u.name === item.defaultUnit) || REJECT_UNITS[0],
      orderQuantity: 1
    };
    setRejectList(prev => [newItem, ...prev]);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const removeFromList = (cartId: string) => {
    setRejectList(prev => prev.filter(i => i.cartId !== cartId));
  };

  const updateItem = (cartId: string, field: 'qty' | 'unit', value: any) => {
    setRejectList(prev => prev.map(item => {
      if (item.cartId === cartId) {
        if (field === 'qty') return { ...item, orderQuantity: Number(value) };
        if (field === 'unit') {
             const u = REJECT_UNITS.find(u => u.name === value) || REJECT_UNITS[0];
             return { ...item, selectedUnit: u };
        }
      }
      return item;
    }));
  };

  // --- Date Formatter (ddMMyy) ---
  const getFormattedDate = (isoDate: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}${month}${year}`;
  };

  // --- Bulk Import Logic (FOR REJECT MASTER DATA ONLY) ---
  const handleDownloadTemplate = () => {
    const headers = [
        { A: 'Name', B: 'SKU', C: 'DefaultUnit', D: 'Category' }
    ];
    const ws = XLSX.utils.json_to_sheet(headers, { header: ["A", "B", "C", "D"], skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reject_Master_Template");
    XLSX.writeFile(wb, "Reject_DB_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map to RejectMasterItem
        const newItems: RejectMasterItem[] = data.map((row: any) => ({
            id: `REJ-M-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: row['Name'] || 'Unknown Reject Item',
            sku: row['SKU'] || `REJ-${Math.floor(Math.random()*10000)}`,
            defaultUnit: row['DefaultUnit'] || 'Pcs',
            category: row['Category'] || 'General'
        })).filter((i: RejectMasterItem) => i.name !== 'Unknown Reject Item');

        if (newItems.length > 0) {
            onAddMasterItems(newItems);
        }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Clipboard Logic ---
  const handleCopyCurrentEntry = async () => {
    if (rejectList.length === 0) {
        alert("List is empty!");
        return;
    }
    const header = `Data Reject ${outletName || '[Outlet]'} ${getFormattedDate(date)}`;
    const body = rejectList.map(item => `• ${item.name} (${item.orderQuantity} ${item.selectedUnit.name})`).join('\n');
    const fullText = `${header}\n${body}`;

    try {
        await navigator.clipboard.writeText(fullText);
        alert("Copied to clipboard!\n\nPreview:\n" + fullText);
    } catch (err) {
        console.error('Failed to copy', err);
    }
  };

  const handleCopyHistoryRecord = async (record: RejectRecord) => {
      const header = `Data Reject ${record.outletName} ${getFormattedDate(record.date)}`;
      const body = record.items.map(item => `• ${item.name} (${item.orderQuantity} ${item.selectedUnit.name})`).join('\n');
      const fullText = `${header}\n${body}`;

      try {
        await navigator.clipboard.writeText(fullText);
        alert("History Record Copied!\n\n" + fullText);
    } catch (err) {
        console.error('Failed to copy', err);
    }
  };

  const handleSaveToSystem = () => {
      if (rejectList.length === 0) return;
      
      const newRecord: RejectRecord = {
          id: `REJ-REC-${Date.now()}`,
          date: date,
          outletName: outletName || 'Unknown Outlet',
          items: [...rejectList],
          totalItems: rejectList.length
      };

      onSaveReject(newRecord);
      setRejectList([]);
      setOutletName('');
      alert("Reject Record Saved to Independent History.");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && searchRef.current.parentElement?.contains(event.target as Node)) {
        return;
      }
      setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
             <div>
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-red-600 rounded-lg text-white shadow-lg shadow-red-900/50">
                        <Database className="w-8 h-8" />
                    </div>
                    Independent Reject System
                </h1>
                <p className="text-slate-400 mt-2 font-mono text-sm border-l-2 border-red-500 pl-3">
                    Database: <span className="text-red-400 font-bold">REJECT_MASTER_DB</span> • Status: <span className="text-green-400">ISOLATED</span>
                </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
                 {/* Master Data Controls */}
                 <div className="flex gap-2 p-1 bg-dark-card border border-dark-border rounded-xl">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                    />
                    <button 
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors"
                        title="Download Reject DB Template"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <div className="w-px bg-dark-border my-1"></div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 transition-colors font-medium"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Import Reject DB</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-dark-card border border-dark-border p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('ENTRY')}
                        className={`flex items-center gap-2 px-4 lg:px-6 py-2 rounded-lg font-bold transition-all text-sm ${activeTab === 'ENTRY' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Plus className="w-4 h-4" />
                        Input Reject
                    </button>
                    <button 
                        onClick={() => setActiveTab('HISTORY')}
                        className={`flex items-center gap-2 px-4 lg:px-6 py-2 rounded-lg font-bold transition-all text-sm ${activeTab === 'HISTORY' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <HistoryIcon className="w-4 h-4" />
                        Logs
                    </button>
                </div>
            </div>
        </div>

      {activeTab === 'ENTRY' ? (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
            {/* LEFT COLUMN: Inputs & Header */}
            <div className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto">
                <div className="bg-gradient-to-br from-dark-card to-dark-bg border border-red-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.05)] space-y-5">
                    {/* Date Input */}
                    <div className="space-y-2">
                        <label className="text-xs text-red-400 uppercase font-bold tracking-wider flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Tanggal (DDMMYY)
                        </label>
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border text-white px-4 py-3 rounded-xl focus:border-red-500 focus:outline-none transition-colors scheme-dark"
                        />
                    </div>

                    {/* Outlet Input */}
                    <div className="space-y-2">
                        <label className="text-xs text-red-400 uppercase font-bold tracking-wider flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Nama Outlet
                        </label>
                        <input 
                            type="text" 
                            value={outletName} 
                            onChange={(e) => setOutletName(e.target.value)}
                            placeholder="Contoh: Outlet Surabaya"
                            className="w-full bg-dark-bg border border-dark-border text-white px-4 py-3 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Preview Box */}
                    <div className="pt-4 border-t border-dark-border/50">
                        <label className="text-xs text-slate-500 uppercase font-bold mb-2 block">Format Text Preview</label>
                        <div className="bg-black/40 p-3 rounded-lg border border-dark-border text-sm font-mono text-green-400 break-words">
                            Data Reject {outletName || '[Outlet]'} {getFormattedDate(date)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleSaveToSystem}
                        disabled={rejectList.length === 0}
                        className="w-full py-4 bg-dark-card border border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-5 h-5" />
                        Simpan Log
                    </button>
                    <button 
                        onClick={handleCopyCurrentEntry}
                        disabled={rejectList.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ClipboardCopy className="w-5 h-5" />
                        Copy Text
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: Search & List */}
            <div className="flex-1 flex flex-col gap-4 bg-dark-card border border-dark-border rounded-2xl overflow-hidden glass-panel relative">
                
                {/* Search Area */}
                <div className="p-4 border-b border-dark-border z-20 bg-dark-card">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-400 transition-colors" />
                        <input
                            ref={searchRef}
                            type="text"
                            className="w-full bg-dark-bg border border-dark-border text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all placeholder-slate-500"
                            placeholder="Cari di Database Reject..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                        />

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && searchTerm && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50">
                                {searchResults.length > 0 ? (
                                    searchResults.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => addToRejectList(item)}
                                            className="p-3 hover:bg-red-500/10 cursor-pointer flex justify-between items-center border-b border-dark-border/30 last:border-0"
                                        >
                                            <div>
                                                <div className="text-white font-medium">{item.name}</div>
                                                <div className="text-xs text-slate-500">{item.sku} • {item.defaultUnit}</div>
                                            </div>
                                            <Plus className="w-4 h-4 text-slate-400" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-slate-500 text-center">
                                        Item tidak ditemukan di Database Reject.<br/>
                                        <span className="text-xs text-red-400">Pastikan sudah Import Master Data Reject.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* List Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-dark-bg/20">
                    {rejectList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600">
                            <Ban className="w-16 h-16 mb-4 opacity-20" />
                            <p>List Reject Kosong</p>
                        </div>
                    ) : (
                        rejectList.map((item) => (
                            <div key={item.cartId} className="bg-dark-bg border border-dark-border p-3 rounded-xl flex items-center justify-between group hover:border-red-500/30 transition-colors">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-400 text-lg">•</span>
                                        <h4 className="font-medium text-white truncate">{item.name}</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 pl-4">{item.sku}</p>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={item.orderQuantity}
                                        onChange={(e) => updateItem(item.cartId, 'qty', e.target.value)}
                                        className="w-16 bg-dark-card border border-dark-border text-center text-white rounded-lg px-2 py-1 focus:border-red-500 outline-none"
                                    />
                                    <select 
                                        value={item.selectedUnit.name}
                                        onChange={(e) => updateItem(item.cartId, 'unit', e.target.value)}
                                        className="w-24 bg-dark-card border border-dark-border text-white text-sm rounded-lg px-2 py-1 focus:border-red-500 outline-none"
                                    >
                                        {REJECT_UNITS.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                    </select>
                                    <button 
                                        onClick={() => removeFromList(item.cartId)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-dark-border bg-dark-bg/50 text-right text-slate-500 text-sm">
                    Total Item Reject: <span className="text-white font-bold">{rejectList.length}</span>
                </div>
            </div>
        </div>
      ) : (
        /* --- HISTORY TAB --- */
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden glass-panel flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                     <tr className="bg-dark-bg/50 border-b border-dark-border text-slate-400 uppercase text-xs tracking-wider">
                        <th className="p-4 w-32">Tanggal</th>
                        <th className="p-4 w-40">ID</th>
                        <th className="p-4">Outlet</th>
                        <th className="p-4">Ringkasan Barang</th>
                        <th className="p-4 text-right">Total</th>
                        <th className="p-4 text-center">Aksi</th>
                     </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                    {rejectHistory.length > 0 ? rejectHistory.map(record => (
                        <tr key={record.id} className="hover:bg-dark-hover/50 transition-colors">
                            <td className="p-4"><div className="text-white font-mono text-sm">{record.date}</div></td>
                            <td className="p-4"><div className="text-xs text-red-400 font-mono">{record.id}</div></td>
                            <td className="p-4 text-white font-medium">{record.outletName}</td>
                            <td className="p-4">
                                <div className="text-sm text-slate-400">
                                    {record.items.map(i => i.name).slice(0, 2).join(", ")}
                                    {record.items.length > 2 && ` +${record.items.length - 2} lainnya`}
                                </div>
                            </td>
                            <td className="p-4 text-right text-white font-bold">{record.totalItems}</td>
                            <td className="p-4 text-center">
                                <button 
                                    onClick={() => handleCopyHistoryRecord(record)}
                                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-all mx-auto border border-white/10"
                                    title="Salin Format Text ke Clipboard"
                                >
                                    <ClipboardCopy className="w-4 h-4" />
                                    <span className="text-xs">Salin</span>
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={6} className="p-12 text-center text-slate-500">Belum ada riwayat reject.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default RejectModule;