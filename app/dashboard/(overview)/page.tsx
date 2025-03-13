export const dynamic = "force-dynamic";

import CardWrapper from "@/app/ui/dashboard/cards";
// import TrendsChart from "@/app/ui/dashboard/trends-chart";
// import LatestDiscs from "@/app/ui/dashboard/latest-discs";
import { primaryFont } from "@/app/ui/fonts";
import { Suspense } from "react";
import {
  // TrendsChartSkeleton,
  // LatestDiscsSkeleton,
  CardsSkeleton,
} from "@/app/ui/skeletons";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Page() {
  return (
    <main>
      <h1 className={`${primaryFont.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid content-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
      {/* <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<TrendsChartSkeleton />}>
          <TrendsChart />
        </Suspense>
        <Suspense fallback={<LatestDiscsSkeleton />}>
          <LatestDiscs />
        </Suspense>
      </div> */}
    </main>
  );
}
