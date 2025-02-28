import { drizzle } from "drizzle-orm/vercel-postgres";
import { config } from "dotenv";

config({ path: ".env" });

export const db = drizzle();
