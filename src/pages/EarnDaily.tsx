import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Gift, Clock, CheckCircle } from 'lucide-react';

const DAILY_REWARD = 500;
const COOLDOWN_HOURS = 24;

const EarnDaily = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    checkClaimStatus();
  }, [user, profile]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkClaimStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  const checkClaimStatus = () => {
    if (!profile) return;

    const lastClaim = profile.last_daily_claim ? new Date(profile.last_daily_claim).getTime() : 0;
    const now = Date.now();
    const timeSinceLastClaim = now - lastClaim;
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

    if (timeSinceLastClaim >= cooldownMs) {
      setCanClaim(true);
      setTimeLeft('');
    } else {
      setCanClaim(false);
      const remaining = cooldownMs - timeSinceLastClaim;
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }
  };

  const claimDaily = async () => {
    if (!user || !profile || !canClaim) return;
    
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ 
          wallet_daily: profile.wallet_daily + DAILY_REWARD,
          last_daily_claim: new Date().toISOString()
        })
        .eq('id', user.id);

      await refreshProfile();
      toast({ title: `+${DAILY_REWARD} UGX claimed!` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to claim reward', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-green-500" /> Daily Reward
          </h1>
          <p className="text-sm text-muted-foreground">
            Claim daily • Balance: {profile?.wallet_daily.toLocaleString()} UGX
          </p>
        </div>
      </header>

      <div className="bg-card rounded-xl p-6 text-center">
        <Gift className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Daily Cashout</h2>
        <p className="text-3xl font-bold text-primary mb-4">+{DAILY_REWARD} UGX</p>
        
        {canClaim ? (
          <Button 
            className="w-full gradient-gold text-accent-foreground" 
            onClick={claimDaily}
            disabled={loading}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {loading ? 'Claiming...' : 'Claim Now'}
          </Button>
        ) : (
          <div>
            <Button disabled className="w-full mb-2">
              <Clock className="w-4 h-4 mr-2" /> Already Claimed
            </Button>
            <p className="text-sm text-muted-foreground">
              Next claim in: <span className="text-primary font-mono">{timeLeft}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarnDaily;
