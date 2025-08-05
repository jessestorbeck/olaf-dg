"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/ui/popover";
import { Input } from "@/app/ui/input";
import { Button } from "@/app/ui/button";
import { UpdatePasswordAlert } from "@/app/ui/settings/update-password-alert";
import { UpdateEmailAlert } from "@/app/ui/settings/update-email-alert";
import { DeleteAccountAlert } from "@/app/ui/settings/delete-account-alert";
import { useToast } from "@/app/hooks/use-toast";
import { updateUserSettings, UpdateUserState } from "@/data-access/users";
import { UserSettings } from "@/db/schema/users";
import { UserSettingsSchema } from "@/db/validation";

export function EditForm({
  userEmail,
  userSettings,
}: {
  userEmail: string;
  userSettings: UserSettings;
}) {
  const initialState: UpdateUserState = {
    formData: {
      ...userSettings,
      laf: userSettings?.laf || undefined,
    },
  };
  const [state, formAction, pending] = useActionState(
    updateUserSettings,
    initialState
  );

  const form = useForm<z.infer<typeof UserSettingsSchema>>({
    resolver: zodResolver(UserSettingsSchema),
    mode: "onTouched",
    defaultValues: {
      name: userSettings.name,
      holdDuration: userSettings.holdDuration,
      laf: userSettings?.laf || "",
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

  return (
    <div>
      <Form {...form}>
        <form action={formAction}>
          <div className="bg-gray-50 p-4 mt-4 rounded-lg space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account name</FormLabel>
                  <FormControl>
                    <Input
                      required
                      placeholder="Update your account name"
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
              name="laf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lost-and-found name</FormLabel>
                  <div className="flex gap-4">
                    <FormControl>
                      <Input
                        required
                        placeholder="Update your lost-and-found name"
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Details</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 text-sm">
                        This name will appear in notifications to disc owners.
                        Changing this value will update notifications for
                        existing discs that are <strong>yet to be sent</strong>.
                        It will not affect previously sent notifications.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="holdDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hold duration (days)</FormLabel>
                  <div className="flex gap-4">
                    <FormControl>
                      <Input
                        required
                        placeholder="Update how many days you hold discs"
                        type="number"
                        min={30}
                        max={365}
                        className="bg-background"
                        {...field}
                      />
                    </FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Details</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 text-sm">
                        Changing this value will only affect existing discs
                        whose owners have not yet been notified (i.e. discs that
                        do not yet have a held-until date). To extend the hold
                        duration for discs whose owners have already been
                        notified, use the &quot;Add time&quot; function in the{" "}
                        <Link
                          href={"/dashboard/discs"}
                          className="text-primary hover:underline"
                        >
                          Discs page
                        </Link>{" "}
                        dropdown menu.
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="my-4 flex justify-end">
            <Button type="submit" disabled={pending}>
              Update settings
            </Button>
          </div>
        </form>
      </Form>
      <div className="bg-gray-50 p-4 mt-8 rounded-lg border border-destructive space-y-4">
        <span className="font-semibold text-destructive">Danger zone</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UpdatePasswordAlert />
          <UpdateEmailAlert userEmail={userEmail} />
          <DeleteAccountAlert />
        </div>
      </div>
    </div>
  );
}
