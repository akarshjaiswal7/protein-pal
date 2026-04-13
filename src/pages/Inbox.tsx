import { useQuery } from '@tanstack/react-query';
import { Mail, MessageSquareText, Calendar, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import AppNavbar from '@/components/AppNavbar';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

const Inbox = () => {
  const { userId } = useAuth();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', userId],
    queryFn: () => apiFetch('/notes'),
    enabled: !!userId,
  });

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
      <AppNavbar />
      <main className="container max-w-3xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard" className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <Mail className="h-7 w-7 text-emerald-400" />
                Inbox
              </h1>
              <p className="text-white/40">Personalized advice from your nutritionists</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Checking your messages...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-white/10 bg-white/2">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <MessageSquareText className="h-8 w-8 text-white/20" />
              </div>
              <h3 className="text-white font-bold text-lg">No advice yet</h3>
              <p className="text-white/30 text-sm max-w-xs mt-1">
                When your nutritionist reviews your logs and sends personalized notes, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note: any, idx: number) => (
                <motion.div
                  key={note.NoteID}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-white/10 bg-white/3 overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                              {note.NutritionistName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-bold">{note.NutritionistName}</p>
                              <p className="text-white/30 text-xs">Healthcare Provider</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/20 text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                            <Calendar className="h-3 w-3" />
                            {new Date(note.CreatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        
                        <div className="relative">
                          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <p className="text-white/80 leading-relaxed whitespace-pre-wrap pl-4">
                            {note.Content}
                          </p>
                        </div>
                      </div>
                      <div className="px-6 py-3 bg-white/2 border-t border-white/5 flex justify-end">
                        <span className="text-[10px] uppercase tracking-widest font-black text-white/20 group-hover:text-emerald-400/40 transition-colors">
                          Professional Advisory Note
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
};

export default Inbox;
