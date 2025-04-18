import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db/index";
import { users } from "@/db/schema/users";
import { session, account, verification } from "@/db/schema/auth";
import { sendEmail } from "@/app/lib/email";

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
    additionalFields: {
      laf: {
        type: "string",
        required: true,
      },
    },
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
    requireEmailVerification: true,
  },
  emailVerification: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const urlWithCallback = url + "login";
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Welcome to Olaf! Click the link to verify your email: ${urlWithCallback}`,
        html: `Welcome to Olaf! <a href="${urlWithCallback}">Click here to verify your email.</a>`,
      });
    },
  },
  plugins: [nextCookies()],
});
