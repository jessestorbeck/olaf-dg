import bcrypt from "bcrypt";
import { db } from "@vercel/postgres";
import { discs, trends, users } from "../lib/placeholder-data";

const client = await db.connect();

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedUsers;
}

async function seedDiscs() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await client.sql`
    CREATE TABLE IF NOT EXISTS discs (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255),
      phone VARCHAR(255) NOT NULL,
      color VARCHAR(255),
      brand VARCHAR(255),
      plastic VARCHAR(255),
      mold VARCHAR(255),
      date DATE NOT NULL,
      held_until DATE NOT NULL,
      location VARCHAR(255),
      notes VARCHAR(255),
      notified BOOLEAN NOT NULL,
      reminded BOOLEAN NOT NULL,
      status VARCHAR(255) NOT NULL
    );
  `;

  const insertedDiscs = await Promise.all(
    discs.map(
      (disc) => client.sql`
        INSERT INTO discs (name, phone, color, brand, plastic, mold, date, held_until, location, notes, notified, reminded, status)
        VALUES (${disc.name}, ${disc.phone}, ${disc.color}, ${disc.brand}, ${disc.plastic}, ${disc.mold}, ${disc.date}, ${disc.held_until}, ${disc.location}, ${disc.notes}, ${disc.notified}, ${disc.reminded}, ${disc.status})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );

  return insertedDiscs;
}

async function seedTrends() {
  await client.sql`
    CREATE TABLE IF NOT EXISTS trends (
      month VARCHAR(4) NOT NULL UNIQUE,
      found INT NOT NULL,
      returned INT NOT NULL
    );
  `;

  const insertedTrends = await Promise.all(
    trends.map(
      (monthly) => client.sql`
        INSERT INTO trends (month, found, returned)
        VALUES (${monthly.month}, ${monthly.found}, ${monthly.returned})
        ON CONFLICT (month) DO NOTHING;
      `
    )
  );

  return insertedTrends;
}

export async function GET() {
  try {
    await client.sql`BEGIN`;
    await seedUsers();
    await seedDiscs();
    await seedTrends();
    console.log("Seeding complete");
    await client.sql`COMMIT`;

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    await client.sql`ROLLBACK`;
    return Response.json({ error }, { status: 500 });
  }
}
