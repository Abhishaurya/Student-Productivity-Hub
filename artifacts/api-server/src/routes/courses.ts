import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, coursesTable } from "@workspace/db";
import {
  CreateCourseBody,
  UpdateCourseBody,
  UpdateCourseParams,
  DeleteCourseParams,
  ListCoursesResponse,
  CreateCourseResponse,
  UpdateCourseResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/courses", async (_req, res): Promise<void> => {
  const courses = await db
    .select()
    .from(coursesTable)
    .orderBy(coursesTable.name);
  res.json(ListCoursesResponse.parse(courses));
});

router.post("/courses", async (req, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [course] = await db
    .insert(coursesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(CreateCourseResponse.parse(course));
});

router.patch("/courses/:id", async (req, res): Promise<void> => {
  const params = UpdateCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [course] = await db
    .update(coursesTable)
    .set(parsed.data)
    .where(eq(coursesTable.id, params.data.id))
    .returning();

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json(UpdateCourseResponse.parse(course));
});

router.delete("/courses/:id", async (req, res): Promise<void> => {
  const params = DeleteCourseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [course] = await db
    .delete(coursesTable)
    .where(eq(coursesTable.id, params.data.id))
    .returning();

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
