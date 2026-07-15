import { Router, type IRouter } from "express";
import { and, asc, eq, ne } from "drizzle-orm";
import {
  db,
  timetableSlotsTable,
  tasksTable,
  attendanceRecordsTable,
  coursesTable,
  gradeEntriesTable,
  remindersTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/dashboard-summary", async (req, res): Promise<void> => {
  const userId = req.userId!;
  const today = new Date().getDay();

  const [todayTimetable, upcomingTasks, courses, records, gradeEntries, upcomingReminders] =
    await Promise.all([
      db
        .select()
        .from(timetableSlotsTable)
        .where(
          and(
            eq(timetableSlotsTable.dayOfWeek, today),
            eq(timetableSlotsTable.userId, userId),
          ),
        ),
      db
        .select()
        .from(tasksTable)
        .where(and(ne(tasksTable.status, "completed"), eq(tasksTable.userId, userId)))
        .orderBy(asc(tasksTable.dueDate))
        .limit(5),
      db.select().from(coursesTable).where(eq(coursesTable.userId, userId)),
      db
        .select()
        .from(attendanceRecordsTable)
        .where(eq(attendanceRecordsTable.userId, userId)),
      db.select().from(gradeEntriesTable).where(eq(gradeEntriesTable.userId, userId)),
      db
        .select()
        .from(remindersTable)
        .where(and(eq(remindersTable.isDone, false), eq(remindersTable.userId, userId)))
        .orderBy(asc(remindersTable.remindAt))
        .limit(5),
    ]);

  const attendanceAtRisk = courses
    .map((course) => {
      const courseRecords = records.filter((r) => r.courseId === course.id);
      const totalClasses = courseRecords.length;
      const present = courseRecords.filter((r) => r.status === "present").length;
      const percentage =
        totalClasses === 0 ? 100 : Math.round((present / totalClasses) * 1000) / 10;
      return { courseId: course.id, courseName: course.name, percentage };
    })
    .filter((c) => c.percentage < 75);

  const totalCredits = gradeEntries.reduce((sum, e) => sum + e.credits, 0);
  const totalPoints = gradeEntries.reduce(
    (sum, e) => sum + e.gradePoint * e.credits,
    0,
  );
  const cgpa =
    totalCredits === 0 ? 0 : Math.round((totalPoints / totalCredits) * 100) / 100;

  res.json(
    GetDashboardSummaryResponse.parse({
      todayTimetable,
      upcomingTasks,
      cgpa,
      attendanceAtRisk,
      upcomingReminders,
    }),
  );
});

export default router;
