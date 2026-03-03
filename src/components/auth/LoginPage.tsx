import { useState } from 'react';
import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Terminal } from 'lucide-react';
import ChugliLogo from '@/components/forum/ChugliLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated } = useAuth();

  // If already authenticated, redirect
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account before signing in.');
      } else {
        setError(authError.message);
      }
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-forum-bg flex items-center justify-center px-4">
      {/* Background grid effect */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,45,146,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,146,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ChugliLogo size={40} />
          </div>
          <div className="flex items-center justify-center gap-2 text-forum-muted font-mono text-[11px]">
            <Terminal size={12} />
            <span>authentication_required</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="hud-panel p-6">
          <div className="border-b border-forum-border pb-4 mb-6">
            <h1 className="text-[16px] font-bold text-forum-text font-mono">
              Sign In
            </h1>
            <p className="text-[11px] text-forum-muted font-mono mt-1">
              Access your account to join the discussion
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5">
              <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-red-400 font-mono">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-medium text-forum-muted font-mono mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-forum-muted"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="transition-forum w-full rounded-md border border-forum-border bg-forum-bg py-2.5 pl-9 pr-4 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:border-forum-pink focus:shadow-pink-glow focus:ring-1 focus:ring-forum-pink/30"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-medium text-forum-muted font-mono mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-forum-muted"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="transition-forum w-full rounded-md border border-forum-border bg-forum-bg py-2.5 pl-9 pr-10 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:border-forum-pink focus:shadow-pink-glow focus:ring-1 focus:ring-forum-pink/30"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forum-muted hover:text-forum-pink transition-forum"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="transition-forum w-full flex items-center justify-center gap-2 rounded-md bg-forum-pink px-4 py-2.5 text-[12px] font-bold text-white font-mono hover:bg-forum-pink/90 hover:shadow-pink-glow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <LogIn size={14} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-forum-border" />
            <span className="text-[10px] text-forum-muted font-mono">or</span>
            <div className="flex-1 border-t border-forum-border" />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-[11px] text-forum-muted font-mono">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-forum-pink hover:text-glow-pink transition-forum underline underline-offset-2"
            >
              Create Account
            </Link>
          </p>
        </div>

        {/* Back to Forum Link */}
        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-[10px] text-forum-muted font-mono hover:text-forum-pink transition-forum"
          >
            ← Back to Forum
          </Link>
        </div>
      </div>
    </div>
  );
}
