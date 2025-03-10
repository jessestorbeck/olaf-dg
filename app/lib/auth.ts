import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db/index";
import { users } from "@/db/schema/users";
import { session, account, verification } from "@/db/schema/auth";

// db schema to pass to better-auth drizzle adapter
const schema = {
  users,
  session,
  account,
  verification,
};

export const auth = betterAuth({
  user: {
    modelName: "users",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  plugins: [nextCookies()],
});
