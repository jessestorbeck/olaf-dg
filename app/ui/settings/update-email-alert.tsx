"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";

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
import { UpdateEmailSchema } from "@/db/validation";
import { updateEmail, UpdateEmailState } from "@/data-access/users";

export function UpdateEmailAlert({ userEmail }: { userEmail: string }) {
  const initialState: UpdateEmailState = {};
  const [state, formAction, pending] = useActionState(
    updateEmail,
    initialState
  );

  const [alertOpen, setAlertOpen] = useState(false);

  const form = useForm<z.infer<typeof UpdateEmailSchema>>({
    resolver: zodResolver(UpdateEmailSchema),
    mode: "onTouched",
    defaultValues: {
      password: "",
      newEmail: "",
      confirmNewEmail: "",
    },
  });

  // For server-side error messages
  useEffect(() => {
    form.reset(state.formData);
    if (state.errors) {
      console.log(state.errors);
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof UpdateEmailSchema>, {
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
          Update email
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update email</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block mb-1">
              Your current email is <strong>{userEmail}</strong>. Please enter
              your password to update your account email.
            </span>
            <span className="block">
              You will receive a confirmation email at your{" "}
              <strong>current</strong> email address with a link to confirm the
              change. You must be logged in to your account when you click the
              link for the email change to take effect.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <form action={formAction}>
            <div className="p-4 space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="New email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Confirm new email"
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
                  Update email
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
