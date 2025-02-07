"use client";

import { useState, useEffect } from "react";
import { Column, ColumnDef } from "@tanstack/react-table";
import clsx from "clsx";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/ui/tooltip";
import { Disc, Template } from "@/app/lib/definitions";
import { splitTemplateContent, getTemplatePreview } from "@/app/lib/utils";
import { Checkbox } from "@/app/ui/checkbox";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  DefaultTemplate,
} from "@/app/ui/icons";
import { LocalDateTime } from "@/app/ui/local-date-time";
import { ActionDropdown } from "./action-dropdown";

const PreviewCell = ({
  content,
  previewDisc,
}: {
  content: string;
  previewDisc: Disc;
}) => {
  const [preview, setPreview] = useState(
    getTemplatePreview(content, previewDisc)
  );

  useEffect(() => {
    setPreview(getTemplatePreview(content, previewDisc));
  }, [content, previewDisc]);

  return (
    <div>
      {preview.map(({ substring, className }, index) => {
        return (
          <span key={index} className={className}>
            {substring}
          </span>
        );
      })}
    </div>
  );
};

const columnHeader = (column: Column<Template>, columnName: string) => {
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

export function columns(previewDisc: Disc): ColumnDef<Template>[] {
  return [
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
      accessorKey: "type",
      header: ({ column }) => columnHeader(column, "Type"),
      cell: ({ row }) => {
        const value: string = row.getValue("type");
        return <div className="capitalize">{value}</div>;
      },
    },
    {
      accessorKey: "content",
      header: ({ column }) => columnHeader(column, "Content"),
      cell: ({ row }) => {
        const content: string = row.getValue("content");
        return (
          <div>
            {splitTemplateContent(content).map(
              ({ substring, className }, index) => {
                return (
                  <span key={index} className={className}>
                    {substring}
                  </span>
                );
              }
            )}
          </div>
        );
      },
    },
    {
      id: "preview",
      header: ({ column }) => columnHeader(column, "Preview"),
      cell: ({ row }) => {
        const content: string = row.getValue("content");
        return <PreviewCell content={content} previewDisc={previewDisc} />;
      },
    },
    {
      accessorKey: "is_default",
      header: ({ column }) => columnHeader(column, "Default"),
      cell: ({ row }) => {
        const value: boolean = row.getValue("is_default");
        return (
          <div className="flex justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="cursor-default">
                  {value ?
                    <DefaultTemplate className="text-primary h-5 w-5" />
                  : ""}
                </TooltipTrigger>
                {value && (
                  <TooltipContent>
                    Default {row.original.type} template
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => columnHeader(column, "Created at"),
      cell: ({ row }) => {
        const value: Date | null = row.getValue("created_at");
        return <LocalDateTime date={value} />;
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => columnHeader(column, "Updated at"),
      cell: ({ row }) => {
        const value: Date | null = row.getValue("updated_at");
        return <LocalDateTime date={value} />;
      },
    },
    {
      id: "iconsAndActions",
      cell: ({ row }) => {
        const template = row.original;

        return <ActionDropdown templates={[template]} actionSet="row" />;
      },
      enableHiding: false,
    },
  ];
}
