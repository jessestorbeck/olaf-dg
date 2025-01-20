import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Trends, Disc } from "./definitions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateStr: string, locale: string = "en-US") => {
  const date = new Date(dateStr + "Z");
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export const formatDateTime = (dateStr: string, locale: string = "en-US") => {
  const date = new Date(dateStr + "Z");
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export const dateHasPassed = (dateStr: string) => {
  // This should work so that it only returns true
  // after the date has passed in the client timezone
  const date = new Date(dateStr + "Z");
  const today = new Date();

  if (today.getFullYear() > date.getFullYear()) {
    return true;
  } else if (today.getFullYear() === date.getFullYear()) {
    if (today.getMonth() > date.getMonth()) {
      return true;
    } else if (today.getMonth() === date.getMonth()) {
      if (today.getDate() > date.getDate()) {
        return true;
      }
    }
  }
  return false;
};

export const dateIsClose = (dateStr: string) => {
  // This should return false if the date has passed
  // but true if the date is within 7 days
  if (dateHasPassed(dateStr)) {
    return false;
  } else {
    const date = new Date(dateStr + "Z");
    const closeInterval = 7; // days
    const closeDate = new Date(date.setDate(date.getDate() - closeInterval));
    return dateHasPassed(closeDate.toString());
  }
};

export const formatPhone = (phone: Disc["phone"]) => {
  // If phone number isn't a string of 10 digits, throw an error
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("Invalid phone number format; must be 10 digits");
  }
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
};

export const generateYAxis = (trends: Trends[]) => {
  // Calculate what labels we need to display on the y-axis
  // based on highest record and in 1000s
  const yAxisLabels = [];
  const highestRecord = Math.max(...trends.map((month) => month.found));
  const topLabel = Math.ceil(highestRecord / 1000) * 1000;

  for (let i = topLabel; i >= 0; i -= 1000) {
    yAxisLabels.push(`$${i / 1000}K`);
  }

  return { yAxisLabels, topLabel };
};
