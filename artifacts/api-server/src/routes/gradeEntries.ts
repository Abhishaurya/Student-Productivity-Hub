import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, gradeEntriesTable } from "@workspace/db";
import {
  CreateGradeEntryBody,
  UpdateGradeEntryBody,
  UpdateGradeEntryParams,
  DeleteGradeEntryParams,
  ListGradeEntriesResponse,
  GetCgpaSummaryResponse,
  CreateGradeEntryResponse,
  UpdateGradeEntryResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/cgpa-summary", async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(gradeEntriesTable)
    .where(eq(gradeEntriesTable.userId, req.userId!));

  const bySemester = new Map<string, { points: number; credits: number }>();
  for (const entry of entries) {
    const bucket = bySemester.get(entry.semesterName) ?? {
      points: 0,
      credits: 0,
    };
    bucket.points += entry.gradePoint * entry.credits;
    bucket.credits += entry.credits;
    bySemester.set(entry.semesterName, bucket);
  }

  const semesters = Array.from(bySemester.entries()).map(
    ([semesterName, { points, credits }]) => ({
      semesterName,
      gpa: credits === 0 ? 0 : Math.round((points / credits) * 100) / 100,
      credits,
    }),
  );

  const totalCredits = entries.reduce((sum, e) => sum + e.credits, 0);
  const totalPoints = entries.reduce(
    (sum, e) => sum + e.gradePoint * e.credits,
    0,
  );
  const cgpa =
    totalCredits === 0 ? 0 : Math.round((totalPoints / totalCredits) * 100) / 100;

  res.json(GetCgpaSummaryResponse.parse({ cgpa, totalCredits, semesters }));
});

router.get("/grade-entries", async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(gradeEntriesTable)
    .where(eq(gradeEntriesTable.userId, req.userId!));
  res.json(ListGradeEntriesResponse.parse(entries));
});

router.post("/grade-entries", async (req, res): Promise<void> => {
  const parsed = CreateGradeEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(gradeEntriesTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();

  res.status(201).json(CreateGradeEntryResponse.parse(entry));
});

router.patch("/grade-entries/:id", async (req, res): Promise<void> => {
  const params = UpdateGradeEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateGradeEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .update(gradeEntriesTable)
    .set(parsed.data)
    .where(
      and(
        eq(gradeEntriesTable.id, params.data.id),
        eq(gradeEntriesTable.userId, req.userId!),
      ),
    )
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Grade entry not found" });
    return;
  }

  res.json(UpdateGradeEntryResponse.parse(entry));
});

router.delete("/grade-entries/:id", async (req, res): Promise<void> => {
  const params = DeleteGradeEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(gradeEntriesTable)
    .where(
      and(
        eq(gradeEntriesTable.id, params.data.id),
        eq(gradeEntriesTable.userId, req.userId!),
      ),
    )
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Grade entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
