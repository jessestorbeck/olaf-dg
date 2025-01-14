import { Suspense } from "react";
import { Metadata } from "next";

import Pagination from "@/app/ui/discs/pagination";
import Search from "@/app/ui/search";
import Table from "@/app/ui/discs/table";
import { CreateDisc } from "@/app/ui/discs/action-buttons";
import { primaryFont } from "@/app/ui/fonts";
import { DiscsTableSkeleton } from "@/app/ui/skeletons";
import { fetchFilteredDiscs, fetchDiscsPages } from "@/app/lib/data";
import { columns } from "@/app/ui/discs/columns";
import { DataTable } from "@/app/ui/discs/data-table";

export const metadata: Metadata = {
  title: "Discs",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchDiscsPages(query);

  const data = await fetchFilteredDiscs(query, currentPage);

  return (
    <>
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <h1 className={`${primaryFont.className} text-2xl`}>Discs</h1>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
          <Search placeholder="Search discs..." />
          <CreateDisc />
        </div>
        <Suspense key={query + currentPage} fallback={<DiscsTableSkeleton />}>
          <Table query={query} currentPage={currentPage} />
        </Suspense>
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
      {/* New Table */}
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <h1 className={`${primaryFont.className} text-2xl`}>Discs</h1>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
          <Search placeholder="Search discs..." />
          <CreateDisc />
        </div>
        <div className="container mx-auto py-5">
          <DataTable columns={columns} data={data} />
        </div>
        <div className="flex w-full justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </>
  );
}
