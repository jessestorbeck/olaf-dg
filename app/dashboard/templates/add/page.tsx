export const dynamic = "force-dynamic";

import AddEditForm from "@/app/ui/templates/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { Metadata } from "next";

import { fetchFilteredTemplates } from "@/data-access/templates";
import { fetchUserSettings } from "@/data-access/users";

export const metadata: Metadata = {
  title: "Add Template",
};

export default async function Page() {
  const userSettings = await fetchUserSettings();
  // Fetch the template names from the database
  // Used for client-side validation to prevent duplicate names
  const templates = await fetchFilteredTemplates("");
  const templateNames = templates.map((template) => template.name);
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Templates", href: "/dashboard/templates" },
          {
            label: "Add template",
            href: "/dashboard/templates/add",
            active: true,
          },
        ]}
      />
      <AddEditForm templateNames={templateNames} userSettings={userSettings} />
    </main>
  );
}
