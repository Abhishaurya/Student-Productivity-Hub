import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, goalsTable } from "@workspace/db";
import {
  UpdateGoalBody,
  GetGoalResponse,
  UpdateGoalResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateGoal() {
  const [existing] = await db.select().from(goalsTable).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(goalsTable).values({}).returning();
  return created;
}

router.get("/goal", async (_req, res): Promise<void> => {
  const goal = await getOrCreateGoal();
  res.json(GetGoalResponse.parse(goal));
});

router.put("/goal", async (req, res): Promise<void> => {
  const parsed = UpdateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const current = await getOrCreateGoal();
  const [goal] = await db
    .update(goalsTable)
    .set({
      ...parsed.data,
      targetDate: parsed.data.targetDate
        ? parsed.data.targetDate.toISOString().slice(0, 10)
        : undefined,
    })
    .where(eq(goalsTable.id, current.id))
    .returning();

  res.json(UpdateGoalResponse.parse(goal));
});

export default router;
