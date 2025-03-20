import { Table } from "@tanstack/react-table";

import {
  Templates,
  Notify,
  Remind,
  AddTime,
  DefaultTemplate,
} from "@/app/ui/icons";
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
            <Templates className="w-5 mr-2" aria-hidden="true" />
            All templates
          </span>
        </SelectItem>
        <SelectItem value="initial">
          <span className="flex items-center">
            <Notify className="w-5 mr-2" aria-hidden="true" />
            Notification
          </span>
        </SelectItem>
        <SelectItem value="reminder">
          <span className="flex items-center">
            <Remind className="w-5 mr-2" aria-hidden="true" />
            Reminder
          </span>
        </SelectItem>
        <SelectItem value="extension">
          <span className="flex items-center">
            <AddTime className="w-5 mr-2" aria-hidden="true" />
            Extension
          </span>
        </SelectItem>
        <SelectItem value="defaults">
          <span className="flex items-center">
            <DefaultTemplate className="w-5 mr-2" aria-hidden="true" />
            Defaults
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
