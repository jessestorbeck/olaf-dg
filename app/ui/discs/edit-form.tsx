"use client";

import { Disc } from "@/app/lib/definitions";
import Link from "next/link";
import { Button } from "@/app/ui/button";
import { updateDisc, State } from "@/app/lib/actions";
import { useActionState } from "react";
import { fields } from "./fields";

export default function EditForm({ disc }: { disc: Disc }) {
  const initialState: State = { message: null, errors: {} };
  const updateDiscWithId = updateDisc.bind(null, disc.id);
  const [state, formAction, pending] = useActionState(
    updateDiscWithId,
    initialState
  );

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {fields.map((field) => (
          <div key={field.id + "-wrapper"}>
            <div key={field.id} className="mb-4">
              <label
                htmlFor={field.id}
                className="mb-2 block text-sm font-medium"
              >
                {field.label}
              </label>
              <div className="relative mt-2 rounded-md">
                <div className="relative">
                  {field.id === "notes" ?
                    <textarea
                      id={field.id}
                      name={field.id}
                      placeholder={field.placeholder}
                      className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-2 text-sm outline-2 placeholder:text-gray-500"
                      rows={2}
                      defaultValue={disc[field.id]}
                      aria-describedby={`${field.id}-error`}
                    />
                  : <input
                      id={field.id}
                      name={field.id}
                      type="text"
                      placeholder={field.placeholder}
                      defaultValue={disc[field.id]}
                      className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-2 text-sm outline-2 placeholder:text-gray-500"
                      aria-describedby={`${field.id}-error`}
                    />
                  }
                </div>
                <div
                  id={`${field.id}-error`}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {state.errors?.[field.id] &&
                    state.errors[field.id].map((error: string) => (
                      <p className="mt-2 text-sm text-red-500" key={error}>
                        {error}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/discs"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          Edit Disc
        </Button>
      </div>
    </form>
  );
}
