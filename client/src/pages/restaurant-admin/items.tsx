import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import ItemList from "@/components/items/item-list";
import AddItemModal from "@/components/modals/add-item-modal";
import { useState } from "react";

export default function RestaurantItems() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Check if admin has a restaurant assigned
  const restaurantId = user?.restaurantId;
  
  if (!restaurantId) {
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
  
  return (
    <AppLayout title="ניהול פריטים">
      <PageHeader 
        title="ניהול פריטים" 
        description="הוסף, ערוך ומחק פריטים בתפריט המסעדה"
        actionLabel="הוסף פריט"
        onAction={() => setIsAddModalOpen(true)}
      />
      
      <ItemList restaurantId={restaurantId} />
      
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        restaurantId={restaurantId}
      />
    </AppLayout>
  );
}
