import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="bg-[#FAFAFA] dark:bg-zinc-950 text-[#0A0A0A] dark:text-zinc-100 min-h-screen">
      <SidebarNav />
      <div className="ml-64 min-h-screen flex flex-col">
        <header className="flex justify-end items-center gap-3 h-14 px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
          <ThemeToggle />
          <UserButton />
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
