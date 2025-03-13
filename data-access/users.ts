"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";

import { auth } from "@/app/lib/auth";
import { db } from "@/db/index";
import { users, UserSettings } from "@/db/schema/users";
import { SignupSchema, LoginSchema } from "@/db/validation";

export async function fetchUserId(): Promise<string> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user.id;
    if (!userId) {
      throw new Error("Failed to authenticate user");
    }
    return userId;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to fetch user");
  }
}

export async function fetchUserSettings(): Promise<UserSettings> {
  try {
    // Auth check
    const userId = await fetchUserId();
    const rows = await db
      .select({ holdDuration: users.holdDuration, laf: users.laf })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch hold duration");
  }
}

// Auth-related actions

export type SignUpState = {
  formData?: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
    root?: string[];
  };
};

export async function signUp(
  prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  // Validate formData
  const validatedFields = SignupSchema.safeParse({
    ...Object.fromEntries(formData),
  });

  // If validation fails, return the errors and form data
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        password: validatedFields.data.password,
      },
    });
  } catch (error) {
    console.error("Error during sign-up:", error);
    const message: string =
      error instanceof APIError ?
        error.message
      : "An error occurred. Please try again.";
    return {
      errors: {
        root: [message],
      },
      formData: Object.fromEntries(formData),
    };
  }
  // Redirect to the login page
  redirect("/login");
}

export type LoginState = {
  formData?: {
    email?: string;
    password?: string;
  };
  errors?: {
    email?: string[];
    password?: string[];
    root?: string[];
  };
};

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Validate formData
  const validatedFields = LoginSchema.safeParse({
    ...Object.fromEntries(formData),
  });

  // If validation fails, return the errors and form data
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: validatedFields.data.email,
        password: validatedFields.data.password,
        rememberMe: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    console.error("Error during login:", error);
    const message: string =
      error instanceof APIError ?
        error.message
      : "An error occurred. Please try again.";
    return {
      errors: {
        root: [message],
      },
      formData: Object.fromEntries(formData),
    };
  }
  // Redirect to the dashboard
  redirect("/dashboard");
}

export async function signOut() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (error) {
    console.error("Error during sign-out:", error);
    if (error instanceof APIError) console.error(error.body);
  }
  redirect("/login");
}
