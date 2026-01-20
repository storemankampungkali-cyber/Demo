import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, CartItem, UnitDefinition, TransactionRecord } from '../types';
import { Search, Trash2, Calendar, FileSpreadsheet, ShoppingCart, ChevronDown, Camera, ArrowDownLeft, ArrowUpRight, X, Download, Edit2, FileText, Hash, AlignLeft, Image as ImageIcon } from 'lucide-react';

interface TransactionModuleProps {
  items: InventoryItem[];
  onTransactionComplete: (record: TransactionRecord) => void;
}

// Mock Unit Conversions
const UNITS: UnitDefinition[] = [
  { name: 'Pcs', ratio: 1 },
  { name: 'Dozen (12x)', ratio: 12 },
  { name: 'Box (24x)', ratio: 24 },
  { name: 'Crate (50x)', ratio: 50 },
];

type TransactionType = 'IN' | 'OUT';

// Helper Component for Editable Fields
const CartItemRow: React.FC<{
  item: CartItem;
  themeColor: string;
  borderColor: string;
  autoFocusQty?: boolean;
  onUpdateQty: (val: number) => void;
  onUpdateUnit: (val: string) => void;
  onRemove: () => void;
  onReturnToSearch: () => void;
}> = ({ item, themeColor, borderColor, autoFocusQty, onUpdateQty, onUpdateUnit, onRemove, onReturnToSearch }) => {
  const [editMode, setEditMode] = useState<'NONE' | 'QTY' | 'UNIT'>('NONE');
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const unitSelectRef = useRef<HTMLSelectElement>(null);

  // Trigger auto-focus on mount if this is the newly added item
  useEffect(() => {
    if (autoFocusQty) {
      setEditMode('QTY');
    }
  }, [autoFocusQty]);

  useEffect(() => {
    if (editMode === 'QTY' && qtyInputRef.current) {
      qtyInputRef.current.focus();
      qtyInputRef.current.select(); // Auto select value for easy overwriting
    }
    if (editMode === 'UNIT' && unitSelectRef.current) {
      unitSelectRef.current.focus();
    }
  }, [editMode]);

  const handleBlur = () => {
    setEditMode('NONE');
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent default behavior (like increment/decrement for ArrowDown)
      setEditMode('NONE');
      onReturnToSearch(); // Jump back to search bar
    }
  };

  const handleUnitKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') setEditMode('NONE');
  }

  return (
    <div className={`bg-dark-card border border-dark-border p-3 rounded-xl flex items-center justify-between group hover:border-slate-600 transition-colors ${editMode !== 'NONE' ? `border-${themeColor.replace('text-', '')}` : ''}`}>
      {/* Product Info */}
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="font-medium text-white truncate">{item.name}</h4>
        <p className="text-xs text-slate-500 font-mono">{item.sku}</p>
      </div>

      {/* Editable Controls */}
      <div className="flex items-center gap-4">
        
        {/* Quantity Field */}
        <div className="flex flex-col items-end w-16">
            <span className="text-[10px] text-slate-500 uppercase">Qty</span>
            {editMode === 'QTY' ? (
                <input
                    ref={qtyInputRef}
                    type="number"
                    min="1"
                    className={`w-16 bg-dark-bg border ${borderColor} text-white text-right px-1 py-0.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-${themeColor.replace('text-', '')}`}
                    value={item.orderQuantity}
                    onChange={(e) => onUpdateQty(parseInt(e.target.value) || 0)}
                    onBlur={handleBlur}
                    onKeyDown={handleQtyKeyDown}
                />
            ) : (
                <span 
                    onClick={() => setEditMode('QTY')}
                    className={`text-sm font-bold ${themeColor} cursor-pointer hover:underline decoration-dashed underline-offset-4`}
                    title="Click to edit quantity"
                >
                    {item.orderQuantity}
                </span>
            )}
        </div>

        {/* Unit Field */}
        <div className="flex flex-col items-end w-24">
            <span className="text-[10px] text-slate-500 uppercase">Unit</span>
            {editMode === 'UNIT' ? (
                <select
                    ref={unitSelectRef}
                    className={`w-24 bg-dark-bg border ${borderColor} text-white text-xs px-1 py-1 rounded focus:outline-none`}
                    value={item.selectedUnit.name}
                    onChange={(e) => {
                        onUpdateUnit(e.target.value);
                        handleBlur();
                    }}
                    onBlur={handleBlur}
                    onKeyDown={handleUnitKeyDown}
                >
                    {UNITS.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                </select>
            ) : (
                <span 
                    onClick={() => setEditMode('UNIT')}
                    className="text-sm text-slate-300 cursor-pointer hover:text-white border-b border-dashed border-slate-600 hover:border-white transition-colors truncate max-w-full text-right"
                    title="Click to edit unit"
                >
                    {item.selectedUnit.name}
                </span>
            )}
        </div>

        {/* Total Calculation Preview (Small) */}
        <div className="hidden sm:flex flex-col items-end w-16 border-l border-dark-border pl-4">
            <span className="text-[10px] text-slate-500 uppercase">Total</span>
            <span className="text-xs font-mono text-slate-400">
                {item.orderQuantity * item.selectedUnit.ratio}
            </span>
        </div>

        {/* Delete Action */}
        <button 
            onClick={onRemove}
            className="text-slate-600 hover:text-red-400 transition-colors p-1"
            title="Remove item"
        >
            <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const TransactionModule: React.FC<TransactionModuleProps> = ({ items, onTransactionComplete }) => {
  const [transactionType, setTransactionType] = useState<TransactionType>('OUT');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Transaction Header Fields
  const [deliveryNote, setDeliveryNote] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [description, setDescription] = useState('');

  // Smart Unit Memory
  const [unitPreferences, setUnitPreferences] = useState<Record<string, string>>({});

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items for Autocomplete
  const searchResults = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside search container
      if (searchRef.current && searchRef.current.parentElement?.contains(event.target as Node)) {
        return;
      }
      setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addToCart = (item: InventoryItem) => {
    const newCartId = crypto.randomUUID();
    
    setCart(prev => {
      // Preferred Unit Logic
      const preferredUnitName = unitPreferences[item.id] || 'Pcs';
      const preferredUnit = UNITS.find(u => u.name === preferredUnitName) || UNITS[0];
      
      return [{ ...item, cartId: newCartId, selectedUnit: preferredUnit, orderQuantity: 1 }, ...prev];
    });

    setLastAddedId(newCartId);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        // Select the first item automatically
        addToCart(searchResults[0]);
      }
    }
  };

  const handleReturnToSearch = () => {
    setLastAddedId(null); // Clear last added so it doesn't re-focus on render
    searchRef.current?.focus();
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, newQty: number) => {
    setCart(prev => prev.map(item => 
      item.cartId === cartId ? { ...item, orderQuantity: Math.max(1, newQty) } : item
    ));
  };

  const updateUnit = (cartId: string, unitName: string) => {
    const unit = UNITS.find(u => u.name === unitName) || UNITS[0];
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        // Learn User Habit: Update preference for this item ID
        setUnitPreferences(prefs => ({ ...prefs, [item.id]: unitName }));
        return { ...item, selectedUnit: unit };
      }
      return item;
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files).map(file => URL.createObjectURL(file as Blob));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmTransaction = () => {
    if (cart.length === 0) return;

    const totalUnits = calculateTotalUnits();
    const reference = transactionType === 'IN' 
        ? (deliveryNote || poNumber || `REF-${Date.now()}`) 
        : (description || `OUT-${Date.now()}`);

    const newRecord: TransactionRecord = {
        id: `TRX-${Date.now()}`,
        date: date,
        type: transactionType,
        items: [...cart], // Snapshot
        totalUnits,
        referenceNumber: reference,
        notes: description,
        photos: [...photos]
    };

    onTransactionComplete(newRecord);

    // Reset Form
    setCart([]);
    setDeliveryNote('');
    setPoNumber('');
    setDescription('');
    setPhotos([]);
    setSearchTerm('');
  };

  const downloadTemplate = () => {
    const headers = ['SKU', 'Product Name', 'Quantity', 'Unit (Pcs/Dozen/Box)'];
    const rows = [
        ['QP-X1-001', 'Quantum Processor X1', '10', 'Box'],
        ['NL-INT-05', 'Neural Link Interface', '5', 'Pcs']
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotalUnits = () => {
    return cart.reduce((acc, item) => acc + (item.selectedUnit.ratio * item.orderQuantity), 0);
  };

  const isStockIn = transactionType === 'IN';
  const themeColor = isStockIn ? 'text-neon-teal' : 'text-neon-pink';
  const borderColor = isStockIn ? 'border-neon-teal' : 'border-neon-pink';
  const bgColor = isStockIn ? 'bg-neon-teal' : 'bg-neon-pink';
  const glowShadow = isStockIn ? 'shadow-[0_0_15px_rgba(0,242,234,0.3)]' : 'shadow-[0_0_15px_rgba(255,0,128,0.3)]';

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 animate-fade-in">
      
      {/* LEFT COLUMN: Input & Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Stock Control</h1>
                <p className="text-slate-400 mt-1">Manage inventory flow and unit conversions.</p>
            </div>
            
            {/* Transaction Type Toggle */}
            <div className="flex bg-dark-card border border-dark-border p-1 rounded-xl">
                <button 
                    onClick={() => setTransactionType('IN')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${isStockIn ? 'bg-neon-teal text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <ArrowDownLeft className="w-4 h-4" />
                    Stock In
                </button>
                <button 
                    onClick={() => setTransactionType('OUT')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${!isStockIn ? 'bg-neon-pink text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Stock Out
                </button>
            </div>
        </div>

        {/* Controls: Date & Import */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-48">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-dark-card border border-dark-border text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-neon-teal transition-all scheme-dark"
            />
          </div>
          
          <div className="flex flex-1 gap-2">
            <button 
                onClick={downloadTemplate}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-card border border-dark-border text-slate-300 rounded-xl hover:text-white hover:border-slate-500 transition-all flex-1"
            >
                <Download className="w-5 h-5 text-blue-400" />
                <span className="hidden md:inline">Template</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 bg-dark-card border border-dark-border text-slate-300 rounded-xl hover:text-white hover:border-neon-teal/50 hover:bg-neon-teal/10 transition-all flex-1">
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
                <span className="hidden md:inline">Bulk Import</span>
            </button>
          </div>
        </div>

        {/* Transaction Detail Fields (Dynamic based on Type) */}
        <div className="bg-dark-card/50 border border-dark-border p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-2 mb-2 text-white font-medium">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Transaction Details</span>
            </div>
            
            {isStockIn && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                            <Hash className="w-3 h-3" /> Delivery Note (Surat Jalan)
                        </label>
                        <input
                            type="text"
                            value={deliveryNote}
                            onChange={(e) => setDeliveryNote(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal/50 transition-all placeholder-slate-600 text-sm"
                            placeholder="e.g. SJ-2023-001"
                        />
                    </div>
                    <div className="space-y-1.5">
                         <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                            <Hash className="w-3 h-3" /> PO Number
                        </label>
                        <input
                            type="text"
                            value={poNumber}
                            onChange={(e) => setPoNumber(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal/50 transition-all placeholder-slate-600 text-sm"
                            placeholder="e.g. PO-8821"
                        />
                    </div>
                </div>
            )}
            
            <div className="space-y-1.5">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <AlignLeft className="w-3 h-3" /> {isStockIn ? 'Notes / Description' : 'Reason / Description'}
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`w-full bg-dark-bg border border-dark-border text-white px-4 py-2.5 rounded-lg focus:outline-none focus:${borderColor} focus:ring-1 focus:ring-opacity-50 transition-all placeholder-slate-600 text-sm resize-none h-20`}
                    placeholder={isStockIn ? "Additional receiving notes, supplier details..." : "Reason for dispatch, destination, or recipient..."}
                />
            </div>

            {/* Photo Upload Zone (Moved Here) */}
            <div className="space-y-2 pt-2 border-t border-dark-border/50">
                <label className="text-xs text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Proof / Attachments
                </label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed border-dark-border bg-dark-bg/50 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-500 hover:bg-white/5 cursor-pointer transition-all ${photos.length > 0 ? 'mb-2' : ''}`}
                 >
                     <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                     />
                     <Camera className="w-6 h-6 mb-2 text-slate-400" />
                     <span className="text-xs font-medium">Click to upload photos</span>
                 </div>
                 
                 {/* Photo Previews */}
                 {photos.length > 0 && (
                     <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {photos.map((url, idx) => (
                            <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-dark-border group">
                                <img src={url} alt="proof" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => removePhoto(idx)}
                                    className="absolute top-0 right-0 bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-lg"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                     </div>
                 )}
            </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Cart System */}
      <div className="w-full lg:w-[500px] flex flex-col gap-4">
        
        {/* Rapid Search Input (Moved Here) */}
        <div className="relative z-20">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className={`h-5 w-5 ${themeColor} transition-colors`} />
                </div>
                <input
                    ref={searchRef}
                    type="text"
                    className={`block w-full pl-12 pr-4 py-4 bg-dark-card border border-dark-border rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all shadow-xl focus:${borderColor} focus:ring-${isStockIn ? 'neon-teal' : 'neon-pink'}`}
                    placeholder={`Type product & Enter to add...`}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleSearchKeyDown}
                    autoComplete="off"
                />
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && searchTerm && (
                <div className="absolute mt-2 w-full bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto glass-panel">
                    {searchResults.length > 0 ? (
                        searchResults.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className={`p-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-dark-border/50 last:border-0 transition-colors group`}
                        >
                            <div>
                            <div className="font-medium text-white group-hover:text-neon-blue transition-colors">{item.name}</div>
                            <div className="text-xs text-slate-500 font-mono">SKU: {item.sku}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-slate-300 font-medium">{item.category}</div>
                                <div className={`text-xs ${item.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                Current: {item.quantity} units
                                </div>
                            </div>
                        </div>
                        ))
                    ) : (
                        <div className="p-4 text-slate-500 text-center">No products found.</div>
                    )}
                </div>
            )}
        </div>

        <div className="bg-dark-card border border-dark-border rounded-2xl flex flex-col shadow-2xl overflow-hidden relative flex-1">
            {/* Cart Header */}
            <div className={`p-5 border-b border-dark-border bg-dark-bg/50 backdrop-blur-md flex justify-between items-center relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${bgColor}`}></div>
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isStockIn ? 'bg-neon-teal/20 text-neon-teal' : 'bg-neon-pink/20 text-neon-pink'}`}>
                    <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg text-white">
                    {isStockIn ? 'Incoming List' : 'Outgoing List'}
                </span>
            </div>
            <div className="text-sm text-slate-400">{cart.length} Items</div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-dark-card/50">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                    <ShoppingCart className="w-16 h-16 mb-4" />
                    <p>List is empty</p>
                    <p className="text-xs mt-1">Scan or search above to add items</p>
                </div>
            ) : (
                cart.map(item => (
                    <CartItemRow 
                        key={item.cartId}
                        item={item}
                        themeColor={themeColor}
                        borderColor={borderColor}
                        autoFocusQty={item.cartId === lastAddedId}
                        onUpdateQty={(val) => updateQuantity(item.cartId, val)}
                        onUpdateUnit={(val) => updateUnit(item.cartId, val)}
                        onRemove={() => removeFromCart(item.cartId)}
                        onReturnToSearch={handleReturnToSearch}
                    />
                ))
            )}
            </div>

            {/* Footer: Totals & Actions */}
            <div className="p-5 bg-dark-bg border-t border-dark-border">
                <div className="flex justify-between items-center mb-4 p-3 bg-dark-card rounded-lg border border-dark-border/50">
                    <span className="text-slate-400 text-sm">Total Batch Quantity (Base Units)</span>
                    <span className="text-2xl font-bold text-white tracking-tight">
                        {calculateTotalUnits()}
                    </span>
                </div>
                
                <button 
                    onClick={handleConfirmTransaction}
                    className={`w-full py-4 ${bgColor} rounded-xl font-bold ${isStockIn ? 'text-black' : 'text-white'} ${glowShadow} hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed`} 
                    disabled={cart.length === 0}
                >
                    {isStockIn ? 'Confirm Restock' : 'Confirm Dispatch'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModule;