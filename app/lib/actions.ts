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
  date: z.date(),
  held_until: z.date(),
  notified: z.boolean(),
  reminded: z.boolean(),
  status: z.enum(["awaiting pickup", "picked up", "abandoned", "removed"]),
});

const CreateDisc = FormSchema.omit({
  id: true,
  date: true,
  held_until: true,
  notified: true,
  reminded: true,
  status: true,
});
const UpdateDisc = FormSchema.omit({
  id: true,
  date: true,
  held_until: true,
  notified: true,
  reminded: true,
  status: true,
});

export type State = {
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
    date?: string[];
    held_until?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createDisc(prevState: State, formData: FormData) {
  const validatedFields = CreateDisc.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    color: formData.get("color"),
    brand: formData.get("brand"),
    plastic: formData.get("plastic"),
    mold: formData.get("mold"),
    location: formData.get("location"),
    notes: formData.get("notes"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing required fields; failed to create disc",
    };
  }

  // Prepare data for insertion into the database
  const { name, phone, color, brand, plastic, mold, location } =
    validatedFields.data;
  const rawDate = new Date();
  const date = rawDate.toISOString().split("T")[0];
  // Held for 60 days past date
  const heldUntil = new Date(rawDate.setDate(rawDate.getDate() + 60))
    .toISOString()
    .split("T")[0];
  const notified = false;
  const reminded = false;
  const status = "awaiting pickup";
  // Insert data into the database
  try {
    await sql`
      INSERT INTO discs (name, phone, color, brand, plastic, mold, location, date, held_until, notified, reminded, status)
      VALUES (${name}, ${phone}, ${color}, ${brand}, ${plastic}, ${mold}, ${location}, ${date}, ${heldUntil}, ${notified}, ${reminded}, ${status})
    `;
  } catch (error) {
    console.error("Database error: failed to create disc", error);
    // If a database error occurs, return a more specific error
    return {
      message: "Database error: failed to create disc",
    };
  }
  // Revalidate the cache for the discs page and redirect the user
  revalidatePath("/dashboard/discs");
  redirect("/dashboard/discs");
}

export async function updateDisc(
  id: string,
  prevState: State,
  formData: FormData
) {
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
  revalidatePath("/dashboard/discs");
  redirect("/dashboard/discs");
}

export async function deleteDisc(id: string) {
  try {
    await sql`DELETE FROM discs WHERE id = ${id}`;
    revalidatePath("/dashboard/discs");
    return { message: "Deleted Disc." };
  } catch (error) {
    console.error("Database error: failed to delete disc", error);
    return { message: "Database error: failed to delete disc" };
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
