import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, Loan } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ApplyLoan = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (user) {
      fetchLoans();
    }
  }, [user, loading, navigate]);

  const fetchLoans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setLoans(data);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      await supabase.from('loans').insert({
        user_id: user.id,
        username: profile.username,
        amount: Number(formData.amount),
        reason: formData.reason,
        phone: formData.phone,
        status: 'pending',
      });

      toast({ title: 'Loan application submitted!' });
      setFormData({ amount: '', reason: '', phone: '' });
      fetchLoans();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to submit application', variant: 'destructive' });
    } finally {
      setSubmitting(false);
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Apply for Loan</h1>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-6">
          <p className="text-sm">
            💰 Apply for a quick loan. Approval depends on your account activity and referral history.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <Label htmlFor="amount">Loan Amount (UGX)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason for Loan</Label>
            <Textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Why do you need this loan?"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0700000000"
              required
            />
          </div>

          <Button type="submit" className="w-full gradient-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>

        {/* Loan History */}
        <div>
          <h3 className="font-semibold mb-3">Loan Applications</h3>
          <div className="space-y-2">
            {loans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No applications yet</p>
            ) : (
              loans.map((loan) => (
                <div key={loan.id} className="bg-card rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{loan.amount.toLocaleString()} UGX</p>
                      <p className="text-xs text-muted-foreground">{loan.reason}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      loan.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                      loan.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyLoan;
