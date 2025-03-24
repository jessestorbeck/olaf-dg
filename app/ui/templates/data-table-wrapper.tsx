"use client";

import { useState } from "react";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { NotificationPreviewDisc } from "@/db/schema/discs";
import { SelectTemplate, DiscCount } from "@/db/schema/templates";
import { UserSettings } from "@/db/schema/users";

interface DataTableWrapperProps<TData extends SelectTemplate> {
  data: TData[];
  userSettings: UserSettings;
  discCounts: DiscCount[];
}

export function DataTableWrapper({
  data,
  userSettings,
  discCounts,
}: DataTableWrapperProps<SelectTemplate>) {
  const initialPreviewDisc: NotificationPreviewDisc = {
    name: "Paul",
    color: "yellow",
    plastic: "Z",
    brand: "Discraft",
    mold: "Luna",
    heldUntil: null,
  };
  const [previewDisc, setPreviewDisc] = useState(initialPreviewDisc);

  return (
    <div className="w-full">
      <DataTable
        previewDiscState={[previewDisc, setPreviewDisc]}
        columns={columns(previewDisc, userSettings, discCounts)}
        data={data}
        discCounts={discCounts}
      />
    </div>
  );
}
