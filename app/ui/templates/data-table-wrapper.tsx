"use client";

import { useState } from "react";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { NotificationPreviewDisc } from "@/db/schema/discs";
import { SelectTemplate } from "@/db/schema/templates";

interface DataTableWrapperProps<TData extends SelectTemplate> {
  data: TData[];
}

export function DataTableWrapper({
  data,
}: DataTableWrapperProps<SelectTemplate>) {
  const initialPreviewDisc: NotificationPreviewDisc = {
    name: "Paul",
    color: "yellow",
    plastic: "Z",
    brand: "Discraft",
    mold: "Luna",
    laf: "Haple Mill",
    heldUntil: null,
  };
  const [previewDisc, setPreviewDisc] = useState(initialPreviewDisc);

  return (
    <div className="w-full">
      <DataTable
        previewDiscState={[previewDisc, setPreviewDisc]}
        columns={columns(previewDisc)}
        data={data}
      />
    </div>
  );
}
