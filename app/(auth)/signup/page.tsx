import { Metadata } from "next";
import { SignupForm } from "@/app/ui/auth/signup-form";

export const metadata: Metadata = {
  title: "Signup",
};

export default function SignupPage() {
  return (
    <main>
      <SignupForm />
    </main>
  );
}
