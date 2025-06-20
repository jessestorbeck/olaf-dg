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
  FormDescription,
  FormMessage,
  FormRootError,
} from "@/app/ui/form";
import { Input } from "@/app/ui/input";
import { Button } from "@/app/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { DeleteAccountSchema } from "@/db/validation";
import { deleteAccount, DeleteAccountState } from "@/data-access/users";

export function DeleteAccountAlert() {
  const initialState: DeleteAccountState = {};
  const [state, formAction, pending] = useActionState(
    deleteAccount,
    initialState
  );

  const [alertOpen, setAlertOpen] = useState(false);

  const form = useForm<z.infer<typeof DeleteAccountSchema>>({
    resolver: zodResolver(DeleteAccountSchema),
    mode: "onTouched",
    defaultValues: {
      password: "",
      areYouSure: "",
    },
  });

  // For server-side error messages
  useEffect(() => {
    form.reset(state.formData);
    if (state.errors) {
      console.log(state.errors);
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof DeleteAccountSchema>, {
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
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="text-destructive font-bold mb-1 block">
              Warning: this action will permanently delete your account and all
              its associated data.
            </span>
            <span className="block">
              If you want to proceed, enter your password and confirm your
              intention to delete your account. You will receive an email with a
              confirmation link to finalize account deletion.
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
                name="areYouSure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Are you sure?</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Yes, I delete my account"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Type{" "}
                      <span className="font-bold">Yes, delete my account</span>{" "}
                      to confirm.
                    </FormDescription>
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
                  Delete account
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
