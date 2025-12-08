"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { z } from "zod/v4";

import { ToastState } from "@/app/ui/toast";
import { auth } from "@/app/lib/auth";
import { sendEmail } from "@/app/lib/email";
import { db } from "@/db/index";
import { users, UserSettings } from "@/db/schema/users";
import {
  SignupSchema,
  LoginSchema,
  UserSettingsSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UpdatePasswordSchema,
  UpdateEmailSchema,
  DeleteAccountSchema,
} from "@/db/validation";
import { addDefaultTemplates } from "@/data-access/templates";

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

export async function fetchUserEmail(): Promise<string> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userEmail = session?.user.email;
    if (!userEmail) {
      throw new Error("Failed to authenticate user");
    }
    return userEmail;
  } catch (error) {
    console.error("Error fetching user email:", error);
    throw new Error("Failed to fetch user email");
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
        smsPermissions: users.smsPermissions,
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
        errors: z.flattenError(validatedFields.error).fieldErrors,
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
      errors: z.flattenError(validatedFields.error).fieldErrors,
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  try {
    // Create the user
    const { user } = await auth.api.signUpEmail({
      body: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        password: validatedFields.data.password,
        laf: validatedFields.data.laf,
        callbackURL: "/login",
      },
    });
    try {
      // Add default templates to the user's account
      await addDefaultTemplates(user.id);
    } catch (error) {
      // If there's an error adding default templates, delete the user
      await db.delete(users).where(eq(users.id, user.id));
      throw error;
    }
  } catch (error) {
    console.error("Error during sign-up:", error);
    const message: string =
      error instanceof APIError && error.message ?
        error.message
      : "An error occurred. Please try again.";
    return {
      errors: {
        root: [message],
      },
      formData: Object.fromEntries(formData),
    };
  }
  // Redirect to email verification page
  redirect("/verify-email");
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
      errors: z.flattenError(validatedFields.error).fieldErrors,
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  try {
    await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email: validatedFields.data.email,
        password: validatedFields.data.password,
        rememberMe: true,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    // If email is unverified, redirect to verify page
    if (error instanceof APIError && error.statusCode === 403) {
      redirect("/verify-email");
    }
    const message: string =
      error instanceof APIError && error.message ?
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

export type ForgotPasswordState = {
  formData?: {
    email?: string;
  };
  errors?: {
    email?: string[];
    root?: string[];
  };
  success?: boolean;
};

export async function forgotPassword(
  prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  // Validate formData
  const validatedFields = ForgotPasswordSchema.safeParse({
    ...Object.fromEntries(formData),
  });

  // If validation fails, return the errors and form data
  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email: validatedFields.data.email,
        redirectTo: "/reset-password",
      },
    });
  } catch (error) {
    console.error("Error during password reset request:", error);
    const message: string =
      error instanceof APIError && error.message ?
        error.message
      : "An error occurred. Please try again.";
    return {
      errors: {
        root: [message],
      },
      formData: Object.fromEntries(formData),
    };
  }
  return { success: true };
}

export type ResetPasswordState = {
  formData?: {
    newPassword?: string;
    confirmNewPassword?: string;
    token?: string;
  };
  errors?: {
    newPassword?: string[];
    confirmNewPassword?: string[];
    token?: string[];
    root?: string[];
  };
};

