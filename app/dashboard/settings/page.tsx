export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Metadata } from "next";

import { primaryFont } from "@/app/ui/fonts";
import { EditForm } from "@/app/ui/settings/edit-form";
import { fetchUserEmail, fetchUserSettings } from "@/data-access/users";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function Page() {
  const [userEmail, userSettings] = await Promise.all([
    fetchUserEmail(),
    fetchUserSettings(),
  ]);

  if (!userEmail || !userSettings) {
    notFound();
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${primaryFont.className} text-2xl`}>Settings</h1>
      </div>
      <EditForm userEmail={userEmail} userSettings={userSettings} />
    </div>
  );
}
