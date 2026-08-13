import React, { useState, useEffect } from 'react';
import { Lock, Activity, ShieldAlert, ArrowRight } from 'lucide-react';

const CORRECT_HASH = '6344b4e746871aff96f0b945d948fc2dc6691b191cfc8a31ce6ff16e660a3071';

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);                    
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hash = await sha256(password);
    if (hash === CORRECT_HASH) {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="p-8 text-center bg-gray-50/50 dark:bg-gray-950/50 border-b border-gray-100 dark:border-gray-800">
          <div className="mx-auto w-16 h-16 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] overflow-hidden bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4">
             <img src="/logo.png" alt="Ozi Algo Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">Ozi Algo Trade</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Yapay Zeka Destekli Portföy Yönetimi</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Sisteme Giriş Şifresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border ${error ? 'border-rose-500 ring-rose-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-rose-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                  <ShieldAlert className="w-4 h-4" /> Hatalı şifre, lütfen tekrar deneyin.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Giriş Yap <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          

        </div>
      </div>
    </div>
  );
}
