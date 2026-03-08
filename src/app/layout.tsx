import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OnRez — Student Housing Near Ontario Universities",
  description:
    "Find your next home near campus. Browse student-friendly rentals near Ontario's top universities.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { display_name: string | null; avatar_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single();
    profile = data;
  }

  return (
    <html lang="en" className={dmSans.variable}>
      <body className="min-h-screen flex flex-col font-sans">
        <Navbar user={user} profile={profile} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
