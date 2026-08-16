import type { Metadata } from "next";
import { AppAccessProvider } from "@/components/app-entry";
import { ThemeApplier } from "@/components/theme-applier";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Morning Coach", template: "%s | Morning Coach" },
  description: "Dein privates Personal Journal für den täglichen Morning Check-in.",
};

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body><ThemeApplier /><AppAccessProvider>{children}</AppAccessProvider></body>
    </html>
  );
}
