import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Share2, Users, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Referrals = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activatedCount, setActivatedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.referral_code) {
      fetchReferralStats();
    }
  }, [profile?.referral_code]);

  const fetchReferralStats = async () => {
    if (!profile) return;
    
    // Get activated referrals count
    const { count: activated } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', profile.referral_code)
      .eq('is_activated', true);
    
    // Get pending referrals count
    const { count: pending } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', profile.referral_code)
      .eq('is_activated', false);
    
    setActivatedCount(activated || 0);
    setPendingCount(pending || 0);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const copyReferralLink = () => {
    navigator.clipboard.writeText(profile.referral_link);
    toast({ title: 'Referral link copied!' });
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(profile.referral_code);
    toast({ title: 'Referral code copied!' });
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Smart Cash',
        text: `Join Smart Cash and start earning money daily! Use my referral code: ${profile.referral_code}`,
        url: profile.referral_link,
      });
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Referrals</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-card rounded-xl p-4 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile.total_referrals || 0}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2 text-primary font-bold">
              💰
            </div>
            <p className="text-2xl font-bold">{(profile.wallet_referral || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">UGX Earned</p>
          </div>
        </div>

        {/* Referral Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <UserCheck className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-500">{activatedCount}</p>
            <p className="text-xs text-muted-foreground">Activated</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
            <UserX className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-yellow-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-card rounded-xl p-4 mb-4">
          <h3 className="font-semibold mb-2">Your Referral Code</h3>
          <div className="bg-secondary rounded-lg p-4 flex items-center justify-between">
            <span className="font-mono text-xl font-bold text-primary">{profile.referral_code}</span>
            <Button size="sm" variant="ghost" onClick={copyReferralCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-card rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-2">Your Referral Link</h3>
          <div className="bg-secondary rounded-lg p-3 flex items-center gap-2 mb-3">
            <p className="text-xs text-muted-foreground flex-1 truncate">{profile.referral_link}</p>
            <Button size="sm" variant="ghost" onClick={copyReferralLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Button className="w-full gradient-gold text-accent-foreground" onClick={shareReferralLink}>
            <Share2 className="w-4 h-4 mr-2" /> Share Link
          </Button>
        </div>

        {/* How it works */}
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-semibold mb-3">How It Works</h3>
          <div className="space-y-3">
            <Step number={1} text="Share your referral link with friends" />
            <Step number={2} text="They sign up using your link" />
            <Step number={3} text="They activate their account (pay 5,000 UGX)" />
            <Step number={4} text="You earn 2,000 UGX instantly!" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Step = ({ number, text }: { number: number; text: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
      {number}
    </div>
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default Referrals;