export async function resetPassword(
  prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  // Validate formData
  const validatedFields = ResetPasswordSchema.safeParse({
    ...Object.fromEntries(formData),
  });

  // If validation fails, return the errors and form data
  if (!validatedFields.success) {
    return {
      errors: z.flattenError(validatedFields.error).fieldErrors,
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  try {
    await auth.api.resetPassword({
      body: {
        token: validatedFields.data.token,
        newPassword: validatedFields.data.newPassword,
      },
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    const message: string =
      error instanceof APIError && error.message ?
        error.message
      : "An error occurred. Please try again.";
    return {
      errors: {
        root:
          message === "invalid token" ?
            ["Please request a new password reset link."]
          : [message],
      },
      formData: Object.fromEntries(formData),
    };
  }
  // Redirect to the login page
  redirect("/login");
}

export type UpdatePasswordState = {
  formData?: {
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  };
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmNewPassword?: string[];
    root?: string[];
  };
  toast?: ToastState["toast"];
};

export async function updatePassword(
  prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  // Will be fetched with userId later and used to authenticate current password
  let email: string;
  try {
    // Auth check
    const userId = await fetchUserId();
    const rows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    email = rows[0].email;

    // Validate formData
    const validatedFields = UpdatePasswordSchema.safeParse({
      ...Object.fromEntries(formData),
    });

    // If validation fails, return the errors and form data
    if (!validatedFields.success) {
      return {
        errors: z.flattenError(validatedFields.error).fieldErrors,
        // Send the form data back to state to repopulate the form
        formData: Object.fromEntries(formData),
      };
    }
    // Check if the current password is correct
    try {
      await auth.api.signInEmail({
        body: {
          email: email,
          password: validatedFields.data.currentPassword,
        },
      });
    } catch {
      return {
        errors: {
          currentPassword: ["Invalid password"],
        },
        formData: Object.fromEntries(formData),
      };
    }
    // Update the user's password
    try {
      const ctx = await auth.$context;
      const hash = await ctx.password.hash(validatedFields.data.newPassword);
      await ctx.internalAdapter.updatePassword(userId, hash);
    } catch (error) {
      console.error("Error during password reset:", error);
      const message: string =
        error instanceof APIError && error.message ?
          error.message
        : "An error occurred. Please try again.";
      return {
        errors: {
          root: [message],
        },
        formData: Object.fromEntries(formData),
      };
    }
    try {
      // Send a confirmation email to the user
      await sendEmail({
        to: email,
        subject: "Password updated",
        text: `Your password was updated successfully. If you didn't request this change, please contact support.`,
        html: `Your password was updated successfully. If you didn't request this change, please contact support.`,
      });
    } catch (error) {
      console.error("Error sending password update confirmation email:", error);
    }
    return {
      toast: {
        title: "Password updated!",
        message: "Your password was updated successfully",
      },
    };
  } catch {
    return {
      errors: {
        root: ["You must be logged in to update your password."],
      },
      formData: Object.fromEntries(formData),
    };
  }
}

export type UpdateEmailState = {
  formData?: {
    password?: string;
    newEmail?: string;
    confirmNewEmail?: string;
  };
  errors?: {
    password?: string[];
    newEmail?: string[];
    confirmNewEmail?: string[];
    root?: string[];
  };
  toast?: ToastState["toast"];
};

export async function updateEmail(
  prevState: UpdateEmailState,
  formData: FormData
): Promise<UpdateEmailState> {
  // Will be fetched with userId later and used to authenticate current password
  let email: string;
  try {
    // Auth check
    const userId = await fetchUserId();
    const rows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    email = rows[0].email;

    // Validate formData
    const validatedFields = UpdateEmailSchema.safeParse({
      ...Object.fromEntries(formData),
    });

    // If validation fails, return the errors and form data
    if (!validatedFields.success) {
      return {
        errors: z.flattenError(validatedFields.error).fieldErrors,
        // Send the form data back to state to repopulate the form
        formData: Object.fromEntries(formData),
      };
    }
    // Check if the current password is correct
    try {
      await auth.api.signInEmail({
        body: {
          email: email,
          password: validatedFields.data.password,
        },
      });
    } catch {
      return {
        errors: {
          password: ["Invalid password"],
        },
        formData: Object.fromEntries(formData),
      };
    }
    // Update the user's email
    try {
      await auth.api.changeEmail({
        headers: await headers(),
        body: {
          newEmail: validatedFields.data.newEmail,
          callbackURL: "/login",
        },
      });
    } catch (error) {
      console.error("Error updating email:", error);
      const message: string =
        error instanceof APIError && error.message ?
          error.message
        : "An error occurred. Please try again.";
      return {
        errors: {
          root: [message],
        },
        formData: Object.fromEntries(formData),
      };
    }
    return {
      toast: {
        title: "Email update requested!",
        message: `Check ${email} for a confirmation link to update your email.`,
      },
    };
  } catch {
    return {
      errors: {
        root: ["You must be logged in to update your email."],
      },
      formData: Object.fromEntries(formData),
    };
  }
}

export type DeleteAccountState = {
  formData?: {
    password?: string;
    areYouSure?: string;
  };
  errors?: {
    password?: string[];
    areYouSure?: string[];
    root?: string[];
  };
  toast?: ToastState["toast"];
};

export async function deleteAccount(
  prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  // Will be fetched with userId later and used to authenticate current password
  let email: string;
  try {
    // Auth check
    const userId = await fetchUserId();
    const rows = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    email = rows[0].email;

    // Validate formData
    const validatedFields = DeleteAccountSchema.safeParse({
      ...Object.fromEntries(formData),
    });

    // If validation fails, return the errors and form data
    if (!validatedFields.success) {
      return {
        errors: z.flattenError(validatedFields.error).fieldErrors,
        // Send the form data back to state to repopulate the form
        formData: Object.fromEntries(formData),
      };
    }
    // Delete the user's account
    // Password will be checked in the API method
    try {
      await auth.api.deleteUser({
        headers: await headers(),
        body: {
          password: validatedFields.data.password,
          callbackURL: "/goodbye",
        },
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      const message: string =
        error instanceof APIError && error.message ?
          error.message
        : "An error occurred. Please try again.";
      return {
        errors: {
          password: [message === "Invalid password" ? message : ""],
          root: [message === "Invalid password" ? "" : message],
        },
        formData: Object.fromEntries(formData),
      };
    }
    return {
      toast: {
        title: "Account deletion requested!",
        message: `Check ${email} for a confirmation link to delete your account.`,
      },
    };
  } catch {
    return {
      errors: {
        root: ["You must be logged in to delete your account."],
      },
      formData: Object.fromEntries(formData),
    };
  }
}
