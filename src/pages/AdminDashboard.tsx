import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Profile, Task, Withdrawal, Loan } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Users, Wallet, FileText, Plus, Trash, Search } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const [newTask, setNewTask] = useState({
    type: 'youtube' as Task['type'],
    title: '',
    description: '',
    reward: '',
    link: '',
    question: '',
    options: '',
    correctAnswer: '',
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/admin');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      navigate('/admin');
      return;
    }

    setIsAdmin(true);
    setLoading(false);
    fetchData();
  };

  const fetchData = async () => {
    // Fetch all users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (usersData) setUsers(usersData);

    // Fetch withdrawals
    const { data: withdrawalsData } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    if (withdrawalsData) setWithdrawals(withdrawalsData);

    // Fetch loans
    const { data: loansData } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });
    if (loansData) setLoans(loansData);

    // Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (tasksData) setTasks(tasksData);
  };

  const activateUser = async (user: Profile) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_activated: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('Activate user error:', updateError);
        toast({
          title: 'Activation failed',
          description: updateError.message,
          variant: 'destructive',
        });
        return;
      }

      // Credit referrer if exists
      if (user.referred_by) {
        const { error: rpcError } = await supabase.rpc('credit_referral_bonus', {
          p_referral_code: user.referred_by,
        });
        if (rpcError) {
          console.error('Referral bonus error:', rpcError);
        }
      }

      toast({ title: `${user.username} activated!` });
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to activate user', variant: 'destructive' });
    }
  };

  const processWithdrawal = async (withdrawal: Withdrawal, status: 'approved' | 'rejected') => {
    try {
      await supabase
        .from('withdrawals')
        .update({ status })
        .eq('id', withdrawal.id);

      if (status === 'approved') {
        const walletColumn = `wallet_${withdrawal.wallet_type}`;
        const { data: userData } = await supabase
          .from('profiles')
          .select(walletColumn)
          .eq('id', withdrawal.user_id)
          .single();

        if (userData) {
          const currentBalance = userData[walletColumn] || 0;
          await supabase
            .from('profiles')
            .update({ [walletColumn]: Math.max(0, currentBalance - withdrawal.amount) })
            .eq('id', withdrawal.user_id);
        }
      }

      toast({ title: `Withdrawal ${status}!` });
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to process withdrawal', variant: 'destructive' });
    }
  };

  const processLoan = async (loan: Loan, status: 'approved' | 'rejected') => {
    try {
      await supabase
        .from('loans')
        .update({ status })
        .eq('id', loan.id);

      if (status === 'approved') {
        const { data: userData } = await supabase
          .from('profiles')
          .select('wallet_loan')
          .eq('id', loan.user_id)
          .single();

        if (userData) {
          await supabase
            .from('profiles')
            .update({ wallet_loan: (userData.wallet_loan || 0) + loan.amount })
            .eq('id', loan.user_id);
        }
      }

      toast({ title: `Loan ${status}!` });
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to process loan', variant: 'destructive' });
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await supabase.from('tasks').insert({
        type: newTask.type,
        title: newTask.title,
        description: newTask.description,
        reward: Number(newTask.reward),
        link: newTask.link || null,
        question: newTask.question || null,
        options: newTask.options ? newTask.options.split(',').map(o => o.trim()) : null,
        correct_answer: newTask.correctAnswer ? Number(newTask.correctAnswer) : null,
        active: true,
      });

      toast({ title: 'Task created!' });
      setNewTask({
        type: 'youtube',
        title: '',
        description: '',
        reward: '',
        link: '',
        question: '',
        options: '',
        correctAnswer: '',
      });
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to create task', variant: 'destructive' });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
      toast({ title: 'Task deleted!' });
      fetchData();
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.phone && u.phone.includes(userSearch))
  );
  const pendingUsers = filteredUsers.filter(u => !u.is_activated);
  const activatedUsers = filteredUsers.filter(u => u.is_activated);
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const pendingLoans = loans.filter(l => l.status === 'pending');

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">🔐 Admin Dashboard</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{pendingUsers.length}</p>
          <p className="text-xs text-muted-foreground">Pending Users</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{pendingWithdrawals.length}</p>
          <p className="text-xs text-muted-foreground">Withdrawals</p>
        </div>
        <div className="bg-card rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{pendingLoans.length}</p>
          <p className="text-xs text-muted-foreground">Loans</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="users"><Users className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="withdrawals"><Wallet className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="loans"><FileText className="w-4 h-4" /></TabsTrigger>
          <TabsTrigger value="tasks"><Plus className="w-4 h-4" /></TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-3">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, email, or phone..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <h2 className="font-semibold">Pending Activations ({pendingUsers.length})</h2>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending users found</p>
          ) : (
            pendingUsers.map((user) => (
              <div key={user.id} className="bg-card rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                  </div>
                  <Button size="sm" onClick={() => activateUser(user)}>
                    Activate
                  </Button>
                </div>
              </div>
            ))
          )}

          {userSearch && (
            <>
              <h2 className="font-semibold mt-4">Activated Users ({activatedUsers.length})</h2>
              {activatedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activated users found</p>
              ) : (
                activatedUsers.map((user) => (
                  <div key={user.id} className="bg-card rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                        Active
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-3">
          <h2 className="font-semibold">Pending Withdrawals</h2>
          {pendingWithdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending withdrawals</p>
          ) : (
            pendingWithdrawals.map((w) => (
              <div key={w.id} className="bg-card rounded-lg p-3">
                <div className="mb-2">
                  <p className="font-medium">{w.username}</p>
                  <p className="text-sm">{w.amount.toLocaleString()} UGX from {w.wallet_type}</p>
                  <p className="text-xs text-muted-foreground">To: {w.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => processWithdrawal(w, 'approved')}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => processWithdrawal(w, 'rejected')}>
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="loans" className="space-y-3">
          <h2 className="font-semibold">Pending Loans</h2>
          {pendingLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending loans</p>
          ) : (
            pendingLoans.map((loan) => (
              <div key={loan.id} className="bg-card rounded-lg p-3">
                <div className="mb-2">
                  <p className="font-medium">{loan.username}</p>
                  <p className="text-sm">{loan.amount.toLocaleString()} UGX</p>
                  <p className="text-xs text-muted-foreground">{loan.reason}</p>
                  <p className="text-xs text-muted-foreground">Phone: {loan.phone}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => processLoan(loan, 'approved')}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => processLoan(loan, 'rejected')}>
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <h2 className="font-semibold">Create Task</h2>
          <form onSubmit={createTask} className="bg-card rounded-xl p-4 space-y-3">
            <div>
              <Label>Task Type</Label>
              <select
                value={newTask.type}
                onChange={(e) => setNewTask({ ...newTask, type: e.target.value as Task['type'] })}
                className="w-full p-2 rounded bg-secondary border-none"
              >
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="quiz">Quiz</option>
                <option value="aviator">Aviator</option>
                <option value="math">Math</option>
              </select>
            </div>

            <div>
              <Label>Title</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Reward (UGX)</Label>
              <Input
                type="number"
                value={newTask.reward}
                onChange={(e) => setNewTask({ ...newTask, reward: e.target.value })}
                required
              />
            </div>

            {(newTask.type === 'youtube' || newTask.type === 'tiktok' || newTask.type === 'aviator') && (
              <div>
                <Label>Link (URL)</Label>
                <Input
                  value={newTask.link}
                  onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
                />
              </div>
            )}

            {newTask.type === 'quiz' && (
              <>
                <div>
                  <Label>Question</Label>
                  <Input
                    value={newTask.question}
                    onChange={(e) => setNewTask({ ...newTask, question: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={newTask.options}
                    onChange={(e) => setNewTask({ ...newTask, options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
                <div>
                  <Label>Correct Answer (0-based index)</Label>
                  <Input
                    type="number"
                    value={newTask.correctAnswer}
                    onChange={(e) => setNewTask({ ...newTask, correctAnswer: e.target.value })}
                    placeholder="0 for first option, 1 for second, etc."
                  />
                </div>
              </>
            )}

            {newTask.type === 'math' && (
              <>
                <div>
                  <Label>Math Question (e.g., "25 + 17 = ?")</Label>
                  <Input
                    value={newTask.question}
                    onChange={(e) => setNewTask({ ...newTask, question: e.target.value })}
                    placeholder="Enter the math problem"
                  />
                </div>
                <div>
                  <Label>Correct Answer (number)</Label>
                  <Input
                    type="number"
                    value={newTask.correctAnswer}
                    onChange={(e) => setNewTask({ ...newTask, correctAnswer: e.target.value })}
                    placeholder="The correct numerical answer"
                  />
                </div>
              </>
            )}

            <Button type="submit" className="w-full gradient-primary">
              <Plus className="w-4 h-4 mr-2" /> Create Task
            </Button>
          </form>

          <h2 className="font-semibold mt-6">Existing Tasks</h2>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="bg-card rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.type} • {task.reward} UGX
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)}>
                  <Trash className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
