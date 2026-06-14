import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  ShoppingBag, Search, History, 
  Settings, LogOut, Package, CheckCircle2, 
  AlertCircle, Upload, Plus, Minus,
  Clock, Lock, Share2, 
  Milk, Snowflake, Beef, Box, Coffee,
  QrCode, LayoutDashboard, ShoppingCart, RefreshCw, ArrowRight, X, Bell, Zap
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
    <div className="absolute bottom-full mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-1 group-hover:translate-y-0 z-[60] whitespace-nowrap shadow-xl">
      {label}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  </div>
);
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getCutoffStatus, cn, formatDate, timeAgo } from '../utils/utils';
import { Product, OrderItem, isClientUser } from '../types';
import { SyncIndicator } from '../components/SyncIndicator';
import { useAutoSync } from '../hooks/useAutoSync';

export const ClientDashboard = () => {
  useAutoSync();
  const { 
    user, products, orders, clients, notifications, bulletins,
    addOrder, confirmDelivery, reportDeliveryIssue, 
    markNotificationRead, updateOrder, userAnalytics, logout,
    setActiveBranchId, activeBranchId, addClientBranch
  } = useStore();
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'shop', 'orders'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const userClientId = isClientUser(user) ? user.clientId : null;
  const clientData = clients.find(c => c.id === userClientId);
  const lastUnconfirmedOrder = orders.find(o => o.clientId === userClientId && !o.deliveryConfirmed);
  const securityAlert = notifications.find(n => n.userId === userClientId && n.type === 'WARNING' && !n.read);
  
  const [showDeliveryModal, setShowDeliveryModal] = useState(!!lastUnconfirmedOrder);
  const [showSecurityAlert, setShowSecurityAlert] = useState(!!securityAlert);
  const [isOrdering, setIsOrdering] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<any>(null);
  const [showQrHandoff, setShowQrHandoff] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Real-time Countdown
  const [timeLeft, setTimeLeft] = useState(getCutoffStatus());
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getCutoffStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cutoff = timeLeft;
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const hudConfig = useMemo(() => {
    const hour = new Date().getHours();
    if (lastUnconfirmedOrder) {
      return {
        title: "Audit Required",
        desc: "Please confirm yesterday's delivery",
        color: "bg-rose-600",
        accent: "bg-rose-500",
        icon: <AlertCircle className="w-5 h-5" />
      };
    }
    if (hour < 11) {
      return {
        title: "The Morning Rush",
        desc: "Place orders early for priority delivery",
        color: "bg-indigo-600",
        accent: "bg-indigo-500",
        icon: <Zap className="w-5 h-5 text-amber-400" />
      };
    }
    if (cutoff.isLocked) {
      return {
        title: "Window Closed",
        desc: "Ordering for tomorrow is now locked",
        color: "bg-slate-900",
        accent: "bg-slate-800",
        icon: <Clock className="w-5 h-5" />
      };
    }
    return {
        title: "Ordering Open",
        desc: `Closes in ${Math.floor(cutoff.secondsRemaining! / 3600)}h ${Math.floor((cutoff.secondsRemaining! % 3600) / 60)}m`,
        color: "bg-emerald-600",
        accent: "bg-emerald-500",
        icon: <CheckCircle2 className="w-5 h-5" />
    };
  }, [lastUnconfirmedOrder, cutoff]);

  // Learning-based favorites
  const favorites = useMemo(() => {
    return products
      .filter(p => p.active)
      .sort((a, b) => (userAnalytics[b.name] || 0) - (userAnalytics[a.name] || 0))
      .slice(0, 8);
  }, [products, userAnalytics]);

  const [issueDetails, setIssueDetails] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);

  const getCategoryConfig = (cat: string) => {
    const cleanCat = cat?.trim();
    switch (cleanCat) {
      case 'Dairy': return { icon: <Milk className="w-4 h-4" />, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" };
      case 'Frozen Foods': return { icon: <Snowflake className="w-4 h-4" />, color: "bg-cyan-500", light: "bg-cyan-50", text: "text-cyan-600" };
      case 'Meat': return { icon: <Beef className="w-4 h-4" />, color: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600" };
      case 'FMCG': return { icon: <Box className="w-4 h-4" />, color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600" };
      case 'Beverages': return { icon: <Coffee className="w-4 h-4" />, color: "bg-violet-500", light: "bg-violet-50", text: "text-violet-600" };
      default: return { icon: <Package className="w-4 h-4" />, color: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-600" };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING': return "bg-blue-50 text-blue-700 border-blue-100";
      case 'CONFIRMED': return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case 'DISPATCHED': return "bg-amber-50 text-amber-700 border-amber-100 animate-pulse";
      case 'DELIVERED': return "bg-green-50 text-green-700 border-green-100";
      case 'ISSUE': return "bg-rose-50 text-rose-700 border-rose-100";
      case 'CANCELLED': return "bg-slate-50 text-slate-500 border-slate-200";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const formatOrderForWhatsApp = (order: any) => {
    const clientName = clients.find(c => c.id === order.clientId)?.companyName || 'Valued Client';
    const dateStr = new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    
    let text = `📦 *ORDER CONFIRMATION*\n`;
    text += `🏢 *Client:* ${clientName}\n`;
    text += `🗓 *Delivery:* ${dateStr}\n`;
    text += `🆔 *Order ID:* ${order.id}\n`;
    text += `--------------------------\n`;
    
    order.items.forEach((item: any, index: number) => {
      const product = products.find(p => p.id === item.productId);
      text += `${index + 1}. ${product?.name} x ${item.quantity} ${product?.unit}\n`;
    });
    
    text += `--------------------------\n`;
    text += `✅ _Sent via Metro Retail and Trade_`;
    
    return encodeURIComponent(text);
  };

  const [shareOrderModal, setShareOrderModal] = useState<any>(null);

  const handleShare = (order: any) => {
    setShareOrderModal(order);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory && p.active;
  });

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const updateCart = (product: Product, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        let newQty = existing.quantity + delta;
        
        // Apply MOQ
        if (delta > 0 && newQty < product.moq) newQty = product.moq;
        
        if (newQty <= 0) return prev.filter(item => item.productId !== product.id);
        return prev.map(item => item.productId === product.id ? { ...item, quantity: newQty } : item);
      }
      if (delta > 0) return [...prev, { productId: product.id, quantity: Math.max(delta, product.moq) }];
      return prev;
    });
  };

  const handlePlaceOrder = () => {
    if (cutoff.isLocked) return;
    setIsOrdering(true);
    
    // Simulate API call
    setTimeout(() => {
      let finalOrder: any = null;

      if (editingOrderId) {
        const orderToUpdate = orders.find(o => o.id === editingOrderId);
        const updates = {
          items: [...cart],
          branchId: activeBranchId || undefined,
          auditLog: [...(orderToUpdate?.auditLog || []), {
            timestamp: new Date().toISOString(),
            userId: user?.id || 'u1',
            action: 'ORDER_EDITED',
            details: `Order items modified by client`
          }]
        };
        updateOrder(editingOrderId, updates);
        finalOrder = { ...orderToUpdate, ...updates };
        setEditingOrderId(null);
      } else {
        const timestamp = new Date();
        const datePart = format(timestamp, 'yyMMdd');
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newOrder = {
          id: `REF-${datePart}-${randomPart}`,
          clientId: userClientId || 'c1',
          branchId: activeBranchId || undefined,
          placedById: user?.id || 'u1',
          items: [...cart],
          status: 'PENDING' as const,
          createdAt: timestamp.toISOString(),
          deliveryDate: cutoff.nextDeliveryDate.toISOString(),
          auditLog: [{
            timestamp: timestamp.toISOString(),
            userId: user?.id || 'u1',
            action: 'ORDER_PLACED',
            details: `Order placed with ${cart.length} items`
          }]
        };
        addOrder(newOrder);
        finalOrder = newOrder;
      }
      
      setLastPlacedOrder(finalOrder);
      setCart([]);
      setIsOrdering(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
      setActiveTab('orders');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden pb-20">
      {/* Contextual HUD Header */}
      <motion.header 
        animate={{ backgroundColor: hudConfig.color === 'bg-white' ? '#fff' : '' }}
        className={cn("px-4 py-6 sticky top-0 z-40 shadow-2xl transition-colors duration-500", hudConfig.color)}
      >
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full text-white">
          <div className="flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-inner", hudConfig.accent)}>
              {hudConfig.icon}
            </div>
            <div>
              <h1 className="text-xl font-black leading-none tracking-tight">{hudConfig.title}</h1>
              <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">{hudConfig.desc}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">
                  {clientData?.companyName}
                </span>
                <SyncIndicator />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <IconButton 
              onClick={() => setShowQrHandoff(true)}
              label="Sync"
              className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg"
            >
              <QrCode className="w-5 h-5" />
            </IconButton>
            <IconButton 
              onClick={() => setShowSettingsMenu(true)}
              label="Account"
              className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg"
            >
              <Settings className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 overflow-y-auto max-w-5xl mx-auto w-full relative">
        {/* Delivery Blocking Banner */}
        {lastUnconfirmedOrder && (
          <div className="sticky top-0 z-30 bg-rose-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center animate-pulse">
                <AlertCircle className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold">Confirm your last delivery to continue ordering.</p>
            </div>
            <button 
              onClick={() => setShowDeliveryModal(true)}
              className="bg-white text-rose-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight shadow-sm active:scale-95 transition-transform"
            >
              Confirm Now
            </button>
          </div>
        )}

        {activeTab === 'home' && (
          <div className="p-4 space-y-8 pb-32">
            {/* Bulletin Board */}
            {bulletins.filter(b => b.active).map(b => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={b.id} 
                className="p-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                  <Bell className="w-14 h-14" />
                </div>
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-[8px] font-black uppercase rounded-full tracking-widest">Notice</span>
                    <h4 className="text-sm font-black tracking-tight">{b.title}</h4>
                  </div>
                  <p className="text-xs text-indigo-100 font-medium leading-relaxed">{b.message}</p>
                </div>
              </motion.div>
            ))}

            {/* Branch Switcher */}
            <section className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Branch</p>
                <button 
                  onClick={() => {
                    const name = prompt('Branch Name:');
                    if (name) addClientBranch(userClientId!, { id: `br-${Date.now()}`, name, address: '' });
                  }}
                  className="text-[10px] font-bold text-indigo-600 uppercase"
                >
                  + Add Branch
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                 <button 
                   onClick={() => setActiveBranchId(null)}
                   className={cn(
                     "px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border shrink-0",
                     !activeBranchId ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-100"
                   )}
                 >
                   Main HQ
                 </button>
                 {clientData?.branches?.map(br => (
                   <button 
                     key={br.id}
                     onClick={() => setActiveBranchId(br.id)}
                     className={cn(
                       "px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border shrink-0",
                       activeBranchId === br.id ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-100"
                     )}
                   >
                     {br.name}
                   </button>
                 ))}
              </div>
            </section>

            {/* Ritual Section: Duplicate Yesterday */}
            <section className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Daily Ritual</p>
              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={!!lastUnconfirmedOrder || cutoff.isLocked}
                onClick={() => {
                  const lastOrder = orders.find(o => o.clientId === userClientId && o.status !== 'CANCELLED');
                  if (lastOrder) {
                    setCart(lastOrder.items.map(item => ({ ...item })));
                  }
                }}
                className="w-full bg-indigo-600 p-8 rounded-theme text-left relative overflow-hidden group shadow-xl shadow-indigo-200 disabled:opacity-50 disabled:grayscale disabled:shadow-none"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[4rem] group-hover:scale-110 transition-transform" />
                <div className="relative z-10 space-y-2">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md mb-2">
                    <History className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white leading-none">Duplicate Yesterday</h3>
                  <p className="text-indigo-100 text-sm font-medium">Instantly repeat your last MRT order</p>
                </div>
                {!lastUnconfirmedOrder && !cutoff.isLocked && (
                  <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                )}
              </motion.button>
            </section>

            {/* Smart Favorites Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-end px-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Quick Add Favorites</p>
                <button onClick={() => setActiveTab('shop')} className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">Browse All</button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {favorites.map(product => {
                  const config = getCategoryConfig(product.category);
                  return (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={product.id}
                      onClick={() => updateCart(product, 1)}
                      className="flex flex-col items-center gap-2 min-w-[90px] p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-indigo-100 transition-all"
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm", config.color)}>
                        {config.icon}
                      </div>
                      <p className="text-[10px] font-black text-slate-900 text-center leading-tight truncate w-full">{product.name}</p>
                      <div className="px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-100 text-[8px] font-black text-slate-400">
                        {product.unit}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* Current Workspace (Cart) */}
            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xl font-black text-slate-900">Today's Workspace</h3>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Clear All</button>
                )}
              </div>

              <div className="space-y-3">
                {cart.length === 0 ? (
                  <div className="py-20 text-center space-y-4 bg-slate-100/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                      <ShoppingBag className="w-8 h-8 text-slate-200" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-500 font-bold">Your workspace is empty</p>
                      <p className="text-slate-400 text-xs px-12">Tap "Duplicate" or "Browse" to start building today's MRT order.</p>
                    </div>
                  </div>
                ) : (
                  cart
                  .filter(item => products.some(p => p.id === item.productId)) // Fix: Filter out deleted products
                  .map(item => {
                    const product = products.find(p => p.id === item.productId)!;
                    const config = getCategoryConfig(product.category);
                    return (
                      <motion.div
                        layout
                        key={item.productId}
                        className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.light, config.text)}>
                            {React.cloneElement(config.icon, { className: "w-6 h-6" })}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-none">{product.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{product.unit}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-slate-50 rounded-[1.5rem] p-1 border border-slate-100 gap-1 overflow-hidden group/stepper">
                          <button 
                            disabled={cutoff.isLocked}
                            onClick={() => updateCart(product, -1)}
                            className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all disabled:opacity-30"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          
                          {/* Gesture-First Slider/Stepper */}
                          <motion.div 
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(_, info) => {
                              if (cutoff.isLocked) return;
                              if (info.offset.x > 50) updateCart(product, 5);
                              if (info.offset.x < -50) updateCart(product, -5);
                            }}
                            className="px-4 py-2 text-center min-w-[80px] cursor-grab active:cursor-grabbing bg-white rounded-xl shadow-sm border border-slate-100 active:bg-indigo-600 active:text-white transition-colors"
                          >
                            <p className="text-base font-black leading-none">{item.quantity}</p>
                            <p className="text-[9px] font-black opacity-50 uppercase tracking-tighter mt-1">{product.unit}</p>
                          </motion.div>

                          <button 
                            disabled={cutoff.isLocked}
                            onClick={() => updateCart(product, 1)}
                            className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all disabled:opacity-30"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="p-4 space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search SKU or Product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {categories.map(cat => {
                  const config = getCategoryConfig(cat);
                  const isSelected = selectedCategory === cat;
                  return (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border shadow-sm",
                        isSelected
                          ? cn("text-white border-transparent", config.color, "shadow-lg")
                          : "bg-white text-slate-500 border-slate-200 hover:border-indigo-200"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        isSelected ? "bg-white/20" : config.light
                      )}>
                        {config.icon}
                      </div>
                      {cat}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-24">
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <Package className="w-12 h-12 mx-auto text-slate-200" />
                  <p className="text-slate-500 font-medium">No products available in this category.</p>
                </div>
              )}
              {filteredProducts.map(product => {
                const cartItem = cart.find(i => i.productId === product.id);
                const config = getCategoryConfig(product.category);
                return (
                  <motion.div
                    layout
                    key={product.id}
                    className="bg-white p-3 rounded-3xl border border-slate-200 flex gap-4 hover:border-indigo-200 transition-colors shadow-sm"
                  >
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-sm font-black text-slate-900 leading-tight">{product.name}</h3>
                          <div className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-tighter shrink-0",
                            config.light,
                            config.text,
                            "border-current/10"
                          )}>
                            {config.icon}
                            {product.sku}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{product.unit}</p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {cartItem ? (
                          <div className="flex items-center bg-slate-50 rounded-xl p-0.5 border border-slate-100">
                            <button 
                              onClick={() => updateCart(product, -1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-black">{cartItem.quantity}</span>
                            <button 
                              onClick={() => updateCart(product, 1)}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={!!lastUnconfirmedOrder || cutoff.isLocked}
                            onClick={() => updateCart(product, 1)}
                            className="ml-auto px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                          >
                            Add to Order
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="p-4 space-y-4 pb-32">
            <h2 className="text-lg font-black mb-4">Order History</h2>
            {orders.filter(o => o.clientId === userClientId).length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No orders yet</p>
              </div>
            ) : (
              orders
              .filter(o => o.clientId === userClientId)
              .map(order => (
                <div key={order.id} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.id}</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{timeAgo(order.createdAt)} • {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconButton 
                        onClick={() => handleShare(order)}
                        label="Share"
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        <Share2 className="w-4 h-4" />
                      </IconButton>
                      {order.status === 'PENDING' && !cutoff.isLocked && (
                        <button 
                          onClick={() => {
                            setCart(order.items.map(i => ({ ...i })));
                            setEditingOrderId(order.id);
                            setActiveTab('home');
                          }}
                          className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-lg border border-amber-100"
                        >
                          Edit
                        </button>
                      )}
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-tight",
                        getStatusConfig(order.status)
                      )}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {order.items.length} items • Delivery: {formatDate(order.deliveryDate)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Action Bar (Place Order) */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-30 max-w-5xl mx-auto"
          >
            <button 
              onClick={handlePlaceOrder}
              disabled={!!lastUnconfirmedOrder || cutoff.isLocked || isOrdering}
              className="w-full bg-slate-900 text-white rounded-[2rem] p-5 shadow-2xl flex items-center justify-between group disabled:opacity-50 disabled:bg-slate-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'} Ready</p>
                  <p className="text-xl font-black leading-none">Review & Place</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pr-2">
                <span className="text-sm font-black uppercase tracking-widest group-hover:mr-2 transition-all">
                  {isOrdering ? 'Confirming...' : 'Place Order'}
                </span>
                {isOrdering ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                )}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 safe-bottom z-50">
        <div className="grid grid-cols-4 h-16 max-w-5xl mx-auto">
          <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutDashboard className="w-5 h-5" />} label="Home" />
          <NavButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<ShoppingBag className="w-5 h-5" />} label="Shop" />
          <NavButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<History className="w-5 h-5" />} label="History" />
          <NavButton
            active={false}
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) logout();
            }}
            icon={<LogOut className="w-5 h-5" />}
            label="Exit"
          />
        </div>
      </nav>

      {/* Settings/Profile Modal */}
      <AnimatePresence>
        {showSettingsMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Account Details</p>
                    <h3 className="text-2xl font-black text-slate-900">{clientData?.companyName}</h3>
                    <p className="text-xs text-slate-500 font-bold">{user?.email}</p>
                  </div>
                  <button onClick={() => setShowSettingsMenu(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">Password</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">Manage your login security</p>
                      </div>
                    </div>
                    <button className="text-xs font-black text-indigo-600 hover:underline">Change</button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-amber-600">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-none">Notifications</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">Cutoff and delivery alerts</p>
                      </div>
                    </div>
                    <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to log out?')) logout();
                  }}
                  className="w-full py-4 bg-rose-50 text-rose-600 font-black rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory Delivery Confirmation Modal */}
      <AnimatePresence>
        {showDeliveryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl shadow-slate-900/20"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-slate-900">Confirm Previous Delivery</h2>
                  <p className="text-slate-500 text-sm">
                    Order <span className="font-bold text-slate-700">#{lastUnconfirmedOrder?.id || 'Latest'}</span> was dispatched. Please confirm its receipt to proceed.
                  </p>
                </div>

                <div className="space-y-4">
                  <button className="w-full aspect-video border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                    <span className="text-sm font-semibold text-slate-500 group-hover:text-indigo-600">Upload Delivery Note Photo</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        setShowIssueModal(true);
                      }}
                      className="py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-colors text-sm border border-rose-100"
                    >
                      Report Issue
                    </button>
                    <button 
                      onClick={() => {
                        if (lastUnconfirmedOrder && user) {
                          confirmDelivery(lastUnconfirmedOrder.id, user.id);
                        }
                        setShowDeliveryModal(false);
                      }}
                      className="py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-sm"
                    >
                      Confirm Received
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Handoff Modal */}
      <AnimatePresence>
        {showQrHandoff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-black text-slate-900">Seamless Handoff</h3>
                <button onClick={() => setShowQrHandoff(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <QrCode className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border-4 border-slate-50 flex items-center justify-center mx-auto w-fit shadow-inner">
                <QRCodeSVG 
                  value={`${window.location.origin}/login?handoff=${btoa(JSON.stringify({ user, token: useStore.getState().token }))}`}
                  size={200}
                />
              </div>

              <div className="space-y-2">
                <p className="text-slate-900 font-bold">Switch to Desktop</p>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Scan this code with another device to instantly continue your MRT session without logging in again.
                </p>
              </div>

              <button 
                onClick={() => setShowQrHandoff(false)}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issue Report Modal */}
      <AnimatePresence>
        {showIssueModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Report Issue</h3>
                <button onClick={() => setShowIssueModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">What went wrong?</label>
                  <textarea 
                    value={issueDetails}
                    onChange={(e) => setIssueDetails(e.target.value)}
                    placeholder="e.g. 5 Liters leaked, or items missing..."
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium"
                  />
                </div>
                
                <button 
                  disabled={!issueDetails.trim()}
                  onClick={() => {
                    if (lastUnconfirmedOrder && user) {
                      reportDeliveryIssue(lastUnconfirmedOrder.id, user.id, issueDetails);
                    }
                    setShowIssueModal(false);
                    setShowDeliveryModal(false);
                  }}
                  className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-100 disabled:opacity-50 transition-all"
                >
                  Submit Issue Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Order Modal */}
      <AnimatePresence>
        {shareOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Order Summary</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{shareOrderModal.id}</p>
                </div>
                <button onClick={() => setShareOrderModal(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <Share2 className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 max-h-[300px] overflow-y-auto">
                  <pre className="text-xs font-medium text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {decodeURIComponent(formatOrderForWhatsApp(shareOrderModal))}
                  </pre>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={async () => {
                      await navigator.clipboard.writeText(decodeURIComponent(formatOrderForWhatsApp(shareOrderModal)));
                      alert('Order summary copied!');
                      setShareOrderModal(null);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                  >
                    Copy Text to Share
                  </button>

                  <button 
                    onClick={() => {
                      const text = decodeURIComponent(formatOrderForWhatsApp(shareOrderModal));
                      if (navigator.share) {
                        navigator.share({ title: `Order ${shareOrderModal.id}`, text });
                      } else {
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }
                      setShareOrderModal(null);
                    }}
                    className="w-full py-3 text-slate-600 font-bold rounded-2xl border border-slate-200 text-sm"
                  >
                    Open Native Share Sheet
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSecurityAlert && securityAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
                <Lock className="w-8 h-8 text-rose-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">{securityAlert.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{securityAlert.message}</p>
              </div>
              <button 
                onClick={() => {
                  markNotificationRead(securityAlert.id);
                  setShowSecurityAlert(false);
                }}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-200"
              >
                Understood
              </button>
            </div>
          </motion.div>
        )}

        {showSuccessToast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight">Order placed!</p>
              <button 
                onClick={() => handleShare(lastPlacedOrder)}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5 transition-colors active:scale-95"
              >
                <Share2 className="w-3 h-3" /> Share Order
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-1 transition-all relative px-1 py-1 h-full",
      active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
    )}
  >
    <div className={cn(
      "p-1.5 rounded-xl transition-all",
      active ? "bg-indigo-50 shadow-sm ring-1 ring-indigo-100" : ""
    )}>
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    {active && (
      <motion.div
        layoutId="nav-pill"
        className="absolute top-0 inset-x-4 h-1 bg-indigo-600 rounded-full"
      />
    )}
  </button>
);
