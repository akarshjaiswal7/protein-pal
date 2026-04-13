import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Dumbbell, Mail, Lock, Eye, EyeOff, Shield, Stethoscope, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const roleConfig: Record<string, { label: string; icon: any; gradient: string; glow: string; accent: string; description: string }> = {
  User: {
    label: 'Customer Portal',
    icon: User,
    gradient: 'from-emerald-500 to-green-600',
    glow: '#4ade80',
    accent: 'focus:border-emerald-500/50',
    description: 'Sign in to track your protein and reach your goals',
  },
  Nutritionist: {
    label: 'Nutritionist Portal',
    icon: Stethoscope,
    gradient: 'from-cyan-500 to-blue-600',
    glow: '#22d3ee',
    accent: 'focus:border-cyan-500/50',
    description: 'Access your clinical dashboard and patient management',
  },
  Admin: {
    label: 'Administrator Portal',
    icon: Shield,
    gradient: 'from-violet-500 to-purple-700',
    glow: '#a855f7',
    accent: 'focus:border-violet-500/50',
    description: 'Platform management and user administration tools',
  },
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const roleContext = searchParams.get('role') || 'User';
  const config = roleConfig[roleContext] || roleConfig.User;
  const RoleIcon = config.icon;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (roleContext !== 'User' && res.role !== roleContext) {
        toast.error(`Access Denied: You do not have ${roleContext} privileges.`);
        setLoading(false);
        return;
      }

      login(res.userId.toString(), res.username, res.token, res.role);
      toast.success(`Welcome back, ${res.username}!`);

      if (res.role === 'Admin') navigate('/admin');
      else if (res.role === 'Nutritionist') navigate('/nutritionist');
      else navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const gradientBtn = roleContext === 'Admin'
    ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
    : roleContext === 'Nutritionist'
      ? 'linear-gradient(135deg, #22d3ee, #3b82f6)'
      : 'linear-gradient(135deg, #4ade80, #22c55e)';

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060b18 0%, #0d1424 50%, #060b18 100%)' }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-6 blur-3xl"
          style={{ background: `radial-gradient(circle, ${config.glow}, transparent 70%)` }} />
      </div>
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative">
        
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-6 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Portal Selection
        </button>

        <div className="rounded-3xl border border-white/10 p-8 shadow-2xl" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)' }}>
          <div className="mb-8 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg mb-4`}
            >
              <RoleIcon className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{config.label}</h1>
            <p className="mt-1.5 text-sm text-white/40 text-center max-w-xs">{config.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/60 text-xs uppercase tracking-widest font-semibold">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="email" type="email" placeholder="your@email.com"
                  className={`pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-12 ${config.accent}`}
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <Label className="text-white/60 text-xs uppercase tracking-widest font-semibold">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                  className={`pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-12 ${config.accent}`}
                  value={password} onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <Button type="submit"
              className="w-full h-12 rounded-xl text-base font-bold mt-2 text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ background: gradientBtn }} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {roleContext === 'User' && (
            <p className="mt-6 text-center text-sm text-white/40">
              New customer?{' '}
              <Link to="/signup" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">Create account</Link>
            </p>
          )}
          {roleContext !== 'User' && (
            <p className="mt-6 text-center text-xs text-white/25 italic">Staff credentials provided by your administrator.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
