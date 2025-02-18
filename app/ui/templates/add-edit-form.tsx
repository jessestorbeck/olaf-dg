"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";
import { Input } from "@/app/ui/input";
import { Textarea } from "@/app/ui/textarea";
import { Button } from "@/app/ui/button";
import { Label } from "@/app/ui/label";
import { PreviewDiscPopover } from "./preview-disc-popover";
import { useToast } from "@/app/hooks/use-toast";
import {
  createTemplate,
  updateTemplate,
  addEditState,
} from "@/app/lib/actions/templates";
import { AddEditTemplateSchema } from "@/app/lib/validation";
import { splitTemplateContent, getTemplatePreview } from "@/app/lib/utils";
import { Disc, Template } from "@/app/lib/definitions";

type AddEditFormProps =
  | { mode: "add"; templateNames: string[]; template?: undefined }
  | { mode: "edit"; templateNames: string[]; template: Template };

export default function AddEditForm({
  mode,
  templateNames,
  template,
}: AddEditFormProps) {
  // Extend the template schema to include name validation
  const TemplateClientSchema = AddEditTemplateSchema.extend({
    name: AddEditTemplateSchema.shape.name
      // Just for client-side (same check done via query on the server)
      .refine((name) => !templateNames.includes(name), {
        message: "A template with that name already exists",
      }),
  });

  const initialState: addEditState = { formData: template };
  const addEditAction =
    mode === "add" ? createTemplate : updateTemplate.bind(null, template.id);
  const [state, formAction, pending] = useActionState(
    addEditAction,
    initialState
  );

  // For client-side validation
  const form = useForm<z.infer<typeof TemplateClientSchema>>({
    resolver: zodResolver(TemplateClientSchema),
    defaultValues: {
      name: "",
      type: undefined,
      content: "",
      // Override with template values if editing
      ...template,
      // Have to set a value here to avoid controlled input error
      addAnother: "false",
    },
  });

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

  // For form field error messages
  useEffect(() => {
    form.clearErrors();
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof AddEditTemplateSchema>, {
          // Display errors on separate lines
          message: value[0],
        });
      }
    }
  }, [state.errors, form]);

  // For managing template preview
  const initialPreviewDisc: Disc = {
    name: "Paul",
    color: "yellow",
    plastic: "Z",
    brand: "Discraft",
    mold: "Luna",
    laf: "Haple Mill",
    // The rest of these don't matter
    // Just placeholders to satisfy Disc type
    id: "",
    user_id: "",
    phone: "",
    notes: "",
    location: "",
    notified: false,
    reminded: false,
    status: "awaiting pickup",
    held_until: null,
    created_at: new Date(),
    updated_at: new Date(),
    notification_text: "",
    reminder_text: "",
    extension_text: "",
  };
  const [previewDisc, setPreviewDisc] = useState(initialPreviewDisc);

  const content = form.watch("content");
  const splitContent = splitTemplateContent(content);
  const preview = getTemplatePreview(content, previewDisc);

  return (
    <Form {...form}>
      <form action={formAction}>
        <div className="bg-gray-50 p-4 mt-4 rounded-lg">
          <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Give your template a name"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} {...field}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="extension">Extension</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <Label>Preview disc</Label>
              <div className="mt-2">
                <PreviewDiscPopover
                  previewDiscState={[previewDisc, setPreviewDisc]}
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea rows={3} className="bg-background" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use the terms <strong>$name</strong>,{" "}
                    <strong>$color</strong>, <strong>$brand</strong>,{" "}
                    <strong>$plastic</strong>, <strong>$mold</strong>,{" "}
                    <strong>$laf</strong>, and <strong>$held_until</strong> to
                    insert dynamic content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mt-4">
            <Label>Template preview</Label>
            <div className="text-sm cursor-not-allowed min-h-[75px] rounded-lg border bg-background mt-2 p-3">
              {splitContent.map((templateSpan, index) => (
                <span key={index} className={templateSpan.className}>
                  {templateSpan.substring}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <Label>Text preview</Label>
            <div className="text-sm cursor-not-allowed min-h-[75px] rounded-lg border bg-background mt-2 p-3">
              {preview.map((templateSpan, index) => (
                <span key={index} className={templateSpan.className}>
                  {templateSpan.substring}
                </span>
              ))}
            </div>
          </div>
          {/* Hidden input to handle whether server action redirects or not */}
          <FormField
            control={form.control}
            name="addAnother"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input type="hidden" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <div className="mt-4 flex flex-col md:flex-row justify-end gap-2">
          <Button variant="outline">
            <Link href="/dashboard/templates">Cancel</Link>
          </Button>
          <Button
            variant={mode === "add" ? "outline" : "default"}
            type="submit"
            onClick={() => {
              // Set the hidden input value to "false"
              // Only need this in case of an error
              // after pressing "Save and add another"
              form.setValue("addAnother", "false");
            }}
            disabled={pending}
          >
            Save {mode === "add" ? "and close" : "changes"}
          </Button>
          {mode === "add" && (
            <Button
              type="submit"
              onClick={() => {
                // Set the hidden input value to "true"
                form.setValue("addAnother", "true");
              }}
              disabled={pending}
            >
              Save and add another
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
