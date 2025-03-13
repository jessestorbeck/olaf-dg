import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { templates } from "./templates";

// Note that this type must be exported (along with the table itself)
// in order for migration generation to work
export const discStatusEnum = pgEnum("status", [
  "awaiting pickup",
  "picked up",
  "archived",
]);

export const discs = pgTable("discs", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar({ length: 256 }),
  phone: varchar({ length: 256 }).notNull(),
  color: varchar({ length: 256 }),
  brand: varchar({ length: 256 }),
  plastic: varchar({ length: 256 }),
  mold: varchar({ length: 256 }),
  location: varchar({ length: 256 }),
  notes: text(),
  notificationTemplate: uuid("notification_template").references(
    () => templates.id,
    { onDelete: "set null" }
  ),
  notificationText: text("notification_text").notNull(),
  reminderTemplate: uuid("reminder_template").references(() => templates.id, {
    onDelete: "set null",
  }),
  reminderText: text("reminder_text").notNull(),
  extensionTemplate: uuid("extension_template").references(() => templates.id, {
    onDelete: "set null",
  }),
  extensionText: text("extension_text").notNull(),
  notified: boolean().notNull().default(false),
  reminded: boolean().notNull().default(false),
  status: discStatusEnum().notNull().default("awaiting pickup"),
  heldUntil: timestamp("held_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type InsertDisc = typeof discs.$inferInsert;
export type SelectDisc = typeof discs.$inferSelect;

// Special type for preview discs
export type NotificationPreviewDisc = Omit<
  SelectDisc,
  | "id"
  | "userId"
  | "phone"
  | "location"
  | "notes"
  | "notified"
  | "reminded"
  | "status"
  | "notificationTemplate"
  | "notificationText"
  | "reminderTemplate"
  | "reminderText"
  | "extensionTemplate"
  | "extensionText"
  | "createdAt"
  | "updatedAt"
>;
