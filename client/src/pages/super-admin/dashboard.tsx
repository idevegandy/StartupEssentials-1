import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building, Users, Store, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layouts/admin-layout";
import { apiRequest } from "@/lib/queryClient";

// Dashboard types
interface DashboardStats {
  restaurantsCount: number;
  activeRestaurantsCount: number;
  restaurantAdminsCount: number;
  itemsCount: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    restaurantsCount: 0,
    activeRestaurantsCount: 0,
    restaurantAdminsCount: 0,
    itemsCount: 0
  });

  // Fetch restaurant data
  const { data: restaurants } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/restaurants');
      const data = await res.json();
      return data;
    }
  });

  // Calculate statistics
  useEffect(() => {
    if (restaurants) {
      setStats({
        restaurantsCount: restaurants.length,
        activeRestaurantsCount: restaurants.filter((r: any) => r.status !== 'inactive').length,
        restaurantAdminsCount: restaurants.length, // Assuming each restaurant has one admin
        itemsCount: restaurants.reduce((acc: number, r: any) => acc + (r.itemsCount || 0), 0)
      });
    }
  }, [restaurants]);
  
  // Format date for "updated X days ago"
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "היום";
    if (diffDays === 1) return "אתמול";
    return `לפני ${diffDays} ימים`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-right">לוח בקרה</h1>
  
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">מסעדות</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.restaurantsCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeRestaurantsCount} פעילות
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">מנהלי מסעדות</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.restaurantAdminsCount}</div>
              <p className="text-xs text-muted-foreground">
                פעילים במערכת
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">פריטי תפריט</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.itemsCount}</div>
              <p className="text-xs text-muted-foreground">
                בכל המסעדות
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">עדכון אחרון</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDate(new Date())}</div>
              <p className="text-xs text-muted-foreground">
                עדכון נתונים אחרון
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Restaurants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">מסעדות אחרונות</h2>
          </div>
          
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      שם
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      כתובת
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      מנהל
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      עדכון אחרון
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {restaurants?.slice(0, 5).map((restaurant: any) => (
                    <tr 
                      key={restaurant.id} 
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle font-medium">{restaurant.name}</td>
                      <td className="p-4 align-middle">{restaurant.slug}</td>
                      <td className="p-4 align-middle">{restaurant.admin?.name || "-"}</td>
                      <td className="p-4 align-middle">{formatDate(restaurant.updatedAt)}</td>
                    </tr>
                  ))}
                  
                  {!restaurants?.length && (
                    <tr>
                      <td colSpan={4} className="h-24 text-center">
                        אין מסעדות להצגה
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}