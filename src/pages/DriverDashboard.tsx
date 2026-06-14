import { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Truck, MapPin, 
  LogOut, Phone, Package, Navigation, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/utils';

export const DriverDashboard = () => {
  const { user, orders, clients, updateOrderStatus, logout } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Get active/dispatched orders for today
  const activeOrders = orders.filter(o => 
    (o.status === 'CONFIRMED' || o.status === 'DISPATCHED' || o.status === 'ISSUE') &&
    new Date(o.deliveryDate).toDateString() === new Date().toDateString()
  );

  const filteredOrders = activeOrders.filter(o => {
    const client = clients.find(c => c.id === o.clientId);
    return client?.companyName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleArrived = () => {
    alert('Arrival notification sent to client!');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans pb-20 overflow-x-hidden">
      {/* Driver Header */}
      <header className="p-6 bg-slate-800/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Truck className="text-slate-900 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">{user?.name}</h1>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Active Duty • {activeOrders.length} Drops</p>
            </div>
          </div>
          <button 
            onClick={() => { if(window.confirm('Logout from route?')) logout(); }}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destination..."
            className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-sm"
          />
        </div>

        {/* Trip Sheet */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Today's Trip Sheet</p>
          
          {filteredOrders.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
                <Navigation className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-slate-500 font-bold">No drops assigned</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const client = clients.find(c => c.id === order.clientId);
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={order.id} 
                  className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-6 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-white">{client?.companyName}</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">{client?.clientNumber} • {order.id}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[9px] font-black uppercase",
                      order.status === 'DISPATCHED' ? "bg-amber-500 text-slate-900" : "bg-white/10 text-white"
                    )}>
                      {order.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client?.address || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                    >
                      <Navigation className="w-5 h-5 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Navigate</span>
                    </a>
                    <a 
                      href={`tel:${client?.phone}`}
                      className="flex flex-col items-center gap-2 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Call Client</span>
                    </a>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => handleArrived()}
                      className="w-full py-4 bg-amber-500 text-slate-900 font-black rounded-2xl hover:bg-amber-400 transition-all active:scale-95 text-sm uppercase tracking-widest shadow-lg shadow-amber-500/20"
                    >
                      Notify Arrival
                    </button>
                    {order.status === 'CONFIRMED' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'DISPATCHED')}
                        className="w-full py-4 bg-white/10 text-white font-black rounded-2xl hover:bg-white/20 transition-all active:scale-95 text-sm uppercase tracking-widest border border-white/10"
                      >
                        Start Delivery
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* Bottom Floating Stats */}
      <div className="fixed bottom-6 left-4 right-4 z-50">
        <div className="max-w-lg mx-auto bg-amber-500 text-slate-900 p-4 rounded-[2rem] shadow-2xl flex justify-between items-center ring-4 ring-slate-900">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900/10 rounded-xl flex items-center justify-center">
               <Package className="w-5 h-5" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase leading-none opacity-60">Status</p>
               <p className="text-sm font-black uppercase leading-tight">On Route</p>
             </div>
           </div>
           <div className="flex gap-4 pr-2">
             <div className="text-right">
               <p className="text-[10px] font-black uppercase leading-none opacity-60">Done</p>
               <p className="text-lg font-black leading-none">0/{activeOrders.length}</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
