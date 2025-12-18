
import React, { useState, useContext } from 'react';
import { ThemeContext } from '../App';
import { Eye, EyeOff, Lock, Mail, Moon, Sun, LogIn } from 'lucide-react';
import { signIn, isAuthAvailable } from '@/src/services/auth';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Check if Firebase is available
    if (!isAuthAvailable()) {
      // Fallback to demo mode if Firebase not configured
      setTimeout(() => {
        setIsLoading(false);
        onLogin();
      }, 800);
      return;
    }

    try {
      // Sign in existing user
      const { user, error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
        setIsLoading(false);
        return;
      }
      if (user) {
        onLogin();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans transition-colors duration-300 ${isDarkMode ? 'bg-black text-zinc-100' : 'bg-white text-zinc-900'}`}>

      {/* Theme Toggle Top Right */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${isDarkMode ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-100' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'}`}
      >
        {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      {/* Logo Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg tracking-tighter ${isDarkMode ? 'bg-white text-black' : 'bg-zinc-950 text-white'}`}>
            AR
          </div>
          <div className="flex flex-col">
            <h1 className={`text-lg font-bold tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>AR MANAGER</h1>
            <span className={`text-[10px] font-medium tracking-wide uppercase ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Cement Business Management</span>
          </div>
        </div>
        <p className={`text-sm mt-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Sign in to manage your cement business
        </p>
      </div>

      {/* Login Card */}
      <div className={`w-full max-w-[400px] border rounded-xl shadow-sm p-8 transition-colors ${isDarkMode ? 'bg-[#09090b] border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="mb-6">
          <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Sign In
          </h2>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Enter your credentials to access your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-4 p-3 rounded-lg text-xs ${isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`} htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-zinc-700 placeholder:text-zinc-600' : 'bg-white border-zinc-200 focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 placeholder:text-zinc-400'}`}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`} htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-9 pr-10 py-2 border rounded-lg text-sm outline-none transition-all ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:border-zinc-700 placeholder:text-zinc-600' : 'bg-white border-zinc-200 focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 placeholder:text-zinc-400'}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-sm font-medium py-2.5 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-2 ${isDarkMode ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-950 hover:bg-zinc-900 text-white'}`}
          >
            {isLoading ? (
              <div className={`w-4 h-4 border-2 rounded-full animate-spin ${isDarkMode ? 'border-zinc-900/30 border-t-zinc-900' : 'border-white/30 border-t-white'}`} />
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Firebase Status Indicator */}
        {!isAuthAvailable() && (
          <div className={`mt-6 p-3 rounded-lg text-xs ${isDarkMode ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
            ⚠️ Firebase not configured. Using demo mode - any credentials work.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xs ${isDarkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>
          N
        </div>
      </div>
    </div>
  );
}

