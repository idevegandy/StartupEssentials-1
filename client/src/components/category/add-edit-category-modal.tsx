import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Category } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  icon: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0),
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface AddEditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
}

export default function AddEditCategoryModal({ 
  isOpen, 
  onClose, 
  category 
}: AddEditCategoryModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      icon: "",
      description: "",
      displayOrder: 0,
    },
  });
  
  // Update form values when category changes
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon || "",
        description: category.description || "",
        displayOrder: category.displayOrder,
      });
    } else {
      form.reset({
        name: "",
        icon: "",
        description: "",
        displayOrder: 0,
      });
    }
  }, [category, form]);
  
  const addCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      if (!user?.restaurantId) {
        throw new Error("לא נמצא מזהה מסעדה");
      }
      
      const payload = {
        ...data,
        restaurantId: user.restaurantId,
      };
      
      const res = await apiRequest("POST", "/api/categories", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/categories` : null] 
      });
      toast({
        title: "קטגוריה נוספה",
        description: "הקטגוריה נוספה בהצלחה",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהוספת קטגוריה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      if (!category) {
        throw new Error("לא נמצאה קטגוריה לעדכון");
      }
      
      const res = await apiRequest("PUT", `/api/categories/${category.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}/categories` : null] 
      });
      toast({
        title: "קטגוריה עודכנה",
        description: "הקטגוריה עודכנה בהצלחה",
      });
      form.reset();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון קטגוריה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: CategoryFormValues) => {
    if (category) {
      updateCategoryMutation.mutate(data);
    } else {
      addCategoryMutation.mutate(data);
    }
  };
  
  const isPending = addCategoryMutation.isPending || updateCategoryMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{category ? "עריכת קטגוריה" : "הוספת קטגוריה חדשה"}</DialogTitle>
          <DialogDescription>
            {category 
              ? "ערוך את פרטי הקטגוריה" 
              : "הוסף קטגוריה חדשה לתפריט המסעדה שלך"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הקטגוריה</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="הזן שם לקטגוריה" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>אייקון (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="הזן אייקון או אימוג'י" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="הזן תיאור קצר לקטגוריה" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סדר תצוגה</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" placeholder="0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex flex-row-reverse sm:justify-end gap-2">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {category ? "עדכן קטגוריה" : "הוסף קטגוריה"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                ביטול
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}