import { Metadata } from "next";
import { ForgotPasswordForm } from "@/app/ui/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default async function Page() {
  return (
    <main>
      <ForgotPasswordForm />
    </main>
  );
}
