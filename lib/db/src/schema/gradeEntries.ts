import { pgTable, serial, text, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gradeEntriesTable = pgTable("grade_entries", {
  id: serial("id").primaryKey(),
  semesterName: text("semester_name").notNull(),
  courseName: text("course_name").notNull(),
  credits: real("credits").notNull(),
  gradePoint: real("grade_point").notNull(),
});

export const insertGradeEntrySchema = createInsertSchema(
  gradeEntriesTable,
).omit({ id: true });
export type InsertGradeEntry = z.infer<typeof insertGradeEntrySchema>;
export type GradeEntry = typeof gradeEntriesTable.$inferSelect;
