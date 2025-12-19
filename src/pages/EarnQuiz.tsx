import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Task } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatRemaining, useTaskCooldown } from '@/hooks/useTaskCooldown';
import { ArrowLeft, HelpCircle, CheckCircle } from 'lucide-react';

const EarnQuiz = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const cooldown = useTaskCooldown({ userId: user?.id, taskType: 'quiz' });

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
      .eq('type', 'quiz')
      .eq('active', true);

    if (data) setTasks(data);
  };

  const submitAnswer = async (task: Task) => {
    if (!user || !profile) return;

    const selectedAnswer = selectedAnswers[task.id];
    if (selectedAnswer === undefined) {
      toast({ title: 'Please select an answer', variant: 'destructive' });
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
        .eq('task_type', 'quiz')
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

      const isCorrect = selectedAnswer === task.correct_answer;
      const reward = isCorrect ? task.reward : Math.floor(task.reward / 2);

      await supabase.from('completed_tasks').insert({
        user_id: user.id,
        task_id: task.id,
        task_type: 'quiz',
        completed_at: new Date().toISOString(),
      });

      await supabase
        .from('profiles')
        .update({ wallet_quiz: profile.wallet_quiz + reward })
        .eq('id', user.id);

      await cooldown.refresh();
      await refreshProfile();

      if (isCorrect) {
        toast({ title: `Correct! +${task.reward} UGX earned!` });
      } else {
        toast({ title: `Wrong answer. +${reward} UGX consolation prize` });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to submit answer', variant: 'destructive' });
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
            <HelpCircle className="w-5 h-5 text-purple-500" /> Quiz Earnings
          </h1>
          <p className="text-sm text-muted-foreground">
            Answer questions & earn • Balance: {profile?.wallet_quiz.toLocaleString()} UGX
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-muted-foreground">No quizzes available right now</p>
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
                <p className="text-sm mb-3">{task.question}</p>

                {isCompleted ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Available in {formatRemaining(remainingMs)}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {task.options?.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswers[task.id] === index ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, [task.id]: index })}
                        disabled={cooldown.loading}
                      >
                        {option}
                      </Button>
                    ))}
                    <Button
                      className="w-full gradient-primary mt-2"
                      onClick={() => submitAnswer(task)}
                      disabled={cooldown.loading}
                    >
                      {cooldown.loading ? 'Checking…' : 'Submit Answer'}
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

export default EarnQuiz;

