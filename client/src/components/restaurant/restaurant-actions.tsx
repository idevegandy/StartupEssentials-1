import { useState } from "react";
import { Eye, Edit, QrCode, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import QrCodeModal from "./qr-code-modal";
import DeleteConfirmationModal from "./delete-confirmation-modal";
import { Restaurant } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RestaurantActionsProps {
  restaurant: Restaurant;
  onEdit: (restaurant: Restaurant) => void;
}

export default function RestaurantActions({ restaurant, onEdit }: RestaurantActionsProps) {
  const { toast } = useToast();
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/restaurants/${restaurant.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "Restaurant deleted",
        description: "Restaurant has been deleted successfully.",
      });
      setShowDeleteModal(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete restaurant",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleView = () => {
    // Open restaurant menu in a new tab
    window.open(`/menus/${restaurant.slug}`, "_blank");
  };
  
  const handleEdit = () => {
    onEdit(restaurant);
  };
  
  const handleShowQrCode = () => {
    setShowQrModal(true);
  };
  
  const handleShowDeleteModal = () => {
    setShowDeleteModal(true);
  };
  
  const handleDelete = () => {
    deleteMutation.mutate();
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            פעולות
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" dir="rtl">
          <DropdownMenuItem onClick={handleView} className="flex gap-2">
            <Eye className="h-4 w-4" />
            <span>צפה בתפריט</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit} className="flex gap-2">
            <Edit className="h-4 w-4" />
            <span>ערוך</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShowQrCode} className="flex gap-2">
            <QrCode className="h-4 w-4" />
            <span>קוד QR</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleShowDeleteModal} 
            className="flex gap-2 text-red-600 focus:text-red-500"
          >
            <Trash className="h-4 w-4" />
            <span>מחק</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        restaurant={restaurant}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        name={restaurant.name}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
