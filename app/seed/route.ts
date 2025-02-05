import bcrypt from "bcrypt";
import { db } from "@vercel/postgres";
import { users, templates, discs, trends } from "@/app/lib/placeholder-data";

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
      laf VARCHAR(255) NOT NULL,
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
        INSERT INTO users (id, name, laf, email, password)
        VALUES (${user.id}, ${user.name}, ${user.laf}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    })
  );

  return insertedUsers;
}

async function seedTemplates() {
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

  // Create the templates table
  await client.sql`
    CREATE TABLE IF NOT EXISTS templates (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      is_default BOOLEAN NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Create the trigger
  await client.sql`
    CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `;

  // Insert the seed templates
  const insertedTemplates = await Promise.all(
    templates.map(
      (template) => client.sql`
        INSERT INTO templates (user_id, name, type, content, is_default)
        VALUES (${template.user_id}, ${template.name}, ${template.type}, ${template.content}, ${template.is_default})
        ON CONFLICT (id) DO NOTHING;
      `
    )
  );

  return insertedTemplates;
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
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
      notification_template UUID REFERENCES templates(id) ON DELETE SET NULL,
      notification_text TEXT NOT NULL,
      reminder_template UUID REFERENCES templates(id) ON DELETE SET NULL,
      reminder_text TEXT NOT NULL,
      extension_template UUID REFERENCES templates(id) ON DELETE SET NULL,
      extension_text TEXT NOT NULL,
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
        INSERT INTO discs (user_id, name, phone, color, brand, plastic, mold, location, notes, notified, reminded, status, notification_template, notification_text, reminder_template, reminder_text, extension_template, extension_text)
        VALUES (${disc.user_id}, ${disc.name}, ${disc.phone}, ${disc.color}, ${disc.brand}, ${disc.plastic}, ${disc.mold}, ${disc.location}, ${disc.notes}, ${disc.notified}, ${disc.reminded}, ${disc.status}, ${disc.notification_template}, ${disc.notification_text}, ${disc.reminder_template}, ${disc.reminder_text}, ${disc.extension_template}, ${disc.extension_text})
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
    await seedTemplates();
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
