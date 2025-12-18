import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Withdrawal } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

type Transaction = {
  id: string;
  type: 'earning' | 'withdrawal';
  category: string;
  amount: number;
  status?: string;
  created_at: string;
};

const TransactionHistory = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch completed tasks (earnings)
      const { data: completedTasks } = await supabase
        .from('completed_tasks')
        .select('*, tasks(title, type, reward)')
        .eq('user_id', user?.id)
        .order('completed_at', { ascending: false });

      const txList: Transaction[] = [];

      // Add withdrawals
      if (withdrawals) {
        withdrawals.forEach((w: Withdrawal) => {
          txList.push({
            id: w.id,
            type: 'withdrawal',
            category: w.wallet_type,
            amount: w.amount,
            status: w.status,
            created_at: w.created_at,
          });
        });
      }

      // Add earnings from completed tasks
      if (completedTasks) {
        completedTasks.forEach((ct: any) => {
          if (ct.tasks) {
            txList.push({
              id: ct.id,
              type: 'earning',
              category: ct.tasks.type,
              amount: ct.tasks.reward,
              created_at: ct.completed_at,
            });
          }
        });
      }

      // Sort by date
      txList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(txList);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTx(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Transaction History</h1>
      </header>

      <div className="px-4">
        {loadingTx ? (
          <div className="text-center text-muted-foreground py-8">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-card rounded-xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'earning' ? 'bg-green-500/20' : 'bg-orange-500/20'
                }`}>
                  {tx.type === 'earning' ? (
                    <ArrowDownCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowUpCircle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium capitalize">
                    {tx.type === 'earning' ? `${tx.category} Earning` : `${tx.category} Withdrawal`}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'earning' ? 'text-green-500' : 'text-orange-500'}`}>
                    {tx.type === 'earning' ? '+' : '-'}{tx.amount.toLocaleString()} UGX
                  </p>
                  {tx.status && (
                    <p className={`text-xs capitalize ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
