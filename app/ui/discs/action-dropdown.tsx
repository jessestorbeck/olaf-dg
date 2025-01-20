"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/ui/dropdown-menu";
import { Button } from "@/app/ui/button";
import { Input } from "@/app/ui/input";
import {
  NotifyOwners,
  RemindOwners,
  AddTimeToDiscs,
  DiscsPickedUp,
  ArchiveDiscs,
  RestoreDiscs,
  ViewDisc,
  UpdateDisc,
  DeleteDiscs,
} from "./action-buttons";
import { AlertTable } from "./alert-table";
import { useToast } from "@/app/hooks/use-toast";
import {
  notifyOwners,
  remindOwners,
  discsPickedUp,
  addTimeToDiscs,
  archiveDiscs,
  restoreDiscs,
  deleteDiscs,
  ToastState,
} from "@/app/lib/actions";
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
  // Filter discs for each action
  const filteredDiscs = {
    // Only allow notifications for unnotified discs awaiting pickup
    toNotify: discs.filter(
      (disc) => !disc.notified && disc.status === "awaiting pickup"
    ),
    // Only allow reminders for notified, unreminded discs awaiting pickup
    toRemind: discs.filter(
      (disc) =>
        disc.notified && !disc.reminded && disc.status === "awaiting pickup"
    ),
    // Only allow time extension for discs awaiting pickup (includes abandoned discs)
    // and after the owner has been notified
    toAddTime: discs.filter(
      (disc) => disc.status === "awaiting pickup" && disc.notified
    ),
    // Only allow pick up of discs awaiting pickup
    toPickUp: discs.filter((disc) => disc.status === "awaiting pickup"),
    // Only allow archiving of discs that have passed their held-until date
    // and are not already archived
    toArchive: discs.filter(
      (disc) => dateHasPassed(disc.held_until) && disc.status !== "archived"
    ),
    // Only allow picked up or archived discs to be restored to "awaiting pickup"
    toRestore: discs.filter((disc) =>
      ["picked up", "archived"].includes(disc.status)
    ),
  };

  // For toasts after all actions
  const { toast } = useToast();
  const initialState: ToastState = { toast: { title: null, message: null } };
  const [state, setState] = useState(initialState);
  useEffect(() => {
    if (state.toast?.title !== null && state.toast?.message !== null) {
      toast({
        title: state.toast?.title,
        description: state.toast?.message,
      });
    }
  }, [state, toast]);

  // For both add-time and delete dialogs
  // `pending` will disable the dialog buttons while the action is being processed
  const [pending, setPending] = useState(false);

  // For adding time to discs
  const defaultDays = 7;
  const [addTimeDialogOpen, setAddTimeDialogOpen] = useState(false);
  const [days, setDays] = useState(defaultDays);
  const [errorMessage, setErrorMessage] = useState("");

  // For deleting discs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Action handlers
  const handleNotify = async () => {
    const idsToNotify = filteredDiscs.toNotify.map((disc) => disc.id);
    const notifyOwnersWithIds = notifyOwners.bind(null, idsToNotify);
    try {
      const result = await notifyOwnersWithIds();
      setState(result);
    } catch (error) {
      console.error("Failed to notify owners", error);
    }
  };
  const handleRemind = async () => {
    const idsToRemind = filteredDiscs.toRemind.map((disc) => disc.id);
    const remindOwnersWithIds = remindOwners.bind(null, idsToRemind);
    try {
      const result = await remindOwnersWithIds();
      setState(result);
    } catch (error) {
      console.error("Failed to remind owners", error);
    }
  };
  const handleAddTime = async () => {
    setPending(true);
    const idsToAddTime = filteredDiscs.toAddTime.map((disc) => disc.id);
    const addTimeToDiscsWithIds = addTimeToDiscs.bind(null, idsToAddTime, days);
    try {
      const result = await addTimeToDiscsWithIds();
      setState(result);
      setErrorMessage(result.errors?.formErrors[0] || "");
      // Close the dialog if there were no form errors
      if (!result.errors) {
        setAddTimeDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to add time to discs", error);
    } finally {
      setPending(false);
    }
  };
  const handlePickUp = async () => {
    const idsPickedUp = filteredDiscs.toPickUp.map((disc) => disc.id);
    const discsPickedUpWithIds = discsPickedUp.bind(null, idsPickedUp);
    try {
      const result = await discsPickedUpWithIds();
      setState(result);
    } catch (error) {
      console.error("Failed to pick up discs", error);
    }
  };
  const handleArchive = async () => {
    const idsToArchive = filteredDiscs.toArchive.map((disc) => disc.id);
    const archiveDiscsWithIds = archiveDiscs.bind(null, idsToArchive);
    try {
      const result = await archiveDiscsWithIds();
      setState(result);
    } catch (error) {
      console.error("Failed to archive discs", error);
    }
  };
  const handleRestore = async () => {
    const idsToRestore = filteredDiscs.toRestore.map((disc) => disc.id);
    const restoreDiscsWithIds = restoreDiscs.bind(null, idsToRestore);
    try {
      const result = await restoreDiscsWithIds();
      setState(result);
    } catch (error) {
      console.error("Failed to restore discs", error);
    }
  };
  const handleDelete = async () => {
    setPending(true);
    const idsToDelete = discs.map((disc) => disc.id);
    const deleteDiscsWithIds = deleteDiscs.bind(null, idsToDelete);
    try {
      const result = await deleteDiscsWithIds();
      setState(result);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete discs", error);
    } finally {
      setPending(false);
    }
  };
  const handleDialogAction = () => {
    if (addTimeDialogOpen) {
      handleAddTime();
    } else if (deleteDialogOpen) {
      handleDelete();
    }
  };
  const handleDialogCancel = () => {
    setErrorMessage("");
    setAddTimeDialogOpen(false);
    setDeleteDialogOpen(false);
  };

  return (
    // DropdownMenu needs to be wrapped in AlertDialog,
    // otherwise, the dialog will unmount when the corresponding button is clicked.
    // The effect then is that the dialog will flash on the screen and disappear.
    <AlertDialog
      open={addTimeDialogOpen || deleteDialogOpen}
      onOpenChange={
        addTimeDialogOpen ? setAddTimeDialogOpen : setDeleteDialogOpen
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={discs.length === 0}>
            <span className={clsx({ "sr-only": actionSet === "row" })}>
              {actionSet === "row" && "Actions"}
              {actionSet === "selected" &&
                `${discs.length} of ${totalDiscs} discs selected`}
            </span>
            <ChevronDown className={"h-5 w-5"} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleNotify}
            disabled={filteredDiscs.toNotify.length === 0}
          >
            <NotifyOwners
              quantity={
                actionSet === "selected" ?
                  filteredDiscs.toNotify.length
                : undefined
              }
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleRemind}
            disabled={filteredDiscs.toRemind.length === 0}
          >
            <RemindOwners
              quantity={
                actionSet === "selected" ?
                  filteredDiscs.toRemind.length
                : undefined
              }
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setAddTimeDialogOpen(true)}
            disabled={filteredDiscs.toAddTime.length === 0}
          >
            <AddTimeToDiscs
              quantity={
                actionSet === "selected" ?
                  filteredDiscs.toAddTime.length
                : undefined
              }
            />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handlePickUp}
            disabled={filteredDiscs.toPickUp.length === 0}
          >
            <DiscsPickedUp
              quantity={
                actionSet === "selected" ?
                  filteredDiscs.toPickUp.length
                : undefined
              }
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleArchive}
            disabled={filteredDiscs.toArchive.length === 0}
          >
            <ArchiveDiscs
              quantity={
                actionSet === "selected" ?
                  filteredDiscs.toArchive.length
                : undefined
              }
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleRestore}
            disabled={filteredDiscs.toRestore.length === 0}
          >
            <RestoreDiscs
              quantity={
                actionSet === "selected" ?
                  filteredDiscs.toRestore.length
                : undefined
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
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={discs.length === 0}
          >
            <DeleteDiscs
              quantity={actionSet === "selected" ? discs.length : undefined}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {addTimeDialogOpen && "How many days would you like to add?"}
            {deleteDialogOpen && "Are you sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {addTimeDialogOpen && (
                <div className="py-2">
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
              )}
              {addTimeDialogOpen &&
                `This action will add ${days || 0} day${days === 1 ? " " : "s "}
                to the following ${filteredDiscs.toAddTime.length}
                disc${filteredDiscs.toAddTime.length > 1 ? "s" : ""}:`}
              {deleteDialogOpen &&
                `This action will permanently delete the following
                ${discs.length} disc${discs.length > 1 ? "s" : ""}:`}
              {addTimeDialogOpen && (
                <AlertTable discs={filteredDiscs.toAddTime} />
              )}
              {deleteDialogOpen && <AlertTable discs={discs} />}
              {deleteDialogOpen && (
                <span className="font-bold">This action cannot be undone.</span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Not using AlertDialogCancel or AlertDialogAction,
          since they were messing with button variant styling */}
          <Button variant="outline" onClick={handleDialogCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleDialogAction}
            disabled={pending}
            variant={deleteDialogOpen ? "destructive" : "default"}
          >
            {addTimeDialogOpen && "Add time"}
            {deleteDialogOpen && "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
