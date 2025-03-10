"use client";

import * as React from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  SortingState,
  VisibilityState,
  getSortedRowModel,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useToast } from "@/app/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/ui/table";
import { DataTablePagination } from "@/app/ui/data-table-pagination";
import { ColumnVisibility } from "@/app/ui/column-visibility";
import { ActionDropdown } from "./action-dropdown";
import { PreviewDiscPopover } from "./preview-disc-popover";
import { TemplateFilter } from "./template-filter";
import { NotificationPreviewDisc } from "@/db/schema/discs";
import { SelectTemplate } from "@/db/schema/templates";

interface DataTableProps<TData extends SelectTemplate, TValue> {
  previewDiscState: [
    NotificationPreviewDisc,
    (disc: NotificationPreviewDisc) => void,
  ];
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData extends SelectTemplate, TValue>({
  previewDiscState,
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({ status: false });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, rowSelection, columnFilters, columnVisibility },
  });

  // This is only for toast notifications after navigation,
  // i.e., after updating a template or creating a template with the "Save and close" button.
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const toastTitle = searchParams.get("title");
  const toastMessage = searchParams.get("message");
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (toastMessage) {
      toast({
        title: decodeURIComponent(atob(toastTitle as string)),
        description: decodeURIComponent(atob(toastMessage as string)),
      });
      // Remove the message from the path after displaying the toast
      router.replace(pathname);
    }
  }, [toast, router, pathname, toastTitle, toastMessage]);

  return (
    <div>
      <div className="flex pb-2 gap-2">
        <ActionDropdown
          templates={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          totalTemplates={table.getFilteredRowModel().rows.length}
          actionSet="selected"
        />
        <TemplateFilter table={table} />
        <div className="flex gap-2 ml-auto">
          <PreviewDiscPopover previewDiscState={previewDiscState} />
          <ColumnVisibility table={table} />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ?
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
