import bcrypt from "bcrypt";
import { db } from "@vercel/postgres";
import { discs, trends, users } from "../lib/placeholder-data";

const client = await db.connect();

async function seedUsers() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // Create the trigger function
  await client.sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  // Create the users table
  await client.sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Create the trigger
  await client.sql`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `;

  // Insert the seed users
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return client.sql`
        INSERT INTO users (name, email, password)
        VALUES (${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedUsers;
}

async function seedDiscs() {
  await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // Create the trigger function
  await client.sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  // Create the discs table
  await client.sql`
    CREATE TABLE IF NOT EXISTS discs (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255),
      phone VARCHAR(255) NOT NULL,
      color VARCHAR(255),
      brand VARCHAR(255),
      plastic VARCHAR(255),
      mold VARCHAR(255),
      location VARCHAR(255),
      notes VARCHAR(255),
      notified BOOLEAN NOT NULL,
      reminded BOOLEAN NOT NULL,
      status VARCHAR(255) NOT NULL,
      held_until TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Create the trigger
  await client.sql`
    CREATE TRIGGER update_discs_updated_at
    BEFORE UPDATE ON discs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `;

  // Insert the seed discs
  const insertedDiscs = await Promise.all(
    discs.map(
      (disc) => client.sql`
        INSERT INTO discs (name, phone, color, brand, plastic, mold, location, notes, notified, reminded, status)
        VALUES (${disc.name}, ${disc.phone}, ${disc.color}, ${disc.brand}, ${disc.plastic}, ${disc.mold}, ${disc.location}, ${disc.notes}, ${disc.notified}, ${disc.reminded}, ${disc.status})
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
      returned INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Create the trigger
  await client.sql`
    CREATE TRIGGER update_trends_updated_at
    BEFORE UPDATE ON trends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `;

  // Insert the seed trends
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
    console.log("Seeding database");
    await seedUsers();
    await seedDiscs();
    await seedTrends();
    await client.sql`COMMIT`;

    return new Response(
      JSON.stringify({ message: "Database seeded successfully" }),
      { status: 200 }
    );
  } catch (error) {
    await client.sql`ROLLBACK`;
    console.error("Database seeding error:", error);
    return new Response(JSON.stringify({ error: "Database seeding failed" }), {
      status: 500,
    });
  }
}
