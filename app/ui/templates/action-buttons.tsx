import { Pencil, Plus, Trash2, Star, Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/app/ui/button";

export function CreateTemplate() {
  return (
    <Button>
      <Link className="flex items-center" href="/dashboard/templates/add">
        <span className="hidden md:block">Add template</span>{" "}
        <Plus className="h-5 md:ml-2" aria-hidden="true" />
      </Link>
    </Button>
  );
}

export function MakeTemplateDefault() {
  return (
    <div className="flex items-center">
      <Star className="w-5 mr-2" aria-hidden="true" />
      Make default
    </div>
  );
}

export function ViewTemplate({ id }: { id: string }) {
  return (
    <Link href={`/dashboard/templates/${id}`} className="flex items-center">
      <Eye className="w-5 mr-2" aria-hidden="true" />
      View
    </Link>
  );
}

export function EditTemplate({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/templates/${id}/edit`}
      className="flex items-center"
    >
      <Pencil className="w-5 mr-2" aria-hidden="true" />
      Edit
    </Link>
  );
}

export function DeleteTemplates({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center text-red-500">
      <Trash2 className="w-5 mr-2" aria-hidden="true" />
      Delete{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}
