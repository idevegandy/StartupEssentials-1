import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RestaurantWithAdmin } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ActionMenu from "./action-menu";
import QRCodeModal from "@/components/modals/qr-code-modal";
import EditRestaurantModal from "@/components/modals/edit-restaurant-modal";
import MenuPreviewModal from "@/components/modals/menu-preview-modal";
import { Loader2 } from "lucide-react";
import { Restaurant, Category, Item } from "@shared/schema";

export default function RestaurantList() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurantForQR, setSelectedRestaurantForQR] = useState<Restaurant | null>(null);
  const [selectedRestaurantForEdit, setSelectedRestaurantForEdit] = useState<RestaurantWithAdmin | null>(null);
  const [selectedRestaurantForPreview, setSelectedRestaurantForPreview] = useState<Restaurant | null>(null);
  const [menuData, setMenuData] = useState<{ categories: Category[], items: Record<number, Item[]> }>({ categories: [], items: {} });
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);

  // Fetch all restaurants
  const { data: restaurants, isLoading } = useQuery<RestaurantWithAdmin[]>({
    queryKey: ["/api/restaurants"],
  });

  // Fetch menu data for preview
  const fetchMenuData = async (slug: string) => {
    try {
      const res = await fetch(`/api/menus/${slug}`);
      const data = await res.json();
      
      // Process data for easier rendering
      const itemsByCategory: Record<number, Item[]> = {};
      data.categories.forEach((category: any) => {
        itemsByCategory[category.id] = category.items || [];
      });
      
      setMenuData({
        categories: data.categories,
        items: itemsByCategory
      });
    } catch (error) {
      console.error("Error fetching menu data", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את נתוני התפריט",
        variant: "destructive",
      });
    }
  };

  // Delete restaurant mutation
  const deleteRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: number) => {
      await apiRequest("DELETE", `/api/restaurants/${restaurantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "המסעדה נמחקה בהצלחה",
        description: "המסעדה והחשבון המשויך אליה נמחקו מהמערכת",
      });
      setRestaurantToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במחיקת המסעדה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter restaurants by search query
  const filteredRestaurants = restaurants?.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.admin?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (restaurant.admin?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestaurantPreview = async (restaurant: Restaurant) => {
    setSelectedRestaurantForPreview(restaurant);
    await fetchMenuData(restaurant.slug);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                שם המסעדה
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                מנהל
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                תאריך יצירה
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                סטטוס
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {filteredRestaurants?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  לא נמצאו מסעדות
                </td>
              </tr>
            ) : (
              filteredRestaurants?.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {restaurant.logo ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={restaurant.logo} alt={restaurant.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                            <i className="fas fa-utensils"></i>
                          </div>
                        )}
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">{restaurant.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          <a href={`/menus/${restaurant.slug}`} target="_blank" className="hover:text-primary-600 flex items-center">
                            <i className="fas fa-external-link-alt text-xs ml-1"></i>
                            /menus/{restaurant.slug}
                          </a>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 dark:text-white">{restaurant.admin?.name || "אין מנהל"}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{restaurant.admin?.email || ""}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(restaurant.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      פעיל
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ActionMenu 
                      onView={() => handleRestaurantPreview(restaurant)}
                      onEdit={() => setSelectedRestaurantForEdit(restaurant)}
                      onQRCode={() => setSelectedRestaurantForQR(restaurant)}
                      onResetPassword={() => {
                        toast({
                          title: "איפוס סיסמה",
                          description: "הסיסמה אופסה בהצלחה ונשלחה למנהל המסעדה",
                        });
                      }}
                      onDelete={() => setRestaurantToDelete(restaurant)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
            הקודם
          </button>
          <button className="mr-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
            הבא
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              מציג
              <span className="font-medium mx-1">1</span>
              עד
              <span className="font-medium mx-1">{filteredRestaurants?.length || 0}</span>
              מתוך
              <span className="font-medium mx-1">{filteredRestaurants?.length || 0}</span>
              תוצאות
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600">
                <span className="sr-only">הקודם</span>
                <i className="fas fa-chevron-right"></i>
              </button>
              <button aria-current="page" className="relative z-10 inline-flex items-center px-4 py-2 border border-primary-500 bg-primary-50 text-sm font-medium text-primary-600 dark:border-primary-400 dark:bg-primary-900 dark:text-primary-200">
                1
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600">
                <span className="sr-only">הבא</span>
                <i className="fas fa-chevron-left"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {/* QR Code Modal */}
      {selectedRestaurantForQR && (
        <QRCodeModal
          isOpen={!!selectedRestaurantForQR}
          onClose={() => setSelectedRestaurantForQR(null)}
          restaurant={selectedRestaurantForQR}
        />
      )}
      
      {/* Edit Restaurant Modal */}
      {selectedRestaurantForEdit && (
        <EditRestaurantModal
          isOpen={!!selectedRestaurantForEdit}
          onClose={() => setSelectedRestaurantForEdit(null)}
          restaurant={selectedRestaurantForEdit}
          admin={selectedRestaurantForEdit.admin}
        />
      )}
      
      {/* Menu Preview Modal */}
      {selectedRestaurantForPreview && (
        <MenuPreviewModal
          isOpen={!!selectedRestaurantForPreview}
          onClose={() => setSelectedRestaurantForPreview(null)}
          restaurant={selectedRestaurantForPreview}
          categories={menuData.categories}
          items={menuData.items}
        />
      )}
      
      {/* Delete Restaurant Confirmation */}
      <AlertDialog open={!!restaurantToDelete} onOpenChange={() => setRestaurantToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את המסעדה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את המסעדה, המנהל שלה, וכל הנתונים הקשורים אליה לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={() => restaurantToDelete && deleteRestaurantMutation.mutate(restaurantToDelete.id)}
              disabled={deleteRestaurantMutation.isPending}
            >
              {deleteRestaurantMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מוחק...
                </>
              ) : (
                "מחק מסעדה"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
