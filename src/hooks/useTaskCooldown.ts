import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CompletedRow = {
  task_id: string;
  created_at: string;
};

const DEFAULT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function useTaskCooldown(params: {
  userId?: string;
  taskType?: string;
  cooldownMs?: number;
}) {
  const { userId, taskType, cooldownMs = DEFAULT_COOLDOWN_MS } = params;

  const [loading, setLoading] = useState(false);
  const [completedAtByTaskId, setCompletedAtByTaskId] = useState<
    Record<string, string>
  >({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const since = new Date(Date.now() - cooldownMs);

    let query = supabase
      .from("completed_tasks")
      .select("task_id, created_at")
      .eq("user_id", userId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false });

    if (taskType) query = query.eq("task_type", taskType);

    const { data, error } = await query;
    setLoading(false);

    if (error) throw error;

    const map: Record<string, string> = {};
    (data as CompletedRow[] | null)?.forEach((row) => {
      if (!map[row.task_id]) map[row.task_id] = row.created_at;
    });

    setCompletedAtByTaskId(map);
  }, [cooldownMs, taskType, userId]);

  const getRemainingMs = useCallback(
    (taskId: string) => {
      const completedAt = completedAtByTaskId[taskId];
      if (!completedAt) return 0;

      const endsAt = new Date(completedAt).getTime() + cooldownMs;
      return Math.max(0, endsAt - now);
    },
    [completedAtByTaskId, cooldownMs, now]
  );

  const isOnCooldown = useCallback(
    (taskId: string) => getRemainingMs(taskId) > 0,
    [getRemainingMs]
  );

  return {
    loading,
    refresh,
    completedAtByTaskId,
    isOnCooldown,
    getRemainingMs,
  };
}
