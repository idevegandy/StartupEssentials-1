import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  LayoutGrid, 
  FileText, 
  Settings, 
  ExternalLink,
  QrCode, 
  BadgeDollarSign,
  Utensils,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import AdminLayout from "@/components/layouts/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface RestaurantStats {
  categoriesCount: number;
  itemsCount: number;
  viewsCount: number; // Placeholder for future analytics
  ordersCount: number; // Placeholder for future ordering functionality
}

export default function RestaurantAdminDashboard() {
  const { user } = useAuth();

  // Fetch restaurant data
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId],
    queryFn: async () => {
      if (!user?.restaurantId) return null;
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}`);
      return res.json();
    },
    enabled: !!user?.restaurantId
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId, 'categories'],
    queryFn: async () => {
      if (!user?.restaurantId) return [];
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}/categories`);
      return res.json();
    },
    enabled: !!user?.restaurantId
  });

  // Fetch items
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId, 'items'],
    queryFn: async () => {
      if (!user?.restaurantId) return [];
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}/items`);
      return res.json();
    },
    enabled: !!user?.restaurantId
  });

  const isLoading = restaurantLoading || categoriesLoading || itemsLoading;

  // Mock stats for future functionality
  const stats: RestaurantStats = {
    categoriesCount: categories?.length || 0,
    itemsCount: items?.length || 0,
    viewsCount: 102, // Mock data
    ordersCount: 24, // Mock data
  };

  // Format date
  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
          <div className="flex items-center space-x-2">
            {restaurant?.slug && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`/menus/${restaurant.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="ml-2 h-4 w-4" />
                  צפה בתפריט
                </a>
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <p>טוען נתונים...</p>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">קטגוריות</CardTitle>
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.categoriesCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">פריטים</CardTitle>
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.itemsCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">צפיות בתפריט</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.viewsCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">הזמנות</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.ordersCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Restaurant Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>פרטי המסעדה</CardTitle>
                <CardDescription>
                  המידע הבסיסי של המסעדה שלך
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col space-y-4">
                  <div>
                    <h3 className="mb-1 text-sm font-medium">שם המסעדה</h3>
                    <p className="text-muted-foreground">{restaurant?.name}</p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium">כתובת</h3>
                    <p className="text-muted-foreground">{restaurant?.address || "לא הוגדר"}</p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium">טלפון</h3>
                    <p className="text-muted-foreground">{restaurant?.phone || "לא הוגדר"}</p>
                  </div>
                </div>
                <div className="flex flex-col space-y-4">
                  <div>
                    <h3 className="mb-1 text-sm font-medium">כתובת תפריט מקוונת</h3>
                    <p className="text-muted-foreground text-left text-sm" dir="ltr">
                      {restaurant?.slug 
                        ? `${window.location.origin}/menus/${restaurant.slug}` 
                        : "לא הוגדר"}
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-1 text-sm font-medium">מנהל</h3>
                    <p className="text-muted-foreground">{user?.name || "לא ידוע"}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" asChild>
                  <Link href="/restaurant-admin/menu-settings">
                    <Settings className="ml-2 h-4 w-4" />
                    ערוך הגדרות
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <h2 className="text-xl font-semibold mb-2">פעולות מהירות</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ניהול קטגוריות</CardTitle>
                  <CardDescription>
                    הוסף, ערוך או מחק קטגוריות בתפריט
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/restaurant-admin/categories">
                      <LayoutGrid className="ml-2 h-4 w-4" />
                      קטגוריות
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ניהול פריטים</CardTitle>
                  <CardDescription>
                    הוסף, ערוך או מחק פריטים בתפריט
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/restaurant-admin/items">
                      <Utensils className="ml-2 h-4 w-4" />
                      פריטי תפריט
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">קוד QR</CardTitle>
                  <CardDescription>
                    צור או הורד קוד QR לתפריט שלך
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/restaurant-admin/qr-code">
                      <QrCode className="ml-2 h-4 w-4" />
                      צור קוד QR
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}