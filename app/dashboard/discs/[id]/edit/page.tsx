import EditForm from "@/app/ui/discs/edit-form";
import Breadcrumbs from "@/app/ui/discs/breadcrumbs";
import { fetchDiscById } from "@/app/lib/data";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Disc",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [disc] = await Promise.all([fetchDiscById(id)]);

  if (!disc) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Discs", href: "/dashboard/discs" },
          {
            label: "Edit Disc",
            href: `/dashboard/discs/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditForm disc={disc} />
    </main>
  );
}
