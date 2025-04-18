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

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  isLoading: boolean;
}

export default function DeleteCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  isLoading,
}: DeleteCategoryModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את הקטגוריה?</AlertDialogTitle>
          <AlertDialogDescription>
            אתה עומד למחוק את הקטגוריה &quot;{categoryName}&quot;.
            פעולה זו היא בלתי הפיכה ותמחק גם את כל הפריטים בקטגוריה זו.
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
              "מחק קטגוריה"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}