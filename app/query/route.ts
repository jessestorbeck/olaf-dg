import { db } from "@vercel/postgres";

const client = await db.connect();

async function listDiscs() {
  const data = await client.sql`
    SELECT *
    FROM discs
    WHERE mold = 'Destroyer';
  `;

  return data.rows;
}

export async function GET() {
  try {
    return Response.json(await listDiscs());
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
