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
        <Button variant="outline">Columns</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            const colName = column.id
              .replace(/is_/g, "") // Remove is_ prefix (for is_default template column)
              .replace(/_/g, " "); // Replace remaining underscores with spaces
            const colNameFormatted = colName
              // Sentence case the column name
              .charAt(0)
              .toUpperCase()
              .concat(colName.slice(1));
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {colNameFormatted}
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
