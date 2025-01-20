"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";

import { Button } from "@/app/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { updateDisc, State } from "@/app/lib/actions";
import { fields } from "./fields";
import { Disc } from "@/app/lib/definitions";

export default function EditForm({ disc }: { disc: Disc }) {
  const initialState: State = { message: null, formData: disc };
  const updateDiscWithId = updateDisc.bind(null, disc.id);
  const [state, formAction, pending] = useActionState(
    updateDiscWithId,
    initialState
  );

  const { toast } = useToast();
  useEffect(() => {
    if (state.message !== null) {
      toast({
        title: state.errors ? "Something went wrong!" : "Disc updated!",
        description: state.message,
      });
    }
  }, [state, toast]);

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
                      defaultValue={
                        state.formData?.[
                          field.id as keyof typeof state.formData
                        ]
                      }
                      className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-2 text-sm outline-2 placeholder:text-gray-500"
                      aria-describedby={`${field.id}-error`}
                      rows={2}
                    />
                  : <input
                      id={field.id}
                      name={field.id}
                      type="text"
                      placeholder={field.placeholder}
                      defaultValue={
                        state.formData?.[
                          field.id as keyof typeof state.formData
                        ]
                      }
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
                  {state.errors?.[field.id as keyof typeof state.errors] &&
                    state.errors[field.id as keyof typeof state.errors]?.map(
                      (error: string) => (
                        <p className="mt-2 text-sm text-red-500" key={error}>
                          {error}
                        </p>
                      )
                    )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Hidden input to handle whether server action redirects or not */}
      <input type="hidden" id="addAnother" name="addAnother" value="false" />
      <div className="mt-4 flex justify-end gap-4">
        <Button variant="outline">
          <Link href="/dashboard/discs">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          Save
        </Button>
      </div>
    </form>
  );
}
