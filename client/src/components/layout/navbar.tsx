import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Bell, Menu, HelpCircle, ChevronLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  
  // Get the current page title based on location
  const getPageTitle = () => {
    const pathSegments = location.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Custom mapping for path to title
    const pageTitles: Record<string, string> = {
      "": "לוח מחוונים",
      "restaurants": "רשימת מסעדות",
      "settings": "הגדרות",
      "profile": "פרופיל",
      "categories": "קטגוריות",
      "items": "פריטים",
      "customization": "התאמה אישית",
      "qr-code": "קוד QR",
    };
    
    return pageTitles[lastSegment] || "ראשי";
  };

  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button 
        id="sidebar-mobile-toggle" 
        className="px-4 text-gray-500 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>
      
      <div className="flex-1 flex justify-between px-4">
        <div className="flex-1 flex">
          {/* Breadcrumbs */}
          <div className="flex items-center">
            <span className="text-gray-600 text-sm">ראשי</span>
            <ChevronLeft className="text-gray-400 mx-1 h-4 w-4" />
            <span className="text-primary-600 text-sm font-medium">{getPageTitle()}</span>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Notifications */}
          <button className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none">
            <Bell size={20} />
          </button>
          
          {/* Help */}
          <button className="p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none mx-3">
            <HelpCircle size={20} />
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                {user?.name?.substring(0, 2).toUpperCase() || "NA"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
                <DropdownMenuItem>{user?.email || user?.username}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/profile">פרופיל</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/settings">הגדרות</a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-red-500">
                  התנתק
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
