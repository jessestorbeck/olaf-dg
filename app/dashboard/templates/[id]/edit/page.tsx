export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Metadata } from "next";

import { AddEditForm } from "@/app/ui/templates/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import {
  fetchFilteredTemplates,
  fetchDiscCounts,
} from "@/data-access/templates";
import { fetchUserSettings } from "@/data-access/users";

export const metadata: Metadata = {
  title: "Edit Disc",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const [params, userSettings, templates] = await Promise.all([
    props.params,
    fetchUserSettings(),
    fetchFilteredTemplates(""),
  ]);
  const id = params.id;
  const discCounts = await fetchDiscCounts(id);
  const templateNames = templates
    // Since we want to be able to edit a template and save it with the same name,
    // filter out the template being edited from the list of names
    .filter((template) => template.id !== id)
    .map((template) => template.name);
  const templateToEdit = templates.find((template) => template.id === id);

  if (!templateToEdit) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Templates", href: "/dashboard/templates" },
          {
            label: "Edit template",
            href: `/dashboard/templates/${id}/edit`,
            active: true,
          },
        ]}
      />
      <AddEditForm
        template={templateToEdit}
        discCount={discCounts[0]}
        templateNames={templateNames}
        userSettings={userSettings}
      />
    </main>
  );
}
