import { ChevronDown } from "lucide-react";
import clsx from "clsx";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/ui/dropdown-menu";
import { Button } from "@/app/ui/button";
import {
  NotifyOwners,
  RemindOwners,
  DiscsPickedUp,
  ArchiveDiscs,
  RestoreDiscs,
  ViewDisc,
  UpdateDisc,
} from "./action-buttons";
import { AddTimeAlert } from "./add-time-alert";
import { DeleteAlert } from "./delete-alert";
import { dateHasPassed } from "@/app/lib/utils";
import { Disc } from "@/app/lib/definitions";

export function ActionDropdown({
  discs,
  totalDiscs,
  actionSet,
}: {
  discs: Disc[];
  totalDiscs?: number;
  actionSet: "row" | "selected";
}) {
  const idsToNotify = discs
    // Only allow notifications for unnotified discs awaiting pickup
    .filter((disc) => !disc.notified && disc.status === "awaiting pickup")
    .map((disc) => disc.id);
  const idsToRemind = discs
    // Only allow reminders for notified, unreminded discs awaiting pickup
    .filter(
      (disc) =>
        disc.notified && !disc.reminded && disc.status === "awaiting pickup"
    )
    .map((disc) => disc.id);
  // Only allow time extension for discs awaiting pickup (includes abandoned discs)
  // and after the owner has been notified
  // No map here, since we want to pass complete disc objects to the dialog
  const discsToAddTime = discs.filter(
    (disc) => disc.status === "awaiting pickup" && disc.notified
  );
  const idsPickedUp = discs
    // Only allow pick up of discs awaiting pickup
    .filter((disc) => disc.status === "awaiting pickup")
    .map((disc) => disc.id);
  const idsToArchive = discs
    // Only allow archiving of discs that have passed their held-until date
    // and are not already archived
    .filter(
      (disc) => dateHasPassed(disc.held_until) && disc.status !== "archived"
    )
    .map((disc) => disc.id);
  const idsToRestore = discs
    // Only allow picked up or archived discs to be restored to "awaiting pickup"
    .filter((disc) => ["picked up", "archived"].includes(disc.status))
    .map((disc) => disc.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <span className={clsx({ "sr-only": actionSet === "row" })}>
            {actionSet === "row" && "Actions"}
            {actionSet === "selected" &&
              `${discs.length} of ${totalDiscs} discs selected`}
          </span>
          <ChevronDown className="h-5 w-5 ml-1" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={idsToNotify.length === 0}>
          <NotifyOwners
            ids={idsToNotify}
            quantity={actionSet === "selected" ? idsToNotify.length : undefined}
          />
        </DropdownMenuItem>
        <DropdownMenuItem disabled={idsToRemind.length === 0}>
          <RemindOwners
            ids={idsToRemind}
            quantity={actionSet === "selected" ? idsToRemind.length : undefined}
          />
        </DropdownMenuItem>
        <DropdownMenuItem disabled={discsToAddTime.length === 0} asChild>
          <AddTimeAlert
            discs={discsToAddTime}
            quantity={
              actionSet === "selected" ? discsToAddTime.length : undefined
            }
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={idsPickedUp.length === 0}>
          <DiscsPickedUp
            ids={idsPickedUp}
            quantity={actionSet === "selected" ? idsPickedUp.length : undefined}
          />
        </DropdownMenuItem>
        <DropdownMenuItem disabled={idsToArchive.length === 0}>
          <ArchiveDiscs
            ids={idsToArchive}
            quantity={
              actionSet === "selected" ? idsToArchive.length : undefined
            }
          />
        </DropdownMenuItem>
        <DropdownMenuItem disabled={idsToRestore.length === 0}>
          <RestoreDiscs
            ids={idsToRestore}
            quantity={
              actionSet === "selected" ? idsToRestore.length : undefined
            }
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {actionSet === "row" && (
          <div>
            <DropdownMenuItem>
              <ViewDisc id={discs[0].id} />
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UpdateDisc id={discs[0].id} />
            </DropdownMenuItem>
          </div>
        )}
        <DropdownMenuItem asChild>
          <DeleteAlert
            discs={discs}
            quantity={actionSet === "selected" ? discs.length : undefined}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
