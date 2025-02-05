import { Table } from "@tanstack/react-table";
import { ScrollText, Bell, BellPlus, Hourglass, Star } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";

interface TemplateFilterProps<TData> {
  table: Table<TData>;
}

export function TemplateFilter<TData>({ table }: TemplateFilterProps<TData>) {
  return (
    <Select
      onValueChange={(value) => {
        if (value === "defaults") {
          table.getColumn("type")?.setFilterValue(undefined);
          table.getColumn("is_default")?.setFilterValue(true);
        } else {
          table.getColumn("is_default")?.setFilterValue(undefined);
          table
            .getColumn("type")
            ?.setFilterValue(value === "all" ? undefined : value);
        }
      }}
    >
      <SelectTrigger className="w-fit">
        <SelectValue placeholder="Show templates by type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="flex items-center">
            <ScrollText className="w-5 mr-2" aria-hidden="true" />
            All templates
          </span>
        </SelectItem>
        <SelectItem value="notification">
          <span className="flex items-center">
            <Bell className="w-5 mr-2" aria-hidden="true" />
            Notification
          </span>
        </SelectItem>
        <SelectItem value="reminder">
          <span className="flex items-center">
            <BellPlus className="w-5 mr-2" aria-hidden="true" />
            Reminder
          </span>
        </SelectItem>
        <SelectItem value="extension">
          <span className="flex items-center">
            <Hourglass className="w-5 mr-2" aria-hidden="true" />
            Extension
          </span>
        </SelectItem>
        <SelectItem value="defaults">
          <span className="flex items-center">
            <Star className="w-5 mr-2" aria-hidden="true" />
            Defaults
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
