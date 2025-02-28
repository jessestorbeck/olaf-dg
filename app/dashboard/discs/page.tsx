import { Suspense } from "react";
import { Metadata } from "next";

import { SearchBar } from "@/app/ui/search-bar";
import { CreateDisc } from "@/app/ui/discs/action-buttons";
import { primaryFont } from "@/app/ui/fonts";
import { DiscsTableSkeleton } from "@/app/ui/skeletons";
import { fetchFilteredDiscs } from "@/data-access/discs";
import { columns } from "@/app/ui/discs/columns";
import { DataTable } from "@/app/ui/discs/data-table";

export const metadata: Metadata = {
  title: "Discs",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";

  const data = await fetchFilteredDiscs(query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${primaryFont.className} text-2xl`}>Discs</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <SearchBar placeholder="Search discs..." />
        <CreateDisc />
      </div>
      <Suspense fallback={<DiscsTableSkeleton />}>
        <div className="container mx-auto py-4">
          <DataTable columns={columns} data={data} />
        </div>
      </Suspense>
    </div>
  );
}
