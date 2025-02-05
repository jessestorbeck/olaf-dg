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
import {
  MakeTemplateDefault,
  ViewTemplate,
  EditTemplate,
  DeleteTemplates,
} from "./action-buttons";
import { AlertTable } from "./alert-table";
import { useToast } from "@/app/hooks/use-toast";
import { makeDefault, deleteTemplates } from "@/app/lib/actions/templates";
import { ToastState } from "@/app/lib/definitions";
import { Template } from "@/app/lib/definitions";

export function ActionDropdown({
  templates,
  totalTemplates,
  actionSet,
}: {
  templates: Template[];
  totalTemplates?: number;
  actionSet: "row" | "selected";
}) {
  // Defaut templates can't be deleted
  const templatesToDelete = templates.filter(
    (template) => !template.is_default
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
                disabled={templates[0].is_default}
              >
                <MakeTemplateDefault />
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
