import { Router, type IRouter } from "express";
import { and, eq, gte } from "drizzle-orm";
import { db, pomodoroSessionsTable } from "@workspace/db";
import {
  CreatePomodoroSessionBody,
  ListPomodoroSessionsResponse,
  GetPomodoroStatsResponse,
  CreatePomodoroSessionResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

router.get("/pomodoro-sessions/stats", async (req, res): Promise<void> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentSessions = await db
    .select()
    .from(pomodoroSessionsTable)
    .where(
      and(
        gte(pomodoroSessionsTable.completedAt, sevenDaysAgo),
        eq(pomodoroSessionsTable.userId, req.userId!),
      ),
    );

  const allSessions = await db
    .select()
    .from(pomodoroSessionsTable)
    .where(eq(pomodoroSessionsTable.userId, req.userId!));

  const today = dayKey(new Date());
  const byDay = new Map<string, { count: number; minutes: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.set(dayKey(d), { count: 0, minutes: 0 });
  }

  for (const session of recentSessions) {
    const key = dayKey(new Date(session.completedAt));
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.minutes += session.durationMinutes;
    }
  }

  const last7Days = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayBucket = byDay.get(today) ?? { count: 0, minutes: 0 };

  res.json(
    GetPomodoroStatsResponse.parse({
      totalSessions: allSessions.length,
      totalMinutes: allSessions.reduce((s, x) => s + x.durationMinutes, 0),
      todaySessions: todayBucket.count,
      todayMinutes: todayBucket.minutes,
      last7Days,
    }),
  );
});

router.get("/pomodoro-sessions", async (req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(pomodoroSessionsTable)
    .where(eq(pomodoroSessionsTable.userId, req.userId!));
  res.json(ListPomodoroSessionsResponse.parse(sessions));
});

router.post("/pomodoro-sessions", async (req, res): Promise<void> => {
  const parsed = CreatePomodoroSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(pomodoroSessionsTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();

  res.status(201).json(CreatePomodoroSessionResponse.parse(session));
});

export default router;
