import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Category, Item, Restaurant } from "@shared/schema";
import { generateQRCodeUrl, getMenuUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import MenuPreviewModal from "@/components/modals/menu-preview-modal";
import { useState } from "react";

export default function RestaurantAdminDashboard() {
  const { user } = useAuth();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Check if admin has a restaurant assigned
  const restaurantId = user?.restaurantId;
  
  // Fetch restaurant data
  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !!restaurantId,
  });
  
  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
    enabled: !!restaurantId,
  });
  
  // Initialize items state
  const [menuData, setMenuData] = useState<{ categories: Category[], items: Record<number, Item[]> }>({ categories: [], items: {} });
  
  // Fetch items when categories are loaded
  useEffect(() => {
    if (categories && categories.length > 0 && restaurant) {
      const fetchItems = async () => {
        try {
          const itemsByCategory: Record<number, Item[]> = {};
          
          // Fetch items for each category
          for (const category of categories) {
            const res = await fetch(`/api/categories/${category.id}/items`);
            const data = await res.json();
            itemsByCategory[category.id] = data;
          }
          
          setMenuData({
            categories: categories,
            items: itemsByCategory
          });
        } catch (error) {
          console.error("Error fetching items:", error);
        }
      };
      
      fetchItems();
    }
  }, [categories, restaurant]);
  
  if (isRestaurantLoading || isCategoriesLoading) {
    return (
      <AppLayout>
        <Loading />
      </AppLayout>
    );
  }
  
  if (!restaurant) {
    return (
      <AppLayout>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">לא נמצאה מסעדה</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            לא מוגדרת מסעדה לחשבון זה. אנא פנה למנהל המערכת.
          </p>
        </div>
      </AppLayout>
    );
  }
  
  const totalCategories = categories?.length || 0;
  const totalItems = Object.values(menuData.items).reduce((sum, items) => sum + items.length, 0);
  const menuUrl = getMenuUrl(restaurant.slug);
  const qrCodeUrl = generateQRCodeUrl(restaurant.slug);
  
  return (
    <AppLayout title="לוח בקרה">
      {/* Restaurant Overview Card */}
      <Card className="mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
          <CardDescription>
            לוח בקרה וסטטיסטיקות עבור המסעדה שלך
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-medium mb-2">פרטי המסעדה</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="font-medium text-slate-700 dark:text-slate-300 ml-2">כתובת התפריט:</span>
                <a 
                  href={menuUrl} 
                  target="_blank" 
                  className="text-primary-600 hover:underline break-all"
                >
                  {menuUrl}
                </a>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-slate-700 dark:text-slate-300 ml-2">קטגוריות:</span>
                <span>{totalCategories}</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-slate-700 dark:text-slate-300 ml-2">פריטים:</span>
                <span>{totalItems}</span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(true)}
              >
                <i className="fas fa-eye ml-2"></i>
                תצוגה מקדימה
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`/menus/${restaurant.slug}`, '_blank')}
              >
                <i className="fas fa-external-link-alt ml-2"></i>
                צפה בתפריט
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">קוד QR לתפריט</h3>
            <div className="mb-4">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-40 h-40"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Download QR code
                const link = document.createElement('a');
                link.href = qrCodeUrl;
                link.download = `${restaurant.slug}-qrcode.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <i className="fas fa-download ml-2"></i>
              הורד קוד QR
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <h2 className="text-xl font-bold mb-4">פעולות מהירות</h2>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <a 
          href="/restaurant-admin/categories" 
          className="block bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 ml-4">
              <i className="fas fa-list text-lg"></i>
            </div>
            <div>
              <h3 className="font-medium text-lg">ניהול קטגוריות</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                הוסף, ערוך ומחק קטגוריות בתפריט
              </p>
            </div>
          </div>
        </a>
        
        <a 
          href="/restaurant-admin/items" 
          className="block bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 ml-4">
              <i className="fas fa-hamburger text-lg"></i>
            </div>
            <div>
              <h3 className="font-medium text-lg">ניהול פריטים</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                הוסף, ערוך ומחק פריטים בתפריט
              </p>
            </div>
          </div>
        </a>
        
        <a 
          href="/restaurant-admin/menu-settings" 
          className="block bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 ml-4">
              <i className="fas fa-cog text-lg"></i>
            </div>
            <div>
              <h3 className="font-medium text-lg">הגדרות תפריט</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                התאם אישית את מראה התפריט שלך
              </p>
            </div>
          </div>
        </a>
      </div>
      
      {/* Menu Preview Modal */}
      <MenuPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        restaurant={restaurant}
        categories={menuData.categories}
        items={menuData.items}
      />
    </AppLayout>
  );
}
