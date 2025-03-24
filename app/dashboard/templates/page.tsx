export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Metadata } from "next";

import { SearchBar } from "@/app/ui/search-bar";
import { CreateTemplate } from "@/app/ui/templates/action-buttons";
import { primaryFont } from "@/app/ui/fonts";
import { DiscsTableSkeleton } from "@/app/ui/skeletons";
import { DataTableWrapper } from "@/app/ui/templates/data-table-wrapper";
import {
  fetchDiscCounts,
  fetchFilteredTemplates,
} from "@/data-access/templates";
import { fetchUserSettings } from "@/data-access/users";

export const metadata: Metadata = {
  title: "Templates",
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
  }>;
}) {
  const searchParamsPromise = props.searchParams;
  const userSettingsPromise = fetchUserSettings();
  const discCountsPromise = fetchDiscCounts();
  const [searchParams, userSettings, discCounts] = await Promise.all([
    searchParamsPromise,
    userSettingsPromise,
    discCountsPromise,
  ]);

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
          <DataTableWrapper
            data={data}
            userSettings={userSettings}
            discCounts={discCounts}
          />
        </div>
      </Suspense>
    </div>
  );
}
