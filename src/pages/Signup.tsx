import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username: form.name, email: form.email, password: form.password })
      });
      const loginRes = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      login(loginRes.userId.toString(), loginRes.username, loginRes.token, loginRes.role || 'User');
      toast.success('Account created! Welcome to ProteinPal 🎉');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const passwordStrength = () => {
    if (form.password.length === 0) return null;
    if (form.password.length < 6) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (form.password.length < 10) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  };

  const strength = passwordStrength();

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1f36 50%, #0f172a 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #4ade80, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #22d3ee, transparent)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative">
        <div className="rounded-3xl border border-white/10 p-8 shadow-2xl" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)' }}>
          
          <div className="mb-8 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }}
            >
              <Dumbbell className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h1>
            <p className="mt-1.5 text-sm text-white/50">Start your protein journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs uppercase tracking-widest font-semibold">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20 h-12"
                  placeholder="Alex Johnson" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <Label className="text-white/70 text-xs uppercase tracking-widest font-semibold">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input type="email" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:border-emerald-500/50 h-12"
                  placeholder="alex@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            <div>
              <Label className="text-white/70 text-xs uppercase tracking-widest font-semibold">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input type={showPass ? 'text' : 'password'} className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:border-emerald-500/50 h-12"
                  placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-xs text-white/40 mt-1">{strength.label} password</p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <Label className="text-white/70 text-xs uppercase tracking-widest font-semibold">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input type={showConfirm ? 'text' : 'password'} className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus:border-emerald-500/50 h-12"
                  placeholder="••••••••" value={form.confirm} onChange={e => update('confirm', e.target.value)} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {form.confirm && form.confirm === form.password && (
                  <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                )}
              </div>
              {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm}</p>}
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold mt-2 text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{' '}
            <Link to="/login?role=User" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
