import { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/app/lib/auth";
import { fetchUserId } from "@/data-access/users";
import { Goodbye } from "@/app/ui/auth/goodbye";

export const metadata: Metadata = {
  title: "Goodbye",
};

export default async function Page(props: {
  searchParams?: Promise<{
    token?: string;
  }>;
}) {
  // Check that user is logged in
  try {
    await fetchUserId();
  } catch {
    redirect("/login");
  }

  // Get password reset token
  const searchParams = await props.searchParams;
  const token = searchParams?.token;

  // Redirect to the login page if the token is not present
  if (!token) {
    redirect("/login");
  }

  let success = false;
  try {
    await auth.api.deleteUser({
      headers: await headers(),
      body: {
        token: token,
      },
    });
    success = true;
  } catch (error) {
    console.error("Error deleting account:", error);
  }

  return (
    <main>
      <Goodbye success={success} />
    </main>
  );
}
