import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Utensils, QrCode, Tag, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layouts/admin-layout";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface RestaurantStats {
  categoriesCount: number;
  itemsCount: number;
  viewsCount: number; // Placeholder for future analytics
  ordersCount: number; // Placeholder for future ordering functionality
}

export default function RestaurantAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<RestaurantStats>({
    categoriesCount: 0,
    itemsCount: 0,
    viewsCount: 0,
    ordersCount: 0
  });

  // Fetch restaurant data for this admin
  const { data: restaurant } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId],
    queryFn: async () => {
      if (!user?.restaurantId) return null;
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!user?.restaurantId
  });

  // Fetch categories for this restaurant
  const { data: categories } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId, 'categories'],
    queryFn: async () => {
      if (!user?.restaurantId) return [];
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}/categories`);
      const data = await res.json();
      return data;
    },
    enabled: !!user?.restaurantId
  });

  // Calculate statistics
  useEffect(() => {
    if (categories) {
      // Calculate total items across all categories
      const itemsCount = categories.reduce((total: number, category: any) => {
        return total + (category.items?.length || 0);
      }, 0);

      setStats({
        categoriesCount: categories.length,
        itemsCount: itemsCount,
        viewsCount: Math.floor(Math.random() * 100), // Placeholder data
        ordersCount: Math.floor(Math.random() * 20), // Placeholder data
      });
    }
  }, [categories]);

  // Format date for display
  const formatDate = (date: string | Date) => {
    if (!date) return "";
    const d = new Date(date);
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1 text-right">שלום, {user?.name}</h1>
          <p className="text-muted-foreground text-right">
            {restaurant?.name || "טוען..."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">קטגוריות</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriesCount}</div>
              <p className="text-xs text-muted-foreground">
                בתפריט שלך
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">פריטים</CardTitle>
              <Utensils className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.itemsCount}</div>
              <p className="text-xs text-muted-foreground">
                בכל הקטגוריות
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">קוד QR</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">פעיל</div>
              <p className="text-xs text-muted-foreground">
                מוכן לשיתוף
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">צפיות תפריט</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.viewsCount}</div>
              <p className="text-xs text-muted-foreground">
                ב-7 הימים האחרונים
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>פרטי מסעדה</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">שם:</dt>
                  <dd>{restaurant?.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">כתובת:</dt>
                  <dd>{restaurant?.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">נוצר ב:</dt>
                  <dd>{restaurant?.createdAt ? formatDate(restaurant.createdAt) : "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">עודכן ב:</dt>
                  <dd>{restaurant?.updatedAt ? formatDate(restaurant.updatedAt) : "-"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>קטגוריות תפריט</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {categories?.slice(0, 5).map((category: any) => (
                  <li key={category.id} className="flex justify-between">
                    <span>{category.name}</span>
                    <span className="text-muted-foreground">{category.items?.length || 0} פריטים</span>
                  </li>
                ))}
                
                {(!categories || categories.length === 0) && (
                  <li className="text-gray-500 dark:text-gray-400 text-center py-2">
                    אין קטגוריות להצגה
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}