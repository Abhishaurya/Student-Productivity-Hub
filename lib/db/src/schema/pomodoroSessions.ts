import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { tasksTable } from "./tasks";

export const pomodoroSessionsTable = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: integer("task_id").references(() => tasksTable.id, {
    onDelete: "set null",
  }),
  courseId: integer("course_id").references(() => coursesTable.id, {
    onDelete: "set null",
  }),
  durationMinutes: integer("duration_minutes").notNull(),
  distractionCount: integer("distraction_count").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPomodoroSessionSchema = createInsertSchema(
  pomodoroSessionsTable,
).omit({ id: true, userId: true, completedAt: true });
export type InsertPomodoroSession = z.infer<
  typeof insertPomodoroSessionSchema
>;
export type PomodoroSession = typeof pomodoroSessionsTable.$inferSelect;
