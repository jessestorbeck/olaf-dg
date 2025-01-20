import {
  Pencil,
  Plus,
  Trash2,
  Bell,
  BellPlus,
  Smile,
  Archive,
  Eye,
  History,
  Hourglass,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/app/ui/button";

export function CreateDisc() {
  return (
    <Button>
      <Link className="flex items-center" href="/dashboard/discs/add">
        <span className="hidden md:block">Add disc</span>{" "}
        <Plus className="h-5 md:ml-2" aria-hidden="true" />
      </Link>
    </Button>
  );
}

export function NotifyOwners({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center">
      <Bell className="w-5 mr-2" aria-hidden="true" />
      Notify{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}

export function RemindOwners({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center">
      <BellPlus className="w-5 mr-2" aria-hidden="true" />
      Remind{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}

export function AddTimeToDiscs({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center">
      <Hourglass className="w-5 mr-2" aria-hidden="true" />
      Add time{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}

export function DiscsPickedUp({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center">
      <Smile className="w-5 mr-2" aria-hidden="true" />
      Picked up{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}

export function ArchiveDiscs({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center">
      <Archive className="w-5 mr-2" aria-hidden="true" />
      Archive{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}

export function RestoreDiscs({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center">
      <History className="w-5 mr-2" aria-hidden="true" />
      Restore{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}

export function ViewDisc({ id }: { id: string }) {
  return (
    <Link href={`/dashboard/discs/${id}`} className="flex items-center">
      <Eye className="w-5 mr-2" aria-hidden="true" />
      View
    </Link>
  );
}

export function UpdateDisc({ id }: { id: string }) {
  return (
    <Link href={`/dashboard/discs/${id}/edit`} className="flex items-center">
      <Pencil className="w-5 mr-2" aria-hidden="true" />
      Edit
    </Link>
  );
}

export function DeleteDiscs({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center text-red-500">
      <Trash2 className="w-5 mr-2" aria-hidden="true" />
      Delete{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}
