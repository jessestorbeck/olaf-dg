"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql, eq, ilike, inArray, and, or, desc } from "drizzle-orm";

import { db } from "@/db/index";
import { discs, SelectDisc } from "@/db/schema/discs";
import { users } from "@/db/schema/users";
import {
  CreateDiscSchema,
  SelectDiscSchema,
  UpdateDiscSchema,
  DaysSchema,
} from "@/db/validation";
import { dateHasPassed } from "@/app/lib/utils";
import { ToastState } from "@/app/ui/toast";
import { fetchHoldDuration } from "./users";

// Placeholder until I rework auth
const userId = "35074acb-9121-4e31-9277-4db3241ef591";

export async function fetchFilteredDiscs(query: string): Promise<SelectDisc[]> {
  try {
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
      .where(
        and(
          eq(discs.userId, userId),
          or(
            ilike(discs.name, `%${query}%`),
            ilike(discs.phone, `%${query}%`),
            ilike(discs.color, `%${query}%`),
            ilike(discs.brand, `%${query}%`),
            ilike(discs.plastic, `%${query}%`),
            ilike(discs.mold, `%${query}%`),
            ilike(discs.location, `%${query}%`),
            ilike(discs.notes, `%${query}%`)
          )
        )
      )
      .orderBy(desc(discs.createdAt));
    const filteredDiscs = rows.map((row) =>
      // Have to flatten the returned rows before parsing,
      // since Drizzle creates nested objects for joined tables
      SelectDiscSchema.parse({ ...row.discs, laf: row.userLafs.laf })
    );
    return filteredDiscs;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch discs");
  }
}

export async function fetchDiscById(id: string): Promise<SelectDisc | void> {
  try {
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
      if (disc.status === "awaiting pickup") {
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
    notificationTemplate?: string;
    notificationText?: string;
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
    notificationTemplate?: string[];
    notificationText?: string[];
    reminderTemplate?: string[];
    reminderText?: string[];
    extensionTemplate?: string[];
    extensionText?: string[];
    addAnother?: string[];
  };
  toast?: ToastState["toast"];
};

export async function addDisc(
  prevState: AddDiscState,
  formData: FormData
): Promise<AddDiscState> {
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
  // Insert data into the database
  try {
    await db.insert(discs).values({ ...dataToInsert, userId });
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
  // Revalidate the cache for the discs page and redirect the user
  revalidatePath("/dashboard/discs");
  // Pass the message for the toast as a query parameter
  redirect(`/dashboard/discs?title=${encodedTitle}&message=${encodedMessage}`);
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

  try {
    await db
      .update(discs)
      .set(validatedFields.data)
      .where(and(eq(discs.id, id), eq(discs.userId, userId)));
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
  const encodedTitle = encodeURIComponent(btoa(toastTitle));
  const encodedMessage = encodeURIComponent(btoa(successMessage));

  revalidatePath("/dashboard/discs");
  // Pass the message for the toast as a query parameter
  redirect(`/dashboard/discs?title=${encodedTitle}&message=${encodedMessage}`);
}

export async function sendNotifications(
  ids: string[],
  mode: "initial" | "reminder"
): Promise<ToastState> {
  const notificationField = mode === "initial" ? "notified" : "reminded";
  try {
    const holdDuration = await fetchHoldDuration();
    console.log(holdDuration);
    await db
      .update(discs)
      .set({
        [notificationField]: true,
        heldUntil:
          mode === "initial" ?
            sql<Date>`NOW() + (INTERVAL '1 day' * ${holdDuration})`
          : discs.heldUntil,
      })
      .where(and(eq(discs.userId, userId), inArray(discs.id, ids)));
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
  try {
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
  status: "awaiting pickup" | "picked up" | "archived"
): Promise<ToastState> {
  try {
    const validatedStatus = UpdateDiscSchema.shape.status.parse(status);
    await db
      .update(discs)
      .set({ status: validatedStatus })
      .where(and(eq(discs.userId, userId), inArray(discs.id, ids)));
    revalidatePath("/dashboard/discs");
    const toastParticiple =
      validatedStatus === "awaiting pickup" ? "restored" : validatedStatus;
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
