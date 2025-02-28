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

const columnAliases = {
  name: "Name",
  type: "Type",
  content: "Content",
  preview: "Preview",
  isDefault: "Default",
  createdAt: "Created at",
  updatedAt: "Updated at",
  phone: "Phone",
  color: "Color",
  brand: "Brand",
  plastic: "Plastic",
  mold: "Mold",
  location: "Location",
  heldUntil: "Held until",
  status: "Status",
};

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
            const colName =
              columnAliases[column.id as keyof typeof columnAliases];
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {colName}
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
