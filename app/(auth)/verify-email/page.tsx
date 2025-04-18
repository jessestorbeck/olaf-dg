import { Metadata } from "next";
import { VerifyEmail } from "@/app/ui/auth/verify-email";

export const metadata: Metadata = {
  title: "Verify email",
};

export default function Page() {
  return (
    <main>
      <VerifyEmail />
    </main>
  );
}
