"use client";

import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface AppShellProps {
  user: User | null;
  profile: { display_name: string | null; avatar_url: string | null } | null;
  children: React.ReactNode;
}

export function AppShell({ user, profile, children }: AppShellProps) {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";

  return (
    <>
      {!isMapPage && <Navbar user={user} profile={profile} />}
      <main className={cn("flex-1", !isMapPage && "pt-[72px]")}>{children}</main>
      {!isMapPage && <Footer />}
    </>
  );
}
