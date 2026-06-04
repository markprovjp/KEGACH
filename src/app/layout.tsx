import "antd/dist/reset.css";
import "@/styles/globals.css";
import type { Metadata } from "next";
import type React from "react";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Kiot Operations Companion",
  description: "Operations board for Kiot-linked orders"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
