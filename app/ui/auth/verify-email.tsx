import Link from "next/link";

import { primaryFont } from "@/app/ui/fonts";
import { Button } from "@/app/ui/button";

export function VerifyEmail() {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h1 className={`${primaryFont.className} mb-3 text-2xl`}>
        Please verify your email address.
      </h1>
      <p>
        Check your email for a verification link. If you don&apos;t see the
        email, check your spam folder.
      </p>
      <p>
        Verification link expired?
        <Button type="button" variant={"link"} className="pl-1 text-base">
          <Link href={"/login"}>Try logging in again.</Link>
        </Button>
      </p>
    </div>
  );
}
