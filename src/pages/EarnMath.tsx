import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Task } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatRemaining, useTaskCooldown } from '@/hooks/useTaskCooldown';
import { ArrowLeft, Calculator, CheckCircle } from 'lucide-react';

const EarnMath = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const cooldown = useTaskCooldown({ userId: user?.id, taskType: 'math' });

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && profile && !profile.is_activated) navigate('/activate');
  }, [profile, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      cooldown.refresh().catch((e) => {
        console.error(e);
        toast({
          title: 'Unable to load completed tasks',
          description: (e as any)?.message ?? String(e),
          variant: 'destructive',
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('type', 'math')
      .eq('active', true);
    if (data) setTasks(data);
  };

  const submitAnswer = async (task: Task) => {
    if (!user || !profile) return;

    const userAnswer = answers[task.id]?.trim();
    if (!userAnswer) {
      toast({ title: 'Please enter your answer', variant: 'destructive' });
      return;
    }

    setSubmitting(task.id);

    // Check if answer is correct (correct_answer stored as number)
    if (task.correct_answer !== undefined && parseInt(userAnswer) !== task.correct_answer) {
      toast({ title: 'Wrong answer! Try again.', variant: 'destructive' });
      setSubmitting(null);
      return;
    }

    try {
      // Server-side guard: prevent re-claim within last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: recent, error: recentError } = await supabase
        .from('completed_tasks')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('task_id', task.id)
        .eq('task_type', 'math')
        .gte('completed_at', twentyFourHoursAgo.toISOString())
        .order('completed_at', { ascending: false })
        .limit(1);

      if (recentError) throw recentError;

      if (recent && recent.length > 0) {
        const remainingMs = Math.max(
          0,
          new Date(recent[0].completed_at).getTime() + 24 * 60 * 60 * 1000 - Date.now()
        );
        toast({ title: `Available again in ${formatRemaining(remainingMs)}` });
        await cooldown.refresh();
        return;
      }

      // Mark task as completed
      const { error: insertError } = await supabase.from('completed_tasks').insert({
        user_id: user.id,
        task_id: task.id,
        task_type: 'math',
        completed_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;

      // Update wallet
      const { error: walletError } = await supabase
        .from('profiles')
        .update({ wallet_math: (profile.wallet_math ?? 0) + task.reward })
        .eq('id', user.id);
      if (walletError) throw walletError;

      toast({ title: `Correct! +${task.reward} UGX earned!` });
      setAnswers({ ...answers, [task.id]: '' });
      await cooldown.refresh();
      refreshProfile();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to submit answer',
        description: (error as any)?.message ?? String(error),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="flex items-center gap-3 mb-6">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-500" /> Math Earnings
          </h1>
          <p className="text-sm text-muted-foreground">Balance: {profile.wallet_math.toLocaleString()} UGX</p>
        </div>
      </header>

      <div className="bg-card rounded-xl p-4 mb-6">
        <h3 className="font-semibold mb-2">How it works</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Solve the math problems below</li>
          <li>• Enter your answer and submit</li>
          <li>• Earn UGX for each correct answer</li>
        </ul>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-muted-foreground">No math problems available right now</p>
          <p className="text-sm text-muted-foreground">Check back later for more!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const remainingMs = cooldown.getRemainingMs(task.id);
            const isCompleted = remainingMs > 0;

            return (
              <div key={task.id} className="bg-card rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">+{task.reward} UGX</span>
                </div>

                {task.question && (
                  <div className="bg-secondary rounded-lg p-3 mb-3">
                    <p className="font-medium text-center text-lg">{task.question}</p>
                  </div>
                )}

                {isCompleted ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" /> Available in {formatRemaining(remainingMs)}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter your answer"
                      value={answers[task.id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [task.id]: e.target.value })}
                      disabled={cooldown.loading}
                    />
                    <Button
                      onClick={() => submitAnswer(task)}
                      disabled={cooldown.loading || submitting === task.id}
                      className="gradient-primary"
                    >
                      {submitting === task.id ? '...' : cooldown.loading ? 'Checking…' : 'Submit'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EarnMath;
