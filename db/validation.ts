import z from "zod/v4";
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
  return { error: `Cannot be more than ${maxLen} characters` };
};

// User schemas
export const CreateUserSchema = createInsertSchema(users);
export const SelectUserSchema = createSelectSchema(users);
export const UpdateUserSchema = createUpdateSchema(users);

export const UserSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Account name is required" })
    .max(maxLenField, tooLong(maxLenField)),
  holdDuration: z.coerce
    .number<number>()
    .int({ error: "Must be a whole number" })
    .min(30, { error: "Must be at least 30 days" })
    .max(365, { error: "Cannot be more than 365 days" }),
  laf: z
    .string()
    .trim()
    .min(1, { error: "Lost-and-found name is required" })
    .max(maxLenField, tooLong(maxLenField)),
});

// Auth schemas
const passwordValidation = z
  .string()
  .min(8, { error: "Must be at least 8 characters" })
  .regex(/[a-z]/, { error: "Must contain a lowercase letter" })
  .regex(/[A-Z]/, { error: "Must contain an uppercase letter" })
  .regex(/\d/, { error: "Must contain a number" })
  .regex(/[^a-zA-Z\d\s]/, {
    error: "Must contain a special character",
  });
export const SignupSchema = z
  .object({
    name: z.string().trim().min(1, { error: "Name is required" }),
    laf: z
      .string()
      .trim()
      .min(1, { error: "Lost-and-found name is required" })
      .max(maxLenField, tooLong(maxLenField)),
    email: z.email(),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.confirmPassword === data.password, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });
export const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});
export const ForgotPasswordSchema = z.object({
  email: z.email(),
});
export const ResetPasswordSchema = z
  .object({
    token: z.string(),
    newPassword: passwordValidation,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.confirmNewPassword === data.newPassword, {
    error: "New passwords do not match",
    path: ["confirmNewPassword"],
  });
// UpdatePasswordSchema is used when the user is logged in
// in contrast to ResetPasswordSchema which is used when the user has forgotten their password
export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: passwordValidation,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.confirmNewPassword === data.newPassword, {
    error: "New passwords do not match",
    path: ["confirmNewPassword"],
  });
export const UpdateEmailSchema = z
  .object({
    newEmail: z.email(),
    confirmNewEmail: z.email(),
    password: z.string(),
  })
  .refine((data) => data.confirmNewEmail === data.newEmail, {
    error: "New emails do not match",
    path: ["confirmNewEmail"],
  });
export const DeleteAccountSchema = z.object({
  password: z.string(),
  areYouSure: z.string().regex(/^Yes, delete my account$/, {
    error: `You must type "Yes, delete my account" to confirm`,
  }),
});

// Template schemas
export const CreateTemplateSchema = createInsertSchema(templates, {
  name: (schema) =>
    schema
      .trim()
      .min(1, { error: "Your template must have a name" })
      .max(maxLenField, tooLong(maxLenField))
      // Templates can't be called "custom" (case-insensitive),
      // since "custom" is reserved for custom messages added to specific discs
      .refine((val) => val.toLowerCase() !== "custom", {
        error: `Template cannot be named "custom" (case-insensitive)`,
      }),
  content: (schema) =>
    schema
      .trim()
      .min(1, { error: "Your template must have content" })
      .max(maxLenText, tooLong(maxLenText))
      .regex(/\$laf/, { error: templateVarMessage })
      .regex(/\$heldUntil/, { error: templateVarMessage }),
  type: (schema) =>
    schema.refine((val) => ["initial", "reminder", "extension"].includes(val), {
      error: "You must select a template type",
    }),
}).extend({ addAnother: z.string().regex(/^(true|false)$/) });
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
        error: "Cannot change the type of a default template",
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
        error: "Cannot change the type of a template assigned to discs",
        path: ["type"],
      }
    );
};

// Disc schemas
export const CreateDiscSchema = createInsertSchema(discs, {
  name: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  phone: (schema) =>
    schema.trim().regex(/^\d{10}$/, { error: "Invalid phone number" }),
  color: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  brand: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  plastic: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  mold: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  location: (schema) => schema.trim().max(maxLenField, tooLong(maxLenField)),
  notes: (schema) => schema.trim().max(maxLenText, tooLong(maxLenText)),
  // Make sure that "custom" is transformed to NULL in the database
  initialTemplate: (schema) =>
    schema.or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => null)
    ),
  reminderTemplate: (schema) =>
    schema.or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => null)
    ),
  extensionTemplate: (schema) =>
    schema.or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => null)
    ),
  initialText: (schema) =>
    schema
      .trim()
      .min(1, { error: "Notification text is required" })
      .max(maxLenText, tooLong(maxLenText)),
  reminderText: (schema) =>
    schema
      .trim()
      .min(1, { error: "Reminder text is required" })
      .max(maxLenText, tooLong(maxLenText)),
  extensionText: (schema) =>
    schema
      .trim()
      .min(1, { error: "Extension text is required" })
      .max(maxLenText, tooLong(maxLenText)),
}).extend({ addAnother: z.string().regex(/^(true|false)$/) });

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
});
export const UpdateDiscSchema = createUpdateSchema(discs, DiscExtensions);

// For disc pick-up extension
export const DaysSchema = z
  .number({ error: "Must be a number" })
  .int({ error: "Must be a whole number" })
  .min(1, { error: "Must be greater than zero" })
  .max(365, { error: "Cannot be more than 365" });

// Trend schemas
export const CreateTrendSchema = createInsertSchema(trends);
export const SelectTrendSchema = createSelectSchema(trends);
export const UpdateTrendSchema = createUpdateSchema(trends);
