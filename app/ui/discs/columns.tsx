"use client";

import { Column, ColumnDef, Row } from "@tanstack/react-table";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  AwaitingPickup,
  Notify,
  Remind,
  PickedUp,
  Archive,
  Abandoned,
} from "@/app/ui/icons";
import clsx from "clsx";

import { Disc } from "@/app/lib/definitions";
import {
  formatDate,
  formatDateTime,
  formatPhone,
  dateHasPassed,
  dateIsClose,
} from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/ui/tooltip";
import { Checkbox } from "@/app/ui/checkbox";
import { ActionDropdown } from "./action-dropdown";

const columnHeader = (column: Column<Disc>, columnName: string) => {
  return (
    <span
      className={clsx(
        "flex items-center cursor-pointer hover:text-emerald-600",
        // Bold the column header if it's sorted
        { "font-bold text-primary": column.getIsSorted() }
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {columnName}
      {/* Arrow icon logic to reflect sorting */}
      {column.getIsSorted() ?
        column.getIsSorted() === "asc" ?
          <ArrowUp className="ml-1 h-4 w-4" />
        : <ArrowDown className="ml-1 h-4 w-4" />
      : <ArrowUpDown className="ml-1 h-4 w-4" />}
    </span>
  );
};

export const columns: ColumnDef<Disc>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => columnHeader(column, "Name"),
  },
  {
    accessorKey: "phone",
    header: ({ column }) => columnHeader(column, "Phone"),
    cell: ({ row }) => {
      const formatted = formatPhone(row.getValue("phone"));
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "color",
    header: ({ column }) => columnHeader(column, "Color"),
  },
  {
    accessorKey: "brand",
    header: ({ column }) => columnHeader(column, "Brand"),
  },
  {
    accessorKey: "plastic",
    header: ({ column }) => columnHeader(column, "Plastic"),
  },
  {
    accessorKey: "mold",
    header: ({ column }) => columnHeader(column, "Mold"),
  },
  {
    accessorKey: "location",
    header: ({ column }) => columnHeader(column, "Location"),
  },
  {
    accessorKey: "status",
    header: ({ column }) => columnHeader(column, "Status"),
    cell: ({ row }) => {
      const status: string = row.getValue("status");
      if (
        status === "awaiting pickup" &&
        dateHasPassed(row.getValue("held_until"))
      ) {
        return "Abandoned";
      } else {
        return status.charAt(0).toUpperCase() + status.slice(1);
      }
    },
    filterFn: (row: Row<Disc>, columnId: string, filterValue: string) => {
      const status = row.getValue(columnId);
      const transformedStatus =
        (
          status === "awaiting pickup" &&
          dateHasPassed(row.getValue("held_until"))
        ) ?
          "abandoned"
        : status;
      return transformedStatus === filterValue;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => columnHeader(column, "Created at"),
    cell: ({ row }) => {
      const formatted = formatDateTime(row.getValue("created_at"));
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "held_until",
    header: ({ column }) => columnHeader(column, "Held until"),
    cell: ({ row }) => {
      const formatted =
        row.getValue("held_until") ?
          formatDate(row.getValue("held_until"))
        : "";
      return (
        <div
          className={clsx({
            "font-bold": dateIsClose(row.getValue("held_until")),
            "font-bold text-red-500": dateHasPassed(row.getValue("held_until")),
          })}
        >
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => columnHeader(column, "Updated at"),
    cell: ({ row }) => {
      const formatted = formatDateTime(row.getValue("updated_at"));
      return <div>{formatted}</div>;
    },
  },
  {
    id: "iconsAndActions",
    cell: ({ row }) => {
      const disc = row.original;

      return (
        <div className="flex items-center justify-end gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                {!disc.reminded && (
                  <Notify
                    className={clsx("w-5", {
                      "text-gray-400": !disc.notified,
                    })}
                  />
                )}
                {disc.reminded && <Remind className="w-5" />}
              </TooltipTrigger>
              <TooltipContent>
                {!disc.notified && <p>Not notified</p>}
                {disc.notified && !disc.reminded && <p>Notified</p>}
                {disc.reminded && <p>Reminded</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                {disc.status === "awaiting pickup" &&
                  !dateHasPassed(disc.held_until) && (
                    <AwaitingPickup className="w-5" />
                  )}
                {disc.status === "picked up" && <PickedUp className="w-5" />}
                {disc.status === "awaiting pickup" &&
                  dateHasPassed(disc.held_until) && (
                    <Abandoned className="w-5" />
                  )}
                {disc.status === "archived" && <Archive className="w-5" />}
              </TooltipTrigger>
              <TooltipContent>
                {disc.status === "awaiting pickup" &&
                  !dateHasPassed(disc.held_until) && <p>Awaiting pickup</p>}
                {disc.status === "picked up" && <p>Picked up</p>}
                {disc.status === "awaiting pickup" &&
                  dateHasPassed(disc.held_until) && <p>Abandoned</p>}
                {disc.status === "archived" && <p>Archived</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <ActionDropdown discs={[disc]} actionSet="row" />
        </div>
      );
    },
    enableHiding: false,
  },
];
