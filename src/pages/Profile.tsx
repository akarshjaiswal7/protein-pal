import { useState, useEffect } from 'react';
import { User, Mail, Save, Loader2, MessageSquareText, ShieldAlert, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Profile = () => {
  const { userId, logout, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [form, setForm] = useState({ username: '', email: '', age: '', weight: '', gender: '', activityLevel: '', proteinGoal: '' });

  const isUser = role === 'User';

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiFetch(`/user/${userId}`),
    enabled: !!userId,
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.Username || '',
        email: user.Email || '',
        age: String(user.Age || ''),
        weight: String(user.Weight || ''),
        gender: user.Gender || '',
        activityLevel: user.ActivityID ? String(user.ActivityID) : '',
        proteinGoal: String(user.ProteinGoalPerDay || ''),
      });
    }
  }, [user]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isUser) {
        await apiFetch('/user/update', {
          method: 'PUT',
          body: JSON.stringify({
            userId,
            age: Number(form.age) || null,
            weight: Number(form.weight) || null,
            gender: form.gender || null,
            activityID: Number(form.activityLevel) || null,
            proteinGoalPerDay: Number(form.proteinGoal) || null,
          })
        });
        localStorage.setItem('proteinGoal', form.proteinGoal);
      }
      toast.success('Profile saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccountMut = useMutation({
    mutationFn: () => apiFetch(`/user/${userId}`, { method: 'DELETE', body: JSON.stringify({ password: deletePassword }) }),
    onSuccess: () => { toast.success('Account deleted. Goodbye!'); logout(); window.location.href = '/'; },
    onError: (err: any) => toast.error(err.message || 'Failed to delete account.')
  });

  const iClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-emerald-500/40";
  const lClass = "text-white/50 text-xs uppercase tracking-widest font-semibold mb-1.5 block";
  const roleAccent = role === 'Admin' ? '#a855f7' : role === 'Nutritionist' ? '#22d3ee' : '#4ade80';

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
        <AppNavbar />
        <main className="container max-w-2xl py-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white/30 mr-3" /><span className="text-white/30">Loading...</span>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
      <AppNavbar />
      <main className="container max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">Profile</h1>
            <p className="text-white/40">Manage your account settings</p>
          </div>

          {/* Avatar Area */}
          <div className="rounded-2xl border p-6 flex items-center gap-5"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
              style={{ background: `linear-gradient(135deg, ${roleAccent}, ${roleAccent}99)` }}>
              {form.username?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold text-white flex items-center gap-2">
                {form.username}
                {role && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: `${roleAccent}20`, color: roleAccent }}>
                    {role}
                  </span>
                )}
              </p>
              <p className="text-white/40 text-sm">{form.email}</p>
            </div>
          </div>

          {/* Account Info — shown for all roles */}
          <div className="rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <h2 className="text-lg font-bold text-white mb-5">Account Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={lClass}><User className="inline h-3 w-3 mr-1" />Username</label>
                <Input disabled value={form.username} className={`${iClass} opacity-50`} />
              </div>
              <div>
                <label className={lClass}><Mail className="inline h-3 w-3 mr-1" />Email</label>
                <Input disabled value={form.email} className={`${iClass} opacity-50`} />
              </div>
            </div>
          </div>

          {/* User-only fields */}
          {isUser && (
            <>
              <div className="rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-lg font-bold text-white mb-5">Personal Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={lClass}>Age</label>
                    <Input type="number" className={iClass} value={form.age} onChange={e => update('age', e.target.value)} placeholder="Years" />
                  </div>
                  <div>
                    <label className={lClass}>Weight (kg)</label>
                    <Input type="number" className={iClass} value={form.weight} onChange={e => update('weight', e.target.value)} placeholder="kg" />
                  </div>
                  <div>
                    <label className={lClass}>Gender</label>
                    <Select value={form.gender} onValueChange={v => update('gender', v)}>
                      <SelectTrigger className={iClass}><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-gray-950 border-white/10 text-white">
                        {['Male', 'Female', 'Other'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={lClass}>Activity Level (1–5)</label>
                    <Input type="number" min={1} max={5} className={iClass} value={form.activityLevel} onChange={e => update('activityLevel', e.target.value)} placeholder="1 = Low, 5 = High" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <h2 className="text-lg font-bold text-white mb-2">Protein Goal</h2>
                <p className="text-white/30 text-sm mb-4">Your daily protein target in grams.</p>
                <label className={lClass}>Target (g/day)</label>
                <Input type="number" className={iClass} value={form.proteinGoal} onChange={e => update('proteinGoal', e.target.value)} placeholder="e.g. 150" />
              </div>
            </>
          )}

          {isUser && (
            <Button onClick={handleSave} className="w-full h-12 rounded-xl font-bold text-black hover:opacity-90 transition-all"
              style={{ background: `linear-gradient(135deg, ${roleAccent}, ${roleAccent}cc)` }} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
            </Button>
          )}

          {/* Danger Zone — only for Users */}
          {isUser && (
            <div className="rounded-2xl border p-6" style={{ background: 'rgba(248,113,113,0.04)', borderColor: 'rgba(248,113,113,0.15)' }}>
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5" /> Danger Zone
              </h2>
              <p className="text-sm text-white/40 mb-4">Permanently delete your account and all associated data.</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-red-400 border border-red-500/20 hover:bg-red-500/10 rounded-xl">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-white/10" style={{ background: '#0a0f1e', color: 'white' }}>
                  <DialogHeader><DialogTitle className="text-red-400">Confirm Deletion</DialogTitle></DialogHeader>
                  <p className="text-sm text-white/50 mt-2">Enter your password to authorize this irreversible action.</p>
                  <Input type="password" placeholder="Password" value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    className="mt-3 bg-white/5 border-white/10 text-white rounded-xl h-11" />
                  <Button variant="destructive" className="mt-4 w-full rounded-xl"
                    disabled={deleteAccountMut.isPending || !deletePassword}
                    onClick={() => deleteAccountMut.mutate()}>
                    {deleteAccountMut.isPending ? 'Verifying...' : 'Permanently Delete Account'}
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
