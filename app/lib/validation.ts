import { z } from "zod";

export const maxLenField = 50;
export const maxLenNotes = 250;
export const maxLenText = 500;
export const tooLong = (maxLen: number) => {
  return { message: `Must be less than ${maxLen} characters` };
};

const DiscSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().trim().max(maxLenField, tooLong(maxLenField)).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, { message: "Invalid phone number" }),
  color: z.string().trim().max(maxLenField, tooLong(maxLenField)).optional(),
  brand: z.string().trim().max(maxLenField, tooLong(maxLenField)).optional(),
  plastic: z.string().trim().max(maxLenField, tooLong(maxLenField)).optional(),
  mold: z.string().trim().max(maxLenField, tooLong(maxLenField)).optional(),
  location: z.string().trim().max(maxLenField, tooLong(maxLenField)).optional(),
  notes: z.string().trim().max(maxLenNotes, tooLong(maxLenNotes)).optional(),
  held_until: z.date().optional(),
  notified: z.boolean(),
  reminded: z.boolean(),
  status: z.enum(["awaiting pickup", "picked up", "archived"]),
  notification_template: z
    .string()
    .uuid()
    .or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => undefined)
    ),
  notification_text: z
    .string({ message: "Notification text is required" })
    .trim()
    .min(1, { message: "Notification text is required" })
    .max(maxLenText, tooLong(maxLenText)),
  reminder_template: z
    .string()
    .uuid()
    .or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => undefined)
    ),
  reminder_text: z
    .string({ message: "Reminder text is required" })
    .trim()
    .min(1, { message: "Reminder text is required" })
    .max(maxLenText, tooLong(maxLenText)),
  extension_template: z
    .string()
    .uuid()
    .or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => undefined)
    ),
  extension_text: z
    .string({ message: "Extension text is required" })
    .trim()
    .min(1, { message: "Extension text is required" })
    .max(maxLenText, tooLong(maxLenText)),
  // Stupid regex, but using enum gives a TS error???
  addAnother: z.string().regex(/^(true|false)$/),
});

const TemplateSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, { message: "Your template must have a name" })
    .max(maxLenField, tooLong(maxLenField)),
  type: z.enum(["notification", "reminder", "extension"], {
    message: "You must select a template type",
  }),
  content: z
    .string()
    .trim()
    .min(1, { message: "Your template must have content" })
    .max(maxLenText, tooLong(maxLenText))
    .regex(/\$laf/, {
      message:
        "Your template must reference the lost-and-found name with $laf and the held-until date with $held_until",
    })
    .regex(/\$held_until/, {
      message:
        "Your template must reference the lost-and-found name with $laf and the held-until date with $held_until",
    }),
  default: z.boolean(),
  // Stupid regex, but using enum gives a TS error???
  addAnother: z.string().regex(/^(true|false)$/),
});

export const AddEditDiscSchema = DiscSchema.omit({
  id: true,
  user_id: true,
  held_until: true,
  notified: true,
  reminded: true,
  status: true,
});

export const AddEditTemplateSchema = TemplateSchema.omit({
  id: true,
  user_id: true,
  default: true,
});
