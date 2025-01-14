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

import {
  notifyOwners,
  remindOwners,
  discsPickedUp,
  archiveDiscs,
  restoreDiscs,
} from "@/app/lib/actions";

export function CreateDisc() {
  return (
    <Link
      href="/dashboard/discs/add"
      className="flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Disc</span>{" "}
      <Plus className="h-5 md:ml-4" aria-hidden="true" />
    </Link>
  );
}

export function NotifyOwners({
  ids,
  quantity,
}: {
  ids: string[];
  quantity?: number;
}) {
  const notifyOwnersWithIds = notifyOwners.bind(null, ids);

  return (
    <form action={notifyOwnersWithIds}>
      <button type="submit" className="flex items-center">
        <Bell className="w-5 mr-2" aria-hidden="true" />
        Notify{quantity || quantity == 0 ? ` (${quantity})` : ""}
      </button>
    </form>
  );
}

export function RemindOwners({
  ids,
  quantity,
}: {
  ids: string[];
  quantity?: number;
}) {
  const remindOwnersWithIds = remindOwners.bind(null, ids);

  return (
    <form action={remindOwnersWithIds}>
      <button type="submit" className="flex items-center">
        <BellPlus className="w-5 mr-2" aria-hidden="true" />
        Remind{quantity || quantity == 0 ? ` (${quantity})` : ""}
      </button>
    </form>
  );
}

// Not actually a button, no action
// Button comes from AlertDialogTrigger in add-time-alert.tsx
// Action is triggered by AlertDialogAction in add-time-alert.tsx
export function AddTimeToDiscs({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center">
      <Hourglass className="w-5 mr-2" aria-hidden="true" />
      Add time{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}

export function DiscsPickedUp({
  ids,
  quantity,
}: {
  ids: string[];
  quantity?: number;
}) {
  const discsPickedUpWithIds = discsPickedUp.bind(null, ids);

  return (
    <form action={discsPickedUpWithIds}>
      <button type="submit" className="flex items-center">
        <Smile className="w-5 mr-2" aria-hidden="true" />
        Picked up{quantity || quantity == 0 ? ` (${quantity})` : ""}
      </button>
    </form>
  );
}

export function ArchiveDiscs({
  ids,
  quantity,
}: {
  ids: string[];
  quantity?: number;
}) {
  const archiveDiscsWithIds = archiveDiscs.bind(null, ids);

  return (
    <form action={archiveDiscsWithIds}>
      <button type="submit" className="flex items-center">
        <Archive className="w-5 mr-2" aria-hidden="true" />
        Archive{quantity || quantity == 0 ? ` (${quantity})` : ""}
      </button>
    </form>
  );
}

export function RestoreDiscs({
  ids,
  quantity,
}: {
  ids: string[];
  quantity?: number;
}) {
  const restoreDiscsWithIds = restoreDiscs.bind(null, ids);

  return (
    <form action={restoreDiscsWithIds}>
      <button type="submit" className="flex items-center">
        <History className="w-5 mr-2" aria-hidden="true" />
        Restore{quantity || quantity == 0 ? ` (${quantity})` : ""}
      </button>
    </form>
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

// Not actually a button, no action
// Button comes from AlertDialogTrigger in delete-alert.tsx
// Action is triggered by AlertDialogAction in delete-alert.tsx
export function DeleteDiscs({ quantity }: { quantity?: number }) {
  return (
    <div className="flex items-center text-red-500">
      <Trash2 className="w-5 mr-2" aria-hidden="true" />
      Delete{quantity || quantity == 0 ? ` (${quantity})` : ""}
    </div>
  );
}
