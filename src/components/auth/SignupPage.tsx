import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  Terminal,
  User,
  CheckCircle,
} from 'lucide-react';
import ChugliLogo from '@/components/forum/ChugliLogo';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already signed in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial, password.length >= 8].filter(
      Boolean
    ).length;
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-400' };
    return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim() || !username.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: authError } = await signUp(email, password, username);
    setLoading(false);

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        setError('An account with this email already exists. Try signing in instead.');
      } else if (authError.message.includes('Password should be at least')) {
        setError('Password must be at least 6 characters long.');
      } else if (authError.message.includes('valid email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(authError.message);
      }
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-forum-bg flex items-center justify-center px-4">
        <div className="fixed inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,45,146,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,146,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative w-full max-w-md">
          <div className="hud-panel p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-emerald-500/10 border border-emerald-500/30 p-3">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
            </div>
            <h2 className="text-[16px] font-bold text-forum-text font-mono mb-2">
              Account Created!
            </h2>
            <p className="text-[11px] text-forum-muted font-mono mb-6 leading-relaxed">
              Check your email for a confirmation link to activate your account.
              Once confirmed, you can sign in and join the community.
            </p>
            <Link
              to="/login"
              className="transition-forum inline-flex items-center gap-2 rounded-md bg-forum-pink px-4 py-2.5 text-[12px] font-bold text-white font-mono hover:bg-forum-pink/90 hover:shadow-pink-glow"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forum-bg flex items-center justify-center px-4 py-8">
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
            <span>new_user_registration</span>
          </div>
        </div>

        {/* Signup Card */}
        <div className="hud-panel p-6">
          <div className="border-b border-forum-border pb-4 mb-6">
            <h1 className="text-[16px] font-bold text-forum-text font-mono">
              Create Account
            </h1>
            <p className="text-[11px] text-forum-muted font-mono mt-1">
              Join the developer community
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
            {/* Username */}
            <div>
              <label className="block text-[11px] font-medium text-forum-muted font-mono mb-1.5">
                Username
              </label>
              <div className="relative">
                <User
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-forum-muted"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cyb3rn0va"
                  className="transition-forum w-full rounded-md border border-forum-border bg-forum-bg py-2.5 pl-9 pr-4 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:border-forum-pink focus:shadow-pink-glow focus:ring-1 focus:ring-forum-pink/30"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

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
                  autoComplete="new-password"
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
              {/* Password Strength */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-forum ${
                          i <= passwordStrength.level
                            ? passwordStrength.color
                            : 'bg-forum-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-forum-muted font-mono">
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-medium text-forum-muted font-mono mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-forum-muted"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`transition-forum w-full rounded-md border bg-forum-bg py-2.5 pl-9 pr-4 text-[12px] font-mono text-forum-text placeholder-forum-muted outline-none focus:border-forum-pink focus:shadow-pink-glow focus:ring-1 focus:ring-forum-pink/30 ${
                    confirmPassword.length > 0 && confirmPassword !== password
                      ? 'border-red-500/50'
                      : 'border-forum-border'
                  }`}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="mt-1 text-[10px] text-red-400 font-mono">
                  Passwords don't match
                </p>
              )}
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
                  <UserPlus size={14} />
                  Create Account
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

          {/* Sign In Link */}
          <p className="text-center text-[11px] text-forum-muted font-mono">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-forum-pink hover:text-glow-pink transition-forum underline underline-offset-2"
            >
              Sign In
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
