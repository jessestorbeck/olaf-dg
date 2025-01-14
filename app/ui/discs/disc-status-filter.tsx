import { Table } from "@tanstack/react-table";
import { Smile, Archive, Clock, CircleHelp } from "lucide-react";
import { CircleStackIcon } from "@heroicons/react/24/outline";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";

interface DiscStatusFilterProps<TData> {
  table: Table<TData>;
}

export function DiscStatusFilter<TData>({
  table,
}: DiscStatusFilterProps<TData>) {
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
            <CircleStackIcon
              className="h-5 mr-2 rotate-90"
              aria-hidden="true"
            />
            All discs
          </span>
        </SelectItem>
        <SelectItem value="awaiting pickup">
          <span className="flex items-center">
            <Clock className="w-5 mr-2" aria-hidden="true" />
            Awaiting pickup
          </span>
        </SelectItem>
        <SelectItem value="picked up">
          <span className="flex items-center">
            <Smile className="w-5 mr-2" aria-hidden="true" />
            Picked up
          </span>
        </SelectItem>
        <SelectItem value="abandoned">
          <span className="flex items-center">
            <CircleHelp className="w-5 mr-2" aria-hidden="true" />
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
