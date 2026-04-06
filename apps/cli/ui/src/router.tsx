import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarNav } from "./components/sidebar-nav";
import { ThemeToggle } from "./components/theme-toggle";
import { EmailListPage } from "./pages/email-list";
import { EmailDetailPage } from "./pages/email-detail";

export function AppRouter() {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
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
