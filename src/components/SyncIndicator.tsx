import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Cloud, CloudOff, RefreshCw, CheckCircle, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const SyncIndicator = () => {
  const { syncStatus, lastSyncedAt, syncLog } = useStore();
  const isOnline = useNetworkStatus();
  const [showLog, setShowLog] = useState(false);

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-amber-50 text-amber-700 border-amber-100 text-[10px] font-bold uppercase tracking-wider shadow-sm">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Offline Mode</span>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'SYNCING':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
          text: 'Syncing...',
          className: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        };
      case 'SAVED':
        return {
          icon: <CheckCircle className="w-3.5 h-3.5" />,
          text: 'Synced',
          className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        };
      case 'ERROR':
        return {
          icon: <CloudOff className="w-3.5 h-3.5" />,
          text: 'Error',
          className: 'bg-rose-50 text-rose-600 border-rose-100',
        };
      default:
        return {
          icon: <Cloud className="w-3.5 h-3.5 text-slate-400" />,
          text: lastSyncedAt ? `Active` : 'Standby',
          className: 'bg-slate-50 text-slate-500 border-slate-100',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowLog(!showLog)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all whitespace-nowrap",
          config.className
        )}
      >
        {config.icon}
        <span>{config.text}</span>
      </motion.button>

      <AnimatePresence>
        {showLog && (
          <>
            <div className="fixed inset-0 z-[190]" onClick={() => setShowLog(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[200] overflow-hidden"
            >
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Sync Health</span>
                <div className="flex items-center gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOnline ? "bg-green-500" : "bg-rose-500")} />
                  <span className="text-[10px] font-black text-slate-400 uppercase">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                {syncLog.length === 0 ? (
                  <div className="py-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No activity recorded</div>
                ) : (
                  syncLog.map(entry => (
                    <div key={entry.id} className="p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100 text-left">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-slate-900">{entry.action}</span>
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded-full font-bold",
                          entry.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {entry.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight">{entry.details}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[9px] font-bold text-slate-400">Conflict Resolution: Server Priority</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
