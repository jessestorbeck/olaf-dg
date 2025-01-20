import { Table } from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/ui/dropdown-menu";
import { Button } from "@/app/ui/button";

interface columnVisibilityProps<TData> {
  table: Table<TData>;
}

export function ColumnVisibility<TData>({
  table,
}: columnVisibilityProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            let columnId =
              column.id === "created_at" ?
                "date"
              : column.id.replace(/_/g, " ");
            // Sentence case column names
            columnId = columnId.charAt(0).toUpperCase() + columnId.slice(1);
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnId}
              </DropdownMenuCheckboxItem>
            );
          })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => table.toggleAllColumnsVisible(true)}
          className="mt-2"
        >
          <span>Show all</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
