
import React, { useState } from 'react';
import { Hexagon, Lock, User as UserIcon, LogIn, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from './ToastSystem';
import { AuthResponse } from '../types';

interface LoginProps {
  onLoginSuccess: (authData: AuthResponse) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Username and password are required");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({ email, password });
      toast.success(`Welcome back, ${response.user.name}`, "Login Successful");
      onLoginSuccess(response);
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials", "Authentication Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-dark-bg selection:bg-neon-teal selection:text-black">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-neon-teal/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[120px]" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="max-w-md w-full animate-fade-in relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-neon-teal to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,242,234,0.4)] mb-4 animate-float">
             <Hexagon className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            Neon<span className="text-neon-teal">Flow</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium tracking-wide">ENTER THE ARCHIVE</p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-card border border-dark-border p-8 rounded-3xl shadow-2xl glass-panel relative overflow-hidden group">
          {/* Top border glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-teal/50 to-transparent" />
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UserIcon className="w-3 h-3 text-neon-teal" /> Username / Email
              </label>
              <div className="relative group/input">
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg/50 border border-dark-border text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-neon-teal focus:ring-1 focus:ring-neon-teal/30 transition-all placeholder-slate-600"
                  placeholder="admin"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3 text-neon-purple" /> Access Key
              </label>
              <div className="relative group/input">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg/50 border border-dark-border text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple/30 transition-all placeholder-slate-600"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
               <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-dark-border flex items-center justify-center transition-all group-hover:border-neon-teal">
                    <ShieldCheck className="w-3 h-3 text-neon-teal opacity-0 group-hover:opacity-100" />
                  </div>
                  <span className="text-xs text-slate-400">Trusted Device</span>
               </label>
               <button type="button" className="text-xs text-slate-500 hover:text-white transition-colors">Forgot Key?</button>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-neon-teal to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black rounded-2xl shadow-[0_0_25px_rgba(0,242,234,0.3)] hover:shadow-[0_0_35px_rgba(0,242,234,0.5)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  INITIALIZE SESSION
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-dark-border/50 text-center">
            <p className="text-xs text-slate-500">
              NeonFlow Secure Inventory Core v1.4<br/>
              Restricted Area • Authorized Personnel Only
            </p>
          </div>
        </div>

        {/* Login Hint (for the prompt specific requirement) */}
        <div className="mt-6 text-center animate-pulse">
            <p className="text-xs text-slate-600 font-mono">
              DEBUG_HINT: admin / 22
            </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
