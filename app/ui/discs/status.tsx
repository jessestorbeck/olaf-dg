import {
  ArchiveBoxIcon,
  CheckIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

export default function DiscStatus({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-1 text-xs",
        {
          "bg-gray-100 text-gray-500": status === "awaiting pickup",
          "bg-emerald-500 text-white": status === "picked up",
          "bg-red-500 text-white": status === "abandoned",
          "bg-gray-500 text-white": status === "removed",
        }
      )}
    >
      {status === "awaiting pickup" ?
        <>
          Awaiting Pickup
          <ClockIcon className="ml-1 w-4 text-gray-500" />
        </>
      : null}
      {status === "picked up" ?
        <>
          Picked Up
          <CheckIcon className="ml-1 w-4 text-white" />
        </>
      : null}
      {status === "abandoned" ?
        <>
          Abandoned
          <QuestionMarkCircleIcon className="ml-1 w-4 text-white" />
        </>
      : null}
      {status === "removed" ?
        <>
          Archived
          <ArchiveBoxIcon className="ml-1 w-4 text-white" />
        </>
      : null}
    </span>
  );
}
