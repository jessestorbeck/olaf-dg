import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/ui/table";
import { Button } from "@/app/ui/button";
import { SelectTemplate } from "@/db/schema/templates";
import { splitTemplateContent } from "@/app/lib/utils";

interface AlertTableTemplate extends SelectTemplate {
  discCountUnused?: number;
}

const getHref = (template: AlertTableTemplate) => {
  if (template.type === "initial") {
    return `/dashboard/discs?query=initialTemplate%3A${template.id}%20notified%3Afalse%20status%3Aawaiting_pickup`;
  } else if (template.type === "reminder") {
    return `/dashboard/discs?query=reminderTemplate%3A${template.id}%20reminded%3Afalse%20status%3Aawaiting_pickup`;
  } else {
    return `/dashboard/discs?query=extensionTemplate%3A${template.id}%20status%3Aawaiting_pickup`;
  }
};

export function AlertTable({ templates }: { templates: AlertTableTemplate[] }) {
  // Are there any discs affected by the deletion of these templates?
  const affectedDiscs = templates.some((el) => (el.discCountUnused || 0) > 0);

  return (
    <div className="max-h-48 overflow-y-scroll my-4">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Content</TableHead>
            {affectedDiscs && <TableHead>Affected Discs</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => (
            <TableRow key={template.id}>
              <TableCell>{template.name}</TableCell>
              <TableCell className="capitalize">{template.type}</TableCell>
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
              {affectedDiscs && (
                <TableCell className="text-center">
                  <Button
                    variant={"link"}
                    className="p-0"
                    disabled={template.discCountUnused === 0}
                  >
                    <Link href={getHref(template)}>
                      {template.discCountUnused}
                    </Link>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
