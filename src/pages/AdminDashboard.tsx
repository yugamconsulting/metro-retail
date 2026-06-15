import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Users, Package, ShoppingCart, 
  ArrowUpRight, ArrowDownRight, Search, 
  Plus, LayoutDashboard,
  ClipboardList, Bell,
  LogOut, Trash2, CheckCircle2, Lock, MoreHorizontal, X, AlertCircle,
  FileText, Calendar, Download as DownloadIcon, Share2, Settings, ShieldCheck,
  Zap, QrCode, Menu, Edit3, Activity, Filter, Truck, FileCheck
} from 'lucide-react';

const IconButton = ({ children, onClick, label, className }: any) => (
  <div className="relative group flex items-center justify-center">
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-xl transition-all active:scale-90",
        className
      )}
    >
      {children}
    </button>
    <div className="absolute bottom-full mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-1 group-hover:translate-y-0 z-50 whitespace-nowrap shadow-xl">
      {label}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  </div>
);
import { QRCodeSVG } from 'qrcode.react';
import { generateOrderReport, generateMasterPickList, generateDeliveryConfirmation } from '../utils/pdfGenerator';
import { subDays, format } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { cn, timeAgo } from '../utils/utils';
import { Role } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { SyncIndicator } from '../components/SyncIndicator';
import { useAutoSync } from '../hooks/useAutoSync';
import { CommandPalette } from '../components/CommandPalette';
import { AuditChain } from '../components/AuditChain';
import { ProductIcon } from '../components/ProductIcon';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

