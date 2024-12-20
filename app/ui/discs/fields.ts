interface Field {
  id: string;
  label: string;
  placeholder: string;
}

export const fields: Field[] = [
  { id: "name", label: "Name", placeholder: "Paul, Kristin" },
  { id: "phone", label: "Phone", placeholder: "555-555-5555" },
  { id: "color", label: "Color", placeholder: "Blue, Swirly" },
  { id: "brand", label: "Brand", placeholder: "Innova, Discraft" },
  { id: "plastic", label: "Plastic", placeholder: "Star, ESP" },
  { id: "mold", label: "Mold", placeholder: "Destroyer, Nuke" },
  { id: "location", label: "Location", placeholder: "Shelf 3, Box 2" },
  { id: "notes", label: "Notes", placeholder: "Found in pond" },
];
