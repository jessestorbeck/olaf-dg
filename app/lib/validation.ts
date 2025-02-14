import { z } from "zod";

const maxStrLen = 50;
const tooLong = { message: `Must be less than ${maxStrLen} characters` };

const DiscSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().trim().max(maxStrLen, tooLong).optional(),
  phone: z.string().regex(/^\d{10}$/, { message: "Invalid phone number" }),
  color: z.string().trim().max(maxStrLen, tooLong).optional(),
  brand: z.string().trim().max(maxStrLen, tooLong).optional(),
  plastic: z.string().trim().max(maxStrLen, tooLong).optional(),
  mold: z.string().trim().max(maxStrLen, tooLong).optional(),
  location: z.string().trim().max(maxStrLen, tooLong).optional(),
  notes: z
    .string()
    .trim()
    .max(250, { message: "Must be less than 250 characters" })
    .optional(),
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
  notification_text: z.string({ message: "Notification text is required" }),
  reminder_template: z
    .string()
    .uuid()
    .or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => undefined)
    ),
  reminder_text: z.string(),
  extension_template: z
    .string()
    .uuid()
    .or(
      z
        .string()
        .regex(/^custom$/)
        .transform(() => undefined)
    ),
  extension_text: z.string(),
  // Stupid regex, but using enum gives a TS error???
  addAnother: z.string().regex(/^(true|false)$/),
});

export const CreateDiscSchema = DiscSchema.omit({
  id: true,
  user_id: true,
  held_until: true,
  notified: true,
  reminded: true,
  status: true,
});

export const UpdateDiscSchema = DiscSchema.omit({
  id: true,
  user_id: true,
  held_until: true,
  notified: true,
  reminded: true,
  status: true,
});
