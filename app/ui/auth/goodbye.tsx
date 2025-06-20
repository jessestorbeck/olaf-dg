import Link from "next/link";

import { primaryFont } from "@/app/ui/fonts";
import { Button } from "@/app/ui/button";

export function Goodbye({ success }: { success?: boolean }) {
  if (!success) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h1 className={`${primaryFont.className} mb-3 text-2xl`}>
          There was an error deleting your account.
        </h1>
        <p>
          Try requesting another deletion link through the{" "}
          <Button type="button" variant={"link"} className="pl-0.5 text-base">
            <Link href={"/dashboard/settings"}>Settings page.</Link>
          </Button>
        </p>
        <p>If the problem persists, please contact support.</p>
      </div>
    );
  }
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h1 className={`${primaryFont.className} mb-3 text-2xl`}>
        Your account has been deleted.
      </h1>
      <p>
        We&apos;re sorry to see you go! If you change your mind, you can always{" "}
        <Button type="button" variant={"link"} className="pl-0.5 text-base">
          <Link href={"/signup"}>create a new account.</Link>
        </Button>
      </p>
    </div>
  );
}
