import z from "zod";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";

import { users } from "./schema/users";
import { templates, SelectTemplate, DiscCount } from "./schema/templates";
import { discs } from "./schema/discs";
import { trends } from "./schema/trends";

// Some reusable helpers for validation
const templateVarMessage =
  "Must reference the lost-and-found name with $laf and the held-until date with $held_until";
const maxLenField = 50;
const maxLenText = 500;
const tooLong = (maxLen: number) => {
  return { message: `Cannot be more than ${maxLen} characters` };
};

// User schemas
export const CreateUserSchema = createInsertSchema(users);
export const SelectUserSchema = createSelectSchema(users);
export const UpdateUserSchema = createUpdateSchema(users);

export const UserSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Account name is required" })
    .max(maxLenField, tooLong(maxLenField)),
  holdDuration: z.coerce
    .number()
    .int({ message: "Must be a whole number" })
    .min(30, { message: "Must be at least 30 days" })
    .max(365, { message: "Cannot be more than 365 days" }),
  laf: z
    .string()
    .trim()
    .min(1, { message: "Lost-and-found name is required" })
    .max(maxLenField, tooLong(maxLenField)),
});

// Auth schemas
export const SignupSchema = z
  .object({
    name: z.string().trim().min(1, { message: "Name is required" }),
    laf: z
      .string()
      .trim()
      .min(1, { message: "Lost-and-found name is required" })
      .max(maxLenField, tooLong(maxLenField)),
    email: z.string().email(),
    password: z
      .string()
      .min(8, { message: "Must be at least 8 characters" })
      .regex(/[a-z]/, { message: "Must contain a lowercase letter" })
      .regex(/[A-Z]/, { message: "Must contain an uppercase letter" })
      .regex(/\d/, { message: "Must contain a number" })
      .regex(/[^a-zA-Z\d\s]/, {
        message: "Must contain a special character",
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
      .max(maxLenField, tooLong(maxLenField))
      // Templates can't be called "custom" (case-insensitive),
      // since "custom" is reserved for custom messages added to specific discs
      .refine((val) => val.toLowerCase() !== "custom", {
        message: `Template cannot be named "custom" (case-insensitive)`,
      }),

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
  type: z.enum(["initial", "reminder", "extension"], {
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
// Wrapper function for the update schema to prevent
// potential problems arising from changing template type
export const UpdateTemplateSchema = (
  template: SelectTemplate,
  discCount: DiscCount
) => {
  return createUpdateSchema(templates, TemplateExtensions)
    .refine(
      (data) => {
        if (template.isDefault && template.type !== data.type) {
          return false;
        }
        return true;
      },
      {
        message: "Cannot change the type of a default template",
        path: ["type"],
      }
    )
    .refine(
      (data) => {
        if (discCount.discCount > 0 && data.type !== template.type) {
          return false;
        }
        return true;
      },
      {
        message: "Cannot change the type of a template assigned to discs",
        path: ["type"],
      }
    );
};

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
  initialTemplate: (schema) =>
    schema.or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => null)
    ),
  initialText: (schema) =>
    schema
      .trim()
      .min(1, { message: "Notification text is required" })
      .max(maxLenText, tooLong(maxLenText)),
  reminderTemplate: (schema) =>
    schema.or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => null)
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
        .transform(() => null)
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
  initialTemplate: CreateDiscSchema.shape.initialTemplate,
  initialText: CreateDiscSchema.shape.initialText,
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
  // e.g., initialTemplate: (schema) => schema.transform((val) => val ?? "custom"),
  // Therefore, I'm just overwriting the schema
  initialTemplate: z
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
});
export const UpdateDiscSchema = createUpdateSchema(discs, DiscExtensions);

// For disc pick-up extension
export const DaysSchema = z
  .number({ message: "Must be a number" })
  .int({ message: "Must be a whole number" })
  .min(1, { message: "Must be greater than zero" })
  .max(365, { message: "Cannot be more than 365" });

// Trend schemas
export const CreateTrendSchema = createInsertSchema(trends);
export const SelectTrendSchema = createSelectSchema(trends);
export const UpdateTrendSchema = createUpdateSchema(trends);
