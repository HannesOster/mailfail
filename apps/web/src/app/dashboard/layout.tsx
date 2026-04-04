import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { SidebarNav } from "@/components/sidebar-nav";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // If no org selected, show org creation/selection screen
  if (!orgId) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-[#0A0A0A] mb-2">Create or select an Organization</h1>
          <p className="text-sm text-[#525252] mb-6">
            MailFail uses organizations to manage inboxes and team members. Create one to get started.
          </p>
          <div className="flex justify-center">
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA] text-[#0A0A0A] min-h-screen">
      <SidebarNav />
      <div className="ml-64 min-h-screen flex flex-col">
        <header className="flex justify-between items-center h-14 px-6 bg-white border-b border-zinc-200 sticky top-0 z-40">
          <OrganizationSwitcher hidePersonal afterSelectOrganizationUrl="/dashboard" />
          <UserButton />
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
