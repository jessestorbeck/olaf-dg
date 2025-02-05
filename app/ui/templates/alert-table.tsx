import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/ui/table";
import { Template } from "@/app/lib/definitions";
import { splitTemplateContent } from "@/app/lib/utils";

export function AlertTable({ templates }: { templates: Template[] }) {
  return (
    <div className="max-h-48 overflow-y-scroll my-4">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Content</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell>{template.type}</TableCell>
              <TableCell>
                {splitTemplateContent(template.content).map(
                  ({ substring, className }, index) => {
                    return (
                      <span key={index} className={className}>
                        {substring}
                      </span>
                    );
                  }
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
