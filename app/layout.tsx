import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "suntcastigator.ro — În construcție",
  description: "suntcastigator.ro este în construcție. Revenim în curând!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
