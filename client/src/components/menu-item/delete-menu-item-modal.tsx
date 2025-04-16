import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isLoading: boolean;
}

export default function DeleteMenuItemModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading,
}: DeleteMenuItemModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את הפריט?</AlertDialogTitle>
          <AlertDialogDescription>
            אתה עומד למחוק את הפריט &quot;{itemName}&quot;.
            פעולה זו היא בלתי הפיכה ולא ניתן לשחזר את הפריט לאחר מחיקתו.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row-reverse sm:justify-start">
          <AlertDialogCancel className="sm:ml-2">ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                מוחק...
              </>
            ) : (
              "מחק פריט"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}