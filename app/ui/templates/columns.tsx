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
import { NotificationPreviewDisc } from "@/db/schema/discs";
import { DiscCount, SelectTemplate } from "@/db/schema/templates";
import { UserSettings } from "@/db/schema/users";

const PreviewCell = ({
  content,
  previewDisc,
  userSettings,
}: {
  content: string;
  previewDisc: NotificationPreviewDisc;
  userSettings: UserSettings;
}) => {
  const [preview, setPreview] = useState(
    getTemplatePreview(content, previewDisc, userSettings)
  );

  useEffect(() => {
    setPreview(getTemplatePreview(content, previewDisc, userSettings));
  }, [content, previewDisc, userSettings]);

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

const columnHeader = (column: Column<SelectTemplate>, columnName: string) => {
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

export function columns(
  previewDisc: NotificationPreviewDisc,
  userSettings: UserSettings,
  discCounts: DiscCount[]
): ColumnDef<SelectTemplate>[] {
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
        return (
          <PreviewCell
            content={content}
            previewDisc={previewDisc}
            userSettings={userSettings}
          />
        );
      },
    },
    {
      accessorKey: "isDefault",
      header: ({ column }) => columnHeader(column, "Default"),
      cell: ({ row }) => {
        const value: boolean = row.getValue("isDefault");
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
      id: "discCount",
      header: ({ column }) => columnHeader(column, "Discs"),
      cell: ({ row }) => {
        const templateId: string = row.original.id;
        const discCount = discCounts.find(
          (disc) => disc.id === templateId
        )?.discCount;
        return <div className="text-center">{discCount}</div>;
      },
      // Properties below are needed for sorting
      accessorFn: (row) => {
        const templateId: string = row.id;
        return discCounts.find((template) => template.id === templateId)
          ?.discCount;
      },
      sortingFn: (a, b) => {
        const aCount =
          discCounts.find((template) => template.id === a.original.id)
            ?.discCount || 0;
        const bCount =
          discCounts.find((template) => template.id === b.original.id)
            ?.discCount || 0;
        return aCount - bCount;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => columnHeader(column, "Created at"),
      cell: ({ row }) => {
        const value: Date = row.getValue("createdAt");
        return <LocalDateTime date={value} />;
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => columnHeader(column, "Updated at"),
      cell: ({ row }) => {
        const value: Date = row.getValue("updatedAt");
        return <LocalDateTime date={value} />;
      },
    },
    {
      id: "iconsAndActions",
      cell: ({ row }) => {
        const template = row.original;

        return (
          <ActionDropdown
            templates={[template]}
            actionSet="row"
            discCounts={discCounts}
          />
        );
      },
      enableHiding: false,
    },
  ];
}
