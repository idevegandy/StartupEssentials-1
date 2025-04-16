import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import CategoryList from "@/components/categories/category-list";
import AddCategoryModal from "@/components/modals/add-category-modal";
import { useState } from "react";
import Loading from "@/components/ui/loading";

export default function RestaurantCategories() {
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
    <AppLayout title="ניהול קטגוריות">
      <PageHeader 
        title="ניהול קטגוריות" 
        description="הוסף, ערוך ומחק קטגוריות בתפריט המסעדה"
        actionLabel="הוסף קטגוריה"
        onAction={() => setIsAddModalOpen(true)}
      />
      
      <CategoryList restaurantId={restaurantId} />
      
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        restaurantId={restaurantId}
      />
    </AppLayout>
  );
}
