import { useState } from 'react';
import { User, Mail, Weight, Activity, Target, Utensils, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockUser } from '@/lib/data';
import { toast } from 'sonner';

const Profile = () => {
  const [form, setForm] = useState({
    username: mockUser.username,
    email: mockUser.email,
    age: String(mockUser.age),
    weight: String(mockUser.weight),
    gender: mockUser.gender,
    activityLevel: mockUser.activityLevel,
    proteinGoal: String(mockUser.proteinGoalPerDay),
    goal: mockUser.goal,
    preference: mockUser.preference,
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => toast.success('Profile updated successfully!');

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Profile</h1>
          <p className="mb-8 text-muted-foreground">Manage your account and fitness goals</p>

          {/* Avatar */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
              {form.username.charAt(0)}
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{form.username}</p>
              <p className="text-sm text-muted-foreground">{form.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Personal Info */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Personal Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Username</Label><Input className="mt-1" value={form.username} onChange={e => update('username', e.target.value)} /></div>
                <div><Label>Email</Label><Input className="mt-1" value={form.email} onChange={e => update('email', e.target.value)} /></div>
                <div><Label>Age</Label><Input type="number" className="mt-1" value={form.age} onChange={e => update('age', e.target.value)} /></div>
                <div><Label>Weight (kg)</Label><Input type="number" className="mt-1" value={form.weight} onChange={e => update('weight', e.target.value)} /></div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => update('gender', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Male', 'Female', 'Other'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Activity Level</Label>
                  <Select value={form.activityLevel} onValueChange={v => update('activityLevel', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Goals & Preferences</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Protein Goal (g/day)</Label>
                  <Input type="number" className="mt-1" value={form.proteinGoal} onChange={e => update('proteinGoal', e.target.value)} />
                </div>
                <div>
                  <Label>Fitness Goal</Label>
                  <Select value={form.goal} onValueChange={v => update('goal', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Muscle Gain', 'Weight Loss', 'Maintenance'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Diet Preference</Label>
                  <Select value={form.preference} onValueChange={v => update('preference', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Vegetarian', 'Non-Veg', 'Vegan', 'Pescatarian'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
