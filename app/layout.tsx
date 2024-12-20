import "@/app/ui/global.css";
import { primaryFont } from "@/app/ui/fonts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | OLaF DG",
    default: "OLaF DG",
  },
  description: "Open-source lost and found management for disc golf",
  keywords: ["disc golf", "lost and found"],
  creator: "Jesse Storbeck",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${primaryFont.className} antialiased`}>{children}</body>
    </html>
  );
}
