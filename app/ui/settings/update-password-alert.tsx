"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from "@/app/ui/form";
import { Input } from "@/app/ui/input";
import { Button } from "@/app/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { UpdatePasswordSchema } from "@/db/validation";
import { updatePassword, UpdatePasswordState } from "@/data-access/users";

export function UpdatePasswordAlert() {
  const initialState: UpdatePasswordState = {};
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );

  const [alertOpen, setAlertOpen] = useState(false);

  const form = useForm<z.infer<typeof UpdatePasswordSchema>>({
    resolver: zodResolver(UpdatePasswordSchema),
    mode: "onTouched",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // For server-side error messages
  useEffect(() => {
    form.reset(state.formData);
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof UpdatePasswordSchema>, {
          message: (value as string[])[0],
        });
      }
    }
  }, [state.errors, state.formData, form]);

  // For toasts
  const { toast } = useToast();
  useEffect(() => {
    if (state.toast) {
      // Close the alert dialog first before showing the toast
      setAlertOpen(false);
      toast({
        title: state.toast.title || "",
        description: state.toast.message || "",
      });
    }
  }, [state, toast]);

  return (
    <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
        >
          Update password
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update password</AlertDialogTitle>
          <AlertDialogDescription>
            Please enter your current and new passwords.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form action={formAction}>
            <div className="p-4 space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Current password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="New password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormRootError className="mt-2" />
              <div className="flex flex-col md:flex-row justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAlertOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" type="submit" disabled={pending}>
                  Update password
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
