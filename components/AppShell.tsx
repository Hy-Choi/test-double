"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      {isHome ? null : <SiteHeader />}
      <main className={isHome ? "px-6 pb-0" : "mx-auto max-w-6xl px-6 pb-12"}>{children}</main>
    </>
  );
}
