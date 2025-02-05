"use client";

import {
  HomeIcon,
  CircleStackIcon,
  UserGroupIcon,
  Cog8ToothIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: "Home", href: "/dashboard", icon: HomeIcon },
  {
    name: "Discs",
    href: "/dashboard/discs",
    icon: CircleStackIcon,
  },
  { name: "Templates", href: "/dashboard/templates", icon: BellAlertIcon },
  { name: "Players", href: "/dashboard/players", icon: UserGroupIcon },
  { name: "Settings", href: "/dashboard/settings", icon: Cog8ToothIcon },
];

export default function NavLinks() {
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
            <LinkIcon
              // Rotate database icon so it looks like discs
              className={clsx("w-6", { "rotate-90": link.name === "Discs" })}
            />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
