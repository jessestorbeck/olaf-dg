import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  smsPermissions: boolean("sms_permissions").default(false).notNull(),
  image: text(),
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

// better-auth required schema for user table
// See https://www.better-auth.com/docs/concepts/database#user
// export const user = pgTable("user", {
//   id: text("id").primaryKey(),
//   name: text("name").notNull(),
//   email: text("email").notNull().unique(),
//   emailVerified: boolean("email_verified").notNull(),
//   image: text("image"),
//   createdAt: timestamp("created_at").notNull(),
//   updatedAt: timestamp("updated_at").notNull(),
// });

// Export inferred types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// Special type for user settings
export type UserSettings = {
  name: string;
  holdDuration: number;
  laf: string | null;
  smsPermissions: boolean;
};
