import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Task } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Youtube, ExternalLink, CheckCircle } from 'lucide-react';

const EarnYouTube = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTasks();
    fetchCompletedTasks();
  }, [user]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('type', 'youtube')
      .eq('active', true);
    
    if (data) setTasks(data);
    setLoading(false);
  };

  const fetchCompletedTasks = async () => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from('completed_tasks')
      .select('task_id')
      .eq('user_id', user.id)
      .eq('task_type', 'youtube')
      .gte('created_at', today.toISOString());
    
    if (data) setCompletedTasks(data.map(t => t.task_id));
  };

  const completeTask = async (task: Task) => {
    if (!user || !profile) return;
    
    try {
      // Insert completed task
      await supabase.from('completed_tasks').insert({
        user_id: user.id,
        task_id: task.id,
        task_type: 'youtube',
      });

      // Update wallet
      await supabase
        .from('profiles')
        .update({ wallet_youtube: profile.wallet_youtube + task.reward })
        .eq('id', user.id);

      setCompletedTasks([...completedTasks, task.id]);
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
            <Youtube className="w-5 h-5 text-red-500" /> YouTube Earnings
          </h1>
          <p className="text-sm text-muted-foreground">
            Watch videos & earn • Balance: {profile?.wallet_youtube.toLocaleString()} UGX
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
            const isCompleted = completedTasks.includes(task.id);
            return (
              <div key={task.id} className="bg-card rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{task.title}</h3>
                  <span className="text-sm font-bold text-primary">+{task.reward} UGX</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                
                {isCompleted ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="w-4 h-4 mr-2" /> Completed
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {task.link && (
                      <a href={task.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">
                          <ExternalLink className="w-4 h-4 mr-2" /> Watch Video
                        </Button>
                      </a>
                    )}
                    <Button 
                      className="w-full gradient-primary" 
                      onClick={() => completeTask(task)}
                    >
                      Claim Reward
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

export default EarnYouTube;
