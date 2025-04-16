import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import PageHeader from "@/components/ui/page-header";
import RestaurantList from "@/components/restaurant/restaurant-list";
import AddRestaurantModal from "@/components/modals/add-restaurant-modal";

export default function RestaurantsList() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AppLayout 
      title="רשימת מסעדות" 
      onSearch={setSearchQuery}
    >
      <PageHeader 
        title="ניהול מסעדות" 
        description="נהל את כל המסעדות והמנהלים במערכת" 
        actionLabel="הוסף מסעדה"
        onAction={() => setIsAddModalOpen(true)}
      />
      
      <RestaurantList />
      
      <AddRestaurantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </AppLayout>
  );
}
