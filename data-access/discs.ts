"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql, eq, ilike, inArray, and, or, desc, SQL } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/index";
import { discs, SelectDisc } from "@/db/schema/discs";
import { users } from "@/db/schema/users";
import {
  CreateDiscSchema,
  SelectDiscSchema,
  UpdateDiscSchema,
  DaysSchema,
} from "@/db/validation";
import { dateHasPassed, getNotificationText } from "@/app/lib/utils";
import { ToastState } from "@/app/ui/toast";
import { fetchUserId, fetchUserSettings } from "@/data-access/users";
import { fetchFilteredTemplates } from "@/data-access/templates";

export async function fetchFilteredDiscs(query: string): Promise<SelectDisc[]> {
  try {
    // Auth check
    const userId = await fetchUserId();
    // Parse the query for searches on specific fields
    interface SearchFields {
      disc: { [key in keyof SelectDisc]?: string };
      general: string[];
    }
    const searchFields: SearchFields = {
      disc: {
        name: undefined,
        phone: undefined,
        color: undefined,
        brand: undefined,
        plastic: undefined,
        mold: undefined,
        location: undefined,
        notes: undefined,
        initialTemplate: undefined,
        initialText: undefined,
        reminderTemplate: undefined,
        reminderText: undefined,
        extensionTemplate: undefined,
        extensionText: undefined,
        notified: undefined,
        reminded: undefined,
        status: undefined,
      },
      general: [],
    };
    const discFields = Object.keys(searchFields.disc);
    const discFieldRegex = new RegExp(`^(${discFields.join("|")}):`);
    query
      .trim()
      .split(" ")
      .forEach((term) => {
        if (discFieldRegex.test(term)) {
          const [field, value] = term.split(":");
          searchFields.disc[field as keyof SearchFields["disc"]] = value;
        } else {
          searchFields.general.push(term);
        }
      });

    // Build the SQL conditions necessary for search
    // First, for searching for field-specific values
    const fieldConditions: SQL[] = [];
    Object.entries(searchFields.disc).forEach(([field, value]) => {
      if (value) {
        // Need to deal with booleans, enum, and uuid values specially,
        // since invalid values will cause unexpected behavior
        if (field === "notified" || field === "reminded") {
          if (value === "true" || value === "false") {
            fieldConditions.push(eq(discs[field], value === "true"));
          } else {
            // Make the condition necessarily false, so no results if invalid value
            fieldConditions.push(sql`FALSE`);
          }
        } else if (field === "status") {
          if (["awaiting_pickup", "picked_up", "archived"].includes(value)) {
            fieldConditions.push(eq(discs[field as keyof SelectDisc], value));
          } else {
            fieldConditions.push(sql`FALSE`);
          }
        } else if (field.endsWith("Template")) {
          try {
            const searchValue = z.string().uuid().parse(value);
            fieldConditions.push(
              eq(discs[field as keyof SelectDisc], searchValue)
            );
          } catch {
            fieldConditions.push(sql`FALSE`);
          }
        } else {
          fieldConditions.push(
            ilike(discs[field as keyof SelectDisc], `%${value}%`)
          );
        }
      }
    });
    // Then, for searching for general values across text fields
    const generalConditions: SQL[] = [];
    const textFields = [
      "name",
      "phone",
      "color",
      "brand",
      "plastic",
      "mold",
      "location",
      "notes",
      "initialText",
      "reminderText",
      "extensionText",
    ];
    searchFields.general.forEach((term) => {
      const conditionsByField: SQL[] = textFields.map((field) =>
        ilike(discs[field as keyof SelectDisc], `%${term}%`)
      );
      generalConditions.push(or(...conditionsByField) || sql`TRUE`);
    });

    const rows = await db
      .select()
      .from(discs)
      .where(
        and(eq(discs.userId, userId), ...fieldConditions, ...generalConditions)
      )
      .orderBy(desc(discs.createdAt));
    const filteredDiscs = rows.map((row) => SelectDiscSchema.parse(row));
    return filteredDiscs;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch discs");
  }
}

