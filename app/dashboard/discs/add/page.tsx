export const dynamic = "force-dynamic";

import { AddEditForm } from "@/app/ui/discs/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { Metadata } from "next";

import { fetchFilteredTemplates } from "@/data-access/templates";
import { fetchUserSettings } from "@/data-access/users";

export const metadata: Metadata = {
  title: "Add disc",
};

export default async function Page() {
  const templates = await fetchFilteredTemplates("");
  const userSettings = await fetchUserSettings();
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Discs", href: "/dashboard/discs" },
          {
            label: "Add disc",
            href: "/dashboard/discs/add",
            active: true,
          },
        ]}
      />
      <AddEditForm templates={templates} userSettings={userSettings} />
    </main>
  );
}
