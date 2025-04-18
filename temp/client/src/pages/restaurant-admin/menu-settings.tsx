import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/layouts/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema
const settingsSchema = z.object({
  name: z.string().min(1, { message: "שם המסעדה נדרש" }),
  description: z.string().optional(),
  primaryColor: z.string().min(1, { message: "צבע ראשי נדרש" }),
  backgroundColor: z.string().min(1, { message: "צבע רקע נדרש" }),
  logo: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  facebookLink: z.string().url({ message: "יש להזין כתובת URL תקינה" }).optional().or(z.literal('')),
  instagramLink: z.string().url({ message: "יש להזין כתובת URL תקינה" }).optional().or(z.literal('')),
  websiteLink: z.string().url({ message: "יש להזין כתובת URL תקינה" }).optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function RestaurantMenuSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  // Fetch restaurant data
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId],
    queryFn: async () => {
      if (!user?.restaurantId) return null;
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}`);
      const data = await res.json();
      return data;
    },
    enabled: !!user?.restaurantId
  });

  // Set up form
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      description: "",
      primaryColor: "#14b8a6",
      backgroundColor: "#ffffff",
      logo: "",
      phone: "",
      address: "",
      facebookLink: "",
      instagramLink: "",
      websiteLink: "",
    },
  });

  // Update form when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      form.reset({
        name: restaurant.name || "",
        description: restaurant.description || "",
        primaryColor: restaurant.primaryColor || "#14b8a6",
        backgroundColor: restaurant.backgroundColor || "#ffffff",
        logo: restaurant.logo || "",
        phone: restaurant.phone || "",
        address: restaurant.address || "",
        facebookLink: restaurant.facebookLink || "",
        instagramLink: restaurant.instagramLink || "",
        websiteLink: restaurant.websiteLink || "",
      });
      
      if (restaurant.logo) {
        setLogoPreview(restaurant.logo);
      }
    }
  }, [restaurant, form]);

  // Update restaurant mutation
  const updateMutation = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      if (!user?.restaurantId) throw new Error("לא נמצא מזהה מסעדה");
      const res = await apiRequest('PUT', `/api/restaurants/${user.restaurantId}`, values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', user?.restaurantId] });
      toast({
        title: "הגדרות נשמרו",
        description: "הגדרות המסעדה והתפריט נשמרו בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בשמירת הגדרות",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: SettingsFormValues) => {
    // If logo is an uploaded file, upload it first and then update restaurant
    if (logoFile) {
      // TODO: Upload logo file
      // For now, just simulate using the preview
      values.logo = logoPreview || "";
    }
    
    updateMutation.mutate(values);
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get menu URL
  const getMenuUrl = () => {
    if (!restaurant?.slug) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/menus/${restaurant.slug}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-8">
        <h1 className="text-3xl font-bold tracking-tight">הגדרות תפריט</h1>
        
        {isLoading ? (
          <p>טוען...</p>
        ) : restaurant ? (
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="general">הגדרות כלליות</TabsTrigger>
                <TabsTrigger value="appearance">מראה ועיצוב</TabsTrigger>
                <TabsTrigger value="social">רשתות חברתיות</TabsTrigger>
              </TabsList>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <TabsContent value="general" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>פרטי מסעדה</CardTitle>
                        <CardDescription>
                          הגדר את המידע הבסיסי של המסעדה שיוצג בתפריט שלך
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>שם המסעדה</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                              <FormLabel>תיאור המסעדה</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="תיאור קצר שיוצג בראש התפריט"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>טלפון</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>כתובת</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>לוגו מסעדה</CardTitle>
                        <CardDescription>
                          העלה את לוגו המסעדה שיוצג בראש התפריט
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col items-center">
                          {logoPreview ? (
                            <div className="mb-4">
                              <img 
                                src={logoPreview} 
                                alt="לוגו" 
                                className="w-32 h-32 object-cover rounded-full border" 
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                              <span className="text-gray-400">אין לוגו</span>
                            </div>
                          )}
                          
                          <label htmlFor="logo-upload" className="cursor-pointer">
                            <div className="flex items-center space-x-2 bg-primary px-4 py-2 rounded-md text-white">
                              <Upload className="ml-2 h-4 w-4" />
                              <span>העלה לוגו</span>
                            </div>
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoChange}
                            />
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>קישור לתפריט</CardTitle>
                        <CardDescription>
                          שתף את התפריט הדיגיטלי שלך עם לקוחות
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2">
                          <Input 
                            readOnly 
                            value={getMenuUrl()} 
                            className="text-left"
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              window.open(getMenuUrl(), '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="appearance" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>צבעים וסגנון</CardTitle>
                        <CardDescription>
                          התאם את העיצוב של התפריט הדיגיטלי שלך
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="primaryColor"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>צבע ראשי</FormLabel>
                                <div className="flex items-center space-x-2">
                                  <FormControl>
                                    <Input 
                                      type="color" 
                                      {...field} 
                                      className="w-12 h-12 p-1 rounded-md"
                                    />
                                  </FormControl>
                                  <Input 
                                    {...field} 
                                    className="flex-1 text-left"
                                    dir="ltr"
                                  />
                                </div>
                                <FormDescription>
                                  צבע לכותרות וכפתורים
                                </FormDescription>
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
                                <div className="flex items-center space-x-2">
                                  <FormControl>
                                    <Input 
                                      type="color" 
                                      {...field} 
                                      className="w-12 h-12 p-1 rounded-md"
                                    />
                                  </FormControl>
                                  <Input 
                                    {...field} 
                                    className="flex-1 text-left"
                                    dir="ltr"
                                  />
                                </div>
                                <FormDescription>
                                  צבע רקע של התפריט
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>תצוגה מקדימה</CardTitle>
                        <CardDescription>
                          כך ייראה התפריט שלך עם העיצוב הנוכחי
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="border rounded-lg overflow-hidden p-4 text-center" 
                          style={{
                            backgroundColor: form.watch("backgroundColor"),
                            color: form.watch("primaryColor"),
                          }}
                        >
                          {logoPreview && (
                            <img 
                              src={logoPreview} 
                              alt="לוגו" 
                              className="w-16 h-16 object-cover rounded-full mx-auto mb-2 border-4" 
                              style={{ borderColor: form.watch("primaryColor") }}
                            />
                          )}
                          <h3 className="text-xl font-bold mb-1">
                            {form.watch("name") || "שם המסעדה"}
                          </h3>
                          <p className="text-sm opacity-75">
                            {form.watch("description") || "תיאור המסעדה יופיע כאן"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="social" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>רשתות חברתיות</CardTitle>
                        <CardDescription>
                          הוסף קישורים לעמודים שלך ברשתות החברתיות
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={form.control}
                          name="facebookLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>פייסבוק</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://facebook.com/your-page" 
                                  {...field} 
                                  value={field.value || ""}
                                  className="text-left"
                                  dir="ltr"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="instagramLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>אינסטגרם</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://instagram.com/your-profile" 
                                  {...field} 
                                  value={field.value || ""}
                                  className="text-left"
                                  dir="ltr"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="websiteLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>אתר אינטרנט</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://yourwebsite.com" 
                                  {...field} 
                                  value={field.value || ""}
                                  className="text-left"
                                  dir="ltr"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <>טוען...</>
                      ) : (
                        <>
                          <Save className="ml-2 h-4 w-4" />
                          שמור שינויים
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-xl font-semibold text-gray-600">לא נמצאה מסעדה</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}