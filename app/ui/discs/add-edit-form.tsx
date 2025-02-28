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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/select";
import { Input } from "@/app/ui/input";
import { Textarea } from "@/app/ui/textarea";
import { Button } from "@/app/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import {
  addDisc,
  AddDiscState,
  editDisc,
  EditDiscState,
} from "@/data-access/discs";
import { CreateDiscSchema, UpdateDiscSchema } from "@/db/validation";
import {
  SelectTemplate,
  SelectDisc,
  NotificationPreviewDisc,
} from "@/db/schema";
import { getTemplatePreview } from "@/app/lib/utils";

export default function AddEditForm({
  disc, // Supply disc if editing
  templates,
}: {
  disc?: SelectDisc;
  templates: SelectTemplate[];
}) {
  // Sort templates by type and default
  const notificationTemplates = templates
    .filter((template) => template.type === "notification")
    // sort by isDefault first, then by name
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        a.name.localeCompare(b.name)
    );
  const reminderTemplates = templates
    .filter((template) => template.type === "reminder")
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        a.name.localeCompare(b.name)
    );
  const extensionTemplates = templates
    .filter((template) => template.type === "extension")
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) ||
        a.name.localeCompare(b.name)
    );

  // Convenience function to get notification text
  // Could be refactored out to lib/utils if needed
  const getNotificationText = (
    templateID: string,
    templates: SelectTemplate[],
    disc: NotificationPreviewDisc
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
  const initialAddState: AddDiscState = { formData: {} };
  const initialEditState: EditDiscState = { formData: disc };
  const [state, formAction, pending] = useActionState(
    // If disc is supplied, it's being edited;
    // otherwise, a new disc is being added
    disc ? editDisc.bind(null, disc.id) : addDisc,
    // Set intial state accordingly
    disc ? initialEditState : initialAddState
  );

  // For client-side validation
  const DiscSchema = disc ? UpdateDiscSchema : CreateDiscSchema;
  const form = useForm<z.infer<typeof DiscSchema>>({
    resolver: zodResolver(DiscSchema),
    mode: "onTouched",
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
      notificationTemplate: notificationTemplates[0].id,
      reminderTemplate: reminderTemplates[0].id,
      extensionTemplate: extensionTemplates[0].id,
      // Set default values for notification text fields
      notificationText: getNotificationText(
        notificationTemplates[0].id,
        templates,
        disc ?? {
          name: "",
          color: "",
          brand: "",
          plastic: "",
          mold: "",
          laf: "",
          heldUntil: new Date(),
        }
      ),
      reminderText: getNotificationText(
        reminderTemplates[0].id,
        templates,
        disc ?? {
          name: "",
          color: "",
          brand: "",
          plastic: "",
          mold: "",
          laf: "",
          heldUntil: new Date(),
        }
      ),
      extensionText: getNotificationText(
        extensionTemplates[0].id,
        templates,
        disc ?? {
          name: "",
          color: "",
          brand: "",
          plastic: "",
          mold: "",
          laf: "",
          heldUntil: new Date(),
        }
      ),
      // Override with disc values if editing
      ...disc,
      // Have to set a value here to avoid controlled input error
      addAnother: "false",
    },
  });

  // Disc for notification previews
  const previewDisc: NotificationPreviewDisc = {
    name: form.watch("name"),
    color: form.watch("color"),
    brand: form.watch("brand"),
    plastic: form.watch("plastic"),
    mold: form.watch("mold"),
    laf: disc?.laf || "Haple Mill",
    heldUntil: disc?.heldUntil || new Date(),
  };

  // onChange handler for fields needed for previews
  const handleChange = () => {
    interface notificationField {
      template: keyof z.infer<typeof DiscSchema>;
      text: keyof z.infer<typeof DiscSchema>;
      skip?: boolean;
    }
    const notificationFields: notificationField[] = [
      {
        template: "notificationTemplate",
        text: "notificationText",
        skip:
          disc?.notified ||
          ["picked_up", "archived"].includes(disc?.status ?? ""),
      },
      {
        template: "reminderTemplate",
        text: "reminderText",
        skip:
          disc?.reminded ||
          ["picked_up", "archived"].includes(disc?.status ?? ""),
      },
      {
        template: "extensionTemplate",
        text: "extensionText",
        skip: ["picked_up", "archived"].includes(disc?.status ?? ""),
      },
    ];

    notificationFields.forEach((field) => {
      // Skip a field if it's disabled in the form
      if (field.skip) return;
      const templateID = form.getValues(field.template);
      if (
        templateID &&
        typeof templateID === "string" &&
        templateID !== "custom"
      ) {
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

  // For server-side error messages
  // and form reset on successful submission
  useEffect(() => {
    form.reset(state.formData);
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof DiscSchema>, {
          message: (value as string[])[0],
        });
      }
    }
  }, [state.errors, state.formData, form]);

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
                      value={field.value || ""}
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
                      required
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
                      value={field.value || ""}
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
                      value={field.value || ""}
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
                      value={field.value || ""}
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
                      value={field.value || ""}
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
                name="notificationTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification template</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        // Set notification text with the selected template,
                        // unless it's a custom template (in which case, do nothing)
                        if (e !== "custom") {
                          const notificationText = getNotificationText(
                            e,
                            templates,
                            previewDisc
                          );
                          form.setValue("notificationText", notificationText);
                        }
                        field.onChange(e);
                      }}
                      {...field}
                      value={field.value ?? notificationTemplates[0].id}
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
                        <SelectItem value={"custom"}>Custom</SelectItem>
                        {notificationTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Notification text */}
              <FormField
                control={form.control}
                name="notificationText"
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
                        {...field}
                        // Set to custom if user types in the field
                        onChange={(e) => {
                          form.setValue("notificationTemplate", "custom");
                          field.onChange(e);
                        }}
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
                name="reminderTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder template</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        if (e !== "custom") {
                          const reminderText = getNotificationText(
                            e,
                            templates,
                            previewDisc
                          );
                          form.setValue("reminderText", reminderText);
                        }
                        field.onChange(e);
                      }}
                      {...field}
                      value={field.value || reminderTemplates[0].id}
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
                        <SelectItem value={"custom"}>Custom</SelectItem>
                        {reminderTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Reminder text */}
              <FormField
                control={form.control}
                name="reminderText"
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
                        {...field}
                        // Set to custom if user types in the field
                        onChange={(e) => {
                          form.setValue("reminderTemplate", "custom");
                          field.onChange(e);
                        }}
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
                name="extensionTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extension template</FormLabel>
                    <Select
                      onValueChange={(e) => {
                        if (e !== "custom") {
                          const extensionText = getNotificationText(
                            e,
                            templates,
                            previewDisc
                          );
                          form.setValue("extensionText", extensionText);
                        }
                        field.onChange(e);
                      }}
                      {...field}
                      value={field.value || extensionTemplates[0].id}
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
                        <SelectItem value={"custom"}>Custom</SelectItem>
                        {extensionTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Extension text */}
              <FormField
                control={form.control}
                name="extensionText"
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
                        {...field}
                        // Set to custom if user types in the field
                        onChange={(e) => {
                          form.setValue("extensionTemplate", "custom");
                          field.onChange(e);
                        }}
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
                      value={field.value || ""}
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
                      value={field.value || ""}
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
        <div className="mt-4 flex flex-col md:flex-row justify-end gap-2">
          <Button variant="outline">
            <Link href="/dashboard/discs">Cancel</Link>
          </Button>
          <Button
            variant={disc ? "default" : "outline"}
            type="submit"
            onClick={() => {
              // Set the hidden input value to "false"
              // Only need this in case of an error
              // after pressing "Save and add another"
              form.setValue("addAnother", "false");
            }}
            disabled={pending}
          >
            Save {disc ? "changes" : "and close"}
          </Button>
          {!disc && (
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
