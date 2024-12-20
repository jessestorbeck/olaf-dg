// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Disc = {
  id: string;
  name: string;
  phone: string;
  color: string;
  brand: string;
  plastic: string;
  mold: string;
  location: string;
  notes: string;
  date: string;
  held_until: string;
  notified: boolean;
  reminded: boolean;
  // Discs can be awaiting pickup, picked up, abandoned, or removed
  status: "awaiting pickup" | "picked up" | "abandoned" | "removed";
};

export type Trends = {
  month: string;
  found: number;
  returned: number;
};
