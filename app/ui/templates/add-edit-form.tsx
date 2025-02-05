"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/app/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";
import { PreviewDiscPopover } from "./preview-disc-popover";
import { useToast } from "@/app/hooks/use-toast";
import {
  createTemplate,
  updateTemplate,
  addEditState,
} from "@/app/lib/actions/templates";
import { splitTemplateContent, getTemplatePreview } from "@/app/lib/utils";
import { Disc, Template } from "@/app/lib/definitions";

type AddEditFormProps =
  | { mode: "add"; template?: undefined }
  | { mode: "edit"; template: Template };

export default function AddEditForm({ mode, template }: AddEditFormProps) {
  const initialState: addEditState = { formData: template };
  const addEditAction =
    mode === "add" ? createTemplate : updateTemplate.bind(null, template.id);
  const [state, formAction, pending] = useActionState(
    addEditAction,
    initialState
  );

  // For toasts
  const { toast } = useToast();
  useEffect(() => {
    if (state.toast) {
      toast({
        title: state.toast.title || "",
        description: state.toast.message || "",
      });
    }
  }, [state, toast]);

  // For managing template content
  const [content, setContent] = useState(
    state.formData?.content ? state.formData.content : ""
  );
  const [styledContent, setStyledContent] = useState<
    { substring: string; className: string }[]
  >([]);

  useEffect(() => {
    setStyledContent(splitTemplateContent(content));
  }, [content]);

  // For managing template preview
  const initialPreviewDisc: Disc = {
    id: "35074acb-9121-4e31-9277-4db3241e9999",
    user_id: "35074acb-9121-4e31-9277-4db3241ef591",
    name: "Paul",
    phone: "1111111111",
    color: "yellow",
    plastic: "Z",
    brand: "Discraft",
    mold: "Luna",
    location: "Shelf 1",
    notes: "Paul's favorite disc",
    notified: false,
    reminded: false,
    status: "awaiting pickup",
    held_until: undefined,
    created_at: new Date(),
    updated_at: new Date(),
    laf: "Haple Mill",
    notification_template: null,
    notification_text: "",
    reminder_template: null,
    reminder_text: "",
    extension_template: null,
    extension_text: "",
  };
  const [previewDisc, setPreviewDisc] = useState(initialPreviewDisc);
  const [preview, setPreview] = useState<
    { substring: string; className: string }[]
  >([]);

  useEffect(() => {
    setPreview(getTemplatePreview(content, previewDisc));
  }, [content, previewDisc]);

  // For adding template type to form data
  // This is a workaround that should be changed
  // after converting all inputs/forms to shadcn components
  const handleSelectChange = (value: string) => {
    if (!state.formData) state.formData = {};
    state.formData.type = value;
    if (state.errors?.type) delete state.errors.type;
  };

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Name
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Give your template a name"
                defaultValue={state.formData?.name}
                className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-2 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby={"name-error"}
              />
            </div>
            <div id="name-error" aria-live="polite" aria-atomic="true">
              {state.errors?.name &&
                state.errors?.name.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="type" className="mb-2 block text-sm font-medium">
            Type
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <Select
                defaultValue={state.formData?.type}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger
                  id="type"
                  name="type"
                  className="w-[180px] text-sm font-medium placeholder:text-gray-500 bg-background"
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="extension">Extension</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Hidden input for getting select value into form data
            Address this when converting all inputs/forms to shadcn components */}
            <input
              type="hidden"
              id="type"
              name="type"
              defaultValue={state.formData?.type}
            />
            <div id="type-error" aria-live="polite" aria-atomic="true">
              {state.errors?.type &&
                state.errors?.type.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="content" className="block text-sm font-medium">
              Content
            </label>
            <PreviewDiscPopover
              previewDiscState={[previewDisc, setPreviewDisc]}
            ></PreviewDiscPopover>
          </div>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <textarea
                id="content"
                name="content"
                placeholder="Use the terms $name, $color, $brand, $plastic, $mold, $laf, and $held_until to insert dynamic content"
                className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-2 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="content-error"
                rows={3}
                defaultValue={state.formData?.content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div id="content-error" aria-live="polite" aria-atomic="true">
              {state.errors?.content &&
                state.errors?.content.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
            <div className="relative mt-2 text-sm text-gray-500">
              <span className="text-black">Content: </span>
              {styledContent.map((part, index) => (
                <span key={index} className={part.className}>
                  {part.substring}
                </span>
              ))}
            </div>
            <div className="relative mt-2 text-sm text-gray-500">
              <span className="text-black">Preview: </span>
              {preview.map((part, index) => (
                <span key={index} className={part.className}>
                  {part.substring}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Hidden input to handle whether server action redirects or not */}
      <input type="hidden" id="addAnother" name="addAnother" value="false" />
      <div className="mt-4 flex justify-end gap-4">
        <Button variant="outline">
          <Link href="/dashboard/templates">Cancel</Link>
        </Button>
        <Button
          variant={mode === "add" ? "outline" : "default"}
          type="submit"
          disabled={pending}
        >
          Save {mode === "add" ? "and close" : "changes"}
        </Button>
        {mode === "add" && (
          <Button
            type="submit"
            onClick={() => {
              const addAnother = document.querySelector(
                'input[id="addAnother"]'
              ) as HTMLInputElement;
              addAnother.value = "true";
            }}
            disabled={pending}
          >
            Save and add another
          </Button>
        )}
      </div>
    </form>
  );
}
