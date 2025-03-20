import { InsertTemplate } from "@/db/schema/templates";

export const defaultTemplates: Omit<InsertTemplate, "userId">[] = [
  {
    name: "Basic initial",
    type: "initial",
    content: `Hi $name, your $color $brand $plastic $mold has been found at $laf. It will be held until $heldUntil.`,
    isDefault: true,
  },
  {
    name: "Basic reminder",
    type: "reminder",
    content: `Hi $name, your $color $brand $plastic $mold is still at $laf. It will be held until $heldUntil.`,
    isDefault: true,
  },
  {
    name: "Basic extension",
    type: "extension",
    content: `Hi $name, the pick-up date for your $color $brand $plastic $mold has been extended. Your disc will now be held at $laf until $heldUntil.`,
    isDefault: true,
  },
];
