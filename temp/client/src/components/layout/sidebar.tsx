import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Moon, Sun, X, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  isMobile: boolean;
  setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ isMobile, setIsMobileOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(newMode));
      document.documentElement.classList.toggle('dark', newMode);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const superAdminLinks = [
    { href: "/", label: "לוח בקרה", icon: "fa-tachometer-alt" },
    { href: "/restaurants", label: "רשימת מסעדות", icon: "fa-utensils" },
  ];

  const restaurantAdminLinks = [
    { href: "/restaurant-admin/dashboard", label: "לוח בקרה", icon: "fa-tachometer-alt" },
    { href: "/restaurant-admin/categories", label: "קטגוריות", icon: "fa-list" },
    { href: "/restaurant-admin/items", label: "פריטים", icon: "fa-hamburger" },
    { href: "/restaurant-admin/menu-settings", label: "הגדרות תפריט", icon: "fa-cog" },
  ];

  const links = user?.role === 'super_admin' ? superAdminLinks : restaurantAdminLinks;

  return (
    <div className={cn(
      "fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-lg transform transition-transform duration-300 md:translate-x-0 lg:relative",
      {
        "translate-x-0": isMobile,
        "translate-x-full": !isMobile,
      }
    )}>
      <div className="flex flex-col h-full">
        {/* Logo and mobile close button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-primary-700 dark:text-primary-500">RestaurantOS</h1>
            {isMobile && (
              <button
                onClick={() => setIsMobileOpen(false)}
                className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
        
        {/* Admin info */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
              <i className="fas fa-user"></i>
            </div>
            <div className="mr-3">
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                {user?.role === 'super_admin' ? 'מנהל ראשי' : 'מנהל מסעדה'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
            </div>
          </div>
        </div>
        
        {/* Navigation links */}
        <div className="flex-grow overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "group flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-primary-50 dark:hover:bg-slate-700",
                  location === link.href
                    ? "bg-primary-50 text-primary-700 dark:bg-slate-700 dark:text-primary-300 border-r-2 border-primary-700 dark:border-primary-300"
                    : "text-slate-700 dark:text-slate-300"
                )}
              >
                <i className={`fas ${link.icon} w-6 h-6 ml-3`}></i>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Bottom section with logout and dark mode */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost" 
              className="flex items-center text-red-500 hover:text-red-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <i className="fas fa-sign-out-alt ml-2"></i>
              התנתק
              {logoutMutation.isPending && <span className="mr-2 animate-spin">⟳</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
