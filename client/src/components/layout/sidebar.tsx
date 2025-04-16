import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// Icons
import { 
  LayoutDashboard,
  Store,
  Settings,
  User,
  Tags,
  List,
  Palette,
  QrCode,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isSuperAdmin = user?.role === "super_admin";
  const isRestaurantAdmin = user?.role === "restaurant_admin";

  const sidebarClass = cn(
    "flex flex-col w-64 bg-white shadow transition-transform duration-200 fixed inset-y-0 z-50 md:relative rtl:md:translate-x-0 ltr:md:translate-x-0",
    {
      "rtl:translate-x-0 ltr:translate-x-0": isOpen,
      "rtl:-translate-x-full ltr:translate-x-full": !isOpen,
    }
  );

  const superAdminLinks = [
    { href: "/", icon: <LayoutDashboard className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "לוח מחוונים" },
    { href: "/restaurants", icon: <Store className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "רשימת מסעדות" },
    { href: "/settings", icon: <Settings className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "הגדרות" },
    { href: "/profile", icon: <User className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "פרופיל" },
  ];

  const restaurantAdminLinks = [
    { href: "/restaurant", icon: <LayoutDashboard className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "לוח מחוונים" },
    { href: "/categories", icon: <Tags className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "קטגוריות" },
    { href: "/items", icon: <List className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "פריטים" },
    { href: "/customization", icon: <Palette className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "התאמה אישית" },
    { href: "/qr-code", icon: <QrCode className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "קוד QR" },
    { href: "/profile", icon: <User className="ml-3 rtl:ml-3 ltr:mr-3 text-lg" />, label: "פרופיל" },
  ];

  const links = isSuperAdmin ? superAdminLinks : restaurantAdminLinks;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      closeSidebar();
    }
  };

  // Backdrop for mobile
  const backdrop = isOpen ? (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={closeSidebar}
    />
  ) : null;

  return (
    <>
      {backdrop}
      <div id="sidebar" className={sidebarClass}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 bg-primary-600">
          <span className="text-white text-xl font-semibold">מערכת ניהול מסעדות</span>
        </div>
        
        {/* User info */}
        <div className="px-4 py-5 bg-primary-700 text-white">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-lg font-semibold">
                {user?.name?.substring(0, 2).toUpperCase() || "NA"}
              </span>
            </div>
            <div className="rtl:mr-3 ltr:ml-3">
              <p className="text-sm font-medium">{user?.name || "User"}</p>
              <p className="text-xs opacity-75">{user?.email || user?.username}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-2 py-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className={cn(
                  "sidebar-item flex items-center px-4 py-2 text-sm font-medium rounded-md",
                  location === link.href
                    ? "active bg-primary-50 text-primary-600 rtl:border-r-2 ltr:border-l-2 border-primary-600"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        
        {/* Logout */}
        <div className="p-4 bg-gray-50 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
          >
            <LogOut className="rtl:ml-2 ltr:mr-2 text-lg" />
            <span>התנתק</span>
          </button>
        </div>
      </div>
    </>
  );
}
