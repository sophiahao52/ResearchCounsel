import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Research Council", description: "A focused workspace for generating, evaluating, and combining research ideas." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
