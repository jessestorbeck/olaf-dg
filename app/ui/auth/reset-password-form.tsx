"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";

import { primaryFont } from "@/app/ui/fonts";
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
import { ResetPasswordState, resetPassword } from "@/data-access/users";
import { ResetPasswordSchema } from "@/db/validation";

export function ResetPasswordForm({ token }: { token: string }) {
  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      token: token,
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const initialState: ResetPasswordState = {};
  const [state, formAction, pending] = useActionState(
    resetPassword,
    initialState
  );

  // For server-side error messages
  // and form reset on successful submission
  useEffect(() => {
    form.reset(state.formData);
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof ResetPasswordSchema>, {
          message: (value as string[])[0],
        });
      }
    }
  }, [state.errors, state.formData, form]);

  return (
    <Form {...form}>
      <form action={formAction}>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h1 className={`${primaryFont.className} mb-3 text-2xl`}>
            Please reset your password.
          </h1>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your new password"
                      type="password"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Password must be at least 8 characters and contain a number,
                    uppercase letter, lowercase letter, and special character.
                  </FormDescription>
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
                      placeholder="Confirm your new password"
                      type="password"
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
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormRootError className="mt-2" />
          <div className="flex flex-col md:flex-row justify-end gap-2 mt-4">
            <Button type="button" variant="outline">
              <Link href={"/login"}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={pending}>
              Reset password
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
