import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import Navbar from "./navbar";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Top navbar */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
