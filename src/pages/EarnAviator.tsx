import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Task } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plane } from 'lucide-react';

const EarnAviator = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [signals, setSignals] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSignals();
  }, [user]);

  const fetchSignals = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('type', 'aviator')
      .eq('active', true)
      .order('created_at', { ascending: false });
    
    if (data) setSignals(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Plane className="w-5 h-5 text-orange-500" /> Aviator Signals
          </h1>
          <p className="text-sm text-muted-foreground">
            Get winning signals • Balance: {profile?.wallet_aviator.toLocaleString()} UGX
          </p>
        </div>
      </header>

      <div className="bg-card rounded-xl p-4 mb-4">
        <p className="text-sm text-muted-foreground">
          Use these signals to play Aviator and win! Signals are updated regularly.
        </p>
      </div>

      <div className="space-y-4">
        {signals.length === 0 ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-muted-foreground">No signals available right now</p>
          </div>
        ) : (
          signals.map((signal) => (
            <div key={signal.id} className="bg-card rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{signal.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(signal.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{signal.description}</p>
              {signal.link && (
                <a 
                  href={signal.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary text-sm hover:underline mt-2 block"
                >
                  Play Now →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EarnAviator;
