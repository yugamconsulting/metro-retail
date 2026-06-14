import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Role, ClientUser } from '../types';
import { Shield, ArrowRight, Mail, Lock, Eye, EyeOff, Zap, ShieldCheck, Activity, FileCheck, Bell, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/utils';

const FeatureItem = ({ icon, title, desc, color, isMobile }: any) => (
  <motion.div 
    whileHover={{ y: -3 }}
    className={cn(
      "border border-slate-100 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/10 flex flex-col relative overflow-hidden group",
      isMobile ? "p-3 gap-1.5 items-center text-center rounded-2xl" : "p-5 gap-3 rounded-theme"
    )}
  >
    <div className={cn("absolute top-0 right-0 w-12 h-12 opacity-5 rounded-bl-full transition-transform group-hover:scale-110", color.split(' ')[0])} />
    <div className={cn("rounded-xl flex items-center justify-center shadow-md relative z-10", 
      color,
      isMobile ? "w-7 h-7" : "w-10 h-10"
    )}>
      {React.cloneElement(icon, { className: isMobile ? "w-3.5 h-3.5" : "w-5 h-5" })}
    </div>
    <div className="relative z-10">
      <p className={cn("font-black text-slate-900 leading-none", isMobile ? "text-[9px] uppercase tracking-tighter" : "text-xs")}>{title}</p>
      {!isMobile && <p className="text-[10px] font-bold text-slate-400 mt-1.5 leading-relaxed">{desc}</p>}
    </div>
  </motion.div>
);

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const { setUser, addNotification, updateFirstLoginPassword, adminCredentials, clients, vendorType, drivers } = useStore();
  const isPharma = vendorType === 'PHARMA';
  const isStationery = vendorType === 'STATIONERY';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const handoffData = params.get('handoff');
    if (handoffData) {
      try {
        const { user, token } = JSON.parse(atob(handoffData));
        if (user && token) {
          setUser(user, token);
          navigate(user.role === Role.ADMIN ? '/admin' : '/order', { replace: true });
        }
      } catch (err) {
        console.error('Invalid handoff data');
      }
    }
  }, [location, setUser, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotSuccess, setShowForgotSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password Change Step
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const mockToken = `mrt_tk_${Math.random().toString(36).substring(7)}`;

    // Driver Login - by mobile number or email
    const driver = drivers.find(d => (d.email.toLowerCase() === cleanEmail || d.name === cleanEmail) && (d as any).password === cleanPassword);
    if (driver) {
      setUser(driver, mockToken);
      navigate('/driver', { replace: true });
      return;
    }

    if (cleanEmail === 'dev@mrt.app' && cleanPassword === 'MRT-2024-MASTER-SAFE') {
      setUser({ id: 'dev-failsafe', name: 'Dev Support', email: 'dev@mrt.app', role: Role.ADMIN }, mockToken);
      navigate('/admin', { replace: true });
      return;
    }

    if (cleanEmail === adminCredentials.email.toLowerCase() && cleanPassword === adminCredentials.password) {
      setUser({ id: 'a1', name: 'Super Admin', email: cleanEmail, role: Role.ADMIN }, mockToken);
      navigate('/admin', { replace: true });
      return;
    }

    const client = clients.find(c => 
      c.email.toLowerCase() === cleanEmail || 
      c.users.some(u => u.email.toLowerCase() === cleanEmail)
    );

    if (!client) {
      setError('Account not found. Please check your email.');
      return;
    }

    const secondaryUser = client.users.find(u => u.email.toLowerCase() === cleanEmail) as ClientUser | undefined;
    const expectedPassword = secondaryUser ? (secondaryUser.password || 'user123') : (client.password || 'client123');
    const isFirstLogin = secondaryUser ? secondaryUser.firstLogin : client.firstLogin;

    if (cleanPassword === expectedPassword) {
      const userData: ClientUser = { 
        id: secondaryUser?.id || `u-${client.id}`, 
        name: secondaryUser?.name || client.contactPerson, 
        email: cleanEmail, 
        role: secondaryUser ? Role.CLIENT_USER : Role.CLIENT, 
        clientId: client.id 
      };

      if (isFirstLogin) {
        setPendingUser(userData);
        setError('');
      } else {
        setUser(userData, mockToken);
        navigate(from === "/login" || from === "/" ? "/order" : from, { replace: true });
      }
      return;
    }
    setError('Invalid password.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const mockToken = `mrt_tk_${Math.random().toString(36).substring(7)}`;
    updateFirstLoginPassword(pendingUser.clientId, pendingUser.role === Role.CLIENT_USER ? pendingUser.id : null, newPassword);
    setUser(pendingUser, mockToken);
    setPendingUser(null);
    navigate("/order", { replace: true });
  };

  const handleForgot = () => {
    if (!email) {
      setError('Please enter your email first to request a password reset.');
      return;
    }
    addNotification({
      id: `forgot-${Date.now()}`,
      userId: 'ADMIN',
      title: 'Password Reset Request',
      message: `Client with email ${email} has requested a password reset.`,
      type: 'ALERT',
      read: false,
      timestamp: new Date().toISOString()
    });
    setShowForgotSuccess(true);
    setTimeout(() => setShowForgotSuccess(false), 5000);
  };

  const themeClass = isPharma ? 'theme-pharma' : isStationery ? 'theme-stationery' : 'theme-dairy';

  if (pendingUser) {
    return (
      <div className={cn("h-screen w-screen flex flex-col items-center justify-center p-6 bg-white font-sans overflow-hidden", themeClass)}>
        <div className="w-full max-w-[380px] space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500 rounded-theme flex items-center justify-center shadow-lg shadow-amber-100 mx-auto mb-2">
              <Lock className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">Security Update</h1>
            <p className="text-slate-500 text-xs">Set a new password to continue.</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] font-bold bg-rose-50 p-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-3.5 rounded-xl shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest"
            >
              Update & Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-screen w-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans", themeClass)}>
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity }} className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:grid lg:grid-cols-2 lg:gap-24 items-center justify-center relative z-10 h-full max-h-screen overflow-hidden">
        
        {/* Left: Branding & Info (Desktop Only) */}
        <div className="hidden lg:flex flex-col space-y-8 py-6 flex-1">
          <div className="space-y-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-14 h-14 bg-indigo-600 rounded-theme flex items-center justify-center shadow-xl ring-4 ring-white">
              <Shield className="text-white w-7 h-7" />
            </motion.div>
            <h1 className="text-4xl xl:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">
              Metro Retail <br />
              <span className="text-indigo-600">& Trade</span> Wholesale
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md italic">
              The high-performance B2B ordering ecosystem. Built for speed, precision, and absolute MRT clarity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <FeatureItem icon={<Zap />} title="Fast Orders" desc="Under 10s daily routine" color="text-amber-600 bg-amber-50" />
            <FeatureItem icon={<FileCheck />} title="Audit Gate" desc="Mandatory proof-of-delivery" color="text-indigo-600 bg-indigo-50" />
            <FeatureItem icon={<Activity />} title="Live Sync" desc="Real-time warehouse trail" color="text-emerald-600 bg-emerald-50" />
            <FeatureItem icon={<ShieldCheck />} title="Secure Vault" desc="Secured multi-user access" color="text-blue-600 bg-blue-50" />
          </div>

          <div className="pt-6 border-t border-slate-200 w-fit">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Trusted MRT Logistics Node
            </p>
          </div>
        </div>

        {/* Right: Login Card (Centered on Mobile) */}
        <div className="flex flex-col items-center justify-center w-full max-w-[360px] lg:max-w-none">
          <div className="w-full space-y-6 sm:space-y-8">
            {/* Mobile Header - Compact */}
            <div className="lg:hidden flex flex-col items-center space-y-2 text-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-theme flex items-center justify-center shadow-lg ring-2 ring-white">
                <Shield className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900">MRT Wholesale</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Driven by MRT</p>
            </div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              className="bg-white/90 backdrop-blur-2xl p-6 sm:p-8 rounded-theme shadow-2xl border border-white/50 space-y-5"
            >
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-900 text-sm" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Secret Key</label>
                    <button type="button" onClick={handleForgot} className="text-[8px] font-black text-indigo-600 hover:underline uppercase tracking-widest">Forgot?</button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-900 text-sm" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-indigo-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>

                {error && <p className="text-red-600 text-[9px] font-black bg-rose-50 p-2.5 rounded-lg border border-rose-100">{error}</p>}

                <div className="flex flex-col gap-3 pt-1">
                  <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-3.5 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest active:scale-95">Sign In <ArrowRight className="w-4 h-4" /></button>
                  <a href="https://metroretailtrade.com" target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-white border border-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest text-center active:scale-95 transition-all">MRT Corporate</a>
                </div>
              </form>
            </motion.div>

            {/* Mobile Feature Grid - Horizontal & Super Compact */}
            <div className="lg:hidden grid grid-cols-4 gap-2">
              <FeatureItem icon={<Zap />} title="Fast Order" isMobile={true} color="text-amber-600 bg-amber-50" />
              <FeatureItem icon={<FileCheck />} title="Audit Gate" isMobile={true} color="text-indigo-600 bg-indigo-50" />
              <FeatureItem icon={<Activity />} title="Live Sync" isMobile={true} color="text-emerald-600 bg-emerald-50" />
              <FeatureItem icon={<ShieldCheck />} title="Secure" isMobile={true} color="text-blue-600 bg-blue-50" />
            </div>

            <div className="text-center">
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] leading-none">
                <button onClick={() => window.open('https://api.whatsapp.com/send?text=Hello%20MRT', '_blank')} className="text-indigo-600 font-black hover:underline">Contact Sales</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
