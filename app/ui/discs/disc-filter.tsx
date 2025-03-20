import { Table } from "@tanstack/react-table";

import {
  Discs,
  AwaitingPickup,
  PickedUp,
  Abandoned,
  Archive,
} from "@/app/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";

interface DiscFilterProps<TData> {
  table: Table<TData>;
}

export function DiscFilter<TData>({ table }: DiscFilterProps<TData>) {
  return (
    <Select
      onValueChange={(value) =>
        table
          .getColumn("status")
          ?.setFilterValue(value === "all" ? undefined : value)
      }
    >
      <SelectTrigger className="w-fit">
        <SelectValue placeholder="Show discs by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="flex items-center">
            <Discs className="h-5 mr-2" aria-hidden="true" />
            All discs
          </span>
        </SelectItem>
        <SelectItem value="awaiting_pickup">
          <span className="flex items-center">
            <AwaitingPickup className="w-5 mr-2" aria-hidden="true" />
            Awaiting pickup
          </span>
        </SelectItem>
        <SelectItem value="picked_up">
          <span className="flex items-center">
            <PickedUp className="w-5 mr-2" aria-hidden="true" />
            Picked up
          </span>
        </SelectItem>
        <SelectItem value="abandoned">
          <span className="flex items-center">
            <Abandoned className="w-5 mr-2" aria-hidden="true" />
            Abandoned
          </span>
        </SelectItem>
        <SelectItem value="archived">
          <span className="flex items-center">
            <Archive className="w-5 mr-2" aria-hidden="true" />
            Archived
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
