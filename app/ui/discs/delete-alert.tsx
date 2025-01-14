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
import { DeleteDiscs } from "./action-buttons";
import { deleteDiscs } from "@/app/lib/actions";
import { formatPhone } from "@/app/lib/utils";

export function DeleteAlert({
  discs,
  quantity,
}: {
  discs: Disc[];
  quantity?: number;
}) {
  const ids = discs.map((disc) => disc.id);
  const deleteDiscsWithIds = deleteDiscs.bind(null, ids);
  const deleteList = discs
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

  return (
    // Really not sure what's happening with styles here
    // Had to use asChild on the DropdownMenuItem parent,
    // otherwise the dialog would just flash on the screen
    // But that messed up the normal DropdownMenuItem styles
    // Temporary fix is wrap in a div with the standard DropdownMenuItem styles, plus hover:bg-muted
    <div className="hover:bg-muted relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0">
      <AlertDialog>
        <AlertDialogTrigger>
          <DeleteDiscs quantity={quantity} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="pt-2 pb-4">
                  This action will permanently delete the following disc
                  {discs.length > 1 ? "s" : ""}:
                </div>
                {deleteList.map((disc, index) => (
                  <span key={index}>
                    {" - "}
                    {disc}
                    <br />
                  </span>
                ))}
                <div className="font-black pt-4">
                  This action cannot be undone.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500"
              onClick={deleteDiscsWithIds}
            >
              Delete{quantity ? ` (${quantity})` : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
