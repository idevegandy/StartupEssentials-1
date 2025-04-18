import { useState, ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  onSearch?: (query: string) => void;
}

export default function AppLayout({ children, title = "Dashboard", onSearch }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200" dir="rtl">
      {/* Sidebar for mobile and desktop */}
      {(isMobile && isMobileOpen) || !isMobile ? (
        <Sidebar isMobile={isMobile} setIsMobileOpen={setIsMobileOpen} />
      ) : null}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={title} 
          onOpenSidebar={() => setIsMobileOpen(true)}
          onSearch={onSearch}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
