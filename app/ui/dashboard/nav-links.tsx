"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { Home, Discs, Players, Templates, Settings } from "@/app/ui/icons";

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: "Home", href: "/dashboard", icon: Home },
  {
    name: "Discs",
    href: "/dashboard/discs",
    icon: Discs,
  },
  { name: "Templates", href: "/dashboard/templates", icon: Templates },
  { name: "Players", href: "/dashboard/players", icon: Players },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-emerald-200 hover:text-emerald-700 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                "bg-emerald-200 text-emerald-700": pathname === link.href,
              }
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
