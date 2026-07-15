import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blocklistItemsTable = pgTable("blocklist_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  label: text("label").notNull(),
  category: text("category").notNull().default("other"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertBlocklistItemSchema = createInsertSchema(
  blocklistItemsTable,
).omit({ id: true, userId: true, createdAt: true });
export type InsertBlocklistItem = z.infer<typeof insertBlocklistItemSchema>;
export type BlocklistItem = typeof blocklistItemsTable.$inferSelect;
