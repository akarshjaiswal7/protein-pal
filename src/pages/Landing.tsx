import { useNavigate } from 'react-router-dom';
import { Shield, User, Stethoscope, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const roles = [
  {
    key: 'User',
    label: 'Customer',
    sublabel: 'Track meals, hit your protein goals',
    icon: User,
    gradient: 'from-emerald-500 to-green-600',
    glow: '#4ade80',
    border: 'hover:border-emerald-500/50',
    badge: 'Personal',
    route: '/login?role=User',
  },
  {
    key: 'Nutritionist',
    label: 'Nutritionist',
    sublabel: 'Manage food database & advise patients',
    icon: Stethoscope,
    gradient: 'from-cyan-500 to-blue-600',
    glow: '#22d3ee',
    border: 'hover:border-cyan-500/50',
    badge: 'Clinical',
    route: '/login?role=Nutritionist',
  },
  {
    key: 'Admin',
    label: 'Administrator',
    sublabel: 'Manage users and platform operations',
    icon: Shield,
    gradient: 'from-violet-500 to-purple-700',
    glow: '#a855f7',
    border: 'hover:border-violet-500/50',
    badge: 'Staff Only',
    route: '/login?role=Admin',
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #060b18 0%, #0d1424 50%, #060b18 100%)' }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #4ade80, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)' }} />
      </div>

      {/* Grid dot pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 text-xs text-white/50 font-medium tracking-widest uppercase">
          <Zap className="w-3 h-3 text-emerald-400" />
          Protein Tracking Platform
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight mb-4 leading-none">
          Protein<span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4ade80, #22d3ee)' }}>Pal</span>
        </h1>
        <p className="text-white/40 text-lg md:text-xl max-w-md mx-auto leading-relaxed">
          Select your role to access your personalized portal
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full relative">
        {roles.map((role, i) => {
          const Icon = role.icon;
          return (
            <motion.button
              key={role.key}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(role.route)}
              className={`group relative flex flex-col items-start p-7 rounded-3xl border border-white/8 text-left transition-all duration-300 cursor-pointer ${role.border}`}
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, ${role.glow}18, transparent 70%)` }} />

              {/* Badge */}
              <span className={`mb-5 inline-block text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-gradient-to-r ${role.gradient} text-white shadow`}>
                {role.badge}
              </span>

              {/* Icon */}
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${role.gradient} shadow-lg mb-5`}>
                <Icon className="h-7 w-7 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{role.label}</h2>
              <p className="text-sm text-white/40 leading-relaxed mb-6">{role.sublabel}</p>

              <div className="flex items-center gap-1.5 text-sm font-semibold text-white/50 group-hover:text-white transition-colors">
                Enter Portal <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 text-white/20 text-sm"
      >
        New here? Choose <span className="text-emerald-400/60">Customer</span> to create your account.
      </motion.p>
    </div>
  );
};

export default Landing;
