"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";

import { ToastState } from "@/app/ui/toast";
import { auth } from "@/app/lib/auth";
import { db } from "@/db/index";
import { users, UserSettings } from "@/db/schema/users";
import { SignupSchema, LoginSchema, UserSettingsSchema } from "@/db/validation";

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
      .select({
        name: users.name,
        holdDuration: users.holdDuration,
        laf: users.laf,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch hold duration");
  }
}

export type UpdateUserState = {
  formData?: {
    name?: string;
    email?: string;
    holdDuration?: number;
    laf?: string;
  };
  errors?: {
    name?: string[];
    email?: string[];
    holdDuration?: string[];
    laf?: string[];
    root?: string[];
  };
  toast?: ToastState["toast"];
};

export async function updateUserSettings(
  prevState: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  try {
    // Auth check
    const userId = await fetchUserId();
    // Validate formData
    const validatedFields = UserSettingsSchema.safeParse(
      Object.fromEntries(formData)
    );
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        toast: {
          title: "Error: failed to update disc",
          message: "Required field(s) missing",
        },
        // Send the form data back to state to repopulate the form
        formData: Object.fromEntries(formData),
      };
    }

    // Update the user settings
    await db
      .update(users)
      .set(validatedFields.data)
      .where(eq(users.id, userId));

    // await db.transaction(async (tx) => {
    //   // Update the user settings
    //   await tx
    //     .update(users)
    //     .set(validatedFields.data)
    //     .where(eq(users.id, userId));
    //   // Update notifications in the discs table
    //   // First, subquery to get template content
    //   // Templates table needs to be aliased to be able to select the right template content
    //   const notifciations = aliasedTable(templates, "notifications");
    //   const reminders = aliasedTable(templates, "reminders");
    //   const extensions = aliasedTable(templates, "extensions");
    //   const subquery = tx.$with("subquery").as(
    //     tx
    //       .select({
    //         id: discs.id,
    //         notificationContent: notifciations.content,
    //         reminderContent: reminders.content,
    //         extensionContent: extensions.content,
    //       })
    //       .from(discs)
    //       .leftJoin(
    //         notifciations,
    //         eq(discs.notificationTemplate, notifciations.id)
    //       )
    //       .leftJoin(reminders, eq(discs.reminderTemplate, reminders.id))
    //       .leftJoin(extensions, eq(discs.extensionTemplate, extensions.id))
    //       .where(eq(discs.userId, userId))
    //   );
    //   const test = await tx
    //     .with(subquery)
    //     .update(discs)
    //     .set({
    //       // Only update the initial notification text if notifciation hasn't been sent
    //       notificationText: sql<string>`
    //         CASE
    //           WHEN ${discs.notified} = FALSE AND ${discs.notificationTemplate} IS NOT NULL
    //             THEN ${subquery.notificationContent}
    //           ELSE ${discs.notificationText}
    //         END`,
    //       // reminderText: sql<string>``,
    //       // extensionText: sql<string>``,
    //     })
    //     .from(subquery)
    //     .where(and(eq(subquery.id, discs.id), eq(discs.userId, userId)))
    //     .returning();
    //   console.log("Update user settings:", test);
    // });
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update user settings");
  }
  return {
    toast: {
      title: "Success!",
      message: "Settings updated successfully",
    },
  };
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
