import { pgTable, serial, integer, text, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";

export const attendanceRecordsTable = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("present"),
});

export const insertAttendanceRecordSchema = createInsertSchema(
  attendanceRecordsTable,
).omit({ id: true, userId: true });
export type InsertAttendanceRecord = z.infer<
  typeof insertAttendanceRecordSchema
>;
export type AttendanceRecord = typeof attendanceRecordsTable.$inferSelect;
