import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

// Enums for tables
// Note that these must be exported for migration generation to work
export const templateTypeEnum = pgEnum("type", [
  "notification",
  "reminder",
  "extension",
]);
export const discStatusEnum = pgEnum("status", [
  "awaiting pickup",
  "picked up",
  "archived",
]);
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

// Table schemas
export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  password: text().notNull(),
  name: varchar({ length: 256 }).notNull(),
  laf: varchar({ length: 256 }).notNull(),
  holdDuration: integer("hold_duration").notNull().default(60),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const templates = pgTable("templates", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: templateTypeEnum().notNull(),
  name: varchar({ length: 256 }).notNull(),
  content: text().notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const discs = pgTable("discs", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
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

export const trends = pgTable("trends", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid("user_id")
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

// Export inferred types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;
export type SelectTemplate = typeof templates.$inferSelect;
export type InsertDisc = typeof discs.$inferInsert;
// Add laf to SelectDisc
export type SelectDisc = typeof discs.$inferSelect & { laf: string };
export type InsertTrend = typeof trends.$inferInsert;
export type SelectTrend = typeof trends.$inferSelect;

// Special type for preview discs (omit unnecessary properties and add laf)
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
