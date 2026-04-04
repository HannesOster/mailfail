import { UserButton } from "@clerk/nextjs";
import { SidebarNav } from "@/components/sidebar-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#FAFAFA] text-[#0A0A0A] min-h-screen">
      <SidebarNav />
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Top bar with user button */}
        <header className="flex justify-end items-center h-14 px-6 bg-white border-b border-zinc-200 sticky top-0 z-40">
          <UserButton />
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
