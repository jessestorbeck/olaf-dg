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
import { ArrowRight } from "@/app/ui/icons";
import { LoginState, login } from "@/data-access/users";
import { LoginSchema } from "@/db/validation";

export function LoginForm() {
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const initialState: LoginState = {};
  const [state, formAction, pending] = useActionState(login, initialState);

  // For server-side error messages
  // and form reset on successful submission
  useEffect(() => {
    form.reset(state.formData);
    if (state.errors) {
      for (const [key, value] of Object.entries(state.errors)) {
        form.setError(key as keyof z.infer<typeof LoginSchema>, {
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
            Please log in to continue.
          </h1>
          <div className="space-y-4">
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your password"
                      type="password"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={pending} className="mt-4 w-full">
            Log in <ArrowRight className="ml-auto h-5 w-5 text-gray-50" />
          </Button>
          <FormRootError className="mt-2" />
          <div className="mt-2">
            No account yet?
            <Button type="button" variant={"link"} className="pl-1 text-base">
              <Link href={"/signup"}>Sign up!</Link>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
