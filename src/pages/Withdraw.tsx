import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Withdrawal } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Wallet, AlertCircle, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const MIN_WITHDRAWAL = 55000;
const SERVICE_FEE_PERCENT = 10;

const Withdraw = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedWallet, setSelectedWallet] = useState<string>('referral');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWithdrawals();
  }, [user]);

  const fetchWithdrawals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setWithdrawals(data);
  };

  const wallets = [
    { key: 'referral', label: 'Referral', balance: profile?.wallet_referral || 0, minRequired: 10000 },
    { key: 'youtube', label: 'YouTube', balance: profile?.wallet_youtube || 0, minRequired: MIN_WITHDRAWAL },
    { key: 'tiktok', label: 'TikTok', balance: profile?.wallet_tiktok || 0, minRequired: MIN_WITHDRAWAL },
    { key: 'quiz', label: 'Quiz', balance: profile?.wallet_quiz || 0, minRequired: MIN_WITHDRAWAL },
    { key: 'daily', label: 'Daily', balance: profile?.wallet_daily || 0, minRequired: MIN_WITHDRAWAL },
    { key: 'aviator', label: 'Aviator', balance: profile?.wallet_aviator || 0, minRequired: MIN_WITHDRAWAL },
    { key: 'math', label: 'Math', balance: profile?.wallet_math || 0, minRequired: MIN_WITHDRAWAL },
  ];

  const selectedWalletData = wallets.find(w => w.key === selectedWallet);
  const canWithdraw = selectedWalletData && selectedWalletData.balance >= selectedWalletData.minRequired;

  const withdrawAmount = Number(amount);
  const serviceFee = Math.round(withdrawAmount * SERVICE_FEE_PERCENT / 100);
  const netAmount = withdrawAmount - serviceFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !selectedWalletData) return;

    if (hasPendingWithdrawal) {
      toast({ title: 'You have a pending withdrawal. Wait for it to be processed.', variant: 'destructive' });
      return;
    }

    if (withdrawAmount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }

    if (withdrawAmount > selectedWalletData.balance) {
      toast({ title: 'Insufficient balance', variant: 'destructive' });
      return;
    }

    if (selectedWallet !== 'referral' && selectedWalletData.balance < MIN_WITHDRAWAL) {
      toast({ title: `Minimum ${MIN_WITHDRAWAL.toLocaleString()} UGX required to withdraw`, variant: 'destructive' });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmWithdraw = async () => {
    if (!user || !profile || !selectedWalletData) return;

    setShowConfirmDialog(false);
    setLoading(true);
    
    try {
      const walletColumn = `wallet_${selectedWallet}`;
      const newBalance = selectedWalletData.balance - withdrawAmount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [walletColumn]: newBalance })
        .eq('id', user.id);

      if (updateError) {
        toast({ title: 'Failed to process withdrawal', variant: 'destructive' });
        return;
      }

      await supabase.from('withdrawals').insert({
        user_id: user.id,
        username: profile.username,
        wallet_type: selectedWallet,
        amount: withdrawAmount,
        service_fee: serviceFee,
        net_amount: netAmount,
        phone: phone,
        status: 'pending',
      });

      toast({ title: `Withdrawal processed! You'll receive ${netAmount.toLocaleString()} UGX after ${SERVICE_FEE_PERCENT}% service fee.` });
      setAmount('');
      setPhone('');
      fetchWithdrawals();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to submit withdrawal', variant: 'destructive' });
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
            <Wallet className="w-5 h-5" /> Withdraw
          </h1>
          <p className="text-sm text-muted-foreground">Cash out your earnings</p>
        </div>
      </header>

      <div className="bg-card rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-3">Select Wallet</h3>
        <div className="grid grid-cols-2 gap-2">
          {wallets.map((wallet) => (
            <button
              key={wallet.key}
              onClick={() => setSelectedWallet(wallet.key)}
              className={`p-3 rounded-lg text-left transition-all ${
                selectedWallet === wallet.key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary'
              }`}
            >
              <p className="text-sm font-medium">{wallet.label}</p>
              <p className="text-xs opacity-80">{wallet.balance.toLocaleString()} UGX</p>
            </button>
          ))}
        </div>
      </div>

      {hasPendingWithdrawal && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-500">Pending Withdrawal</h3>
              <p className="text-sm text-muted-foreground">
                You have a pending withdrawal. You can only make one withdrawal at a time.
              </p>
            </div>
          </div>
        </div>
      )}

      {!canWithdraw && selectedWallet !== 'referral' ? (
        <div className="bg-card rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Not Eligible</h3>
              <p className="text-sm text-muted-foreground">
                You need at least {MIN_WITHDRAWAL.toLocaleString()} UGX to withdraw from this wallet.
                Current balance: {selectedWalletData?.balance.toLocaleString()} UGX
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-4 mb-6 space-y-4">
          <div>
            <Label htmlFor="amount">Amount (UGX)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              max={selectedWalletData?.balance}
              required
              disabled={hasPendingWithdrawal}
            />
            {amount && Number(amount) > 0 && (
              <div className="mt-2 text-sm bg-secondary p-2 rounded">
                <p>Service Fee ({SERVICE_FEE_PERCENT}%): <span className="text-destructive">{Math.round(Number(amount) * SERVICE_FEE_PERCENT / 100).toLocaleString()} UGX</span></p>
                <p>You'll Receive: <span className="text-primary font-semibold">{(Number(amount) - Math.round(Number(amount) * SERVICE_FEE_PERCENT / 100)).toLocaleString()} UGX</span></p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Mobile Money Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0700000000"
              required
              disabled={hasPendingWithdrawal}
            />
          </div>

          <Button type="submit" className="w-full gradient-primary" disabled={loading || hasPendingWithdrawal}>
            {loading ? 'Processing...' : hasPendingWithdrawal ? 'Pending Withdrawal Active' : 'Request Withdrawal'}
          </Button>
        </form>
      )}

      <div>
        <h3 className="font-semibold mb-3">Withdrawal History</h3>
        <div className="space-y-2">
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No withdrawals yet</p>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="bg-card rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{w.amount.toLocaleString()} UGX</p>
                    <p className="text-xs text-muted-foreground">{w.wallet_type} • {w.phone}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    w.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                    w.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                    'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {w.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to withdraw <strong>{withdrawAmount.toLocaleString()} UGX</strong> from your {selectedWalletData?.label} wallet?
              <br /><br />
              <span className="text-destructive">Service Fee (10%): {serviceFee.toLocaleString()} UGX</span>
              <br />
              <span className="text-primary font-semibold">You'll receive: {netAmount.toLocaleString()} UGX</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmWithdraw}>Confirm Withdrawal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Withdraw;
