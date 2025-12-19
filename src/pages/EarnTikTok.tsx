import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Task } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatRemaining, useTaskCooldown } from '@/hooks/useTaskCooldown';
import { ArrowLeft, Music2, ExternalLink, CheckCircle } from 'lucide-react';

const EarnTikTok = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const cooldown = useTaskCooldown({ userId: user?.id, taskType: 'tiktok' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    Promise.all([
      fetchTasks(),
      cooldown.refresh().catch((e) => {
        console.error(e);
        toast({ title: 'Unable to load completed tasks', variant: 'destructive' });
      }),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('type', 'tiktok')
      .eq('active', true);

    if (data) setTasks(data);
  };

  const completeTask = async (task: Task) => {
    if (!user || !profile) return;

    try {
      // Server-side guard: prevent re-claim within last 24 hours (works even after refresh)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: recent, error: recentError } = await supabase
        .from('completed_tasks')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('task_id', task.id)
        .eq('task_type', 'tiktok')
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

      await supabase.from('completed_tasks').insert({
        user_id: user.id,
        task_id: task.id,
        task_type: 'tiktok',
        completed_at: new Date().toISOString(),
      });

      await supabase
        .from('profiles')
        .update({ wallet_tiktok: profile.wallet_tiktok + task.reward })
        .eq('id', user.id);

      await cooldown.refresh();
      await refreshProfile();
      toast({ title: `+${task.reward} UGX earned!` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to complete task', variant: 'destructive' });
    }
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
            <Music2 className="w-5 h-5 text-pink-500" /> TikTok Earnings
          </h1>
          <p className="text-sm text-muted-foreground">
            Watch TikToks & earn • Balance: {profile?.wallet_tiktok.toLocaleString()} UGX
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-muted-foreground">No tasks available right now</p>
          </div>
        ) : (
          tasks.map((task) => {
            const remainingMs = cooldown.getRemainingMs(task.id);
            const isCompleted = remainingMs > 0;

            return (
              <div key={task.id} className="bg-card rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{task.title}</h3>
                  <span className="text-sm font-bold text-primary">+{task.reward} UGX</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>

                {isCompleted ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Available in {formatRemaining(remainingMs)}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {task.link && (
                      <a href={task.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="w-4 h-4 mr-2" /> Watch TikTok
                        </Button>
                      </a>
                    )}
                    <Button
                      className="w-full gradient-primary"
                      onClick={() => completeTask(task)}
                      disabled={cooldown.loading}
                    >
                      {cooldown.loading ? 'Checking…' : 'Claim Reward'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EarnTikTok;

