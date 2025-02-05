"use client";

import { useState } from "react";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Disc, Template } from "@/app/lib/definitions";

interface DataTableWrapperProps<TData extends Template> {
  data: TData[];
}

export function DataTableWrapper({ data }: DataTableWrapperProps<Template>) {
  const initialPreviewDisc: Disc = {
    id: "35074acb-9121-4e31-9277-4db3241e9999",
    user_id: "35074acb-9121-4e31-9277-4db3241ef591",
    name: "Paul",
    phone: "1111111111",
    color: "yellow",
    plastic: "Z",
    brand: "Discraft",
    mold: "Luna",
    location: "Shelf 1",
    notes: "Paul's favorite disc",
    notified: false,
    reminded: false,
    status: "awaiting pickup",
    held_until: undefined,
    created_at: new Date(),
    updated_at: new Date(),
    laf: "Haple Mill",
    notification_template: null,
    notification_text: "",
    reminder_template: null,
    reminder_text: "",
    extension_template: null,
    extension_text: "",
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
