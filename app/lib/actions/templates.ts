"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Template, ToastState } from "@/app/lib/definitions";

// Placeholder until I rework auth
const user_id = "35074acb-9121-4e31-9277-4db3241ef591";

const maxNameLen = 50;
const maxContentLen = 500;
const tooLong = (maxLen: number) => {
  return { message: `Must be less than ${maxLen} characters` };
};

// Make sure the name doesn't exist already in the database
const nameExists = async (name: string) => {
  try {
    const existingTemplate = await sql<Template>`
      SELECT name
      FROM templates
      WHERE name = ${name} AND user_id = ${user_id}
    `;
    if (existingTemplate.rows.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Database error: failed to validate template name", error);
    throw new Error("Failed to validate template name");
  }
};

const FormSchema = z.object({
  id: z.string().uuid(),
  user: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, { message: "Your template must have a name" })
    .max(maxNameLen, tooLong(maxNameLen))
    .refine(
      async (name: string) => {
        const exists = await nameExists(name);
        return !exists;
      },
      { message: "You already have a template with this name" }
    ),
  type: z.enum(["notification", "reminder", "extension"], {
    message: "You must select a template type",
  }),
  content: z
    .string()
    .trim()
    .regex(/\$laf/, {
      message: "Your template must reference the lost-and-found name with $laf",
    })
    .regex(/\$held_until/, {
      message:
        "Your template must reference the held-until date with $held_until",
    })
    .min(1, { message: "Your template must have content" })
    .max(maxContentLen, tooLong(maxContentLen)),
  default: z.boolean(),
  addAnother: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

const CreateTemplate = FormSchema.omit({
  id: true,
  user: true,
  default: true,
});
const EditTemplate = FormSchema.omit({
  id: true,
  user: true,
  default: true,
  addAnother: true,
});

export type addEditState = {
  formData?: {
    name?: string;
    type?: string;
    content?: string;
    addAnother?: string;
  };
  errors?: {
    name?: string[];
    type?: string[];
    content?: string[];
    addAnother?: string[];
  };
  toast?: ToastState["toast"];
};

export async function createTemplate(
  prevState: addEditState,
  formData: FormData
): Promise<addEditState> {
  const validatedFields = await CreateTemplate.safeParseAsync({
    name: formData.get("name"),
    type: formData.get("type"),
    content: formData.get("content"),
    addAnother: formData.get("addAnother"),
  });

  // If form validation fails, return errors early; otherwise, continue
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      toast: {
        title: "Error: failed to create template",
        message: "Required field(s) missing",
      },
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  // Prepare data for insertion into the database
  const { name, type, content, addAnother } = validatedFields.data;
  const is_default = false;

  // Insert data into the database
  try {
    await sql`
      INSERT INTO templates (user_id, name, type, content, is_default)
      VALUES (${user_id}, ${name}, ${type}, ${content}, ${is_default})
    `;
  } catch (error) {
    console.error("Database error: failed to create template", error);
    // If a database error occurs, return a more specific error
    return {
      toast: {
        title: "Database error",
        message: "Failed to create template",
      },
      formData: Object.fromEntries(formData),
    };
  }

  const toastTitle = "Template added!";
  const successMessage = `Added a new template "${name}" to your account`;

  if (addAnother) {
    // If user wants to add another, don't redirect and clear the form
    return {
      toast: {
        title: toastTitle,
        message: successMessage,
      },
      formData: {},
    };
  }
  // Revalidate the cache for the templates page and redirect the user
  revalidatePath("/dashboard/templates");
  // Pass the message for the toast as a query parameter
  redirect(
    `/dashboard/templates?message=${encodeURIComponent(successMessage)}&title=${encodeURIComponent(toastTitle)}`
  );
}

export async function updateTemplate(
  id: string,
  prevState: addEditState,
  formData: FormData
): Promise<addEditState> {
  const validatedFields = await EditTemplate.safeParseAsync({
    name: formData.get("name"),
    type: formData.get("type"),
    content: formData.get("content"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      toast: {
        title: "Error: failed to update template",
        message: "Required field(s) missing",
      },
      // Send the form data back to state to repopulate the form
      formData: Object.fromEntries(formData),
    };
  }

  const { name, type, content } = validatedFields.data;

  try {
    await sql`
      UPDATE templates
      SET name = ${name}, type = ${type}, content = ${content}
      WHERE id = ${id} AND user_id = ${user_id}
    `;
  } catch (error) {
    console.error("Database error: failed to update template", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to update template",
      },
      formData: Object.fromEntries(formData),
    };
  }
  const successMessage = `Updated your template "${name}"`;
  const toastTitle = "Template updated!";

  revalidatePath("/dashboard/templates");
  // Pass the message for the toast as a query parameter
  redirect(
    `/dashboard/templates?message=${encodeURIComponent(successMessage)}&title=${encodeURIComponent(toastTitle)}`
  );
}

export async function makeDefault(id: string): Promise<ToastState> {
  try {
    // Set the template with the given id to be the default of that type
    // and change any of the user's other templates of the same type to not be default
    await sql`
      UPDATE templates
      SET is_default = CASE
        WHEN id = ${id} THEN TRUE
        ELSE FALSE
      END
      WHERE type = (SELECT type FROM templates WHERE id = ${id}) AND
        user_id = ${user_id}
    `;
    // Get the template name and type for the toast message
    const nameAndType = await sql`
      SELECT name, type
      FROM templates
      WHERE id = ${id} AND user_id = ${user_id}
    `;
    const { name, type } = nameAndType.rows[0];

    revalidatePath("/dashboard/templates");
    return {
      toast: {
        title: "Template updated!",
        message: `"${name}" is now the default for ${type} messages`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to update template", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to update template",
      },
    };
  }
}

export async function deleteTemplates(ids: string[]): Promise<ToastState> {
  try {
    await sql`
      DELETE FROM templates
      WHERE id = ANY(${Object.assign(ids)}) AND
        user_id = ${user_id} AND
        is_default = FALSE
    `;
    revalidatePath("/dashboard/templates");
    return {
      toast: {
        title: "Templates(s) deleted!",
        message: `Deleted ${ids.length} templates`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to delete templates", error);
    return {
      toast: {
        title: "Database error",
        message: "Database error: failed to delete templates",
      },
    };
  }
}
