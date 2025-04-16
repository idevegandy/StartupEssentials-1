import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface HeaderProps {
  title: string;
  onOpenSidebar: () => void;
  onSearch?: (query: string) => void;
}

export default function Header({ title, onOpenSidebar, onSearch }: HeaderProps) {
  const [location] = useLocation();
  
  const getPageTitle = () => {
    switch (true) {
      case location === "/restaurants":
        return "רשימת מסעדות";
      case location === "/restaurant-admin/dashboard":
        return "לוח בקרה";
      case location === "/restaurant-admin/categories":
        return "ניהול קטגוריות";
      case location === "/restaurant-admin/items":
        return "ניהול פריטים";
      case location === "/restaurant-admin/menu-settings":
        return "הגדרות תפריט";
      default:
        return title;
    }
  };
  
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSidebar}
              className="md:hidden ml-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              <i className="fas fa-bars"></i>
            </Button>
            <h2 className="text-lg font-medium">{getPageTitle()}</h2>
          </div>
          
          {onSearch && (
            <div className="flex items-center">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="חיפוש..."
                  className="bg-slate-100 dark:bg-slate-700 border-0 rounded-full py-2 px-4 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none w-48 md:w-64 pl-10 pr-4"
                  onChange={(e) => onSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
