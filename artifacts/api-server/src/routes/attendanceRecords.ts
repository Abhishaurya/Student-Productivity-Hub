import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, attendanceRecordsTable, coursesTable } from "@workspace/db";
import {
  CreateAttendanceRecordBody,
  UpdateAttendanceRecordBody,
  UpdateAttendanceRecordParams,
  DeleteAttendanceRecordParams,
  ListAttendanceRecordsQueryParams,
  ListAttendanceRecordsResponse,
  GetAttendanceSummaryResponse,
  CreateAttendanceRecordResponse,
  UpdateAttendanceRecordResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

router.get("/attendance-summary", async (req, res): Promise<void> => {
  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.userId, req.userId!));
  const records = await db
    .select()
    .from(attendanceRecordsTable)
    .where(eq(attendanceRecordsTable.userId, req.userId!));

  const summary = courses.map((course) => {
    const courseRecords = records.filter((r) => r.courseId === course.id);
    const present = courseRecords.filter((r) => r.status === "present").length;
    const absent = courseRecords.filter((r) => r.status === "absent").length;
    const excused = courseRecords.filter((r) => r.status === "excused").length;
    const totalClasses = courseRecords.length;
    const percentage =
      totalClasses === 0 ? 100 : Math.round((present / totalClasses) * 1000) / 10;

    return {
      courseId: course.id,
      courseName: course.name,
      totalClasses,
      present,
      absent,
      excused,
      percentage,
    };
  });

  res.json(GetAttendanceSummaryResponse.parse(summary));
});

router.get("/attendance-records", async (req, res): Promise<void> => {
  const query = ListAttendanceRecordsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(attendanceRecordsTable.userId, req.userId!)];
  if (query.data.courseId !== undefined)
    conditions.push(eq(attendanceRecordsTable.courseId, query.data.courseId));

  const records = await db
    .select()
    .from(attendanceRecordsTable)
    .where(and(...conditions));

  res.json(ListAttendanceRecordsResponse.parse(records));
});

router.post("/attendance-records", async (req, res): Promise<void> => {
  const parsed = CreateAttendanceRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db
    .insert(attendanceRecordsTable)
    .values({
      ...parsed.data,
      userId: req.userId!,
      date: toDateString(parsed.data.date),
    })
    .returning();

  res.status(201).json(CreateAttendanceRecordResponse.parse(record));
});

router.patch("/attendance-records/:id", async (req, res): Promise<void> => {
  const params = UpdateAttendanceRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAttendanceRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db
    .update(attendanceRecordsTable)
    .set({
      ...parsed.data,
      date: parsed.data.date ? toDateString(parsed.data.date) : undefined,
    })
    .where(
      and(
        eq(attendanceRecordsTable.id, params.data.id),
        eq(attendanceRecordsTable.userId, req.userId!),
      ),
    )
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  res.json(UpdateAttendanceRecordResponse.parse(record));
});

router.delete("/attendance-records/:id", async (req, res): Promise<void> => {
  const params = DeleteAttendanceRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .delete(attendanceRecordsTable)
    .where(
      and(
        eq(attendanceRecordsTable.id, params.data.id),
        eq(attendanceRecordsTable.userId, req.userId!),
      ),
    )
    .returning();

  if (!record) {
    res.status(404).json({ error: "Attendance record not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
