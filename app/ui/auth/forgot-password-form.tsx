"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { primaryFont } from "@/app/ui/fonts";
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
import { ForgotPasswordState, forgotPassword } from "@/data-access/users";
import { ForgotPasswordSchema } from "@/db/validation";

export function ForgotPasswordForm() {
  const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  const initialState: ForgotPasswordState = {};
  const [state, formAction, pending] = useActionState(
    forgotPassword,
    initialState
  );

  // For server-side error messages
  // and form reset on successful submission
  useEffect(() => {
    form.reset(state.formData);
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof ForgotPasswordSchema>, {
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
            Please enter your email address to reset your password.
          </h1>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email address"
                    className="bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormRootError className="mt-2" />
          {!state.success && (
            <div className="flex flex-col md:flex-row justify-end gap-2 mt-4">
              <Button type="button" variant="outline">
                <Link href={"/login"}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={pending}>
                Request password reset
              </Button>
            </div>
          )}
          {state.success && (
            <div className="text-green-600 mt-4">
              If an account with that email address exists, a password reset
              link has been sent to your email.
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