export async function fetchDiscById(id: string): Promise<SelectDisc | void> {
  try {
    // Auth check
    const userId = await fetchUserId();
    // Subquery to select the user lafs
    const userLafs = db
      .select({ id: users.id, laf: users.laf })
      .from(users)
      .as("userLafs");
    const rows = await db
      .select()
      .from(discs)
      // Join with laf from the users table
      .innerJoin(userLafs, eq(discs.userId, userLafs.id))
      .where(and(eq(discs.id, id), eq(discs.userId, userId)))
      .limit(1);
    // Have to flatten the returned row before parsing,
    // since Drizzle creates nested objects for joined tables
    const flattenedRow = { ...rows[0].discs, laf: rows[0].userLafs.laf };
    const validatedDisc = SelectDiscSchema.safeParse(flattenedRow);
    if (validatedDisc.success) {
      return validatedDisc.data;
    }
    // If validation fails, page.tsx will show the not found message
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch templates");
  }
}

export async function fetchCardData() {
  try {
    // Auth check
    const userId = await fetchUserId();
    // Select just phone numbers, statuses, and heldUntil dates
    // Necessary filtering can be done post-query
    const data = await db
      .select({
        phone: discs.phone,
        status: discs.status,
        heldUntil: discs.heldUntil,
      })
      .from(discs)
      .where(eq(discs.userId, userId));

    let totalInventory = 0;
    let awaitingPickup = 0;
    let abandoned = 0;
    const players: string[] = [];
    data.forEach((disc) => {
      if (disc.status === "awaiting_pickup") {
        totalInventory++;
        if (dateHasPassed(disc.heldUntil)) {
          abandoned++;
        } else {
          awaitingPickup++;
        }
      }
      if (!players.includes(disc.phone)) {
        players.push(disc.phone);
      }
    });

    return {
      totalInventory,
      awaitingPickup,
      abandoned,
      totalPlayers: players.length,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data");
  }
}

export type AddDiscState = {
  formData?: {
    name?: string;
    phone?: string;
    color?: string;
    brand?: string;
    plastic?: string;
    mold?: string;
    location?: string;
    notes?: string;
    initialTemplate?: string;
    initialText?: string;
    reminderTemplate?: string;
    reminderText?: string;
    extensionTemplate?: string;
    extensionText?: string;
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
    initialTemplate?: string[];
    initialText?: string[];
    reminderTemplate?: string[];
    reminderText?: string[];
    extensionTemplate?: string[];
    extensionText?: string[];
    addAnother?: string[];
  };
  toast?: ToastState["toast"];
  success?: boolean;
};

export async function addDisc(
  prevState: AddDiscState,
  formData: FormData
): Promise<AddDiscState> {
  // For toast after redirect
  // Outside try block, since redirect has to be outside the try block
  let encodedTitle: string;
  let encodedMessage: string;
  try {
    // Auth check
    const userId = await fetchUserId();
    // Validate form data
    const validatedFields = CreateDiscSchema.safeParse({
      ...Object.fromEntries(formData),
      userId,
    });

    // If validation fails, return the errors and form data
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        toast: {
          title: "Error: failed to create disc",
          message: "Required field(s) missing",
        },
        // Send the form data back to state to repopulate the form
        formData: Object.fromEntries(formData),
      };
    }

    // Don't want to insert the addAnother field into the database
    // It's only used after the insert to redirect or not
    const { addAnother, ...dataToInsert } = validatedFields.data;

    // Don't write notification text to the db unless it's a custom template
    // When using templates, notifications are generated from templates as needed
    // so that notifications are always up to date with changes to templates and user settings
    // I tried to integrate this logic into the Zod schema,
    // but this method seemed more straightforward
    dataToInsert.initialText =
      dataToInsert.initialTemplate ? null : dataToInsert.initialText;
    dataToInsert.reminderText =
      dataToInsert.reminderTemplate ? null : dataToInsert.reminderText;
    dataToInsert.extensionText =
      dataToInsert.extensionTemplate ? null : dataToInsert.extensionText;

    // Insert data into the database
    await db.insert(discs).values({ ...dataToInsert, userId });

    // Prepare toast
    const discString = [
      dataToInsert.color,
      dataToInsert.brand,
      dataToInsert.plastic,
      dataToInsert.mold || "disc",
    ]
      .filter(Boolean)
      .join(" ");
    const toastTitle = "Disc added!";
    const successMessage = `Added a new ${discString} to your inventory`;
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
    console.error("Database error: failed to create disc", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to create disc",
      },
      formData: Object.fromEntries(formData),
    };
  }
  // Revalidate the cache for the discs page and redirect the user
  revalidatePath("/dashboard/discs");
  // Pass the message for the toast as a query parameter
  redirect(`/dashboard/discs?title=${encodedTitle}&message=${encodedMessage}`);

  // Add a fallback return statement to satisfy the function's return type
  // As long as the redirect is successful, this code won't be executed
  return {
    toast: {
      title: "Unknown error",
      message: "An unexpected error occurred",
    },
    formData: Object.fromEntries(formData),
  };
}

