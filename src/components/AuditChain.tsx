import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2, Truck, PackageCheck, AlertCircle, XCircle, User } from 'lucide-react';
import { cn, formatDate, timeAgo } from '../utils/utils';
import { OrderStatus } from '../types';

interface AuditChainProps {
  logs: any[];
  status: OrderStatus;
}

const statusMap = {
  PENDING: { icon: <ShoppingCart />, label: 'Placed', color: 'indigo' },
  CONFIRMED: { icon: <CheckCircle2 />, label: 'Confirmed', color: 'blue' },
  DISPATCHED: { icon: <Truck />, label: 'In Transit', color: 'amber' },
  DELIVERED: { icon: <PackageCheck />, label: 'Delivered', color: 'emerald' },
  ISSUE: { icon: <AlertCircle />, label: 'Issue', color: 'rose' },
  CANCELLED: { icon: <XCircle />, label: 'Cancelled', color: 'slate' },
};

export const AuditChain = ({ logs, status }: AuditChainProps) => {
  return (
    <div className="relative py-8">
      {/* Connector Line */}
      <div className="absolute left-[2.25rem] top-0 bottom-0 w-0.5 bg-slate-100" />
      
      <div className="space-y-12 relative z-10">
        {logs.map((log, index) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={index} 
            className="flex items-start gap-6 group"
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ring-4 ring-white shrink-0",
              log.action === 'ORDER_PLACED' ? "bg-indigo-600 text-white" :
              log.action === 'DELIVERY_CONFIRMED' ? "bg-emerald-500 text-white" :
              log.action === 'ISSUE_REPORTED' ? "bg-rose-500 text-white" :
              "bg-slate-100 text-slate-400"
            )}>
              {log.action === 'ORDER_PLACED' ? <ShoppingCart className="w-5 h-5" /> :
               log.action === 'DELIVERY_CONFIRMED' ? <PackageCheck className="w-5 h-5" /> :
               log.action === 'ISSUE_REPORTED' ? <AlertCircle className="w-5 h-5" /> :
               <User className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 pt-1">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.action.replace('_', ' ')}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                      <User className="w-3 h-3" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      User: <span className="text-indigo-600">{log.userId}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-900">{timeAgo(log.timestamp)}</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase">{formatDate(log.timestamp)}</p>
                </div>
              </div>
              <p className="mt-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 font-medium leading-relaxed">
                {log.details}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Current Status Preview */}
        <div className="flex items-center gap-6">
           <div className={cn(
             "w-12 h-12 rounded-2xl flex items-center justify-center ring-4 ring-white animate-pulse",
             status === 'DELIVERED' ? "bg-emerald-50 text-emerald-600" :
             status === 'PENDING' ? "bg-indigo-50 text-indigo-600" :
             status === 'ISSUE' ? "bg-rose-50 text-rose-600" :
             status === 'DISPATCHED' ? "bg-amber-50 text-amber-600" :
             "bg-slate-50 text-slate-600"
           )}>
             {statusMap[status].icon}
           </div>
           <div className="flex-1 py-4 px-6 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</p>
                <p className="text-sm font-black text-slate-900 uppercase">{statusMap[status].label}</p>
              </div>
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                status === 'DELIVERED' ? "bg-emerald-100 text-emerald-700" :
                status === 'PENDING' ? "bg-indigo-100 text-indigo-700" :
                status === 'ISSUE' ? "bg-rose-100 text-rose-700" :
                status === 'DISPATCHED' ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-700"
              )}>Live</span>
           </div>
        </div>
      </div>
    </div>
  );
};
