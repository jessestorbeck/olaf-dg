"use server";

import { sql } from "@vercel/postgres";
import { Disc, Template, Trends } from "./definitions";
import { dateHasPassed } from "./utils";

// Placeholder until I rework auth
const user_id = "35074acb-9121-4e31-9277-4db3241ef591";

export async function fetchTrends() {
  try {
    const data = await sql<Trends>`SELECT * FROM trends`;
    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch trends data.");
  }
}

export async function fetchLatestDiscs() {
  try {
    const data = await sql<Disc>`
      SELECT name, phone, color, brand, plastic, mold
      FROM discs
      WHERE user_id = ${user_id}
      ORDER BY created_at DESC
      LIMIT 5`;

    return data.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch the latest discs.");
  }
}

export async function fetchCardData() {
  try {
    const totaldiscsPromise = sql`
      SELECT COUNT(*)
      FROM discs
      WHERE user_id = ${user_id} AND
        status NOT IN ('picked up', 'archived')`;

    const awaitingPickupPromise = sql`
      SELECT *
      FROM discs
      WHERE user_id = ${user_id} AND status = 'awaiting pickup'`;

    const playerCountPromise = sql`
      SELECT COUNT(DISTINCT phone)
      FROM discs
      WHERE user_id = ${user_id}`;

    const data = await Promise.all([
      totaldiscsPromise,
      awaitingPickupPromise,
      playerCountPromise,
    ]);

    const totalDiscs = Number(data[0].rows[0].count ?? "0");
    const totalDiscsAwaitingPickup = data[1].rows.filter(
      (disc) => !dateHasPassed(disc.held_until)
    ).length;
    const totalDiscsAbandoned = data[1].rows.filter((disc) =>
      dateHasPassed(disc.held_until)
    ).length;
    const totalPlayers = Number(data[2].rows[0].count ?? "0");

    return {
      totalDiscs,
      totalDiscsAwaitingPickup,
      totalDiscsAbandoned,
      totalPlayers,
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch card data.");
  }
}

export async function fetchFilteredDiscs(query: string) {
  try {
    const discs = await sql<Disc>`
      SELECT *
      FROM discs
      WHERE
        user_id = ${user_id} AND (
          name ILIKE ${`%${query}%`} OR
          phone ILIKE ${`%${query}%`} OR
          color ILIKE ${`%${query}%`} OR
          brand ILIKE ${`%${query}%`} OR
          plastic ILIKE ${`%${query}%`} OR
          mold ILIKE ${`%${query}%`} OR
          location ILIKE ${`%${query}%`} OR
          notes ILIKE ${`%${query}%`}
        )
      ORDER BY created_at DESC
    `;

    return discs.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch discs");
  }
}

export async function fetchDiscById(id: string) {
  try {
    const data = await sql<Disc>`
      SELECT *
      FROM discs
      WHERE id = ${id} AND user_id = ${user_id};
    `;

    return data.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch disc");
  }
}

export async function fetchFilteredTemplates(query: string) {
  try {
    const templates = await sql<Template>`
      SELECT *
      FROM templates
      WHERE
        user_id = ${user_id} AND (
          name ILIKE ${`%${query}%`} OR
          content ILIKE ${`%${query}%`}
        )
      ORDER BY is_default DESC, created_at DESC
    `;

    return templates.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch templates");
  }
}

export async function fetchTemplateById(id: string) {
  try {
    const template = await sql<Template>`
      SELECT *
      FROM templates
      WHERE id = ${id} AND user_id = ${user_id};
    `;

    return template.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch template");
  }
}
