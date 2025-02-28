import AddEditForm from "@/app/ui/discs/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { Metadata } from "next";

import { fetchFilteredTemplates } from "@/data-access/templates";

export const metadata: Metadata = {
  title: "Add disc",
};

export default async function Page() {
  const templates = await fetchFilteredTemplates("");
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
      <AddEditForm templates={templates} />
    </main>
  );
}
