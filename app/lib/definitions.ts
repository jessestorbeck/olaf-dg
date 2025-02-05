import { z } from "zod";

export type User = {
  id: string;
  name: string;
  laf: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
};

export type Template = {
  id: string;
  user_id: string;
  type: "notification" | "reminder" | "extension";
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Disc = {
  id: string;
  user_id: string;
  name?: string;
  phone: string;
  color?: string;
  brand?: string;
  plastic?: string;
  mold?: string;
  location?: string;
  notes?: string;
  notified: boolean;
  reminded: boolean;
  status: "awaiting pickup" | "picked up" | "archived";
  laf: string;
  notification_template: string | null;
  notification_text: string;
  reminder_template: string | null;
  reminder_text: string;
  extension_template: string | null;
  extension_text: string;
  held_until?: Date;
  created_at: Date;
  updated_at: Date;
};

export type Trends = {
  month: string;
  found: number;
  returned: number;
};

export type ToastState = {
  errors?: z.typeToFlattenedError<number, string>;
  toast?: {
    title: string | null;
    message: string | null;
  };
};
