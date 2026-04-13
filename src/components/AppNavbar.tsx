import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, Database, BarChart3, User, Menu, X, Dumbbell, LogOut, RotateCcw, Shield, Stethoscope, Mail, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const userNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/add-intake', label: 'Add Intake', icon: Plus },
  { path: '/food-database', label: 'Food DB', icon: Database },
  { path: '/my-meal-plan', label: 'My Meal Plan', icon: ChefHat },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/inbox', label: 'Inbox', icon: Mail },
  { path: '/profile', label: 'Profile', icon: User },
];
const adminNavItems = [
  { path: '/admin', label: 'Manage Users', icon: Shield },
  { path: '/profile', label: 'Profile', icon: User },
];
const nutritionistNavItems = [
  { path: '/nutritionist', label: 'Nutritionist Hub', icon: Stethoscope },
  { path: '/profile', label: 'Profile', icon: User },
];

const AppNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, role, username } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = role === 'Admin' ? adminNavItems
    : role === 'Nutritionist' ? nutritionistNavItems
    : userNavItems;

  const roleAccent = role === 'Admin' ? '#a855f7'
    : role === 'Nutritionist' ? '#22d3ee'
    : '#4ade80';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleRestartOnboarding = () => {
    localStorage.removeItem('onboardingComplete');
    localStorage.removeItem('proteinGoal');
    toast.info('Restarting onboarding...');
    navigate('/onboarding');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(8, 10, 20, 0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="container flex h-16 items-center justify-between">
          <Link to={role === 'Admin' ? '/admin' : role === 'Nutritionist' ? '/nutritionist' : '/dashboard'}
            className="flex items-center gap-2.5 font-black text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg, ${roleAccent}, ${roleAccent}99)` }}>
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-white tracking-tight">Protein<span style={{ color: roleAccent }}>Pal</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all",
                    active ? "text-white" : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: `${roleAccent}15`, border: `1px solid ${roleAccent}30`, zIndex: -1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="ml-3 flex items-center gap-1 border-l pl-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-xs text-white/30 mr-1 hidden lg:block">{username}</span>
              {role === 'User' && (
                <button onClick={handleRestartOnboarding}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" /> Setup
                </button>
              )}
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          </div>

          <button className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 border-b p-4 md:hidden space-y-1"
            style={{ background: 'rgba(8, 10, 20, 0.97)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    active ? "text-white" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
                  style={active ? { background: `${roleAccent}12`, color: 'white' } : {}}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t pt-2 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {role === 'User' && (
                <button onClick={() => { setMobileOpen(false); handleRestartOnboarding(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors">
                  <RotateCcw className="h-5 w-5" /> Restart Setup
                </button>
              )}
              <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppNavbar;
