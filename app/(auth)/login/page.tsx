import { Metadata } from "next";
import { LoginForm } from "@/app/ui/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main>
      <LoginForm />
    </main>
  );
}
