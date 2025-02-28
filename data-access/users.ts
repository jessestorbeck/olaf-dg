"use server";

import { AuthError } from "next-auth";
import { eq } from "drizzle-orm";

import { signIn } from "@/auth";
import { db } from "@/db/index";
import { users, SelectUser } from "@/db/schema";

// Placeholder until I rework auth
const userId = "35074acb-9121-4e31-9277-4db3241ef591";

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

export async function getUser(email: string): Promise<SelectUser> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export async function fetchHoldDuration() {
  try {
    const rows = await db
      .select({ holdDuration: users.holdDuration })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return rows[0].holdDuration;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch hold duration");
  }
}
