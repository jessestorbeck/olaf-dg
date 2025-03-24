"use client";

import { useState, useEffect } from "react";
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
import { ChevronDown } from "@/app/ui/icons";
import {
  MakeTemplateDefault,
  ViewTemplate,
  EditTemplate,
  DeleteTemplates,
  GoToDiscs,
} from "./action-buttons";
import { AlertTable } from "./alert-table";
import { useToast } from "@/app/hooks/use-toast";
import { makeDefault, deleteTemplates } from "@/data-access/templates";
import { ToastState } from "@/app/ui/toast";
import { DiscCount, SelectTemplate } from "@/db/schema/templates";

export function ActionDropdown({
  templates,
  totalTemplates,
  actionSet,
  discCounts,
}: {
  templates: SelectTemplate[];
  totalTemplates?: number;
  actionSet: "row" | "selected";
  discCounts: DiscCount[];
}) {
  // Defaut templates can't be deleted
  const templatesToDelete = templates
    // Don't allow default templates to be deleted
    .filter((template) => !template.isDefault)
    // Add the discCountUnused property from disCounts to each template
    .map((template) => {
      const discCount = discCounts.find(
        (discCount) => discCount.id === template.id
      );
      return {
        ...template,
        discCountUnused: discCount?.discCountUnused,
      };
    });
  // Are there any discs affected by the deletion of these templates?
  const affectedDiscs = templatesToDelete.some(
    (el) => (el.discCountUnused || 0) > 0
  );
  const idsToDelete = templatesToDelete.map((template) => template.id);

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

  // For delete dialog
  // `pending` will disable the dialog buttons while the action is being processed
  const [pending, setPending] = useState(false);

  // For deleting templates
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Action handlers
  const handleMakeDefault = async () => {
    const idToMakeDefault = templates[0].id;
    const makeDefaultWithId = makeDefault.bind(null, idToMakeDefault);
    try {
      const result = await makeDefaultWithId();
      setState(result);
    } catch (error) {
      console.error("Failed to make template default:", error);
    }
  };
  const handleDelete = async () => {
    setPending(true);
    const deleteTemplatesWithIds = deleteTemplates.bind(null, idsToDelete);
    try {
      const result = await deleteTemplatesWithIds();
      setState(result);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete templates:", error);
    } finally {
      setPending(false);
    }
  };

  return (
    // DropdownMenu needs to be wrapped in AlertDialog,
    // otherwise, the dialog will unmount when the corresponding button is clicked.
    // The effect then is that the dialog will flash on the screen and disappear.
    <AlertDialog open={deleteDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={templates.length === 0}>
            <span className={clsx({ "sr-only": actionSet === "row" })}>
              {actionSet === "row" && "Actions"}
              {actionSet === "selected" &&
                `${templates.length} of ${totalTemplates} templates selected`}
            </span>
            <ChevronDown className={"h-5 w-5"} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actionSet === "row" && (
            <div>
              <DropdownMenuItem
                onClick={handleMakeDefault}
                disabled={templates[0].isDefault}
              >
                <MakeTemplateDefault />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <GoToDiscs
                  id={templates[0].id}
                  templateType={templates[0].type}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <ViewTemplate id={templates[0].id} />
              </DropdownMenuItem>
              <DropdownMenuItem>
                <EditTemplate id={templates[0].id} />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
          )}
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={templatesToDelete.length === 0}
          >
            <DeleteTemplates
              quantity={
                actionSet === "selected" ? templatesToDelete.length : undefined
              }
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              This action will permanently delete the following{" "}
              {templatesToDelete.length} template
              {templatesToDelete.length > 1 ? "s" : ""}:
              <AlertTable templates={templatesToDelete} />
              {affectedDiscs && (
                <p className="mb-4">
                  At least one of these templates is assigned to a disc awaiting
                  pickup and may be used for future notifications. If you delete
                  it, the affected discs will be reassigned to the appropriate
                  default template. You can view the affected discs by clicking
                  on the numbers in the table.
                </p>
              )}
              <span className="font-bold">This action cannot be undone.</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Not using AlertDialogCancel or AlertDialogAction,
          since they were messing with button variant styling */}
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={pending}
            variant="destructive"
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
