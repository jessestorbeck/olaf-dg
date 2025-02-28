import bcrypt from "bcrypt";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { config } from "dotenv";

import { users, templates, discs, trends } from "./schema";
import { seedUsers, seedTemplates, seedDiscs, seedTrends } from "./seed-data";

config({ path: ".env" });

async function main() {
  const db = drizzle();
  console.log("Seeding database...");
  await db.insert(users).values(
    seedUsers.map((user) => ({
      ...user,
      password: bcrypt.hashSync(user.password, 10),
    }))
  );
  console.log("Users table seeded successfully");
  await db.insert(templates).values(seedTemplates);
  console.log("Templates table seeded successfully");
  await db.insert(discs).values(seedDiscs);
  console.log("Discs table seeded successfully");
  await db.insert(trends).values(seedTrends);
  console.log("Trends table seeded successfully");
}
main();
