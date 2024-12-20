import AddForm from "@/app/ui/discs/add-form";
import Breadcrumbs from "@/app/ui/discs/breadcrumbs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Disc",
};

export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Discs", href: "/dashboard/discs" },
          {
            label: "Add Disc",
            href: "/dashboard/discs/create",
            active: true,
          },
        ]}
      />
      <AddForm />
    </main>
  );
}
