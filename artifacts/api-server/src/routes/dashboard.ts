import { Router, type IRouter } from "express";
import { asc, eq, ne } from "drizzle-orm";
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

const router: IRouter = Router();

router.get("/dashboard-summary", async (_req, res): Promise<void> => {
  const today = new Date().getDay();

  const [todayTimetable, upcomingTasks, courses, records, gradeEntries, upcomingReminders] =
    await Promise.all([
      db
        .select()
        .from(timetableSlotsTable)
        .where(eq(timetableSlotsTable.dayOfWeek, today)),
      db
        .select()
        .from(tasksTable)
        .where(ne(tasksTable.status, "completed"))
        .orderBy(asc(tasksTable.dueDate))
        .limit(5),
      db.select().from(coursesTable),
      db.select().from(attendanceRecordsTable),
      db.select().from(gradeEntriesTable),
      db
        .select()
        .from(remindersTable)
        .where(eq(remindersTable.isDone, false))
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
