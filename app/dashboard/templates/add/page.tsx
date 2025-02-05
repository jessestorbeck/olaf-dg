import AddEditForm from "@/app/ui/templates/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Template",
};

export default async function Page() {
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
      <AddEditForm mode="add" />
    </main>
  );
}
