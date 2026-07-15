import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, goalsTable } from "@workspace/db";
import {
  UpdateGoalBody,
  GetGoalResponse,
  UpdateGoalResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

async function getOrCreateGoal(userId: string) {
  const [existing] = await db
    .select()
    .from(goalsTable)
    .where(eq(goalsTable.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db.insert(goalsTable).values({ userId }).returning();
  return created;
}

router.get("/goal", async (req, res): Promise<void> => {
  const goal = await getOrCreateGoal(req.userId!);
  res.json(GetGoalResponse.parse(goal));
});

router.put("/goal", async (req, res): Promise<void> => {
  const parsed = UpdateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const current = await getOrCreateGoal(req.userId!);
  const [goal] = await db
    .update(goalsTable)
    .set({
      ...parsed.data,
      targetDate: parsed.data.targetDate
        ? parsed.data.targetDate.toISOString().slice(0, 10)
        : undefined,
    })
    .where(and(eq(goalsTable.id, current.id), eq(goalsTable.userId, req.userId!)))
    .returning();

  res.json(UpdateGoalResponse.parse(goal));
});

export default router;
