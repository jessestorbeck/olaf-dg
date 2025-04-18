import { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/app/lib/auth";
import { LoginForm } from "@/app/ui/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default async function Page() {
  // Redirect to the dashboard if the user is already logged in
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main>
      <LoginForm />
    </main>
  );
}
