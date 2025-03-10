import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// Note that this type must be exported (along with the table itself)
// in order for migration generation to work
export const trendMonthEnum = pgEnum("month", [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

export const trends = pgTable("trends", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: trendMonthEnum().notNull(),
  year: integer().notNull(),
  found: integer().notNull(),
  returned: integer().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type InsertTrend = typeof trends.$inferInsert;
export type SelectTrend = typeof trends.$inferSelect;
