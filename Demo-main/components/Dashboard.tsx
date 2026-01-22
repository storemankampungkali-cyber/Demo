import React, { useMemo, useState } from 'react';
import { InventoryItem, KPIMetric, PlaylistItem } from '../types';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Youtube,
  Play,
  Plus,
  Trash2,
  Music
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface DashboardProps {
  items: InventoryItem[];
  // Props for Media Player Management
  playlist: PlaylistItem[];
  onAddToPlaylist: (url: string) => void;
  onRemoveFromPlaylist: (id: string) => void;
  onPlayVideo: (videoId: string) => void;
  currentVideoId: string | null;
}

const KPICard: React.FC<{ metric: KPIMetric }> = ({ metric }) => {
  const getGradient = (color: string) => {
    switch (color) {
      case 'teal': return 'from-teal-500/20 via-teal-900/10 to-transparent border-teal-500/30';
      case 'purple': return 'from-purple-500/20 via-purple-900/10 to-transparent border-purple-500/30';
      case 'orange': return 'from-orange-500/20 via-orange-900/10 to-transparent border-orange-500/30';
      case 'pink': return 'from-pink-500/20 via-pink-900/10 to-transparent border-pink-500/30';
      default: return 'from-slate-800 to-transparent border-slate-700';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
        case 'teal': return 'text-neon-teal bg-teal-500/20';
        case 'purple': return 'text-neon-purple bg-purple-500/20';
        case 'orange': return 'text-neon-orange bg-orange-500/20';
        case 'pink': return 'text-neon-pink bg-pink-500/20';
        default: return 'text-white';
    }
  }

  const IconMap: Record<string, any> = {
    users: Users,
    trending: TrendingUp,
    alert: AlertTriangle,
    dollar: DollarSign
  };

  const Icon = IconMap[metric.iconName] || Activity;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02]
      bg-gradient-to-br ${getGradient(metric.color)}
    `}>
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${getIconColor(metric.color)} backdrop-blur-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
          metric.trend === 'up' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
        }`}>
          {metric.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(metric.change)}%
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{metric.title}</h3>
        <p className="text-2xl lg:text-3xl font-bold text-white mt-1 tracking-tight">
            {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
        </p>
      </div>

      {/* Decorative Glow */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 bg-${metric.color === 'teal' ? 'teal-500' : metric.color === 'purple' ? 'purple-600' : metric.color === 'orange' ? 'orange-500' : 'pink-600'}`} />
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ items, playlist, onAddToPlaylist, onRemoveFromPlaylist, onPlayVideo, currentVideoId }) => {
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const stats = useMemo(() => {
    const totalVal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const lowStock = items.filter(i => i.status === 'Low Stock' || i.quantity < 20).length;
    const activeItems = items.filter(i => i.status === 'In Stock').length;
    
    return { totalVal, lowStock, activeItems, total: items.length };
  }, [items]);

  const kpis: KPIMetric[] = [
    { title: 'Total Inventory Value', value: `$${(stats.totalVal / 1000).toFixed(1)}k`, change: 12.5, trend: 'up', color: 'pink', iconName: 'dollar' },
    { title: 'Active Products', value: stats.activeItems, change: 4.2, trend: 'up', color: 'teal', iconName: 'trending' },
    { title: 'Low Stock Alerts', value: stats.lowStock, change: -2.5, trend: 'down', color: 'orange', iconName: 'alert' },
    { title: 'Total SKUs', value: stats.total, change: 0.8, trend: 'up', color: 'purple', iconName: 'users' },
  ];

  // Mock data for charts
  const chartData = [
    { name: 'Jan', stock: 4000, sales: 2400 },
    { name: 'Feb', stock: 3000, sales: 1398 },
    { name: 'Mar', stock: 2000, sales: 9800 },
    { name: 'Apr', stock: 2780, sales: 3908 },
    { name: 'May', stock: 1890, sales: 4800 },
    { name: 'Jun', stock: 2390, sales: 3800 },
    { name: 'Jul', stock: 3490, sales: 4300 },
  ];

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    items.forEach(i => {
      cats[i.category] = (cats[i.category] || 0) + i.quantity;
    });
    return Object.keys(cats).map(k => ({ name: k, value: cats[k] })).slice(0, 5);
  }, [items]);

  const handleAddVideo = (e: React.FormEvent) => {
      e.preventDefault();
      if(newVideoUrl) {
          onAddToPlaylist(newVideoUrl);
          setNewVideoUrl('');
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time inventory overview & performance</p>
        </div>
        <div className="hidden md:flex gap-3">
          <button className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-slate-300 hover:text-white text-sm">Last 30 Days</button>
          <button className="px-4 py-2 bg-neon-teal text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors text-sm shadow-[0_0_15px_rgba(0,242,234,0.4)]">Export Report</button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => <KPICard key={idx} metric={kpi} />)}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-2xl p-6 glass-panel relative">
          <h3 className="text-lg font-semibold text-white mb-6">Stock vs Sales Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b94dff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#b94dff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a324a" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161b28', borderColor: '#2a324a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#b94dff" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="stock" stroke="#00f2ea" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Category Chart & Media Player */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Category Chart */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 glass-panel h-[320px]">
                <h3 className="text-lg font-semibold text-white mb-6">Category Distribution</h3>
                <div className="h-full w-full pb-8">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={categoryData} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#2a324a" />
                        <XAxis type="number" stroke="#64748b" hide />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
                        <Tooltip 
                        cursor={{fill: '#1e2436'}}
                        contentStyle={{ backgroundColor: '#161b28', borderColor: '#2a324a' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00f2ea' : '#b94dff'} />
                            ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Media / Playlist Card */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-0 overflow-hidden glass-panel flex flex-col h-[350px]">
                <div className="p-5 bg-gradient-to-r from-red-900/40 to-dark-card border-b border-red-500/20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-white p-1.5 rounded-lg">
                            <Youtube className="w-5 h-5 text-red-600 fill-current" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Workstation FM</h3>
                            <p className="text-xs text-slate-400">Lo-Fi / Focus Playlist</p>
                        </div>
                    </div>
                    {currentVideoId && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 rounded text-red-400 text-xs animate-pulse font-medium">
                            <Activity className="w-3 h-3" /> Playing
                        </div>
                    )}
                </div>

                <div className="p-4 border-b border-dark-border/50">
                    <form onSubmit={handleAddVideo} className="relative">
                        <input 
                            type="text" 
                            placeholder="Paste YouTube Link..." 
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            className="w-full bg-dark-bg border border-dark-border text-xs text-white pl-3 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                        />
                        <button 
                            type="submit"
                            className="absolute right-1 top-1 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                            disabled={!newVideoUrl}
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {playlist.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <Music className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-xs">Playlist empty</p>
                        </div>
                    ) : (
                        playlist.map((video) => (
                            <div 
                                key={video.id}
                                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${currentVideoId === video.videoId ? 'bg-red-500/10 border border-red-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div 
                                    className="flex items-center gap-3 flex-1 min-w-0"
                                    onClick={() => onPlayVideo(video.videoId)}
                                >
                                    <div className="relative w-8 h-8 rounded bg-dark-bg flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <img src={`https://img.youtube.com/vi/${video.videoId}/default.jpg`} className="w-full h-full object-cover opacity-60" />
                                        <Play className={`w-3 h-3 text-white absolute ${currentVideoId === video.videoId ? 'hidden' : ''}`} />
                                        {currentVideoId === video.videoId && <Activity className="w-3 h-3 text-red-400 absolute" />}
                                    </div>
                                    <div className="truncate">
                                        <div className={`text-sm truncate font-medium ${currentVideoId === video.videoId ? 'text-red-400' : 'text-slate-300 group-hover:text-white'}`}>
                                            {video.title}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRemoveFromPlaylist(video.id); }}
                                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;