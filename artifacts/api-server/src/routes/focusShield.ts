import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, pomodoroSessionsTable, blocklistItemsTable } from "@workspace/db";
import { GetFocusShieldStatsResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/focus-shield/stats", async (req, res): Promise<void> => {
  const userId = req.userId!;

  const [sessions, blocklistItems] = await Promise.all([
    db
      .select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.userId, userId))
      .orderBy(desc(pomodoroSessionsTable.completedAt)),
    db.select().from(blocklistItemsTable).where(eq(blocklistItemsTable.userId, userId)),
  ]);

  let currentStreak = 0;
  for (const session of sessions) {
    if (session.distractionCount === 0) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  let longestStreak = 0;
  let running = 0;
  // sessions are newest-first; iterate oldest-first for a natural streak scan
  for (const session of [...sessions].reverse()) {
    if (session.distractionCount === 0) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }

  const distractionFreeSessions = sessions.filter(
    (s) => s.distractionCount === 0,
  ).length;
  const totalDistractions = sessions.reduce((sum, s) => sum + s.distractionCount, 0);

  res.json(
    GetFocusShieldStatsResponse.parse({
      currentStreak,
      longestStreak,
      totalFocusSessions: sessions.length,
      distractionFreeSessions,
      totalDistractions,
      blockedItemsCount: blocklistItems.length,
    }),
  );
});

export default router;
