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
  secret: process.env.BETTER_AUTH_SECRET!,
  user: {
    modelName: "users",
    additionalFields: {
      laf: {
        type: "string",
        required: true,
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({
        user,
        newEmail,
        url,
      }: {
        user: { email: string };
        newEmail: string;
        url: string;
      }) => {
        await sendEmail({
          to: user.email,
          subject: "Confirm email change",
          text: `We received a request to update your Olaf account email to ${newEmail}. Click the link to verify your updated email: ${url}`,
          html: `We received a request to update your Olaf account email to ${newEmail}. <a href="${url}">Click here to verify your updated email.</a>`,
        });
      },
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({
        user,
        url,
        // token,
      }: {
        user: { email: string };
        url: string;
        token: string;
      }) => {
        // FIX THIS LATER
        const fixedUrl = url
          .replace("api/auth/delete-user/callback", "goodbye")
          .replace("&callbackURL=/goodbye", "");
        await sendEmail({
          to: user.email,
          subject: "Confirm account deletion",
          text: `We received a request to delete your Olaf account. Click the link to delete your account: ${fixedUrl}`,
          html: `We received a request to delete your Olaf account. <a href="${fixedUrl}">Click here to delete your account.</a>`,
        });
        // console.log("token:", token);
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
    sendResetPassword: async ({
      user,
      url,
      token,
    }: {
      user: { email: string };
      url: string;
      token: string;
    }) => {
      // FIX THIS LATER
      const fixedUrl = url
        .replace("/api/auth", "")
        .replace("/" + token, "?token=" + token)
        .replace("?callbackURL=%2Freset-password", "");
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${fixedUrl}`,
        html: `<a href="${fixedUrl}">Click here to reset your password.</a>`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Welcome to Olaf! Click the link to verify your email: ${url}`,
        html: `Welcome to Olaf! <a href="${url}">Click here to verify your email.</a>`,
      });
    },
  },
  plugins: [nextCookies()],
});
