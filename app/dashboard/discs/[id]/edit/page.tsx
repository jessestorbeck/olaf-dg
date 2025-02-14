import AddEditForm from "@/app/ui/discs/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { fetchDiscById } from "@/app/lib/data";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import { fetchFilteredTemplates } from "@/app/lib/data";

export const metadata: Metadata = {
  title: "Edit Disc",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [disc] = await Promise.all([fetchDiscById(id)]);
  const templates = await fetchFilteredTemplates("");

  if (!disc) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Discs", href: "/dashboard/discs" },
          {
            label: "Edit disc",
            href: `/dashboard/discs/${id}/edit`,
            active: true,
          },
        ]}
      />
      <AddEditForm mode="edit" templates={templates} disc={disc} />
    </main>
  );
}
