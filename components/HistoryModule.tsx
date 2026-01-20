import React, { useState, useEffect, useRef } from 'react';
import { TransactionRecord, InventoryItem, CartItem, UnitDefinition } from '../types';
import { Search, Eye, Trash2, Edit2, X, ChevronRight, Hash, Image as ImageIcon, FileText, FileSpreadsheet, Download, Plus, Save, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

// Copy of Units from TransactionModule (In real app, move to constants file)
const UNITS: UnitDefinition[] = [
  { name: 'Pcs', ratio: 1 },
  { name: 'Dozen (12x)', ratio: 12 },
  { name: 'Box (24x)', ratio: 24 },
  { name: 'Crate (50x)', ratio: 50 },
];

interface HistoryModuleProps {
  history: TransactionRecord[];
  inventoryItems: InventoryItem[]; // Required to add new items during edit
  onDelete: (id: string) => void;
  onEditTransaction: (original: TransactionRecord, newRecord: TransactionRecord) => void;
}

const HistoryModule: React.FC<HistoryModuleProps> = ({ history, inventoryItems, onDelete, onEditTransaction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedRecord, setSelectedRecord] = useState<TransactionRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState<string | null>(null);

  // -- Edit Mode State --
  const [editingRecord, setEditingRecord] = useState<TransactionRecord | null>(null);
  const [itemSearchTerm, setItemSearchTerm] = useState(''); // For adding items inside modal
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  // Filter Logic
  const filteredHistory = history.filter(record => {
    const term = searchTerm.toLowerCase();
    const matchesMeta = 
        record.id.toLowerCase().includes(term) || 
        record.referenceNumber.toLowerCase().includes(term) ||
        record.notes.toLowerCase().includes(term);
    const matchesItem = record.items.some(item => item.name.toLowerCase().includes(term));
    const matchesText = matchesMeta || matchesItem;

    let matchesDate = true;
    if (startDate) matchesDate = matchesDate && record.date >= startDate;
    if (endDate) matchesDate = matchesDate && record.date <= endDate;
    
    return matchesText && matchesDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenDetail = (record: TransactionRecord) => {
    setSelectedRecord(record);
    setIsEditing(false);
    setEditingRecord(null);
  };

  const startEditing = () => {
      if (selectedRecord) {
          // Deep Clone to avoid reference issues
          setEditingRecord(JSON.parse(JSON.stringify(selectedRecord)));
          setIsEditing(true);
      }
  };

  const handleSaveEdit = () => {
    if (selectedRecord && editingRecord) {
        // Recalculate Total Units
        const totalUnits = editingRecord.items.reduce((acc, item) => acc + (item.orderQuantity * item.selectedUnit.ratio), 0);
        const finalRecord = { ...editingRecord, totalUnits };

        onEditTransaction(selectedRecord, finalRecord);
        setSelectedRecord(finalRecord); // Update view
        setIsEditing(false);
        setEditingRecord(null);
    }
  };

  const handleDelete = () => {
      if (selectedRecord && window.confirm('Are you sure you want to delete this log? Note: This assumes you handle stock reversal manually or this is just a log cleanup.')) {
          onDelete(selectedRecord.id);
          setSelectedRecord(null);
      }
  }

  // -- Edit Logic: Item Management --
  const updateEditItem = (itemId: string, field: 'qty' | 'unit', value: string | number) => {
      if (!editingRecord) return;
      
      const newItems = editingRecord.items.map(item => {
          if (item.id === itemId) {
              if (field === 'qty') return { ...item, orderQuantity: Number(value) };
              if (field === 'unit') {
                  const newUnit = UNITS.find(u => u.name === value) || item.selectedUnit;
                  return { ...item, selectedUnit: newUnit };
              }
          }
          return item;
      });
      setEditingRecord({ ...editingRecord, items: newItems });
  };

  const removeEditItem = (itemId: string) => {
      if (!editingRecord) return;
      setEditingRecord({ 
          ...editingRecord, 
          items: editingRecord.items.filter(i => i.id !== itemId) 
      });
  };

  const addItemToEdit = (invItem: InventoryItem) => {
      if (!editingRecord) return;
      
      // Check if already exists
      if (editingRecord.items.find(i => i.id === invItem.id)) {
          alert('Item already in list');
          return;
      }

      const newItem: CartItem = {
          ...invItem,
          cartId: crypto.randomUUID(), // New cart ID
          selectedUnit: UNITS[0],
          orderQuantity: 1
      };

      setEditingRecord({
          ...editingRecord,
          items: [newItem, ...editingRecord.items]
      });
      setItemSearchTerm('');
      setShowItemSuggestions(false);
  };

  // -- Excel Export --
  const exportToXLSX = () => {
    const flatData: any[] = [];
    filteredHistory.forEach(record => {
        record.items.forEach(item => {
            flatData.push({
                'ID': record.id,
                'Date': record.date,
                'Type': record.type,
                'Description': record.notes || '-',
                'Ref Number': record.referenceNumber,
                'Product': item.name,
                'SKU': item.sku,
                'Qty': item.orderQuantity,
                'Unit': item.selectedUnit.name,
                'Total': item.orderQuantity * item.selectedUnit.ratio
            });
        });
    });
    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "History");
    XLSX.writeFile(workbook, `NeonFlow_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredSuggestions = inventoryItems.filter(i => 
    i.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) || 
    i.sku.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in relative h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Transaction History</h1>
                <p className="text-slate-400 mt-1">Archive of all incoming and outgoing stock movements.</p>
            </div>
            <button onClick={exportToXLSX} className="flex items-center justify-center gap-2 w-12 h-12 bg-green-600/20 border border-green-500 text-green-400 hover:bg-green-500 hover:text-white rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <FileSpreadsheet className="w-6 h-6" />
            </button>
        </div>

        {/* Filters */}
        <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col lg:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                    type="text" placeholder="Search ID, Description, or Item Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-neon-teal"
                />
             </div>
             <div className="flex gap-2 items-center">
                 <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-dark-bg border border-dark-border text-white px-3 py-2.5 rounded-lg scheme-dark" />
                 <span className="text-slate-500">-</span>
                 <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-dark-bg border border-dark-border text-white px-3 py-2.5 rounded-lg scheme-dark" />
                 {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-2.5 text-slate-400 hover:bg-dark-bg rounded-lg"><X className="w-4 h-4" /></button>}
             </div>
        </div>

        {/* List */}
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden glass-panel min-h-[400px]">
            <table className="w-full text-left border-collapse">
                <thead>
                     <tr className="bg-dark-bg/50 border-b border-dark-border text-slate-400 uppercase text-xs tracking-wider">
                        <th className="p-4 w-32">Date</th>
                        <th className="p-4 w-40">Transaction ID</th>
                        <th className="p-4 w-32">Type</th>
                        <th className="p-4">Description (Ref)</th>
                        <th className="p-4">Items Count</th>
                        <th className="p-4">Photos</th>
                        <th className="p-4 text-right">Action</th>
                     </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                    {filteredHistory.map(record => (
                        <tr key={record.id} className="hover:bg-dark-hover/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetail(record)}>
                            <td className="p-4"><div className="text-white font-mono text-sm">{record.date}</div></td>
                            <td className="p-4"><div className="text-xs text-slate-400 font-mono">{record.id}</div></td>
                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${record.type === 'IN' ? 'text-neon-teal bg-neon-teal/10' : 'text-neon-pink bg-neon-pink/10'}`}>{record.type}</span></td>
                            <td className="p-4">
                                <div className="text-slate-200 text-sm truncate max-w-[200px]" title={record.notes}>
                                    {record.notes ? record.notes : "-"}
                                </div>
                                {record.referenceNumber && (
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{record.referenceNumber}</div>
                                )}
                            </td>
                            <td className="p-4 text-slate-300">{record.items.length} Items</td>
                            <td className="p-4">{record.photos.length > 0 ? <ImageIcon className="w-4 h-4 text-slate-400" /> : '-'}</td>
                            <td className="p-4 text-right"><ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" /></td>
                        </tr>
                    ))}
                    {filteredHistory.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-500">No data found.</td></tr>}
                </tbody>
            </table>
        </div>

        {/* Detail / Edit Modal */}
        {selectedRecord && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-dark-border flex justify-between items-start bg-dark-card sticky top-0 z-10">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Transaction' : 'Transaction Details'}</h2>
                                {isEditing && (
                                    <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Live Stock Sync
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-sm mt-1 font-mono">{selectedRecord.id}</p>
                        </div>
                        <button onClick={() => setSelectedRecord(null)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-8">
                        {isEditing && editingRecord ? (
                            /* --- EDIT FORM --- */
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-bold uppercase">Date</label>
                                        <input type="date" value={editingRecord.date} onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})} 
                                            className="w-full bg-dark-bg border border-dark-border text-white px-3 py-2 rounded focus:border-neon-teal scheme-dark" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-bold uppercase">Type</label>
                                        <select value={editingRecord.type} onChange={(e) => setEditingRecord({...editingRecord, type: e.target.value as 'IN' | 'OUT'})}
                                            className="w-full bg-dark-bg border border-dark-border text-white px-3 py-2 rounded focus:border-neon-teal">
                                            <option value="IN">STOCK IN</option>
                                            <option value="OUT">STOCK OUT</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-500 font-bold uppercase">Reference (PO/SJ)</label>
                                        <input type="text" value={editingRecord.referenceNumber} onChange={(e) => setEditingRecord({...editingRecord, referenceNumber: e.target.value})}
                                            className="w-full bg-dark-bg border border-dark-border text-white px-3 py-2 rounded focus:border-neon-teal" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-500 font-bold uppercase">Description / Notes</label>
                                    <textarea value={editingRecord.notes} onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                                        className="w-full bg-dark-bg border border-dark-border text-white px-3 py-2 rounded focus:border-neon-teal h-20 resize-none" />
                                </div>

                                {/* Item Editor */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-xs text-slate-500 font-bold uppercase">Items</label>
                                        
                                        {/* Add Item Search */}
                                        <div className="relative w-64 z-20">
                                            <input 
                                                type="text" 
                                                placeholder="Add product..." 
                                                value={itemSearchTerm}
                                                onChange={(e) => { setItemSearchTerm(e.target.value); setShowItemSuggestions(true); }}
                                                className="w-full bg-dark-bg border border-dark-border text-xs px-3 py-1.5 rounded-lg text-white focus:border-neon-blue"
                                            />
                                            {showItemSuggestions && itemSearchTerm && (
                                                <div className="absolute top-full left-0 w-full bg-dark-card border border-dark-border mt-1 rounded-lg max-h-40 overflow-y-auto shadow-xl">
                                                    {filteredSuggestions.map(item => (
                                                        <div key={item.id} onClick={() => addItemToEdit(item)} className="p-2 hover:bg-white/10 cursor-pointer text-xs text-white truncate">
                                                            {item.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-dark-card text-slate-400">
                                                <tr>
                                                    <th className="p-3 text-left">Product</th>
                                                    <th className="p-3 text-right w-24">Qty</th>
                                                    <th className="p-3 text-right w-32">Unit</th>
                                                    <th className="p-3 text-center w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-dark-border">
                                                {editingRecord.items.map((item, idx) => (
                                                    <tr key={idx} className="group">
                                                        <td className="p-3">
                                                            <div className="text-white">{item.name}</div>
                                                            <div className="text-xs text-slate-500">{item.sku}</div>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <input type="number" min="1" value={item.orderQuantity} 
                                                                onChange={(e) => updateEditItem(item.id, 'qty', e.target.value)}
                                                                className="w-16 bg-dark-card border border-dark-border text-center rounded text-white px-1 py-1 text-xs" />
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <select value={item.selectedUnit.name} 
                                                                onChange={(e) => updateEditItem(item.id, 'unit', e.target.value)}
                                                                className="w-24 bg-dark-card border border-dark-border text-white text-xs px-1 py-1 rounded">
                                                                {UNITS.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <button onClick={() => removeEditItem(item.id)} className="text-slate-600 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* --- VIEW ONLY --- */
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-dark-bg/50 p-4 rounded-xl border border-dark-border">
                                     <div className="space-y-2">
                                        <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2"><Hash className="w-3 h-3" /> Reference / PO</label>
                                        <div className="text-white font-medium text-lg">{selectedRecord.referenceNumber || "-"}</div>
                                     </div>
                                     <div className="space-y-2">
                                        <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2"><FileText className="w-3 h-3" /> Notes / Description</label>
                                        <div className="text-slate-300">{selectedRecord.notes || "-"}</div>
                                     </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4">Items Snapshot</h3>
                                    <div className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-dark-card text-slate-400">
                                                <tr>
                                                    <th className="p-3 text-left">Item Name</th>
                                                    <th className="p-3 text-right">Qty</th>
                                                    <th className="p-3 text-right">Unit</th>
                                                    <th className="p-3 text-right">Total Base</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-dark-border">
                                                {selectedRecord.items.map((item, idx) => (
                                                    <tr key={idx} className="text-slate-300">
                                                        <td className="p-3">
                                                            <div>{item.name}</div>
                                                            <div className="text-xs text-slate-500 font-mono">{item.sku}</div>
                                                        </td>
                                                        <td className="p-3 text-right font-medium text-white">{item.orderQuantity}</td>
                                                        <td className="p-3 text-right">{item.selectedUnit.name}</td>
                                                        <td className="p-3 text-right text-slate-500">{item.orderQuantity * item.selectedUnit.ratio}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {selectedRecord.photos.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4">Attachments</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-2">
                                            {selectedRecord.photos.map((photo, idx) => (
                                                <div key={idx} className="group relative w-32 h-32 rounded-xl overflow-hidden border border-dark-border cursor-pointer" onClick={() => setShowPhotoPreview(photo)}>
                                                    <img src={photo} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Eye className="text-white w-6 h-6" /></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-dark-border bg-dark-bg/50 flex justify-between items-center">
                        <button onClick={handleDelete} className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" /> Delete Record
                        </button>
                        <div className="flex gap-3">
                            {isEditing ? (
                                <>
                                    <button onClick={() => { setIsEditing(false); setEditingRecord(null); }} className="px-6 py-2 rounded-lg text-slate-300 hover:text-white">Cancel</button>
                                    <button onClick={handleSaveEdit} className="px-6 py-2 rounded-lg bg-neon-blue text-black font-bold hover:bg-blue-400 transition-colors flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save & Sync Stock
                                    </button>
                                </>
                            ) : (
                                <button onClick={startEditing} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-dark-card border border-dark-border text-white hover:bg-white/10 transition-colors">
                                    <Edit2 className="w-4 h-4" /> Edit Record
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Photo Preview Modal */}
        {showPhotoPreview && (
            <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowPhotoPreview(null)}>
                <button className="absolute top-6 right-6 text-white hover:text-neon-pink"><X className="w-8 h-8" /></button>
                <img src={showPhotoPreview} className="max-w-full max-h-full rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]" />
            </div>
        )}
    </div>
  );
};

export default HistoryModule;