// Edit state is the same minus formData.addAnother and errors.addAnother
export type EditDiscState = Omit<AddDiscState, "formData" | "errors"> & {
  formData?: Omit<AddDiscState["formData"], "addAnother">;
  errors?: Omit<AddDiscState["errors"], "addAnother">;
};

export async function editDisc(
  id: string,
  prevState: EditDiscState,
  formData: FormData
): Promise<EditDiscState> {
  // For toast after redirect
  // Outside try block, since redirect has to be outside the try block
  let encodedTitle: string;
  let encodedMessage: string;

  try {
    // Auth check
    const userId = await fetchUserId();
    // Validate form data
    const validatedFields = UpdateDiscSchema.safeParse(
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

    await db
      .update(discs)
      .set({
        ...validatedFields.data,
        // Logic below is a bit convoluted because of the need
        // to use JS logic for the incoming form data and SQL logic for existing db values
        // The overall goals though are:
        // (a) for initial and reminder notifications, don't update the text if the notification has already been sent
        // (b) if a template is being used, set the text to null
        // (c) if a template is NOT being used, set the text to the incoming form data
        initialText: sql<string>`
          CASE
            WHEN ${discs.notified} = FALSE
              -- If using a template, set the text to null; if custom, set to the incoming form data 
              THEN ${validatedFields.data.initialTemplate ? null : validatedFields.data.initialText}
            -- If the notification has already been sent, keep the existing text
            ELSE ${discs.initialText}
          END`,
        reminderText: sql<string>`
          CASE
            WHEN ${discs.reminded} = FALSE
              THEN ${validatedFields.data.reminderTemplate ? null : validatedFields.data.reminderText}
            ELSE ${discs.reminderText}
          END`,
        extensionText:
          validatedFields.data.extensionTemplate ?
            null
          : validatedFields.data.extensionText,
      })
      .where(and(eq(discs.id, id), eq(discs.userId, userId)));

    // Prepare toast
    const discString = [
      validatedFields.data.color,
      validatedFields.data.brand,
      validatedFields.data.plastic,
      validatedFields.data.mold || "disc",
    ]
      .filter(Boolean)
      .join(" ");

    const toastTitle = "Disc updated!";
    const successMessage = `Updated an existing ${discString} in your inventory`;
    encodedTitle = encodeURIComponent(btoa(toastTitle));
    encodedMessage = encodeURIComponent(btoa(successMessage));
  } catch (error) {
    console.error("Database error: failed to update disc", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to update disc",
      },
      formData: Object.fromEntries(formData),
    };
  }
  revalidatePath("/dashboard/discs");
  redirect(`/dashboard/discs?title=${encodedTitle}&message=${encodedMessage}`);

  // Add a fallback return statement to satisfy the function's return type
  // As long as the redirect is successful, this code won't be executed
  return {
    toast: {
      title: "Unknown error",
      message: "An unexpected error occurred",
    },
    formData: Object.fromEntries(formData),
  };
}

