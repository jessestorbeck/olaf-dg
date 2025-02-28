import { notFound } from "next/navigation";
import { Metadata } from "next";

import AddEditForm from "@/app/ui/templates/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { fetchFilteredTemplates } from "@/data-access/templates";

export const metadata: Metadata = {
  title: "Edit Disc",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const templates = await fetchFilteredTemplates("");
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
      <AddEditForm template={templateToEdit} templateNames={templateNames} />
    </main>
  );
}
