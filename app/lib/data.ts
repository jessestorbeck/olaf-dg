import { sql } from "@vercel/postgres";
import { Disc, Trends } from "./definitions";

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
      SELECT name, phone, id, color, brand, plastic, mold, created_at
      FROM discs
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
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const discCountPromise = sql`SELECT COUNT(*) FROM discs`;
    const playerCountPromise = sql`SELECT COUNT(DISTINCT phone) FROM discs`;

    const data = await Promise.all([discCountPromise, playerCountPromise]);

    const numberOfDiscs = Number(data[0].rows[0].count ?? "0");
    const numberOfPlayers = Number(data[1].rows[0].count ?? "0");

    return { numberOfPlayers, numberOfDiscs };
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
        name ILIKE ${`%${query}%`} OR
        phone ILIKE ${`%${query}%`} OR
        color ILIKE ${`%${query}%`} OR
        brand ILIKE ${`%${query}%`} OR
        plastic ILIKE ${`%${query}%`} OR
        mold ILIKE ${`%${query}%`} OR
        held_until::text ILIKE ${`%${query}%`} OR
        location ILIKE ${`%${query}%`}
      ORDER BY created_at DESC
    `;

    return discs.rows;
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch discs.");
  }
}

export async function fetchDiscById(id: string) {
  try {
    const data = await sql<Disc>`
      SELECT *
      FROM discs
      WHERE id = ${id};
    `;

    return data.rows[0];
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch disc.");
  }
}
