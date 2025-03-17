export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Metadata } from "next";

import { AddEditForm } from "@/app/ui/discs/add-edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { fetchDiscById } from "@/data-access/discs";
import { fetchFilteredTemplates } from "@/data-access/templates";
import { fetchUserSettings } from "@/data-access/users";

export const metadata: Metadata = {
  title: "Edit Disc",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const userSettings = await fetchUserSettings();
  const params = await props.params;
  const id = params.id;
  const [disc, templates] = await Promise.all([
    fetchDiscById(id),
    fetchFilteredTemplates(""),
  ]);

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
      <AddEditForm
        disc={disc}
        templates={templates}
        userSettings={userSettings}
      />
    </main>
  );
}
