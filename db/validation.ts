import z from "zod";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

import { users } from "./schema/users";
import { templates } from "./schema/templates";
import { discs } from "./schema/discs";
import { trends } from "./schema/trends";

// Some reusable helpers for validation
const templateVarMessage =
  "Your template must reference the lost-and-found name with $laf and the held-until date with $held_until";
const maxLenField = 50;
const maxLenText = 500;
const tooLong = (maxLen: number) => {
  return { message: `Must be less than ${maxLen} characters` };
};

// User schemas
export const CreateUserSchema = createInsertSchema(users);
export const SelectUserSchema = createSelectSchema(users);
export const UpdateUserSchema = createUpdateSchema(users);

// Auth schemas
export const SignupSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.string().email(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[a-z]/, { message: "Password must contain a lowercase letter" })
      .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
      .regex(/\d/, { message: "Password must contain a number" })
      .regex(/[^a-zA-Z\d\s]/, {
        message: "Password must contain a special character",
      }),
    confirmPassword: z.string(),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Template schemas
export const CreateTemplateSchema = createInsertSchema(templates, {
  name: (schema) =>
    schema
      .trim()
      .min(1, { message: "Your template must have a name" })
      .max(maxLenField, tooLong(maxLenField)),
  content: (schema) =>
    schema
      .trim()
      .min(1, { message: "Your template must have content" })
      .max(maxLenText, tooLong(maxLenText))
      .regex(/\$laf/, { message: templateVarMessage })
      .regex(/\$heldUntil/, { message: templateVarMessage }),
}).extend({
  addAnother: z.string().regex(/^(true|false)$/),
  // Unfortunately, it seems like there's no way to add a user-facing message
  // to the ZodEnum which createInsertSchema infers from the database schema
  // So we have to just overwrite it with the same enum and the desired message
  type: z.enum(["notification", "reminder", "extension"], {
    message: "You must select a template type",
  }),
});
const TemplateExtensions = {
  name: CreateTemplateSchema.shape.name,
  type: CreateTemplateSchema.shape.type,
  content: CreateTemplateSchema.shape.content,
};
export const SelectTemplateSchema = createSelectSchema(
  templates,
  TemplateExtensions
);
export const UpdateTemplateSchema = createUpdateSchema(
  templates,
  TemplateExtensions
);

// Disc schemas
export const CreateDiscSchema = createInsertSchema(discs, {
  name: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  phone: (schema) =>
    schema.trim().regex(/^\d{10}$/, { message: "Invalid phone number" }),
  color: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  brand: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  plastic: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  mold: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  location: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  notes: (schema) => schema.trim().max(maxLenText, tooLong(maxLenText)),
  notificationTemplate: (schema) =>
    schema.or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => undefined)
    ),
  notificationText: (schema) =>
    schema
      .trim()
      .min(1, { message: "Notification text is required" })
      .max(maxLenText, tooLong(maxLenText)),
  reminderTemplate: (schema) =>
    schema.or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => undefined)
    ),
  reminderText: (schema) =>
    schema
      .trim()
      .min(1, { message: "Reminder text is required" })
      .max(maxLenText, tooLong(maxLenText)),
  extensionTemplate: (schema) =>
    schema.or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => undefined)
    ),
  extensionText: (schema) =>
    schema
      .trim()
      .min(1, { message: "Extension text is required" })
      .max(maxLenText, tooLong(maxLenText)),
}).extend({
  addAnother: z.string().regex(/^(true|false)$/),
});
const DiscExtensions = {
  name: CreateDiscSchema.shape.name,
  phone: CreateDiscSchema.shape.phone,
  color: CreateDiscSchema.shape.color,
  brand: CreateDiscSchema.shape.brand,
  plastic: CreateDiscSchema.shape.plastic,
  mold: CreateDiscSchema.shape.mold,
  location: CreateDiscSchema.shape.location,
  notes: CreateDiscSchema.shape.notes,
  notificationTemplate: CreateDiscSchema.shape.notificationTemplate,
  notificationText: CreateDiscSchema.shape.notificationText,
  reminderTemplate: CreateDiscSchema.shape.reminderTemplate,
  reminderText: CreateDiscSchema.shape.reminderText,
  extensionTemplate: CreateDiscSchema.shape.extensionTemplate,
  extensionText: CreateDiscSchema.shape.extensionText,
};
export const SelectDiscSchema = createSelectSchema(discs, {
  ...DiscExtensions,
  // Need to reverse the transform for custom templates when selecting
  // For some reason, extending the schema wasn't working here,
  // and I couldn't get the transform to work correctly:
  // e.g., notificationTemplate: (schema) => schema.transform((val) => val ?? "custom"),
  // Therefore, I'm just overwriting the schema
  notificationTemplate: z
    .string()
    .uuid()
    .nullable()
    .transform((val) => val ?? "custom"),
  reminderTemplate: z
    .string()
    .uuid()
    .nullable()
    .transform((val) => val ?? "custom"),
  extensionTemplate: z
    .string()
    .uuid()
    .nullable()
    .transform((val) => val ?? "custom"),
}).extend({
  // Account for joining laf from the users table
  laf: z.string(),
});
export const UpdateDiscSchema = createUpdateSchema(discs, DiscExtensions);

// For disc pick-up extension
export const DaysSchema = z
  .number({ message: "Days must be a number" })
  .int({ message: "Days must be a whole number" })
  .positive({ message: "Days must be greater than zero" })
  .lte(365, { message: "Days must be less than or equal to 365" });

// Trend schemas
export const CreateTrendSchema = createInsertSchema(trends);
export const SelectTrendSchema = createSelectSchema(trends);
export const UpdateTrendSchema = createUpdateSchema(trends);
