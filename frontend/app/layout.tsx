import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morning Coach",
  description: "Privates Journal fuer den taeglichen Morning Check-in",
};

type RootLayoutProps = Readonly<{ children: React.ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
