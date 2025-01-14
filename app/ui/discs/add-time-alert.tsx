"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/ui/alert-dialog";
import { Disc } from "@/app/lib/definitions";
import { AddTimeToDiscs } from "./action-buttons";
import { Input } from "@/app/ui/input";
import { addTimeToDiscs } from "@/app/lib/actions";
import { formatPhone } from "@/app/lib/utils";

export function AddTimeAlert({
  discs,
  quantity,
}: {
  discs: Disc[];
  quantity?: number;
}) {
  const defaultDays = 7;
  const [days, setDays] = useState(defaultDays);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const ids = discs.map((disc) => disc.id);
  const addTimeList = discs
    .map((disc) =>
      [
        disc.color,
        disc.brand,
        disc.plastic,
        disc.mold.concat(" | "),
        disc.name,
        formatPhone(disc.phone),
      ]
        .filter(Boolean)
        .join(" ")
    )
    .filter((disc, index) => index < 5)
    .concat(discs.length > 5 ? `[...and ${discs.length - 5} more discs]` : []);

  const handleAddTime = async (e: React.MouseEvent) => {
    e.preventDefault();
    setPending(true);
    const addTimeToDiscsWithIds = addTimeToDiscs.bind(null, ids, days);
    try {
      const result = await addTimeToDiscsWithIds();
      setErrorMessage(result.errors?.days || "");
      if (!result.errors) {
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to add time to discs", error);
    } finally {
      setPending(false);
    }
  };

  return (
    // Really not sure what's happening with styles here.
    // Had to use asChild on the DropdownMenuItem parent,
    // otherwise the dialog would just flash on the screen.
    // But that messed up the normal DropdownMenuItem styles.
    // Temporary fix is wrap in a div with the standard DropdownMenuItem styles,
    // plus hover:bg-muted
    <div className="hover:bg-muted relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger>
          <AddTimeToDiscs quantity={quantity} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              How many days would you like to add?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="pt-2 pb-4">
                  <Input
                    type="number"
                    className="w-14"
                    min="1"
                    required
                    value={days || ""}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                  />
                  {errorMessage && (
                    <span className="text-sm text-red-500">{errorMessage}</span>
                  )}
                </div>
                <div>
                  This action will add {days || 0} day
                  {days === 1 ? " " : "s "}
                  to the following disc
                  {discs.length > 1 ? "s" : ""}:
                </div>
                <div className="py-2">
                  {addTimeList.map((disc, index) => (
                    <span key={index}>
                      {" - "}
                      {disc}
                      <br />
                    </span>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setErrorMessage("")}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAddTime} disabled={pending}>
              Add time
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