export const AdminDashboard = () => {
  useAutoSync();
  const { 
    user, products, clients, orders, categories, notifications, bulletins, drivers, setUser, 
    addProduct, deleteProduct, updateProduct, 
    addClient, addCategory, addClientUser,
    addBulletin, deleteBulletin, toggleBulletinStatus,
    addDriver, deleteDriver,
    resetClientPassword, resetUserPassword, markNotificationRead, markAllNotificationsRead, deleteNotification,
    archiveClient, restoreClient, updateOrderStatus,
    adminCredentials, updateAdminCredentials, userAnalytics, incrementActionCount
  } = useStore();

  const chartData = useMemo(() => {
    // Area chart: Order count per day for last 7 days
    const orderTrend = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayOrders = orders.filter(
        (o) => new Date(o.createdAt).toDateString() === date.toDateString()
      );
      return {
        name: format(date, 'EEE'),
        total: dayOrders.length,
      };
    });

    // Pie chart: items by category
    const categoryMap: Record<string, number> = {};
    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;
        categoryMap[product.category] = (categoryMap[product.category] || 0) + item.quantity;
      });
    });
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    return { orderTrend, pieData };
  }, [orders, products]);

  // Hyper-Personalized Adaptive UI Logic
  const smartActions = useMemo(() => {
    return Object.entries(userAnalytics)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([action]) => action);
  }, [userAnalytics]);

  const [activeView, setActiveView] = useState('dashboard');
  
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [productViewMode, setProductViewMode] = useState<'table' | 'grid'>('table');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState<any>(null); // Stores client object
  const [showPasswordResetModal, setShowPasswordResetModal] = useState<any>(null); // Stores client object
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showArchivedClients, setShowArchivedClients] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientError, setClientError] = useState('');
  const [showCredentialShareModal, setShowCredentialShareModal] = useState<any>(null); // Stores client object
  const [copyFeedback, setCopyFeedback] = useState('');
  const [showQrHandoff, setShowQrHandoff] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Command Palette Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getCredentialMessage = (client: any) => {
    const loginUrl = window.location.origin;
    return `🏢 *Welcome to Metro Retail and Trade*\n\n` +
      `Hello *${client.contactPerson}*,\n` +
      `Your wholesale ordering account is ready!\n\n` +
      `🔗 *Login URL:* ${loginUrl}\n` +
      `📧 *Login ID:* ${client.email}\n` +
      `🔑 *Temporary Password:* ${client.password || 'client123'}\n\n` +
      `📝 *Instructions:*\n` +
      `1. Log in using the credentials above.\n` +
      `2. You will be prompted to change your password on first login.\n` +
      `3. Confirm your previous delivery before placing new orders.\n` +
      `4. Daily cutoff for next-day delivery is *3:00 PM*.\n\n` +
      `✅ _Driven by Quality, Delivered by MRT._`;
  };

  const handleShareCredentials = (client: any) => {
    setShowCredentialShareModal(client);
  };

  // Report State
  const [reportConfig, setReportConfig] = useState({
    clientId: '',
    userId: '',
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const embedded = isEmbedded();

  return (
    <div className={cn("flex h-screen bg-slate-50 overflow-hidden", embedded ? "bg-white" : "")}>
      {/* Sidebar */}
      {!embedded && (
        <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col m-4 rounded-theme shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">MRT Admin</span>
          </div>

          <nav className="space-y-1">
            <SidebarItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
            <SidebarItem active={activeView === 'orders'} onClick={() => setActiveView('orders')} icon={<ShoppingCart />} label="Orders" />
            <SidebarItem active={activeView === 'products'} onClick={() => setActiveView('products')} icon={<Package />} label="Products" />
            <SidebarItem active={activeView === 'clients'} onClick={() => setActiveView('clients')} icon={<Users />} label="Clients" />
            <SidebarItem active={activeView === 'bulletins'} onClick={() => setActiveView('bulletins')} icon={<Bell />} label="Bulletins" />
            <SidebarItem active={activeView === 'reports'} onClick={() => setActiveView('reports')} icon={<FileText />} label="Reports" />
            <SidebarItem active={activeView === 'drivers'} onClick={() => setActiveView('drivers')} icon={<Truck />} label="Drivers" />
            <SidebarItem active={activeView === 'settings'} onClick={() => setActiveView('settings')} icon={<Settings />} label="Settings" />
            <SidebarItem active={activeView === 'logs'} onClick={() => setActiveView('logs')} icon={<ClipboardList />} label="Audit Trail" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <button 
            onClick={() => setUser(null)}
            className="flex items-center gap-3 text-slate-500 hover:text-red-600 font-semibold transition-colors w-full p-2"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        {!embedded && (
          <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <IconButton 
              onClick={() => setShowMobileMenu(true)}
              label="Menu"
              className="text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </IconButton>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 hidden sm:block">
              {activeView}
            </h2>
            <SyncIndicator />
          </div>
          <div className="flex items-center gap-2 lg:gap-6">
            <div className="flex-1" />
            <IconButton 
              onClick={() => setShowQrHandoff(true)}
              label="Handoff"
              className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
            >
              <QrCode className="w-5 h-5" />
            </IconButton>
            <div className="relative group/notif">
              <IconButton 
                label="Inbox"
                className="relative text-slate-400 hover:text-indigo-600"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read && n.userId === 'ADMIN').length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse pointer-events-none"></span>
                )}
              </IconButton>
              
              {/* Notifications Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 hidden group-hover/notif:block z-[100] overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Notifications</span>
                  {notifications.filter(n => n.userId === 'ADMIN' && !n.read).length > 0 && (
                    <button 
                      onClick={() => markAllNotificationsRead()}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.filter(n => n.userId === 'ADMIN').length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.filter(n => n.userId === 'ADMIN').map(n => (
                      <div key={n.id} className={cn("p-4 hover:bg-slate-50 transition-colors relative", !n.read && "bg-indigo-50/30")}>
                        {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />}
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-900 leading-tight">{n.title}</p>
                          <button 
                            onClick={() => deleteNotification(n.id)}
                            className="text-slate-300 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2">{n.message}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {format(new Date(n.timestamp), 'h:mm a')}
                          </span>
                          {!n.read && (
                            <button 
                              onClick={() => markNotificationRead(n.id)}
                              className="text-[10px] font-bold text-indigo-600 hover:underline"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">Super Admin</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Platform Manager</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
                AD
              </div>
            </div>
          </div>
        </header>
        )}

        <div className="p-4 lg:p-6">
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Today's Orders" value={orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length.toString()} change="+0" trend="up" icon={<ShoppingCart />} color="indigo" />
                <StatCard title="Active Clients" value={clients.length.toString()} change="+0" trend="up" icon={<Users />} color="violet" />
                
                {/* MRT Operational Health - More Compact */}
                <div className="lg:col-span-2 bg-white rounded-theme border border-slate-100 p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Zap className="w-12 h-12 text-amber-500" />
                  </div>
                  <div className="flex justify-between items-start gap-6 relative z-10">
                    <div className="space-y-1.5">
                      <h3 className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 w-fit uppercase tracking-widest mb-1">Operational Health</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Daily system integrity status</p>
                    </div>
                    <div className="flex-1 max-w-[200px] space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                          <span className="text-slate-400">Compliance</span>
                          <span className="text-indigo-600">94%</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} className="h-full bg-indigo-500" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase">
                          <span className="text-slate-400">Picking</span>
                          <span className="text-emerald-600">Optimal</span>
                        </div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-emerald-500" />
                        </div>
                      </div>
                    </div>
                    <IconButton 
                      onClick={() => setActiveView('logs')} 
                      label="Audit"
                      className="bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-200 shrink-0"
                    >
                      <Activity className="w-4 h-4" />
                    </IconButton>
                  </div>
                </div>
              </div>

              {/* Adaptive UI: Smart Actions - Slimmer */}
              {smartActions.length > 0 && (
                <div className="bg-slate-900 rounded-theme p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-400 shadow-inner">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Smart Actions</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Recent MRT Workflow</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {smartActions.map(action => (
                        <button
                          key={action}
                          onClick={() => {
                            if (action === 'Generate Report') setActiveView('reports');
                            if (action === 'Add Product') { setActiveView('products'); setShowProductModal(true); }
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-xl border border-white/5 font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Section - Ultra Compact */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white p-5 rounded-theme border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Trend Pulse</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Daily order volume</p>
                    </div>
                    <select className="text-[10px] border-slate-100 rounded-lg font-black uppercase bg-slate-50 py-1.5 px-3">
                      <option>7 Days</option>
                      <option>30 Days</option>
                    </select>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.orderTrend}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.08}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} />
                        <Tooltip 
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px'}}
                        />
                        <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-theme border border-slate-100 shadow-sm flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-0.5">Mix</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-4">By category</p>
                  <div className="h-[160px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartData.pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-xl font-black text-slate-900">{orders.length}</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 space-y-1.5">
                    {chartData.pieData.slice(0, 4).map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="truncate max-w-[80px]">{item.name}</span>
                        </div>
                        <span className="font-black text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Activity Section for Dashboard */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Today's Active Orders</h3>
                    <p className="text-sm text-slate-500 font-medium">Quick overview of current fulfillment</p>
                  </div>
                  <button onClick={() => setActiveView('orders')} className="text-indigo-600 font-bold text-sm hover:underline">Manage All Orders</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Client</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium">No orders received today yet</td>
                        </tr>
                      ) : (
                        orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).map((order) => {
                          const client = clients.find(c => c.id === order.clientId);
                          return (
                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{order.id}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-700">{client?.companyName}</td>
                              <td className="px-6 py-4">
                                <select 
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer",
                                    order.status === 'DELIVERED' ? "bg-green-50 text-green-700" : 
                                    order.status === 'PENDING' ? "bg-indigo-50 text-indigo-700" :
                                    order.status === 'ISSUE' ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" :
                                    "bg-slate-50 text-slate-700"
                                  )}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="DISPATCHED">Dispatched</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="ISSUE">Issue Reported</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-[10px] font-black text-slate-300">#{order.id.split('-').pop()}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Order Management</h3>
                  <p className="text-slate-500 font-medium">Browse and manage daily wholesale orders</p>
                </div>
                <button 
                  onClick={() => {
                    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === selectedDate.toDateString());
                    if (dayOrders.length === 0) {
                      alert('No orders found for this date to generate a pick-list.');
                      return;
                    }
                    generateMasterPickList({
                      orders: dayOrders,
                      products,
                      date: selectedDate
                    });
                  }}
                  className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl flex items-center gap-2 hover:bg-black transition-all text-xs uppercase tracking-widest"
                >
                  <DownloadIcon className="w-4 h-4" /> Master Pick-List (.PDF)
                </button>
              </div>

              {/* Magnetic Pulse Ribbon (Revolutionized Date Picker) */}
              <div className="relative bg-white/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent pointer-events-none" />
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x items-end min-h-[140px] px-4">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const date = subDays(new Date(), i);
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const dayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === date.toDateString());
                    const totalQty = dayOrders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0), 0);
                    const hasIssue = dayOrders.some(o => o.status === 'ISSUE');
                    
                    // Volume bar height (max 60px)
                    const barHeight = Math.min(60, (totalQty / 100) * 60);

                    return (
                      <motion.button 
                        key={i} 
                        onClick={() => setSelectedDate(date)}
                        animate={{ 
                          scale: isSelected ? 1.1 : 0.95,
                          y: isSelected ? -5 : 0
                        }}
                        className={cn(
                          "flex flex-col items-center min-w-[65px] snap-center relative transition-all duration-500 group/node",
                          isSelected ? "z-10" : "opacity-60 hover:opacity-100"
                        )}
                      >
                        {/* Volume Pulse Bar */}
                        <div className="w-1.5 bg-slate-100 rounded-full h-[60px] mb-4 relative overflow-hidden flex items-end">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight || 4}px` }}
                            className={cn(
                              "w-full rounded-full shadow-sm",
                              isSelected ? "bg-indigo-500" : "bg-indigo-200"
                            )} 
                          />
                        </div>

                        <div className={cn(
                          "w-14 py-3 rounded-2xl border-2 flex flex-col items-center transition-all shadow-sm",
                          isSelected 
                            ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                            : "bg-white border-slate-50 text-slate-400 group-hover/node:border-indigo-100"
                        )}>
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">{format(date, 'EEE')}</span>
                          <span className="text-base font-black leading-none">{format(date, 'dd')}</span>
                        </div>

                        {/* Semantic Indicator */}
                        {dayOrders.length > 0 && (
                          <motion.div 
                            layoutId={`indicator-${i}`}
                            className={cn(
                              "absolute -bottom-1 w-1.5 h-1.5 rounded-full",
                              hasIssue ? "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" : 
                              isSelected ? "bg-indigo-500" : "bg-indigo-200"
                            )} 
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Orders for {format(selectedDate, 'dd MMMM yyyy')}</h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Client</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Items</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.filter(o => new Date(o.createdAt).toDateString() === selectedDate.toDateString()).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">No orders for this date</td>
                        </tr>
                      ) : (
                        orders.filter(o => new Date(o.createdAt).toDateString() === selectedDate.toDateString()).map((order) => {
                          const client = clients.find(c => c.id === order.clientId);
                          return (
                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{order.id}</td>
                              <td className="px-6 py-4 text-sm font-bold text-slate-700">{client?.companyName}</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-500">{order.items.length} units</td>
                              <td className="px-6 py-4">
                                <select 
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer",
                                    order.status === 'DELIVERED' ? "bg-green-50 text-green-700" : 
                                    order.status === 'PENDING' ? "bg-indigo-50 text-indigo-700" :
                                    order.status === 'ISSUE' ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" :
                                    "bg-slate-50 text-slate-700"
                                  )}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="CONFIRMED">Confirmed</option>
                                  <option value="DISPATCHED">Dispatched</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="ISSUE">Issue Reported</option>
                                  <option value="CANCELLED">Cancelled</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right flex justify-end gap-1">
                                {order.status === 'DELIVERED' && (
                                  <IconButton 
                                    label="DC" 
                                    onClick={() => generateDeliveryConfirmation({ 
                                      client: clients.find(c => c.id === order.clientId), 
                                      order, 
                                      products 
                                    })} 
                                    className="text-emerald-500 hover:bg-emerald-50"
                                  >
                                    <FileCheck className="w-4 h-4" />
                                  </IconButton>
                                )}
                                <IconButton label="Audit" onClick={() => setActiveView('logs')} className="text-slate-400 hover:text-indigo-600"><MoreHorizontal className="w-4 h-4" /></IconButton>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'products' && (
            <div className="space-y-6 pb-20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Product Catalog</h3>
                  <p className="text-slate-500 font-medium">Manage SKUs and delivery units (Price entry is optional)</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mr-2">
                    <IconButton 
                      onClick={() => setProductViewMode('table')}
                      label="Table"
                      className={cn("p-1.5 rounded-lg", productViewMode === 'table' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
                    >
                      <ClipboardList className="w-4 h-4" />
                    </IconButton>
                    <IconButton 
                      onClick={() => setProductViewMode('grid')}
                      label="Grid"
                      className={cn("p-1.5 rounded-lg", productViewMode === 'grid' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                    </IconButton>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Category
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      incrementActionCount('Add Product');
                      setShowProductModal(true);
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Product
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative group flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Rapid search by SKU, Name or Category..." 
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
                <button className="px-6 py-4 bg-white border border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Filter className="w-4 h-4" /> Smart Filters
                </button>
              </div>

              {productViewMode === 'table' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                          <th className="px-6 py-4">Product Info</th>
                          <th className="px-6 py-4">SKU / Cat</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <ProductIcon 
                                  productName={p.name} 
                                  className={cn("w-12 h-12 ring-1 ring-slate-100", Role.CLIENT ? "bg-white" : "")} 
                                />
                                <div>
                                  <p className="font-black text-slate-900 leading-none">{p.name.toUpperCase()}</p>
                                  <p className="text-[10px] text-slate-400 mt-1 font-bold lowercase">{p.unit.toLowerCase()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">{p.sku}</span>
                                <p className="text-[10px] text-slate-500 font-bold ml-0.5">{p.category}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => updateProduct(p.id, { active: !p.active })}
                                className={cn(
                                  "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight",
                                  p.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                                )}
                              >
                                {p.active ? 'Active' : 'Draft'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <IconButton label="Edit" className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                  <Edit3 className="w-4 h-4" />
                                </IconButton>
                                <IconButton 
                                  onClick={() => deleteProduct(p.id)} 
                                  label="Delete"
                                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </IconButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((p) => (
                    <motion.div 
                      layout
                      key={p.id}
                      className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group"
                    >
                      <div className="aspect-square relative overflow-hidden bg-slate-50 flex items-center justify-center p-8">
                        <ProductIcon productName={p.name} className="w-full h-full text-indigo-600/30" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-slate-900 shadow-sm">{p.sku}</span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <IconButton 
                            onClick={() => updateProduct(p.id, { active: !p.active })}
                            label={p.active ? "Pause" : "Start"}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
                              p.active ? "bg-emerald-500 text-white" : "bg-white text-slate-300 hover:text-emerald-500"
                            )}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{p.category}</p>
                          <h4 className="font-black text-slate-900 leading-tight line-clamp-1">{p.name.toUpperCase()}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 lowercase tracking-tighter">{p.unit.toLowerCase()}</p>
                        </div>
                        <div className="flex items-end justify-end">
                          <div className="flex gap-1">
                            <IconButton label="Edit" className="bg-slate-50 text-slate-400 hover:text-indigo-600">
                              <Edit3 className="w-4 h-4" />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === 'clients' && (
            <div className="space-y-6 pb-20">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Client Management</h3>
                  <p className="text-slate-500 font-medium">Manage B2B accounts and secondary login IDs</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowArchivedClients(!showArchivedClients)}
                    className={cn(
                      "px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border",
                      showArchivedClients ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-slate-600 border-slate-200"
                    )}
                  >
                    <ClipboardList className="w-4 h-4" /> {showArchivedClients ? "View Active" : "View Archive"}
                  </button>
                  <button 
                    onClick={() => {
                      setClientError('');
                      setShowClientModal(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Client
                  </button>
                </div>
              </div>

              {/* Client Search Bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search clients by name, email or contact person..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  value={clientSearchQuery}
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Client ID</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Company</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(showArchivedClients ? clients.filter(c => c.isArchived) : clients.filter(c => !c.isArchived))
                        .filter(c => {
                          if (!clientSearchQuery.trim()) return true;
                          const q = clientSearchQuery.toLowerCase();
                          return (
                            c.companyName.toLowerCase().includes(q) ||
                            c.contactPerson.toLowerCase().includes(q) ||
                            c.email.toLowerCase().includes(q) ||
                            c.clientNumber?.toLowerCase().includes(q)
                          );
                        })
                        .length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                            {showArchivedClients ? "No archived clients matching search" : "No active clients found"}
                          </td>
                        </tr>
                      ) : (
                        (showArchivedClients ? clients.filter(c => c.isArchived) : clients.filter(c => !c.isArchived))
                        .filter(c => {
                          if (!clientSearchQuery.trim()) return true;
                          const q = clientSearchQuery.toLowerCase();
                          return (
                            c.companyName.toLowerCase().includes(q) ||
                            c.contactPerson.toLowerCase().includes(q) ||
                            c.email.toLowerCase().includes(q) ||
                            c.clientNumber?.toLowerCase().includes(q)
                          );
                        })
                        .map((client) => (
                          <tr key={client.id}>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                {client.clientNumber}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900">{client.companyName}</span>
                                {!client.isArchived && (
                                  <IconButton 
                                    onClick={() => handleShareCredentials(client)}
                                    label="Onboard"
                                    className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                                  >
                                    <Share2 className="w-3.5 h-3.5" />
                                  </IconButton>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">{client.contactPerson}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {!showArchivedClients ? (
                                  <>
                                    <IconButton 
                                      onClick={() => setShowPasswordResetModal(client)}
                                      label="Pass"
                                      className="text-slate-400 hover:text-indigo-600"
                                    >
                                      <Lock className="w-4 h-4" />
                                    </IconButton>
                                    <button 
                                      onClick={() => setShowUserModal(client)}
                                      className="text-indigo-600 font-bold text-[10px] bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                      Users ({client.users.length})
                                    </button>
                                    <IconButton 
                                      onClick={() => archiveClient(client.id)}
                                      label="Archive"
                                      className="text-slate-400 hover:text-amber-600"
                                    >
                                      <ClipboardList className="w-4 h-4" />
                                    </IconButton>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => restoreClient(client.id)}
                                    className="text-indigo-600 font-bold text-[10px] bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                                  >
                                    Restore
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeView === 'reports' && (
            <div className="space-y-8 pb-20">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Performance Reports</h3>
                <p className="text-slate-500 font-medium">Generate professional PDF summaries of client ordering behavior</p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Client Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" /> Select Client
                      </label>
                      <select 
                        value={reportConfig.clientId}
                        onChange={(e) => setReportConfig({ ...reportConfig, clientId: e.target.value, userId: '' })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      >
                        <option value="">Choose a business...</option>
                        {clients.filter(c => !c.isArchived).map(c => (
                          <option key={c.id} value={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Secondary User Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-indigo-600" /> Filter by User ID (Optional)
                      </label>
                      <select 
                        disabled={!reportConfig.clientId}
                        value={reportConfig.userId}
                        onChange={(e) => setReportConfig({ ...reportConfig, userId: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium disabled:opacity-50"
                      >
                        <option value="">All User IDs</option>
                        {reportConfig.clientId && clients.find(c => c.id === reportConfig.clientId)?.users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" /> Start Date
                      </label>
                      <input 
                        type="date"
                        value={reportConfig.startDate}
                        onChange={(e) => setReportConfig({ ...reportConfig, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" /> End Date
                      </label>
                      <input 
                        type="date"
                        value={reportConfig.endDate}
                        onChange={(e) => setReportConfig({ ...reportConfig, endDate: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex flex-col items-center">
                    <button 
                      disabled={!reportConfig.clientId}
                      onClick={() => {
                        incrementActionCount('Generate Report');
                        const client = clients.find(c => c.id === reportConfig.clientId);
                        const user = client?.users.find(u => u.id === reportConfig.userId);
                        const filteredOrders = orders.filter(o => {
                          const orderDate = new Date(o.createdAt);
                          const start = new Date(reportConfig.startDate);
                          const end = new Date(reportConfig.endDate);
                          end.setHours(23, 59, 59, 999);
                          
                          const matchesClient = o.clientId === reportConfig.clientId;
                          const matchesUser = !reportConfig.userId || o.placedById === reportConfig.userId;
                          const matchesDate = orderDate >= start && orderDate <= end;
                          
                          return matchesClient && matchesUser && matchesDate;
                        });

                        generateOrderReport({
                          client,
                          user,
                          orders: filteredOrders,
                          products,
                          startDate: new Date(reportConfig.startDate),
                          endDate: new Date(reportConfig.endDate)
                        });
                      }}
                      className="w-full max-w-sm py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                    >
                      <DownloadIcon className="w-5 h-5" />
                      Generate Professional Report (.PDF)
                    </button>
                    <p className="mt-4 text-xs text-slate-400 font-bold uppercase tracking-widest text-center">
                      The report will include itemized SKUs, quantities, and total values
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Hint */}
              {!reportConfig.clientId && (
                <div className="p-20 text-center space-y-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                  <FileText className="w-12 h-12 mx-auto text-slate-200" />
                  <p className="text-slate-400 font-medium">Select a client above to enable report generation</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'settings' && (
            <div className="space-y-8 max-w-2xl pb-20">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Admin Settings</h3>
                <p className="text-slate-500 font-medium">Manage your administrative access credentials</p>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-indigo-900">Account Security</p>
                      <p className="text-xs text-indigo-600 font-medium">Updating these will immediately require a new login.</p>
                    </div>
                  </div>

                  <form 
                    onSubmit={(e: any) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const newEmail = (formData.get('email') as string).trim();
                      const newPassword = (formData.get('password') as string).trim();
                      const updates: { email?: string; password?: string } = { email: newEmail };
                      if (newPassword) {
                        updates.password = newPassword;
                      }
                      updateAdminCredentials(updates);
                      alert('Admin credentials updated successfully!');
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Admin Email</label>
                      <input 
                        name="email" 
                        defaultValue={adminCredentials.email}
                        required 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">New Password</label>
                      <input 
                        name="password" 
                        type="password"
                        placeholder="Leave blank to keep current"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" 
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg mt-4"
                    >
                      Update Admin Credentials
                    </button>
                  </form>
                </div>
              </div>

              <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">Developer Failsafe Active</p>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    A master developer key is enabled. In case of lost credentials, contact Metro Retail and Trade technical support to regain access via the system failsafe.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeView === 'bulletins' && (
            <div className="space-y-8 pb-20 max-w-2xl mx-auto">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Bulletin Board</h3>
                  <p className="text-slate-500 font-medium">Post announcements for all MRT clients</p>
                </div>
                <button 
                  onClick={() => {
                    const title = prompt('Bulletin Title:');
                    const message = prompt('Message:');
                    if (title && message) {
                      addBulletin({
                        id: `b-${Date.now()}`,
                        title,
                        message,
                        type: 'INFO',
                        active: true,
                        timestamp: new Date().toISOString()
                      });
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Post
                </button>
              </div>

              <div className="space-y-4">
                {bulletins.length === 0 ? (
                  <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm">
                    <Bell className="w-8 h-8 mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active bulletins</p>
                  </div>
                ) : (
                  bulletins.map(b => (
                    <div key={b.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm",
                          b.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-400 border border-slate-200"
                        )}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none">{b.title}</p>
                          <p className="text-xs text-slate-400 font-medium mt-1">{b.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconButton 
                          onClick={() => toggleBulletinStatus(b.id)}
                          label={b.active ? "Hide" : "Show"}
                          className={b.active ? "text-emerald-500" : "text-slate-300"}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </IconButton>
                        <IconButton 
                          onClick={() => deleteBulletin(b.id)}
                          label="Delete"
                          className="text-slate-300 hover:text-rose-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </IconButton>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeView === 'drivers' && (
            <div className="space-y-8 pb-20 max-w-4xl mx-auto">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Delivery Fleet</h3>
                  <p className="text-slate-500 font-medium">Manage driver accounts and mobile access</p>
                </div>
                <button 
                  onClick={() => setShowDriverModal(true)}
                  className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Driver
                </button>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <tr>
                       <th className="px-8 py-4">Driver Name</th>
                       <th className="px-8 py-4">Identity / Phone</th>
                       <th className="px-8 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {drivers.length === 0 ? (
                       <tr>
                         <td colSpan={3} className="px-8 py-20 text-center text-slate-300 font-bold uppercase text-[10px]">No drivers registered</td>
                       </tr>
                     ) : (
                       drivers.map(driver => (
                         <tr key={driver.id}>
                           <td className="px-8 py-5 font-black text-slate-900">{driver.name}</td>
                           <td className="px-8 py-5 text-sm font-medium text-slate-500">{driver.email}</td>
                           <td className="px-8 py-5 text-right">
                              <IconButton label="Remove" onClick={() => deleteDriver(driver.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></IconButton>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'logs' && (
            <div className="space-y-8 pb-20 max-w-4xl mx-auto">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Verifiable Chain</h3>
                <p className="text-slate-500 font-medium">Immutable MRT ledger for order transparency and handoff proof</p>
              </div>

              {orders.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200 space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                    <Activity className="w-10 h-10" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No entries found in the chain</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
                      <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <Package className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Ref</p>
                                {order.branchId && (
                                  <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                    {clients.find(c => c.id === order.clientId)?.branches.find(b => b.id === order.branchId)?.name || 'Branch'}
                                  </span>
                                )}
                              </div>
                              <p className="text-lg font-black text-slate-900">{order.id}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</p>
                           <p className="text-sm font-bold text-slate-900">{timeAgo(order.auditLog[order.auditLog.length-1]?.timestamp || order.createdAt)}</p>
                        </div>
                      </div>
                      <AuditChain logs={order.auditLog} status={order.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Copy Feedback Toast */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[200] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-sm font-bold">{copyFeedback}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Reset Password</h3>
              <button onClick={() => setShowPasswordResetModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            <form 
              onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                resetClientPassword(showPasswordResetModal.id, formData.get('newPass') as string);
                setShowPasswordResetModal(null);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">New Password for {showPasswordResetModal.companyName}</label>
                <input name="newPass" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Enter new password" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPasswordResetModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-100">Reset Now</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Secondary User Management Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Client Users</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{showUserModal.companyName}</p>
              </div>
              <button onClick={() => setShowUserModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Existing Users List */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Login IDs</p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{showUserModal.contactPerson} (Primary)</p>
                      <p className="text-[10px] font-medium text-slate-500">{showUserModal.email}</p>
                    </div>
                  </div>
                  {showUserModal.users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] font-medium text-slate-500">{u.email}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const newPass = prompt(`Enter new password for ${u.name}:`, 'user123');
                          if (newPass) resetUserPassword(showUserModal.id, u.id, newPass);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Reset User Password"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New User Form */}
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Add Secondary ID</p>
                <form 
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    addClientUser(showUserModal.id, {
                      id: `u-${Date.now()}`,
                      name: formData.get('name') as string,
                      email: (formData.get('email') as string).trim().toLowerCase(),
                      role: Role.CLIENT_USER,
                      clientId: showUserModal.id
                    });
                    e.target.reset();
                  }}
                  className="space-y-3"
                >
                  <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="User Name (e.g. Night Shift Mgr)" />
                  <input name="email" type="email" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Email Address" />
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-100">Create Access ID</button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Credential Share Modal */}
      {showCredentialShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Share Onboarding Info</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{showCredentialShareModal.companyName}</p>
              </div>
              <button onClick={() => setShowCredentialShareModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <pre className="text-xs font-medium text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {getCredentialMessage(showCredentialShareModal)}
                </pre>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(getCredentialMessage(showCredentialShareModal));
                    setCopyFeedback('Credentials copied to clipboard!');
                    setTimeout(() => setCopyFeedback(''), 3000);
                  }}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4 rotate-180" /> Copy Text Summary
                </button>

                <button 
                  onClick={() => {
                    const message = getCredentialMessage(showCredentialShareModal);
                    if (navigator.share) {
                      navigator.share({ title: 'MRT Credentials', text: message });
                    } else {
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
                    }
                  }}
                  className="w-full py-3 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Share2 className="w-4 h-4" /> Use Mobile Share Sheet
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* QR Handoff Modal */}
      <AnimatePresence>
        {showQrHandoff && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-8 text-center space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">Desktop Handoff</h3>
                <button onClick={() => setShowQrHandoff(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                  <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                </button>
              </div>
              <div className="bg-white p-6 rounded-3xl border-4 border-slate-50 flex items-center justify-center mx-auto w-fit shadow-inner">
                <QRCodeSVG 
                  value={`${window.location.origin}/login?handoff=${btoa(JSON.stringify({ user, token: useStore.getState().token }))}`}
                  size={200}
                />
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">Scan with your phone to instantly mirror this session on another device.</p>
              <button 
                onClick={() => setShowQrHandoff(false)}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <div className="fixed inset-0 z-[150] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Package className="text-white w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-slate-900">MRT Admin</span>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <nav className="space-y-1">
                  <SidebarItem 
                    active={activeView === 'dashboard'} 
                    onClick={() => { setActiveView('dashboard'); setShowMobileMenu(false); }} 
                    icon={<LayoutDashboard />} 
                    label="Dashboard" 
                  />
                  <SidebarItem 
                    active={activeView === 'orders'} 
                    onClick={() => { setActiveView('orders'); setShowMobileMenu(false); }} 
                    icon={<ShoppingCart />} 
                    label="Orders" 
                  />
                  <SidebarItem 
                    active={activeView === 'products'} 
                    onClick={() => { setActiveView('products'); setShowMobileMenu(false); }} 
                    icon={<Package />} 
                    label="Products" 
                  />
                  <SidebarItem 
                    active={activeView === 'clients'} 
                    onClick={() => { setActiveView('clients'); setShowMobileMenu(false); }} 
                    icon={<Users />} 
                    label="Clients" 
                  />
                  <SidebarItem 
                    active={activeView === 'reports'} 
                    onClick={() => { setActiveView('reports'); setShowMobileMenu(false); }} 
                    icon={<FileText />} 
                    label="Reports" 
                  />
                  <SidebarItem 
                    active={activeView === 'settings'} 
                    onClick={() => { setActiveView('settings'); setShowMobileMenu(false); }} 
                    icon={<Settings />} 
                    label="Settings" 
                  />
                  <SidebarItem 
                    active={activeView === 'logs'} 
                    onClick={() => { setActiveView('logs'); setShowMobileMenu(false); }} 
                    icon={<ClipboardList />} 
                    label="Audit Trail" 
                  />
                </nav>
              </div>

              <div className="p-6 border-t border-slate-100">
                <button 
                  onClick={() => { setUser(null); setShowMobileMenu(false); }}
                  className="flex items-center gap-3 text-slate-500 hover:text-red-600 font-semibold transition-colors w-full p-2"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Client Creation Modal */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Register New Client</h3>
              <button onClick={() => setShowClientModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            <form 
              onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const name = formData.get('companyName') as string;
                
                if (clients.some(c => c.companyName.toLowerCase() === name.toLowerCase())) {
                  setClientError(`A client named "${name}" already exists.`);
                  return;
                }

                addClient({
                  id: `c-${Date.now()}`,
                  clientNumber: '', 
                  companyName: name,
                  gstNumber: formData.get('gstNumber') as string,
                  contactPerson: formData.get('contactPerson') as string,
                  email: (formData.get('email') as string).trim().toLowerCase(),
                  phone: (formData.get('phone') as string).trim(),
                  address: formData.get('address') as string,
                  branches: [],
                  users: []
                });
                setShowClientModal(false);
              }}
              className="p-6 space-y-4"
            >
              {clientError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  {clientError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Company Name</label>
                <input name="companyName" required onChange={() => setClientError('')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Hotel Taj" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Contact Person</label>
                  <input name="contactPerson" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">GST / Registration No</label>
                  <input name="gstNumber" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                  <input name="email" type="email" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="purchasing@company.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">WhatsApp Phone</label>
                  <input name="phone" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowClientModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Register Client</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Product Creation Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Add New Product</h3>
              <button onClick={() => setShowProductModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            <form 
              onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const category = formData.get('category') as string;
                const catPrefix = category.substring(0, 3).toUpperCase();
                const existingSkus = products
                  .filter(p => p.sku.startsWith(catPrefix))
                  .map(p => parseInt(p.sku.split('-')[1]) || 0);
                const nextNum = existingSkus.length > 0 ? Math.max(...existingSkus) + 1 : 1;
                const sku = `${catPrefix}-${String(nextNum).padStart(3, '0')}`;
                
                addProduct({
                  id: `p-${Date.now()}`,
                  name: formData.get('name') as string,
                  sku: sku,
                  category: category,
                  unit: formData.get('unit') as string,
                  unitValue: Number(formData.get('unitValue') || 1),
                  moq: Number(formData.get('moq') || 1),
                  iconName: formData.get('iconName') as string,
                  image: '', 
                  active: true
                });
                setShowProductModal(false);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Product Name</label>
                  <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Fresh Milk" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">SKU Code (Auto)</label>
                  <input name="sku" readOnly className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" placeholder="Auto-generated" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Category</label>
                  <select name="category" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    {categories.map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Unit Type (Preset)</label>
                  <select name="unit" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="liter">liter</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                    <option value="gram">gram</option>
                    <option value="pieces">pieces</option>
                    <option value="box">box</option>
                    <option value="pack (30 pcs)">pack (30 pcs)</option>
                    <option value="pack (10 pcs)">pack (10 pcs)</option>
                    <option value="tray">tray</option>
                    <option value="carton">carton</option>
                    <option value="crate">crate</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Size (e.g. 50)</label>
                  <input name="unitValue" type="number" defaultValue="1" min="1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">MOQ (Qty)</label>
                  <input name="moq" type="number" defaultValue="1" min="1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Product Icon</label>
                  <select name="iconName" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Default (Auto)</option>
                    <option value="milk">Milk / Dairy</option>
                    <option value="meat">Meat / Poultry</option>
                    <option value="frozen">Frozen / Ice</option>
                    <option value="beverage">Beverage / Coffee</option>
                    <option value="egg">Egg</option>
                    <option value="pizza">Cheese / Pizza</option>
                    <option value="veg">Vegetables</option>
                    <option value="fruit">Fruits</option>
                    <option value="stationery">Stationery</option>
                    <option value="pharma">Pharma</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Create Product</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />

      {/* Driver Creation Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Add New Driver</h3>
              <button onClick={() => setShowDriverModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            <form 
              onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addDriver({
                  id: `drv-${Date.now()}`,
                  name: formData.get('name') as string,
                  email: formData.get('id') as string, // Phone or ID
                  role: Role.DRIVER,
                  password: formData.get('pass') as string
                });
                setShowDriverModal(false);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Driver Full Name</label>
                <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Login ID (Phone/Email)</label>
                <input name="id" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+91..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                <input name="pass" type="password" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDriverModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl">Create Account</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">New Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            <form 
              onSubmit={(e: any) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addCategory(formData.get('catName') as string);
                setShowCategoryModal(false);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Category Name</label>
                <input name="catName" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Seafood" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100">Add</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const isEmbedded = () => {
  return new URLSearchParams(window.location.search).get('embedded') === 'true';
};

const SidebarItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold text-sm",
      active 
        ? "bg-indigo-50 text-indigo-700 shadow-sm" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    {React.cloneElement(icon, { className: "w-5 h-5" })}
    {label}
  </button>
);

const StatCard = ({ title, value, change, trend, icon, color = "indigo" }: any) => {
  const colorMap: any = {
    indigo: "from-indigo-500/10 to-indigo-500/5 text-indigo-600 ring-indigo-500/20",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 ring-emerald-500/20",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 ring-amber-500/20",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-600 ring-rose-500/20",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-600 ring-violet-500/20",
  };

  return (
    <motion.div 
      whileHover={{ y: -1 }}
      className="bg-white p-4 rounded-theme border border-slate-100 shadow-sm relative overflow-hidden group"
    >
      <div className={cn("absolute top-0 right-0 w-12 h-12 bg-gradient-to-br opacity-5 rounded-bl-2xl transition-transform group-hover:scale-110", colorMap[color])} />
      
      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className={cn(
          "p-1.5 rounded-lg bg-gradient-to-br ring-1 shadow-sm",
          colorMap[color]
        )}>
          {React.cloneElement(icon, { className: "w-3.5 h-3.5" })}
        </div>
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm",
          trend === "up" ? "bg-emerald-50/50 text-emerald-600 border border-emerald-100" : "bg-rose-50/50 text-rose-600 border border-rose-100"
        )}>
          {trend === "up" ? <ArrowUpRight className="w-2 h-2" /> : <ArrowDownRight className="w-2 h-2" />}
          {change}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{title}</p>
        <p className="text-xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
};
