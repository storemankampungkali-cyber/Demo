import React, { useState, useRef, useMemo, useEffect } from 'react';
import { InventoryItem, TransactionRecord } from '../types';
import { Search, Filter, MoreHorizontal, Plus, Download, FileSpreadsheet, X, Calendar, ArrowUpRight, ArrowDownLeft, TrendingUp, History } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryListProps {
  items: InventoryItem[];
  history: TransactionRecord[];
  onAddItems: (items: InventoryItem[]) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, history, onAddItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Stock Card State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockStartDate, setStockStartDate] = useState('');
  const [stockEndDate, setStockEndDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset filter dates when a new item is selected
  useEffect(() => {
      if (selectedItem) {
          setStockStartDate('');
          setStockEndDate('');
      }
  }, [selectedItem]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'Low Stock': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Out of Stock': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  // --- BULK IMPORT LOGIC ---
  const handleDownloadTemplate = () => {
      const headers = [
          { A: 'Name', B: 'SKU', C: 'Category', D: 'Price', E: 'Quantity', F: 'Status (In Stock/Low Stock)' }
      ];
      const ws = XLSX.utils.json_to_sheet(headers, { header: ["A", "B", "C", "D", "E", "F"], skipHeader: true });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "Inventory_Master_Template.xlsx");
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

          // Map and validate
          const newItems: InventoryItem[] = data.map((row: any) => ({
              id: `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              name: row['Name'] || 'Unknown Item',
              sku: row['SKU'] || `GEN-${Math.floor(Math.random()*10000)}`,
              category: row['Category'] || 'General',
              price: Number(row['Price']) || 0,
              quantity: Number(row['Quantity']) || 0,
              status: row['Status'] || 'In Stock',
              lastUpdated: new Date().toISOString().split('T')[0]
          })).filter((i: InventoryItem) => i.name !== 'Unknown Item'); // Simple validation

          if (newItems.length > 0) {
              onAddItems(newItems);
          }
      };
      reader.readAsBinaryString(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- STOCK CARD LOGIC ---
  const stockCardData = useMemo(() => {
      if (!selectedItem) return null;

      // 1. Get ALL transactions involving this item (Full History)
      const allRelevantTransactions = history.flatMap(trx => {
          const itemInTrx = trx.items.find(i => i.id === selectedItem.id);
          if (!itemInTrx) return [];
          
          return [{
              date: trx.date,
              id: trx.id,
              type: trx.type,
              ref: trx.referenceNumber,
              notes: trx.notes,
              qtyChange: itemInTrx.orderQuantity * itemInTrx.selectedUnit.ratio * (trx.type === 'IN' ? 1 : -1)
          }];
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort Newest First

      // 2. Calculate Full Ledger (balances for every transaction in history)
      // Start with Current Stock, subtract recent transactions to find previous states
      let runningBalance = selectedItem.quantity;
      const fullLedger = allRelevantTransactions.map(trx => {
          const balanceAfter = runningBalance;
          const balanceBefore = runningBalance - trx.qtyChange;
          
          const entry = {
              ...trx,
              balance: balanceAfter
          };
          
          runningBalance = balanceBefore;
          return entry;
      });

      const initialStockAllTime = runningBalance; // Stock before any recorded transaction

      // 3. Apply Date Filter
      const visibleLedger = fullLedger.filter(entry => {
          const entryDate = entry.date;
          if (stockStartDate && entryDate < stockStartDate) return false;
          if (stockEndDate && entryDate > stockEndDate) return false;
          return true;
      });

      // 4. Calculate Summary Stats for the VISIBLE period
      const totalIn = visibleLedger.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.qtyChange, 0);
      const totalOut = visibleLedger.filter(t => t.type === 'OUT').reduce((acc, t) => acc + Math.abs(t.qtyChange), 0);

      // 5. Calculate Period Opening Balance
      // Find the most recent transaction BEFORE the start date. 
      // If start date is empty, it's the initialStockAllTime.
      let periodStartBalance = initialStockAllTime;
      if (stockStartDate) {
          const prevTrx = fullLedger.find(t => t.date < stockStartDate);
          if (prevTrx) {
              periodStartBalance = prevTrx.balance;
          } else {
              // If we didn't find any transaction older than start date, check if all transactions are newer.
              // Since fullLedger is desc, if the last item is >= stockStartDate, then balance is initialStockAllTime.
              // Which is covered by default initialization.
          }
      }

      // 6. Calculate Period Ending Balance
      // Usually the balance of the newest transaction in the filtered list.
      // If list is empty, we need to find the balance at the end of the requested period.
      let periodEndBalance = selectedItem.quantity; // Default to current
      
      if (stockEndDate) {
          // Find first transaction <= endDate
          const lastTrxInPeriod = fullLedger.find(t => t.date <= stockEndDate);
          if (lastTrxInPeriod) {
              periodEndBalance = lastTrxInPeriod.balance;
          } else {
              // If no transaction is <= endDate (meaning all transactions are in the future relative to endDate)
              periodEndBalance = initialStockAllTime;
          }
      } else {
          // No end date filter -> End balance is current real stock
          periodEndBalance = selectedItem.quantity;
      }

      return {
          periodStartBalance,
          totalIn,
          totalOut,
          periodEndBalance,
          ledger: visibleLedger
      };
  }, [selectedItem, history, stockStartDate, stockEndDate]);

  return (
    <div className="space-y-6 animate-fade-in relative">
       {/* Top Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Management</h1>
          <p className="text-slate-400 mt-1">Manage products, stock levels, and pricing.</p>
        </div>
        <div className="flex gap-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
            />
            <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2.5 bg-dark-card border border-dark-border hover:bg-dark-hover text-slate-300 hover:text-white font-medium rounded-xl transition-all"
            >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Template</span>
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-dark-card border border-green-900 hover:bg-green-900/20 text-green-400 font-medium rounded-xl transition-all"
            >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden md:inline">Import Bulk</span>
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-neon-purple to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-purple-900/40 transition-all">
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Add Product</span>
            </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by product name or SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal/50 transition-all"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-dark-bg border border-dark-border text-slate-300 rounded-lg hover:text-white hover:border-slate-500 transition-colors w-full md:w-auto justify-center">
              <Filter className="w-4 h-4" />
              <span>{filterStatus}</span>
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-20">
              {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(status => (
                <div 
                  key={status} 
                  onClick={() => setFilterStatus(status)}
                  className="px-4 py-2 hover:bg-dark-hover text-slate-300 hover:text-white cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                >
                  {status}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-dark-bg/50 border-b border-dark-border text-slate-400 uppercase text-xs tracking-wider">
                <th className="p-4 font-semibold">Product Name</th>
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredItems.map((item) => (
                <tr 
                    key={item.id} 
                    className="hover:bg-dark-hover/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                >
                  <td className="p-4">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-xs text-slate-500">Updated: {item.lastUpdated}</div>
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-sm">{item.sku}</td>
                  <td className="p-4 text-slate-300">{item.category}</td>
                  <td className="p-4 text-white font-medium">${item.price.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200">{item.quantity}</span>
                      <div className="w-16 h-1.5 bg-dark-bg rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.quantity < 20 ? 'bg-red-500' : 'bg-neon-teal'}`} 
                          style={{ width: `${Math.min(100, (item.quantity / 200) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="p-2 hover:bg-dark-bg rounded-lg text-slate-500 hover:text-neon-blue transition-colors">
                      <History className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No items found matching your criteria.
          </div>
        )}
      </div>

      {/* STOCK CARD MODAL */}
      {selectedItem && stockCardData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-dark-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-dark-card z-10">
                      <div>
                          <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-bold text-white">Stock Card</h2>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(selectedItem.status)}`}>
                                  {selectedItem.status}
                              </span>
                          </div>
                          <p className="text-slate-400 mt-1 font-mono text-sm">{selectedItem.name} • {selectedItem.sku}</p>
                      </div>

                      {/* Date Filter Controls */}
                      <div className="flex gap-2 items-center bg-dark-bg/50 p-1.5 rounded-xl border border-dark-border">
                          <div className="relative group">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Calendar className="w-3 h-3"/></span>
                              <input 
                                  type="date" 
                                  value={stockStartDate} 
                                  onChange={e => setStockStartDate(e.target.value)} 
                                  className="bg-transparent text-white text-xs pl-8 pr-2 py-1.5 outline-none rounded-lg focus:bg-white/5 transition-colors scheme-dark"
                                  title="Start Date"
                              />
                          </div>
                          <span className="text-slate-500 font-bold">-</span>
                          <div className="relative group">
                              <input 
                                  type="date" 
                                  value={stockEndDate} 
                                  onChange={e => setStockEndDate(e.target.value)} 
                                  className="bg-transparent text-white text-xs pl-3 pr-2 py-1.5 outline-none rounded-lg focus:bg-white/5 transition-colors scheme-dark"
                                  title="End Date"
                              />
                          </div>
                          {(stockStartDate || stockEndDate) && (
                              <button 
                                onClick={() => {setStockStartDate(''); setStockEndDate('')}}
                                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Clear Filters"
                              >
                                  <X className="w-3 h-3" />
                              </button>
                          )}
                      </div>

                      <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 md:static text-slate-500 hover:text-white transition-colors">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  <div className="p-6 space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="bg-dark-bg border border-dark-border p-4 rounded-xl">
                              <div className="text-xs text-slate-500 uppercase font-bold mb-1">Opening Balance</div>
                              <div className="text-2xl font-mono text-slate-300">{stockCardData.periodStartBalance}</div>
                          </div>
                          <div className="bg-dark-bg border border-dark-border p-4 rounded-xl">
                              <div className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1 text-green-400">
                                  <ArrowDownLeft className="w-3 h-3" /> Total In
                              </div>
                              <div className="text-2xl font-mono text-green-400">+{stockCardData.totalIn}</div>
                          </div>
                          <div className="bg-dark-bg border border-dark-border p-4 rounded-xl">
                              <div className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1 text-red-400">
                                  <ArrowUpRight className="w-3 h-3" /> Total Out
                              </div>
                              <div className="text-2xl font-mono text-red-400">-{stockCardData.totalOut}</div>
                          </div>
                          <div className="bg-neon-teal/10 border border-neon-teal/50 p-4 rounded-xl">
                              <div className="text-xs text-neon-teal uppercase font-bold mb-1">Closing Balance</div>
                              <div className="text-2xl font-mono text-white">{stockCardData.periodEndBalance}</div>
                          </div>
                      </div>

                      {/* Ledger Table */}
                      <div>
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-neon-purple" /> Stock Movements
                          </h3>
                          <div className="bg-dark-bg border border-dark-border rounded-lg overflow-hidden">
                              <table className="w-full text-sm text-left">
                                  <thead className="bg-dark-card text-slate-400 uppercase text-xs">
                                      <tr>
                                          <th className="p-3">Date</th>
                                          <th className="p-3">Ref</th>
                                          <th className="p-3">Description</th>
                                          <th className="p-3 text-right">In/Out</th>
                                          <th className="p-3 text-right">Balance</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-dark-border text-slate-300">
                                      {stockCardData.ledger.length > 0 ? (
                                          stockCardData.ledger.map((entry, idx) => (
                                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                  <td className="p-3 font-mono text-xs">{entry.date}</td>
                                                  <td className="p-3 text-xs">{entry.ref || '-'}</td>
                                                  <td className="p-3 truncate max-w-[200px]">{entry.notes || '-'}</td>
                                                  <td className={`p-3 text-right font-bold ${entry.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
                                                      {entry.type === 'IN' ? '+' : ''}{entry.qtyChange}
                                                  </td>
                                                  <td className="p-3 text-right font-mono text-white bg-white/5">
                                                      {entry.balance}
                                                  </td>
                                              </tr>
                                          ))
                                      ) : (
                                          <tr>
                                              <td colSpan={5} className="p-8 text-center text-slate-500">No recorded movements in this period.</td>
                                          </tr>
                                      )}
                                      {/* Opening Balance Row for Visual Clarity */}
                                      <tr className="bg-dark-card/50">
                                          <td colSpan={3} className="p-3 text-slate-500 italic text-right text-xs">Opening Balance ({stockStartDate || 'All Time'})</td>
                                          <td className="p-3"></td>
                                          <td className="p-3 text-right font-mono text-slate-500">{stockCardData.periodStartBalance}</td>
                                      </tr>
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default InventoryList;