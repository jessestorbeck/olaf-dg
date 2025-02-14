"use client";

import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { clsx } from "clsx";
import Link from "next/link";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";
import { Input } from "@/app/ui/input";
import { Textarea } from "@/app/ui/textarea";
import { Button } from "@/app/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { createDisc, updateDisc, addEditState } from "@/app/lib/actions/discs";
import { CreateDiscSchema, UpdateDiscSchema } from "@/app/lib/validation";
import { Disc, Template } from "@/app/lib/definitions";
import { getTemplatePreview } from "@/app/lib/utils";

type AddEditFormProps =
  | { mode: "add"; templates: Template[]; disc?: undefined }
  | { mode: "edit"; templates: Template[]; disc: Disc };

export default function AddEditForm({
  mode,
  templates,
  disc,
}: AddEditFormProps) {
  // Sort templates by type and default
  const notificationTemplates = templates
    .filter((template) => template.type === "notification")
    // sort by is_default first, then by name
    .sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        a.name.localeCompare(b.name)
    );
  const reminderTemplates = templates
    .filter((template) => template.type === "reminder")
    .sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        a.name.localeCompare(b.name)
    );
  const extensionTemplates = templates
    .filter((template) => template.type === "extension")
    .sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        a.name.localeCompare(b.name)
    );

  // Convenience function to get notification text
  // Could be refactored out to lib/utils if needed
  const getNotificationText = (
    templateID: string,
    templates: Template[],
    disc: Disc
  ) => {
    const notificationTemplate = templates.find(
      (template) => template.id === templateID
    );
    const notificationTemplateContent = notificationTemplate?.content ?? "";
    const notificationText = getTemplatePreview(
      notificationTemplateContent,
      disc
    )
      .map((templateSpan) => templateSpan.substring)
      .join("");
    return notificationText;
  };

  // Set up form state and server action
  const initialState: addEditState = { formData: disc };
  const addEditAction =
    mode === "add" ? createDisc : updateDisc.bind(null, disc.id);
  const [state, formAction, pending] = useActionState(
    addEditAction,
    initialState
  );

  // For client-side validation
  const FormSchema = mode === "add" ? CreateDiscSchema : UpdateDiscSchema;
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      phone: "",
      color: "",
      brand: "",
      plastic: "",
      mold: "",
      location: "",
      notes: "",
      // Set default values for notification templates
      // If disc is being edited and doesn't have a template,
      // set the default to "custom"
      notification_template: notificationTemplates[0].id,
      reminder_template: reminderTemplates[0].id,
      extension_template: extensionTemplates[0].id,
      // Set default values for notification text fields
      notification_text: getNotificationText(
        notificationTemplates[0].id,
        templates,
        disc ?? ({ id: "", user_id: "", phone: "" } as Disc)
      ),
      reminder_text: getNotificationText(
        reminderTemplates[0].id,
        templates,
        disc ?? ({ id: "", user_id: "", phone: "" } as Disc)
      ),
      extension_text: getNotificationText(
        extensionTemplates[0].id,
        templates,
        disc ?? ({ id: "", user_id: "", phone: "" } as Disc)
      ),
      // Override default values with disc values if editing
      // or after an error during adding
      ...state.formData,
      // Have to set a value here to avoid controlled input error
      addAnother: "false",
    },
  });

  // Disc for notification previews
  const previewDisc: Disc = {
    // Dummy values to satisfy Disc type
    // Need these when adding discs
    // But, regardless, not actually used for previews
    id: "",
    user_id: "",
    phone: "",
    notified: false,
    reminded: false,
    status: "awaiting pickup",
    created_at: new Date(),
    updated_at: new Date(),
    notification_text: "",
    reminder_text: "",
    extension_text: "",
    // Need these for previews,
    // and won't be set for new discs
    laf: "Haple Mill",
    held_until: new Date(),
    // Values from form state
    ...state.formData,
    // Override with form values
    name: form.watch("name"),
    color: form.watch("color"),
    brand: form.watch("brand"),
    plastic: form.watch("plastic"),
    mold: form.watch("mold"),
    location: form.watch("location"),
    notification_template: form.watch("notification_template"),
    reminder_template: form.watch("reminder_template"),
    extension_template: form.watch("extension_template"),
  };

  // onChange handler for fields needed for previews
  const handleChange = () => {
    interface notificationField {
      template: keyof z.infer<typeof FormSchema>;
      text: keyof z.infer<typeof FormSchema>;
      skip?: boolean;
    }
    const notificationFields: notificationField[] = [
      {
        template: "notification_template",
        text: "notification_text",
        skip:
          disc?.notified ||
          ["picked_up", "archived"].includes(disc?.status ?? ""),
      },
      {
        template: "reminder_template",
        text: "reminder_text",
        skip:
          disc?.reminded ||
          ["picked_up", "archived"].includes(disc?.status ?? ""),
      },
      {
        template: "extension_template",
        text: "extension_text",
        skip: ["picked_up", "archived"].includes(disc?.status ?? ""),
      },
    ];

    notificationFields.forEach((field) => {
      // Skip a field if it's disabled in the form
      if (field.skip) return;
      const templateID = form.getValues(field.template);
      if (templateID && templateID !== "custom") {
        const notificationText = getNotificationText(
          templateID,
          templates,
          previewDisc
        );
        form.setValue(field.text, notificationText);
      }
    });
  };

  // For all toasts except successful "save and close", which is handled in DataTable
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
        form.setError(key as keyof z.infer<typeof FormSchema>, {
          message: value[0],
        });
      }
    }
  }, [state.errors, form]);

  return (
    <Form {...form}>
      <form action={formAction}>
        {/* Owner details */}
        <div className="bg-gray-50 p-4 mt-4 rounded-lg">
          <span className="font-semibold">Owner</span>
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Calvin"
                      className="bg-background"
                      onKeyUp={handleChange}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"Phone (required)"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="555-555-5555"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {/* Disc details */}
        <div className="bg-gray-50 p-4 mt-4 rounded-lg">
          <span className="font-semibold">Disc</span>
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Blue"
                      className="bg-background"
                      onKeyUp={handleChange}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Innova"
                      className="bg-background"
                      onKeyUp={handleChange}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plastic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plastic</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Halo Star"
                      className="bg-background"
                      onKeyUp={handleChange}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mold</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Destroyer"
                      className="bg-background"
                      onKeyUp={handleChange}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        {/* Notification details */}
        <div className="bg-gray-50 p-4 mt-4 rounded-lg">
          <span className="font-semibold">Notifications</span>
          <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              {/* Select notification template */}
              <FormField
                control={form.control}
                name="notification_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification template</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        field.onChange(e);
                        // Set notification text with the selected template,
                        // unless it's a custom template (in which case, do nothing)
                        if (e !== "custom") {
                          const notificationText = getNotificationText(
                            e,
                            templates,
                            previewDisc
                          );
                          form.setValue("notification_text", notificationText);
                        }
                      }}
                      {...field}
                    >
                      <FormControl>
                        <SelectTrigger
                          // Disable if disc is already notified or status is archived or picked up
                          disabled={
                            disc?.notified ||
                            ["archived", "picked_up"].includes(
                              disc?.status ?? ""
                            )
                          }
                          className="bg-background"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={"custom"}>Custom</SelectItem>
                          {notificationTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Notification text */}
              <FormField
                control={form.control}
                name="notification_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification text</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        // readOnly if disc is already notified or status is archived or picked up
                        // Have to use readOnly instead of disabled,
                        // since disabling will make the form values undefined
                        readOnly={
                          disc?.notified ||
                          ["archived", "picked_up"].includes(disc?.status ?? "")
                        }
                        // cursor-not-allowed if readOnly
                        className={clsx("bg-background", {
                          "cursor-not-allowed":
                            disc?.notified ||
                            ["archived", "picked_up"].includes(
                              disc?.status ?? ""
                            ),
                        })}
                        // Set to "custom" if user types in the field
                        onKeyUp={() =>
                          form.setValue("notification_template", "custom")
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              {/* Select reminder template */}
              <FormField
                control={form.control}
                name="reminder_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder template</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        field.onChange(e);
                        if (e !== "custom") {
                          const reminderText = getNotificationText(
                            e,
                            templates,
                            previewDisc
                          );
                          form.setValue("reminder_text", reminderText);
                        }
                      }}
                      {...field}
                    >
                      <FormControl>
                        <SelectTrigger
                          // Disable if disc is already reminded or status is archived or picked up
                          disabled={
                            disc?.reminded ||
                            ["archived", "picked_up"].includes(
                              disc?.status ?? ""
                            )
                          }
                          className="bg-background"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={"custom"}>Custom</SelectItem>
                          {reminderTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Reminder text */}
              <FormField
                control={form.control}
                name="reminder_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder text</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        // readOnly if disc is already reminded or status is archived or picked up
                        readOnly={
                          disc?.reminded ||
                          ["archived", "picked_up"].includes(disc?.status ?? "")
                        }
                        // cursor-not-allowed if readOnly
                        className={clsx("bg-background", {
                          "cursor-not-allowed":
                            disc?.reminded ||
                            ["archived", "picked_up"].includes(
                              disc?.status ?? ""
                            ),
                        })}
                        // Set to custom if user types in the field
                        onKeyUp={() =>
                          form.setValue("reminder_template", "custom")
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              {/* Select extension template */}
              <FormField
                control={form.control}
                name="extension_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extension template</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        field.onChange(e);
                        if (e !== "custom") {
                          const extensionText = getNotificationText(
                            e,
                            templates,
                            previewDisc
                          );
                          form.setValue("extension_text", extensionText);
                        }
                      }}
                      {...field}
                    >
                      <FormControl>
                        <SelectTrigger
                          // Disable if disc status is archived or picked up
                          disabled={["archived", "picked_up"].includes(
                            disc?.status ?? ""
                          )}
                          className="bg-background"
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={"custom"}>Custom</SelectItem>
                          {extensionTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Extension text */}
              <FormField
                control={form.control}
                name="extension_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extension text</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        // readOnly if disc status is archived or picked up
                        readOnly={["archived", "picked_up"].includes(
                          disc?.status ?? ""
                        )}
                        // cursor-not-allowed if readOnly
                        className={clsx("bg-background", {
                          "cursor-not-allowed": [
                            "archived",
                            "picked_up",
                          ].includes(disc?.status ?? ""),
                        })}
                        // Set to custom if user types in the field
                        onKeyUp={() =>
                          form.setValue("extension_template", "custom")
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        {/* Internal lost-and-found details */}
        <div className="bg-gray-50 p-4 mt-4 rounded-lg">
          <span className="font-semibold">Internal</span>
          <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Shelf 3"
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Found in pond"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline">
            <Link href="/dashboard/discs">Cancel</Link>
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
