import Link from "next/link";

import { Edit, Add, Delete, DefaultTemplate, View } from "@/app/ui/icons";

import { Button } from "@/app/ui/button";

export function CreateTemplate() {
  return (
    <Button>
      <Link className="flex items-center" href="/dashboard/templates/add">
        <span className="hidden md:block">Add template</span>{" "}
        <Add className="h-5 md:ml-2" aria-hidden="true" />
      </Link>
    </Button>
  );
}

export function MakeTemplateDefault() {
  return (
    <div className="flex items-center">
      <DefaultTemplate className="w-5 mr-2" aria-hidden="true" />
      Make default
    </div>
  );
}

export function ViewTemplate({ id }: { id: string }) {
  return (
    <Link href={`/dashboard/templates/${id}`} className="flex items-center">
      <View className="w-5 mr-2" aria-hidden="true" />
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
      <Edit className="w-5 mr-2" aria-hidden="true" />
      Edit
    </Link>
  );
}

export function DeleteTemplates({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center text-red-500">
      <Delete className="w-5 mr-2" aria-hidden="true" />
      Delete{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}
