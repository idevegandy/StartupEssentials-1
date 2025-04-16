import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Utensils, 
  Tags, 
  Pizza, 
  Users, 
  Eye, 
  ArrowUpRight,
  BarChart4,
  Loader2
} from "lucide-react";
import { Restaurant, Category, MenuItem } from "@shared/schema";

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    categories: 0,
    items: 0,
  });

  // Get restaurant data
  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery<Restaurant>({
    queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}` : null],
    enabled: !!user?.restaurantId,
  });

  // Get categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/categories` : null],
    enabled: !!user?.restaurantId,
  });

  // Get menu items
  const { data: menuItems, isLoading: isLoadingItems } = useQuery<MenuItem[]>({
    queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/items` : null],
    enabled: !!user?.restaurantId,
  });

  // Update stats when data is loaded
  useEffect(() => {
    if (categories && menuItems) {
      setStats({
        categories: categories.length,
        items: menuItems.length,
      });
    }
  }, [categories, menuItems]);

  const isLoading = isLoadingRestaurant || isLoadingCategories || isLoadingItems;

  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">לוח מחוונים</h1>
          
          {restaurant && (
            <Link href={`/menus/${restaurant.slug}`} target="_blank">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>צפה בתפריט</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
        
        {/* Restaurant Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {isLoadingRestaurant ? (
              <div className="flex flex-col space-y-3">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ) : restaurant ? (
              <div className="flex items-center">
                <div className="mr-4 flex-1">
                  <h2 className="text-2xl font-bold">{restaurant.name}</h2>
                  <p className="text-gray-500">
                    {restaurant.status === 'active' ? 'פעיל' : 'בהמתנה'}
                  </p>
                </div>
                <Link href="/qr-code">
                  <Button className="flex items-center gap-2">
                    <span>קוד QR</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                לא נמצאו נתונים
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Categories */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-primary-100 p-3">
                  <Tags className="h-5 w-5 text-primary-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-500">קטגוריות</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoading ? (
                      <Skeleton className="h-8 w-8 inline-block" />
                    ) : (
                      stats.categories
                    )}
                  </p>
                </div>
                <div className="ml-auto">
                  <Link href="/categories">
                    <Button variant="ghost" size="sm" className="text-primary-600">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Menu Items */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
                  <Pizza className="h-5 w-5 text-green-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-500">פריטי תפריט</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {isLoading ? (
                      <Skeleton className="h-8 w-8 inline-block" />
                    ) : (
                      stats.items
                    )}
                  </p>
                </div>
                <div className="ml-auto">
                  <Link href="/items">
                    <Button variant="ghost" size="sm" className="text-primary-600">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Visitors (Placeholder) */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-yellow-100 p-3">
                  <Users className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-500">מבקרים היום</p>
                  <p className="text-2xl font-semibold text-gray-900">0</p>
                </div>
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" className="text-primary-600">
                    <BarChart4 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">פעולות מהירות</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/categories">
                  <Button variant="outline" className="w-full flex items-center justify-start gap-2 h-auto py-3">
                    <Tags className="h-5 w-5 text-primary-600" />
                    <div className="text-right">
                      <div className="font-medium">נהל קטגוריות</div>
                      <div className="text-xs text-gray-500">הוסף, ערוך או הסר קטגוריות</div>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/items">
                  <Button variant="outline" className="w-full flex items-center justify-start gap-2 h-auto py-3">
                    <Pizza className="h-5 w-5 text-primary-600" />
                    <div className="text-right">
                      <div className="font-medium">נהל פריטים</div>
                      <div className="text-xs text-gray-500">הוסף, ערוך או הסר פריטי תפריט</div>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/customization">
                  <Button variant="outline" className="w-full flex items-center justify-start gap-2 h-auto py-3">
                    <Utensils className="h-5 w-5 text-primary-600" />
                    <div className="text-right">
                      <div className="font-medium">התאמה אישית</div>
                      <div className="text-xs text-gray-500">התאם את מראה התפריט</div>
                    </div>
                  </Button>
                </Link>
                
                <Link href="/qr-code">
                  <Button variant="outline" className="w-full flex items-center justify-start gap-2 h-auto py-3">
                    <Eye className="h-5 w-5 text-primary-600" />
                    <div className="text-right">
                      <div className="font-medium">קוד QR</div>
                      <div className="text-xs text-gray-500">הצג ושתף קוד QR לתפריט</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity Placeholder */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">פעילות אחרונה</h3>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>אין פעילות אחרונה להצגה</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
