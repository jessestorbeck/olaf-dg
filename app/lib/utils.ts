import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { SelectDisc, NotificationPreviewDisc } from "@/db/schema/discs";
import { SelectTemplate } from "@/db/schema/templates";
import { UserSettings } from "@/db/schema/users";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateHasPassed = (date: Date | null) => {
  // This should work so that it only returns true
  // after the date has passed in the client timezone
  if (date === null) return false;
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

export const dateIsClose = (date: Date | null) => {
  // This should return false if the date has passed
  // but true if the date is within 7 days
  if (date === null || dateHasPassed(date)) {
    return false;
  } else {
    const closeInterval = 7; // days
    const closeDate = new Date(date.setDate(date.getDate() - closeInterval));
    return dateHasPassed(closeDate);
  }
};

export const formatPhone = (phone: SelectDisc["phone"]) => {
  // If phone number isn't a string of 10 digits, throw an error
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("Invalid phone number format; must be 10 digits");
  }
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
};

export const templateVarClasses = {
  $name: "bg-red-500/50 rounded font-bold px-0.5",
  $color: "bg-orange-500/50 rounded font-bold px-0.5",
  $brand: "bg-yellow-500/50 rounded font-bold px-0.5",
  $plastic: "bg-green-500/50 rounded font-bold px-0.5",
  $mold: "bg-blue-500/50 rounded font-bold px-0.5",
  $laf: "bg-indigo-500/50 rounded font-bold px-0.5",
  $heldUntil: "bg-purple-500/50 rounded font-bold px-0.5",
};

export const templateVarRegex = new RegExp(
  Object.keys(templateVarClasses)
    .map((key) => `\\${key}`)
    .join("|"),
  "g"
);

export const splitTemplateContent = (
  content: string
): { substring: string; className: string }[] => {
  const matchSubstrings = content.match(templateVarRegex) || [];
  const nonMatchSubstrings = content.split(templateVarRegex);
  const splitTemplate = [] as { substring: string; className: string }[];
  nonMatchSubstrings.forEach((substring, index) => {
    splitTemplate.push({ substring, className: "" });
    if (matchSubstrings[index]) {
      splitTemplate.push({
        substring: matchSubstrings[index],
        className:
          templateVarClasses[
            matchSubstrings[index] as keyof typeof templateVarClasses
          ],
      });
    }
  });
  return splitTemplate;
};

export const getTemplatePreview = (
  templateContent: string,
  disc: NotificationPreviewDisc | SelectDisc,
  userSettings: UserSettings
) => {
  const splitTemplate = splitTemplateContent(templateContent);
  const splitPreview = splitTemplate.map(({ substring, className }) => {
    if (templateVarRegex.test(substring)) {
      // For each template variable, replace it with the corresponding disc property
      if (substring === "$heldUntil") {
        if (disc.heldUntil) {
          return {
            substring: disc.heldUntil.toDateString(),
            className,
          };
        } else {
          // In case the disc doesn't have a heldUntil date yet,
          const provisionalDate = new Date();
          provisionalDate.setDate(
            provisionalDate.getDate() + userSettings.holdDuration
          );
          return {
            substring: provisionalDate.toDateString(),
            className,
          };
        }
      } else if (substring === "$laf") {
        return {
          substring: userSettings.laf,
          className,
        };
      } else if (substring === "$mold" && !disc.mold) {
        return {
          substring: "disc",
          className,
        };
      } else {
        const discProp = substring.slice(1) as keyof NotificationPreviewDisc;
        const substringVal = disc[discProp]?.toString();
        return {
          substring: substringVal?.trim(),
          className,
        };
      }
    } else {
      // For each non-template variable, return it as is
      return {
        substring,
        className,
      };
    }
  });
  // If a template variable is undefined for the disc,
  // remove the trailing space from the previous substring
  splitTemplate.forEach(({ substring }, index) => {
    if (
      templateVarRegex.test(substring) &&
      !disc[substring.slice(1) as keyof NotificationPreviewDisc] &&
      // Don't include $mold or $heldUntil here,
      // since they are auto-filled if undefined;
      // Also don't include $laf since it is a user setting
      // and not a disc property
      !["$mold", "$heldUntil", "$laf"].includes(substring)
    ) {
      const newSubstring = splitPreview[index - 1].substring?.slice(0, -1);
      splitPreview[index - 1].substring = newSubstring;
    }
  });
  // Finally, remove any empty substrings
  return splitPreview.filter(({ substring }) => substring !== "");
};

// Convenience function to get notification text
// given the template ID and an array of templates
export const getNotificationText = (
  templateID: string,
  templates: SelectTemplate[],
  disc: NotificationPreviewDisc,
  userSettings: UserSettings
): string => {
  const notificationTemplate = templates.find(
    (template) => template.id === templateID
  );
  if (!notificationTemplate) {
    throw new Error(
      `Template with ID ${templateID} not found in templates array`
    );
  } else {
    const notificationText = getTemplatePreview(
      notificationTemplate.content,
      disc,
      userSettings
    )
      .map((templateSpan) => templateSpan.substring)
      .join("");
    return notificationText;
  }
};
