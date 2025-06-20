import { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/app/ui/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default async function Page(props: {
  searchParams?: Promise<{
    token?: string;
  }>;
}) {
  // Get password reset token
  const searchParams = await props.searchParams;
  const token = searchParams?.token;

  // Redirect to the login page if the token is not present
  if (!token) {
    redirect("/login");
  }

  return (
    <main>
      <ResetPasswordForm token={token} />
    </main>
  );
}
