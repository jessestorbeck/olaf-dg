"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const maxStrLen = 50;
const tooLong = { message: `Must be less than ${maxStrLen} characters` };

const FormSchema = z.object({
  id: z.string().uuid(),
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
  addAnother: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

const CreateDisc = FormSchema.omit({
  id: true,
  held_until: true,
  notified: true,
  reminded: true,
  status: true,
});
const UpdateDisc = FormSchema.omit({
  id: true,
  held_until: true,
  notified: true,
  reminded: true,
  status: true,
  addAnother: true,
});

export type State = {
  formData?: {
    name?: string;
    phone?: string;
    color?: string;
    brand?: string;
    plastic?: string;
    mold?: string;
    location?: string;
    notes?: string;
    addAnother?: string;
  };
  errors?: {
    id?: string[];
    name?: string[];
    phone?: string[];
    color?: string[];
    brand?: string[];
    plastic?: string[];
    mold?: string[];
    location?: string[];
    notes?: string[];
    held_until?: string[];
    status?: string[];
    addAnother?: string[];
  };
  message?: string | null;
};

export async function createDisc(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = CreateDisc.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    color: formData.get("color"),
    brand: formData.get("brand"),
    plastic: formData.get("plastic"),
    mold: formData.get("mold"),
    location: formData.get("location"),
    notes: formData.get("notes"),
    addAnother: formData.get("addAnother"),
  });

  // If form validation fails, return errors early; otherwise, continue
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing required fields; failed to create disc",
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  // Prepare data for insertion into the database
  const {
    name,
    phone,
    color,
    brand,
    plastic,
    mold,
    location,
    notes,
    addAnother,
  } = validatedFields.data;
  const notified = false;
  const reminded = false;
  const status = "awaiting pickup";
  const held_until = undefined;
  // Insert data into the database
  try {
    await sql`
      INSERT INTO discs (name, phone, color, brand, plastic, mold, location, notes, notified, reminded, status, held_until)
      VALUES (${name}, ${phone}, ${color}, ${brand}, ${plastic}, ${mold}, ${location}, ${notes}, ${notified}, ${reminded}, ${status}, ${held_until})
    `;
  } catch (error) {
    console.error("Database error: failed to create disc", error);
    // If a database error occurs, return a more specific error
    return {
      message: "Database error: failed to create disc",
    };
  }
  const discString = [color, brand, plastic, mold || "disc"]
    .filter(Boolean)
    .join(" ");
  const successMessage = `Added a new ${discString} to your inventory`;
  // Title for the toast notification after redirect
  const toastTitle = "Disc added!";

  if (addAnother) {
    // If user wants to add another, don't redirect and clear the form
    return { message: successMessage, formData: {} };
  }
  // Revalidate the cache for the discs page and redirect the user
  revalidatePath("/dashboard/discs");
  // Pass the message for the toast as a query parameter
  redirect(
    `/dashboard/discs?message=${encodeURIComponent(successMessage)}&title=${encodeURIComponent(toastTitle)}`
  );
}

export async function updateDisc(
  id: string,
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = UpdateDisc.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    color: formData.get("color"),
    brand: formData.get("brand"),
    plastic: formData.get("plastic"),
    mold: formData.get("mold"),
    location: formData.get("location"),
    notes: formData.get("notes"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing required fields; failed to update disc",
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  const { name, phone, color, brand, plastic, mold, location, notes } =
    validatedFields.data;

  try {
    await sql`
      UPDATE discs
      SET name = ${name}, phone = ${phone}, color = ${color}, brand = ${brand}, plastic = ${plastic}, mold = ${mold}, location = ${location}, notes = ${notes}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error("Database error: failed to update disc", error);
    return { message: "Database error: failed to update disc" };
  }
  const discString = [color, brand, plastic, mold || "disc"]
    .filter(Boolean)
    .join(" ");
  const successMessage = `Updated an existing ${discString} in your inventory`;
  const toastTitle = "Disc updated!";

  revalidatePath("/dashboard/discs");
  // Pass the message for the toast as a query parameter
  redirect(
    `/dashboard/discs?message=${encodeURIComponent(successMessage)}&title=${encodeURIComponent(toastTitle)}`
  );
}

export type ToastState = {
  errors?: z.typeToFlattenedError<number, string>;
  toast?: {
    title: string | null;
    message: string | null;
  };
};

export async function notifyOwners(ids: string[]): Promise<ToastState> {
  try {
    await sql`
      UPDATE discs
      SET notified = TRUE, held_until = NOW() + INTERVAL '60 days'
      WHERE id = ANY(${Object.assign(ids)})
    `;
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Notification(s) sent!",
        message: `Notified owners of ${ids.length} disc(s)`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to notify disc owner(s)", error);
    return {
      toast: {
        title: "Database error",
        message: `Failed to notify disc owner(s)`,
      },
    };
  }
}

export async function remindOwners(ids: string[]): Promise<ToastState> {
  try {
    await sql`UPDATE discs SET reminded = TRUE WHERE id = ANY(${Object.assign(ids)})`;
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Reminder(s) sent!",
        message: `Reminded owners of ${ids.length} disc(s)`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to remind disc owner(s)", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to remind disc owner(s)",
      },
    };
  }
}

export async function addTimeToDiscs(
  ids: string[],
  days: number
): Promise<ToastState> {
  const validDays = z
    .number({ message: "Days must be a number" })
    .int({ message: "Days must be a whole number" })
    .positive({ message: "Days must be greater than zero" })
    .lte(365, { message: "Days must be less than or equal to 365" })
    .safeParse(days);

  if (!validDays.success) {
    return {
      errors: validDays.error.flatten(),
      toast: {
        title: "Invalid days",
        message: "Days must be a positive whole number <= 365",
      },
    };
  }
  try {
    await sql`
      UPDATE discs
      SET held_until = held_until + INTERVAL '1 day' * ${validDays.data}
      WHERE id = ANY(${Object.assign(ids)})
    `;
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Time added!",
        message: `Added ${days} day(s) to ${ids.length} disc(s)`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to update held-until dates", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to update held-until dates",
      },
    };
  }
}

export async function discsPickedUp(ids: string[]): Promise<ToastState> {
  try {
    await sql`UPDATE discs SET status = 'picked up' WHERE id = ANY(${Object.assign(ids)})`;
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Disc(s) picked up!",
        message: `${ids.length} disc(s) picked up`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to update disc status", error);
    return {
      toast: {
        title: "Database error",
        message: "Database error: failed to update disc status",
      },
    };
  }
}

export async function archiveDiscs(ids: string[]): Promise<ToastState> {
  try {
    await sql`UPDATE discs SET status = 'archived' WHERE id = ANY(${Object.assign(ids)})`;
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Disc(s) archived!",
        message: `${ids.length} disc(s) archived`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to update disc status", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to update disc status",
      },
    };
  }
}

export async function restoreDiscs(ids: string[]): Promise<ToastState> {
  try {
    await sql`UPDATE discs SET status = 'awaiting pickup' WHERE id = ANY(${Object.assign(ids)})`;
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Disc(s) restored!",
        message: `${ids.length} disc(s) restored to "awaiting pickup"`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to update disc status", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to update disc status",
      },
    };
  }
}

export async function deleteDiscs(ids: string[]): Promise<ToastState> {
  try {
    await sql`DELETE FROM discs WHERE id = ANY(${Object.assign(ids)})`;
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Disc(s) deleted!",
        message: `Deleted ${ids.length} discs`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to delete discs", error);
    return {
      toast: {
        title: "Database error",
        message: "Database error: failed to delete discs",
      },
    };
  }
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
