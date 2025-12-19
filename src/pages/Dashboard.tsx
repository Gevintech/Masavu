import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Youtube, Music2, HelpCircle, Gift, Plane, Banknote, 
  Users, Wallet, Copy, Share2, Calculator, History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NavigationDrawer from '@/components/NavigationDrawer';

const Dashboard = () => {
  const { user, profile, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && profile && !profile.is_activated) {
      navigate('/activate');
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const totalEarnings = 
    (profile.wallet_referral || 0) + 
    (profile.wallet_youtube || 0) + 
    (profile.wallet_tiktok || 0) + 
    (profile.wallet_quiz || 0) + 
    (profile.wallet_daily || 0) + 
    (profile.wallet_aviator || 0) + 
    (profile.wallet_loan || 0) +
    (profile.wallet_math || 0);

  const copyReferralLink = () => {
    navigator.clipboard.writeText(profile.referral_link);
    toast({ title: 'Referral link copied!' });
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Smart Cash',
        text: 'Earn money daily with Smart Cash! Use my referral link:',
        url: profile.referral_link,
      });
    } else {
      copyReferralLink();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <NavigationDrawer onLogout={handleLogout} />
          <div>
            <h1 className="text-xl font-bold">💰 Smart Cash</h1>
            <p className="text-sm text-muted-foreground">Welcome, {profile.username}</p>
          </div>
        </div>
        <Link to="/transactions">
          <Button variant="ghost" size="icon">
            <History className="w-5 h-5" />
          </Button>
        </Link>
      </header>

      {/* Balance Card */}
      <div className="px-4 mb-6">
        <div className="gradient-primary rounded-2xl p-6 text-primary-foreground">
          <p className="text-sm opacity-80">Total Balance</p>
          <h2 className="text-3xl font-bold">{totalEarnings.toLocaleString()} UGX</h2>
          <div className="flex gap-2 mt-4">
            <Link to="/withdraw" className="flex-1">
              <Button className="w-full bg-background/20 hover:bg-background/30 text-primary-foreground">
                <Wallet className="w-4 h-4 mr-2" /> Withdraw
              </Button>
            </Link>
            <Link to="/referrals" className="flex-1">
              <Button className="w-full bg-background/20 hover:bg-background/30 text-primary-foreground">
                <Users className="w-4 h-4 mr-2" /> Referrals
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-xl p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" />
            Your Referral Link
          </h3>
          <div className="bg-secondary rounded-lg p-3 flex items-center gap-2">
            <p className="text-xs text-muted-foreground flex-1 truncate">{profile.referral_link}</p>
            <Button size="sm" variant="ghost" onClick={copyReferralLink}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Code: <span className="font-mono text-primary">{profile.referral_code}</span> • 
            Referrals: <span className="text-primary">{profile.total_referrals}</span>
          </p>
          <Button className="w-full mt-3 gradient-gold text-accent-foreground" onClick={shareReferralLink}>
            <Share2 className="w-4 h-4 mr-2" /> Share & Earn 2,000 UGX
          </Button>
        </div>
      </div>

      {/* Wallet Overview */}
      <div className="px-4 mb-6">
        <h3 className="font-semibold mb-3">Your Wallets</h3>
        <div className="grid grid-cols-2 gap-3">
          <WalletCard label="Referral" amount={profile.wallet_referral || 0} color="bg-blue-500" />
          <WalletCard label="YouTube" amount={profile.wallet_youtube || 0} color="bg-red-500" />
          <WalletCard label="TikTok" amount={profile.wallet_tiktok || 0} color="bg-pink-500" />
          <WalletCard label="Quiz" amount={profile.wallet_quiz || 0} color="bg-purple-500" />
          <WalletCard label="Daily" amount={profile.wallet_daily || 0} color="bg-green-500" />
          <WalletCard label="Aviator" amount={profile.wallet_aviator || 0} color="bg-orange-500" />
          <WalletCard label="Math" amount={profile.wallet_math || 0} color="bg-cyan-500" />
        </div>
      </div>

      {/* Earn Methods */}
      <div className="px-4">
        <h3 className="font-semibold mb-3">Earn Money</h3>
        <div className="grid grid-cols-3 gap-3">
          <EarnCard to="/earn/youtube" icon={<Youtube />} label="YouTube" color="bg-red-500" />
          <EarnCard to="/earn/tiktok" icon={<Music2 />} label="TikTok" color="bg-pink-500" />
          <EarnCard to="/earn/quiz" icon={<HelpCircle />} label="Quiz" color="bg-purple-500" />
          <EarnCard to="/earn/math" icon={<Calculator />} label="Math" color="bg-cyan-500" />
          <EarnCard to="/earn/daily" icon={<Gift />} label="Daily" color="bg-green-500" />
          <EarnCard to="/earn/aviator" icon={<Plane />} label="Aviator" color="bg-orange-500" />
          <EarnCard to="/apply-loan" icon={<Banknote />} label="Loan" color="bg-blue-500" />
        </div>
      </div>
    </div>
  );
};

const WalletCard = ({ label, amount, color }: { label: string; amount: number; color: string }) => (
  <div className="bg-card rounded-xl p-3">
    <div className="flex items-center gap-2 mb-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className="font-bold">{amount.toLocaleString()} UGX</p>
  </div>
);

const EarnCard = ({ to, icon, label, color }: { to: string; icon: React.ReactNode; label: string; color: string }) => (
  <Link to={to}>
    <div className="bg-card rounded-xl p-4 text-center hover:card-glow transition-all">
      <div className={`${color} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-white`}>
        {icon}
      </div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  </Link>
);

export default Dashboard;
