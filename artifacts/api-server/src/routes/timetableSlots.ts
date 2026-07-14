import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, timetableSlotsTable } from "@workspace/db";
import {
  CreateTimetableSlotBody,
  UpdateTimetableSlotBody,
  UpdateTimetableSlotParams,
  DeleteTimetableSlotParams,
  ListTimetableSlotsResponse,
  GetTodayTimetableSlotsResponse,
  CreateTimetableSlotResponse,
  UpdateTimetableSlotResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/timetable-slots/today", async (_req, res): Promise<void> => {
  const today = new Date().getDay();
  const slots = await db
    .select()
    .from(timetableSlotsTable)
    .where(eq(timetableSlotsTable.dayOfWeek, today));
  res.json(GetTodayTimetableSlotsResponse.parse(slots));
});

router.get("/timetable-slots", async (_req, res): Promise<void> => {
  const slots = await db.select().from(timetableSlotsTable);
  res.json(ListTimetableSlotsResponse.parse(slots));
});

router.post("/timetable-slots", async (req, res): Promise<void> => {
  const parsed = CreateTimetableSlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [slot] = await db
    .insert(timetableSlotsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(CreateTimetableSlotResponse.parse(slot));
});

router.patch("/timetable-slots/:id", async (req, res): Promise<void> => {
  const params = UpdateTimetableSlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTimetableSlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [slot] = await db
    .update(timetableSlotsTable)
    .set(parsed.data)
    .where(eq(timetableSlotsTable.id, params.data.id))
    .returning();

  if (!slot) {
    res.status(404).json({ error: "Timetable slot not found" });
    return;
  }

  res.json(UpdateTimetableSlotResponse.parse(slot));
});

router.delete("/timetable-slots/:id", async (req, res): Promise<void> => {
  const params = DeleteTimetableSlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [slot] = await db
    .delete(timetableSlotsTable)
    .where(eq(timetableSlotsTable.id, params.data.id))
    .returning();

  if (!slot) {
    res.status(404).json({ error: "Timetable slot not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
