import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { Loader2 } from "lucide-react";

import { AddRestaurantFormData, FileWithPreview } from "@/types";

const formSchema = z.object({
  restaurant: z.object({
    name: z.string().min(2, "Name is required"),
    slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    }),
    logo: z.any().optional(),
    status: z.enum(["active", "pending", "inactive"]).default("active"),
  }),
  user: z.object({
    name: z.string().min(2, "Admin name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  }),
});

interface AddRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRestaurantModal({ isOpen, onClose }: AddRestaurantModalProps) {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<FileWithPreview | null>(null);
  
  const form = useForm<AddRestaurantFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      restaurant: {
        name: "",
        slug: "",
        status: "active",
      },
      user: {
        name: "",
        email: "",
        password: "",
      },
    },
  });
  
  const addRestaurantMutation = useMutation({
    mutationFn: async (data: AddRestaurantFormData) => {
      // If we have a logo, we would handle file upload here
      // For the MVP, we'll just use a placeholder value
      if (logoFile) {
        data.restaurant.logo = logoFile.name; // In a real app, this would be the uploaded file URL
      }
      
      const res = await apiRequest("POST", "/api/restaurants", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "Restaurant added",
        description: "Restaurant has been added successfully.",
      });
      form.reset();
      setLogoFile(null);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add restaurant",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: AddRestaurantFormData) => {
    addRestaurantMutation.mutate(data);
  };
  
  // Auto-generate slug from restaurant name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");
    
    form.setValue("restaurant.slug", slug);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת מסעדה חדשה</DialogTitle>
          <DialogDescription>
            הוסף מסעדה חדשה ומנהל מסעדה
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Restaurant Details Section */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700">פרטי מסעדה</h4>
              
              <FormField
                control={form.control}
                name="restaurant.name"
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
                name="restaurant.slug"
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
                name="restaurant.logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>לוגו (אופציונלי)</FormLabel>
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
            </div>
            
            {/* Admin Details Section */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700">פרטי מנהל מסעדה</h4>
              
              <FormField
                control={form.control}
                name="user.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם מנהל</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="הזן שם מנהל" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="user.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>דוא&quot;ל</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="הזן דוא&quot;ל" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="user.password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>סיסמה</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="הזן סיסמה" />
                    </FormControl>
                    <p className="text-sm text-gray-500">לפחות 8 תווים, אות גדולה, מספר ותו מיוחד</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter className="flex flex-row-reverse sm:justify-end">
              <Button
                type="submit"
                disabled={addRestaurantMutation.isPending}
                className="w-full sm:w-auto"
              >
                {addRestaurantMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                הוסף מסעדה
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
