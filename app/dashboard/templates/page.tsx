import { Suspense } from "react";
import { Metadata } from "next";

import { SearchBar } from "@/app/ui/search-bar";
import { CreateTemplate } from "@/app/ui/templates/action-buttons";
import { primaryFont } from "@/app/ui/fonts";
import { DiscsTableSkeleton } from "@/app/ui/skeletons";
import { fetchFilteredTemplates } from "@/app/lib/data";
import { DataTableWrapper } from "@/app/ui/templates/data-table-wrapper";

export const metadata: Metadata = {
  title: "Templates",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";

  const data = await fetchFilteredTemplates(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${primaryFont.className} text-2xl`}>Templates</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <SearchBar placeholder="Search templates..." />
        <CreateTemplate />
      </div>
      <Suspense fallback={<DiscsTableSkeleton />}>
        <div className="container mx-auto py-4">
          <DataTableWrapper data={data} />
        </div>
      </Suspense>
    </div>
  );
}
