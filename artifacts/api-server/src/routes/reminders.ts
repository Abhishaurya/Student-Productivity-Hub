import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, remindersTable } from "@workspace/db";
import {
  CreateReminderBody,
  UpdateReminderBody,
  UpdateReminderParams,
  DeleteReminderParams,
  ListRemindersQueryParams,
  GetUpcomingRemindersQueryParams,
  ListRemindersResponse,
  GetUpcomingRemindersResponse,
  CreateReminderResponse,
  UpdateReminderResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reminders/upcoming", async (req, res): Promise<void> => {
  const query = GetUpcomingRemindersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const limit = query.data.limit ?? 5;

  const reminders = await db
    .select()
    .from(remindersTable)
    .where(eq(remindersTable.isDone, false))
    .orderBy(asc(remindersTable.remindAt))
    .limit(limit);

  res.json(GetUpcomingRemindersResponse.parse(reminders));
});

router.get("/reminders", async (req, res): Promise<void> => {
  const query = ListRemindersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const reminders = await db
    .select()
    .from(remindersTable)
    .where(
      query.data.upcomingOnly ? eq(remindersTable.isDone, false) : undefined,
    )
    .orderBy(asc(remindersTable.remindAt));

  res.json(ListRemindersResponse.parse(reminders));
});

router.post("/reminders", async (req, res): Promise<void> => {
  const parsed = CreateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reminder] = await db
    .insert(remindersTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(CreateReminderResponse.parse(reminder));
});

router.patch("/reminders/:id", async (req, res): Promise<void> => {
  const params = UpdateReminderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reminder] = await db
    .update(remindersTable)
    .set(parsed.data)
    .where(eq(remindersTable.id, params.data.id))
    .returning();

  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }

  res.json(UpdateReminderResponse.parse(reminder));
});

router.delete("/reminders/:id", async (req, res): Promise<void> => {
  const params = DeleteReminderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reminder] = await db
    .delete(remindersTable)
    .where(eq(remindersTable.id, params.data.id))
    .returning();

  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
