"use client";

import { useState, useEffect, Suspense } from "react";

export function LocalDateTime({
  date,
  dateOnly = false,
}: {
  date: Date | null;
  dateOnly?: boolean;
  heldUntil?: boolean;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // In the case of undefined held_until dates, return empty string
  if (!date) return "";

  return (
    <Suspense key={isClient ? "local" : "utc"}>
      <time dateTime={new Date(date).toISOString()}>
        {dateOnly && new Date(date).toLocaleDateString()}
        {!dateOnly && new Date(date).toLocaleString()}
        {isClient ? "" : " (UTC)"}
      </time>
    </Suspense>
  );
}
