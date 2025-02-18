"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Template, ToastState } from "@/app/lib/definitions";
import { AddEditTemplateSchema } from "@/app/lib/validation";

// Placeholder until I rework auth
const user_id = "35074acb-9121-4e31-9277-4db3241ef591";

// Make sure the name doesn't exist already in the database
const nameExists = async (name: string, ignoreId?: string) => {
  try {
    const query =
      ignoreId ?
        sql<Template>`
          SELECT name
          FROM templates
          WHERE name = ${name} AND user_id = ${user_id} AND id <> ${ignoreId}
        `
      : sql<Template>`
          SELECT name
          FROM templates
          WHERE name = ${name} AND user_id = ${user_id}
        `;

    const existingTemplate = await query;
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
  // Extend the template schema to include name validation
  const TemplateServerSchema = AddEditTemplateSchema.extend({
    name: AddEditTemplateSchema.shape.name
      // Just for server-side
      .refine(async (name) => !(await nameExists(name)), {
        message: "A template with that name already exists",
      }),
  });

  // Validate the form data
  const validatedFields = await TemplateServerSchema.safeParseAsync({
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
  const encodedTitle = encodeURIComponent(btoa(toastTitle));
  const encodedMessage = encodeURIComponent(btoa(successMessage));

  if (addAnother === "true") {
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
    `/dashboard/templates?title=${encodedTitle}&message=${encodedMessage}`
  );
}

export async function updateTemplate(
  id: string,
  prevState: addEditState,
  formData: FormData
): Promise<addEditState> {
  // Extend the template schema to include name validation
  // This works just like in createTemplate, but we provide the id to
  // nameExists to ignore the name of the template being edited
  const TemplateServerSchema = AddEditTemplateSchema.extend({
    name: AddEditTemplateSchema.shape.name
      // Just for server-side
      .refine(async (name) => !(await nameExists(name, id)), {
        message: "A template with that name already exists",
      }),
  });

  const validatedFields = await TemplateServerSchema.safeParseAsync({
    name: formData.get("name"),
    type: formData.get("type"),
    content: formData.get("content"),
    // Don't actually need this for editing, but it's required in the schema
    addAnother: formData.get("addAnother"),
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

  const toastTitle = "Template updated!";
  const successMessage = `Updated your template "${name}"`;
  const encodedTitle = encodeURIComponent(btoa(toastTitle));
  const encodedMessage = encodeURIComponent(btoa(successMessage));

  revalidatePath("/dashboard/templates");
  // Pass the message for the toast as a query parameter
  redirect(
    `/dashboard/templates?title=${encodedTitle}&message=${encodedMessage}`
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
