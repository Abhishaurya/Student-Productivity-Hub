import { pgTable, serial, text, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  targetCgpa: real("target_cgpa").notNull().default(8),
  targetDate: date("target_date", { mode: "string" }),
  note: text("note"),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({
  id: true,
});
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
