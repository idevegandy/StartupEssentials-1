import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { iconOptions } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "שם הקטגוריה חייב להכיל לפחות 2 תווים"),
  icon: z.string().min(1, "נא לבחור סמל עבור הקטגוריה"),
  displayOrder: z.coerce.number().int().nonnegative("סדר הצגה חייב להיות מספר חיובי"),
});

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: number;
}

export default function AddCategoryModal({ isOpen, onClose, restaurantId }: AddCategoryModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      icon: "utensils",
      displayOrder: 0,
    },
  });
  
  const addCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", `/api/restaurants/${restaurantId}/categories`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/categories`] });
      toast({
        title: "קטגוריה נוספה בהצלחה",
        description: "הקטגוריה החדשה נוצרה בהצלחה",
      });
      onClose();
      form.reset({
        name: "",
        icon: "utensils",
        displayOrder: 0,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהוספת קטגוריה",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addCategoryMutation.mutate(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">הוספת קטגוריה חדשה</DialogTitle>
          <DialogDescription>
            צור קטגוריה חדשה לפריטי התפריט שלך
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם הקטגוריה *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="לדוגמה: ראשונות, עיקריות, קינוחים" />
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
                  <FormLabel>סמל הקטגוריה *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סמל" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            <i className={`fas fa-${option.icon} ml-2`}></i>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>סדר הצגה</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="ml-2"
              >
                ביטול
              </Button>
              <Button type="submit" disabled={addCategoryMutation.isPending}>
                {addCategoryMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    מוסיף...
                  </>
                ) : (
                  "הוסף קטגוריה"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