export async function sendNotifications(
  ids: string[],
  mode: "initial" | "reminder"
): Promise<ToastState> {
  try {
    // Auth check
    const userId = await fetchUserId();

    const booleanField = mode === "initial" ? "notified" : "reminded";
    const templateField =
      mode === "initial" ? "initialTemplate" : "reminderTemplate";
    const textField = mode === "initial" ? "initialText" : "reminderText";

    const [userSettings, templates] = await Promise.all([
      fetchUserSettings(),
      fetchFilteredTemplates(""),
    ]);

    // Initial db update, in which we set notified/reminded to true
    // and set the heldUntil date for initial notifications
    const updatedDiscs: SelectDisc[] = await db
      .update(discs)
      .set({
        [booleanField]: true,
        heldUntil:
          mode === "initial" ?
            sql<Date>`NOW() + (INTERVAL '1 day' * ${userSettings.holdDuration})`
          : discs.heldUntil,
      })
      .where(and(eq(discs.userId, userId), inArray(discs.id, ids)))
      .returning();

    // Build the CASE WHEN statement for setting each discs's notification text
    const textValue = sql`CASE`;
    updatedDiscs.forEach((disc) => {
      // If the disc specifies a template, use it to generate the notification text
      // Otherwise, use the custom text will already be present
      const notificationText =
        disc[templateField] ?
          getNotificationText(
            disc[templateField],
            templates,
            disc,
            userSettings
          )
        : disc[textField];
      textValue.append(
        sql` WHEN ${discs.id} = ${disc.id} THEN ${notificationText}`
      );
    });
    textValue.append(sql` END`);

    // Second db update, in which we set the notification text
    const toNotify = await db
      .update(discs)
      .set({ [textField]: textValue })
      .where(and(eq(discs.userId, userId), inArray(discs.id, ids)))
      .returning({ phone: discs.phone, [textField]: discs[textField] });

    // Send notifications
    // STILL NEED TO IMPLEMENT THIS
    console.log("toNotify", toNotify);

    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: `${mode[0].toUpperCase() + mode.slice(1)} notification(s) sent!`,
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

export async function addTimeToDiscs(
  ids: string[],
  days: number
): Promise<ToastState> {
  try {
    // Auth check
    const userId = await fetchUserId();
    // Validate extension days
    const validatedDays = DaysSchema.safeParse(days);
    if (!validatedDays.success) {
      return {
        errors: validatedDays.error.flatten(),
        toast: {
          title: "Error: invalid days",
          message: "Days must be a positive whole number <= 365",
        },
      };
    }
    await db
      .update(discs)
      .set({
        heldUntil: sql<Date>`${discs.heldUntil} + INTERVAL '1 day' * ${validatedDays.data}`,
      })
      .where(and(eq(discs.userId, userId), inArray(discs.id, ids)));
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Time added!",
        message: `Added ${validatedDays.data} day(s) to ${ids.length} disc(s)`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to add time to disc(s)", error);
    return {
      toast: {
        title: "Database error",
        message: "Failed to add time to disc(s)",
      },
    };
  }
}

export async function updateDiscStatus(
  ids: string[],
  status: "awaiting_pickup" | "picked_up" | "archived"
): Promise<ToastState> {
  try {
    // Auth check
    const userId = await fetchUserId();
    // Validate disc status
    const validatedStatus = UpdateDiscSchema.shape.status.parse(status);
    await db
      .update(discs)
      .set({ status: validatedStatus })
      .where(and(eq(discs.userId, userId), inArray(discs.id, ids)));
    revalidatePath("/dashboard/discs");
    const toastParticiple =
      validatedStatus === "awaiting_pickup" ? "restored" : (
        validatedStatus?.replace("_", " ")
      );
    return {
      toast: {
        title: `Disc(s) ${toastParticiple}!`,
        message: `${ids.length} disc(s) ${toastParticiple}`,
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

export async function deleteDiscs(ids: string[]): Promise<ToastState> {
  try {
    // Auth check
    const userId = await fetchUserId();
    await db
      .delete(discs)
      .where(and(eq(discs.userId, userId), inArray(discs.id, ids)));
    revalidatePath("/dashboard/discs");
    return {
      toast: {
        title: "Disc(s) deleted!",
        message: `Deleted ${ids.length} disc(s)`,
      },
    };
  } catch (error) {
    console.error("Database error: failed to delete disc(s)", error);
    return {
      toast: {
        title: "Database error",
        message: "Database error: failed to delete disc(s)",
      },
    };
  }
}
