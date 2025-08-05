"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
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
import { PreviewDiscPopover } from "@/app/ui/templates/preview-disc-popover";
import { useToast } from "@/app/hooks/use-toast";
import {
  addTemplate,
  AddTemplateState,
  editTemplate,
  EditTemplateState,
} from "@/data-access/templates";
import { splitTemplateContent, getTemplatePreview } from "@/app/lib/utils";
import { NotificationPreviewDisc } from "@/db/schema/discs";
import { SelectTemplate, DiscCount } from "@/db/schema/templates";
import { CreateTemplateSchema, UpdateTemplateSchema } from "@/db/validation";
import { UserSettings } from "@/db/schema/users";

const formDefaults = {
  name: "",
  type: undefined,
  content: "",
};

interface AddEditFormProps {
  template?: SelectTemplate; // Supply template and discCount if editing
  discCount?: DiscCount;
  templateNames: string[];
  userSettings: UserSettings;
}

export function AddEditForm({
  template,
  discCount,
  templateNames,
  userSettings,
}: AddEditFormProps) {
  // Set up the zod schema according to whether we're adding or editing
  const TemplateSchema =
    template && discCount ?
      UpdateTemplateSchema(template, discCount)
    : CreateTemplateSchema;
  // Extend the template schema to include name validation
  const TemplateClientSchema = TemplateSchema.refine(
    (data) => !templateNames.includes(data.name),
    {
      message: "A template with that name already exists",
      path: ["name"],
    }
  );

  // Set up form state and server action
  const initialAddState: AddTemplateState = {};
  const initialEditState: EditTemplateState = { formData: template };
  const [state, formAction, pending] = useActionState(
    // If template is supplied, it's being edited;
    // otherwise, a new template is being added
    template ? editTemplate.bind(null, template.id) : addTemplate,
    // Set intial state accordingly
    template ? initialEditState : initialAddState
  );

  // For client-side validation
  const form = useForm<z.infer<typeof TemplateClientSchema>>({
    resolver: zodResolver(TemplateClientSchema),
    mode: "onTouched",
    defaultValues: {
      ...formDefaults,
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

  // For server-side error messages
  useEffect(() => {
    form.reset(state.formData);
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof TemplateClientSchema>, {
          message: (value as string[])[0],
        });
      }
    }
  }, [state.errors, state.formData, form]);

  // For clearing the form after successful addition
  // Only relevant if the user is adding another template
  useEffect(() => {
    if (state.success) {
      form.reset(formDefaults);
    }
  }, [state, form]);

  // For managing template preview
  const initialPreviewDisc: NotificationPreviewDisc = {
    name: "Paul",
    color: "yellow",
    plastic: "Z",
    brand: "Discraft",
    mold: "Luna",
    heldUntil: null,
  };
  const [previewDisc, setPreviewDisc] = useState(initialPreviewDisc);

  const content = form.watch("content");
  const splitContent = splitTemplateContent(content);
  const preview = getTemplatePreview(content, previewDisc, userSettings);

  return (
    <Form {...form}>
      <form action={formAction}>
        <div className="bg-gray-50 p-4 mt-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <SelectItem value="initial">Initial</SelectItem>
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
                    <strong>$laf</strong>, and <strong>$heldUntil</strong> to
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
            variant={template ? "default" : "outline"}
            type="submit"
            onClick={() => {
              // Set the hidden input value to "false"
              // Only need this in case of an error
              // after pressing "Save and add another"
              form.setValue("addAnother", "false");
            }}
            disabled={pending}
          >
            Save {template ? "changes" : "and close"}
          </Button>
          {!template && (
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
