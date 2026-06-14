import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, Zap, Users, Package, FileText, Settings, X, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export const CommandPalette = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const { clients, products, setActiveView, setShowProductModal, setShowClientModal } = useStore() as any;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle logic is handled in parent, but good to have a listener
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const actions = [
    { id: 'add-product', title: 'Add New Product', icon: <Package className="w-4 h-4" />, category: 'Actions', run: () => { setActiveView('products'); setShowProductModal(true); } },
    { id: 'add-client', title: 'Register New Client', icon: <Users className="w-4 h-4" />, category: 'Actions', run: () => { setActiveView('clients'); setShowClientModal(true); } },
    { id: 'gen-report', title: 'Generate Performance Report', icon: <FileText className="w-4 h-4" />, category: 'Actions', run: () => { setActiveView('reports'); } },
    { id: 'view-settings', title: 'Account Settings', icon: <Settings className="w-4 h-4" />, category: 'System', run: () => { setActiveView('settings'); } },
  ];

  const filteredActions = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));
  const filteredClients = clients.filter((c: any) => c.companyName.toLowerCase().includes(query.toLowerCase())).slice(0, 3);
  const filteredProducts = products.filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-900 placeholder:text-slate-300"
            />
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Command className="w-3 h-3" /> K
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {/* Actions */}
            {filteredActions.length > 0 && (
              <div className="space-y-2">
                <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</p>
                {filteredActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => { action.run(); onClose(); }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-indigo-50 rounded-2xl transition-colors group"
                  >
                    <div className="w-10 h-10 bg-slate-50 group-hover:bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                      {action.icon}
                    </div>
                    <span className="flex-1 text-left font-bold text-slate-700 group-hover:text-indigo-900">{action.title}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            )}

            {/* Clients */}
            {query && filteredClients.length > 0 && (
              <div className="space-y-2">
                <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clients</p>
                {filteredClients.map((client: any) => (
                  <button
                    key={client.id}
                    onClick={() => { setActiveView('clients'); onClose(); }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-emerald-50 rounded-2xl transition-colors group"
                  >
                    <div className="w-10 h-10 bg-emerald-50 group-hover:bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-700 group-hover:text-emerald-900">{client.companyName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{client.clientNumber}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Products */}
            {query && filteredProducts.length > 0 && (
              <div className="space-y-2">
                <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Products</p>
                {filteredProducts.map((product: any) => (
                  <button
                    key={product.id}
                    onClick={() => { setActiveView('products'); onClose(); }}
                    className="w-full flex items-center gap-4 p-3 hover:bg-amber-50 rounded-2xl transition-colors group"
                  >
                    <div className="w-10 h-10 bg-amber-50 group-hover:bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-slate-700 group-hover:text-amber-900">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{product.sku}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!query && (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ready for Command</p>
                <p className="text-xs text-slate-300 max-w-[200px] mx-auto">Start typing to search products, clients, or perform MRT actions.</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>MRT Command Interface v2.0</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm">↑↓</span> Navigate</span>
              <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm">Enter</span> Select</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
