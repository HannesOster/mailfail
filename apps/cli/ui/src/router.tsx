import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarNav } from "./components/sidebar-nav";
import { ThemeToggle } from "./components/theme-toggle";
import { EmailListPage } from "./pages/email-list";
import { EmailDetailPage } from "./pages/email-detail";

export function AppRouter() {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="ml-64 min-h-screen relative flex flex-col flex-1">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-end px-8 bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-40 border-b border-[rgba(123,122,129,0.1)]">
          <ThemeToggle />
        </header>
        {/* Content */}
        <div className="p-8 flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<EmailListPage />} />
            <Route path="/emails/:mailId" element={<EmailDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
