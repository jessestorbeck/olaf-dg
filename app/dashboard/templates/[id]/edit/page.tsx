import AddEditForm from "@/app/ui/templates/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { fetchTemplateById } from "@/app/lib/data";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Disc",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [template] = await Promise.all([fetchTemplateById(id)]);

  if (!template) {
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
      <AddEditForm mode="edit" template={template} />
    </main>
  );
}
