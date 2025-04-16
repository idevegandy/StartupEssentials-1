import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Restaurant } from "@shared/schema";

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
import { FileUpload } from "@/components/ui/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { FileWithPreview } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, {
    message: "Slug can only contain lowercase letters, numbers, and hyphens",
  }),
  logo: z.any().optional(),
  status: z.enum(["active", "pending", "inactive"]),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

type EditRestaurantFormValues = z.infer<typeof formSchema>;

interface EditRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant | null;
}

export default function EditRestaurantModal({ isOpen, onClose, restaurant }: EditRestaurantModalProps) {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<FileWithPreview | null>(null);
  
  const form = useForm<EditRestaurantFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      status: "active",
      primaryColor: "#3b82f6",
      backgroundColor: "#ffffff",
    },
  });
  
  // Update form values when restaurant changes
  useEffect(() => {
    if (restaurant) {
      form.reset({
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
        primaryColor: restaurant.primaryColor || "#3b82f6",
        backgroundColor: restaurant.backgroundColor || "#ffffff",
      });
      
      if (restaurant.logo) {
        setLogoFile({
          name: restaurant.name,
          size: 0,
          type: "image/jpeg",
          preview: restaurant.logo,
        } as FileWithPreview);
      }
    }
  }, [restaurant, form]);
  
  const editRestaurantMutation = useMutation({
    mutationFn: async (data: EditRestaurantFormValues) => {
      if (!restaurant) return null;
      
      // If we have a logo, we would handle file upload here
      // For the MVP, we'll just use a placeholder value
      if (logoFile) {
        data.logo = logoFile.name; // In a real app, this would be the uploaded file URL
      }
      
      const res = await apiRequest("PUT", `/api/restaurants/${restaurant.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "Restaurant updated",
        description: "Restaurant has been updated successfully.",
      });
      form.reset();
      setLogoFile(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update restaurant",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: EditRestaurantFormValues) => {
    editRestaurantMutation.mutate(data);
  };
  
  // Auto-generate slug from restaurant name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");
    
    form.setValue("slug", slug);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת מסעדה</DialogTitle>
          <DialogDescription>
            ערוך את פרטי המסעדה
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Restaurant Details Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם מסעדה</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="הזן שם מסעדה"
                        onChange={(e) => {
                          field.onChange(e);
                          handleNameChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מזהה URL (slug)</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-gray-500 pl-2 text-sm">/menus/</span>
                        <Input {...field} placeholder="my-restaurant" />
                      </div>
                    </FormControl>
                    <p className="text-sm text-gray-500">רק אותיות באנגלית, מספרים ומקפים, ללא רווחים</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>לוגו</FormLabel>
                    <FormControl>
                      <FileUpload
                        value={logoFile}
                        onChange={(file) => {
                          setLogoFile(file);
                          field.onChange(file);
                        }}
                        accept={{ 'image/*': [] }}
                        maxSize={2 * 1024 * 1024} // 2MB
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סטטוס</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סטטוס" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">פעיל</SelectItem>
                        <SelectItem value="pending">בהמתנה</SelectItem>
                        <SelectItem value="inactive">לא פעיל</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>צבע ראשי</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <div
                          className="w-10 h-10 rounded-md border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>צבע רקע</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <div
                          className="w-10 h-10 rounded-md border"
                          style={{ backgroundColor: field.value }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter className="flex flex-row-reverse sm:justify-end">
              <Button
                type="submit"
                disabled={editRestaurantMutation.isPending}
                className="w-full sm:w-auto"
              >
                {editRestaurantMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                עדכן מסעדה
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
