"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql, eq, ne, ilike, inArray, and, or, desc } from "drizzle-orm";

import { db } from "@/db/index";
import { templates, SelectTemplate } from "@/db/schema/templates";
import {
  CreateTemplateSchema,
  SelectTemplateSchema,
  UpdateTemplateSchema,
} from "@/db/validation";
import { defaultTemplates } from "@/db/default-templates";
import { ToastState } from "@/app/ui/toast";
import { fetchUserId } from "@/data-access/users";

export async function fetchFilteredTemplates(
  query: string
): Promise<SelectTemplate[]> {
  try {
    // Auth check
    const userId = await fetchUserId();

    const rows = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.userId, userId),
          or(
            ilike(templates.name, `%${query}%`),
            ilike(templates.content, `%${query}%`)
          )
        )
      )
      .orderBy(desc(templates.isDefault), desc(templates.createdAt));
    return rows.map((row) => SelectTemplateSchema.parse(row));
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch templates");
  }
}

export async function fetchTemplateById(id: string): Promise<SelectTemplate> {
  try {
    // Auth check
    const userId = await fetchUserId();

    const rows = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, id), eq(templates.userId, userId)))
      .limit(1);
    return SelectTemplateSchema.parse(rows[0]);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch templates");
  }
}

// Make sure the template name doesn't exist already in the database
async function nameExists(name: string, ignoreId?: string): Promise<boolean> {
  try {
    // Auth check
    const userId = await fetchUserId();

    const templateCount = await db.$count(
      templates,
      and(
        eq(templates.name, name),
        eq(templates.userId, userId),
        // If ignoreId is provided, exclude that template from the count
        ignoreId ? ne(templates.id, ignoreId) : undefined
      )
    );
    return templateCount > 0;
  } catch (error) {
    console.error("Database error: failed to validate template name", error);
    throw new Error("Failed to validate template name");
  }
}

export type AddTemplateState = {
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
  success?: boolean;
};

export async function addTemplate(
  prevState: AddTemplateState,
  formData: FormData
): Promise<AddTemplateState> {
  // For toast after redirect
  // Outside try block, since redirect has to be outside the try block
  let encodedTitle: string;
  let encodedMessage: string;
  try {
    // Auth check
    const userId = await fetchUserId();
    // Extend the template schema to include name validation
    const TemplateServerSchema = CreateTemplateSchema.extend({
      name: CreateTemplateSchema.shape.name
        // Just for server-side
        .refine(async (name) => !(await nameExists(name)), {
          message: "A template with that name already exists",
        }),
    });

    // Validate the form data
    const validatedFields = await TemplateServerSchema.safeParseAsync({
      ...Object.fromEntries(formData),
      userId,
    });

    // If validation fails, return the errors and form data
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

    // Don't want to insert the addAnother field into the database
    // It's only used after the insert to redirect or not
    const { addAnother, ...dataToInsert } = validatedFields.data;

    // Insert data into the database
    await db.insert(templates).values({ ...dataToInsert, userId });

    // Prepare toast
    const toastTitle = "Template added!";
    const successMessage = `Added a new template "${dataToInsert.name}" to your account`;
    encodedTitle = encodeURIComponent(btoa(toastTitle));
    encodedMessage = encodeURIComponent(btoa(successMessage));

    if (addAnother === "true") {
      // If user wants to add another, don't redirect and clear the form
      return {
        toast: {
          title: toastTitle,
          message: successMessage,
        },
        formData: {},
        success: true,
      };
    }
  } catch (error) {
    console.error("Database error: failed to create template", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to create template",
      },
      formData: Object.fromEntries(formData),
    };
  }
  // Revalidate the cache for the templates page and redirect the user
  revalidatePath("/dashboard/templates");
  // Pass the message for the toast as a query parameter
  redirect(
    `/dashboard/templates?title=${encodedTitle}&message=${encodedMessage}`
  );
}

export async function addDefaultTemplates(userId: string): Promise<void> {
  try {
    // No auth check on this one since it happens as part of sign-up
    // and userId comes right from auth.api.signUpEmail
    const templatesToInsert = defaultTemplates.map((template) =>
      CreateTemplateSchema.omit({ addAnother: true }).parse({
        ...template,
        userId,
      })
    );

    // Insert the default templates into the database
    await db.insert(templates).values(templatesToInsert);
  } catch (error) {
    console.error("Database error: failed to add default templates", error);
    throw new Error("Failed to add default templates");
  }
}

// Edit state is the same minus formData.addAnother and errors.addAnother
export type EditTemplateState = Omit<
  AddTemplateState,
  "formData" | "errors"
> & {
  formData?: Omit<AddTemplateState["formData"], "addAnother">;
  errors?: Omit<AddTemplateState["errors"], "addAnother">;
};

export async function editTemplate(
  id: string,
  prevState: EditTemplateState,
  formData: FormData
): Promise<EditTemplateState> {
  let encodedTitle: string;
  let encodedMessage: string;
  try {
    // Auth check
    const userId = await fetchUserId();

    // Extend the template schema to include name validation
    // This works just like in createTemplate, but we provide the id to
    // nameExists to ignore the name of the template being edited
    const TemplateServerSchema = UpdateTemplateSchema.extend({
      name: UpdateTemplateSchema.shape.name
        // Just for server-side
        .refine(async (name) => !(await nameExists(name, id)), {
          message: "A template with that name already exists",
        }),
    });

    const validatedFields = await TemplateServerSchema.safeParseAsync({
      ...Object.fromEntries(formData),
      userId,
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

    await db
      .update(templates)
      .set(validatedFields.data)
      .where(and(eq(templates.id, id), eq(templates.userId, userId)));

    // Prepare toast
    const toastTitle = "Template updated!";
    const successMessage = `Updated your template "${validatedFields.data.name}"`;
    encodedTitle = encodeURIComponent(btoa(toastTitle));
    encodedMessage = encodeURIComponent(btoa(successMessage));
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
  revalidatePath("/dashboard/templates");
  redirect(
    `/dashboard/templates?title=${encodedTitle}&message=${encodedMessage}`
  );
}

export async function makeDefault(id: string): Promise<ToastState> {
  try {
    // Auth check
    const userId = await fetchUserId();
    // Set the template with the given id to be the default of that type
    // and change any of the user's other templates of the same type to non-default
    // Return the ids, names, and types of updated templates, which can be filtered
    // to show the name and type of the now-default template in the toast
    const templateType = db
      .select({ type: templates.type })
      .from(templates)
      .where(and(eq(templates.id, id), eq(templates.userId, userId)));
    const updatedTemplates = await db
      .update(templates)
      .set({
        isDefault: sql<boolean>`CASE WHEN ${templates.id} = ${id} THEN TRUE ELSE FALSE END`,
      })
      .where(
        and(eq(templates.type, templateType), eq(templates.userId, userId))
      )
      .returning({
        id: templates.id,
        name: templates.name,
        type: templates.type,
      });
    const defaultTemplate = updatedTemplates.find(
      (template) => template.id === id
    );
    // Throw an error if the target template wasn't found
    if (!defaultTemplate) {
      throw new Error("Template not found");
    }
    revalidatePath("/dashboard/templates");
    return {
      toast: {
        title: "Template updated!",
        message: `${defaultTemplate?.name} template is now your default for ${defaultTemplate?.type} notifications`,
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
    // Auth check
    const userId = await fetchUserId();
    // Delete the templates with the given ids
    await db
      .delete(templates)
      .where(and(eq(templates.userId, userId), inArray(templates.id, ids)));
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
