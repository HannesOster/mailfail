import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarNav } from "./components/sidebar-nav";
import { ThemeToggle } from "./components/theme-toggle";
import { InboxListPage } from "./pages/inbox-list";
import { InboxDetailPage } from "./pages/inbox-detail";
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
            <Route path="/" element={<Navigate to="/inboxes" replace />} />
            <Route path="/inboxes" element={<InboxListPage />} />
            <Route path="/inboxes/:id" element={<InboxDetailPage />} />
            <Route path="/inboxes/:id/:mailId" element={<EmailDetailPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
