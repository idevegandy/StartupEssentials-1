import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { ColorPicker } from "@/components/ui/color-picker";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Save, EyeIcon, RefreshCcw } from "lucide-react";
import { Restaurant } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Color options for pickers
const primaryColorOptions = [
  { hex: "#e65100" },
  { hex: "#b71c1c" },
  { hex: "#1565c0" },
  { hex: "#4caf50" },
  { hex: "#9c27b0" },
  { hex: "#ff5722" },
];

const secondaryColorOptions = [
  { hex: "#f57c00" },
  { hex: "#e53935" },
  { hex: "#1976d2" },
  { hex: "#66bb6a" },
  { hex: "#ba68c8" },
  { hex: "#ff7043" },
];

export default function Appearance() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = parseInt(id);
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Fetch restaurant data
  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", restaurantId],
    enabled: !!restaurantId,
  });

  // Check if current user has access to this restaurant
  const isSuperAdmin = user?.role === "super_admin";
  const isRestaurantAdmin = user?.id === restaurant?.adminId;
  const hasAccess = isSuperAdmin || isRestaurantAdmin;

  // Form schema for appearance settings
  const formSchema = z.object({
    primaryColor: z.string().default("#e65100"),
    secondaryColor: z.string().default("#f57c00"),
    rtl: z.boolean().default(true),
    // Logo is handled separately via state
  });

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      primaryColor: "#e65100",
      secondaryColor: "#f57c00",
      rtl: true,
    },
  });

  // Update form values when restaurant data is loaded
  useEffect(() => {
    if (restaurant) {
      form.reset({
        primaryColor: restaurant.primaryColor || "#e65100",
        secondaryColor: restaurant.secondaryColor || "#f57c00",
        rtl: restaurant.rtl !== undefined ? restaurant.rtl : true,
      });
    }
  }, [restaurant, form]);

  // Submit handler
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!restaurant) return;
    
    try {
      // TODO: Handle logo upload in a real implementation
      
      // Update restaurant appearance settings
      await apiRequest("PUT", `/api/restaurants/${restaurantId}`, {
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        rtl: data.rtl,
      });
      
      // Invalidate restaurant query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", restaurantId] });
      
      toast({
        title: t("success"),
        description: t("appearance_saved"),
      });
    } catch (error) {
      console.error("Error saving appearance settings:", error);
      toast({
        title: t("error"),
        description: t("appearance_save_error"),
        variant: "destructive",
      });
    }
  };

  // Preview style sample for a color
  const getStyleSample = (color: string, textColor: string = "white") => {
    return (
      <div className="flex flex-col space-y-2">
        <div
          className="h-12 rounded-md flex items-center justify-center text-white" 
          style={{ backgroundColor: color }}
        >
          <span className="font-medium" style={{ color: textColor }}>{t("button")}</span>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <div
            className="h-6 w-6 rounded-full" 
            style={{ backgroundColor: color }}
          ></div>
          <div
            className="h-6 w-10 rounded-md" 
            style={{ backgroundColor: color, opacity: 0.7 }}
          ></div>
          <div
            className="h-6 w-8 rounded-md" 
            style={{ backgroundColor: color, opacity: 0.4 }}
          ></div>
        </div>
      </div>
    );
  };

  if (!hasAccess) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("access_denied")}</h2>
              <p className="text-neutral-600">{t("no_access_to_restaurant")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (!restaurant) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">{t("restaurant_not_found")}</h2>
              <p className="text-neutral-600">{t("restaurant_not_found_description")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-heading">{t("appearance")}</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <EyeIcon className="ml-2 h-4 w-4" />
            {previewMode ? t("edit_mode") : t("preview")}
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)}>
            <Save className="ml-2 h-4 w-4" />
            {t("save_changes")}
          </Button>
        </div>
      </div>

      {previewMode ? (
        // Preview mode - show how menu will look
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            className="p-4 text-white" 
            style={{ backgroundColor: form.getValues().primaryColor }}
          >
            <div className="flex items-center">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center overflow-hidden mr-4">
                {restaurant.logo ? (
                  <img src={restaurant.logo} alt={restaurant.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-bold" style={{ color: form.getValues().primaryColor }}>
                    {restaurant.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{restaurant.name}</h2>
                {restaurant.description && (
                  <p className="mt-1 opacity-90">{restaurant.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div 
              className="text-lg font-bold mb-4 pb-2 border-b-2" 
              style={{ borderColor: form.getValues().secondaryColor, color: form.getValues().primaryColor }}
            >
              {t("menu_preview")}
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 
                  className="text-lg font-semibold mb-3" 
                  style={{ color: form.getValues().primaryColor }}
                >
                  {t("starters")}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-dashed border-neutral-200 pb-2">
                    <div>
                      <div className="font-medium">{t("sample_item_1")}</div>
                      <div className="text-sm text-neutral-500">{t("sample_description")}</div>
                    </div>
                    <div className="text-lg font-semibold" style={{ color: form.getValues().primaryColor }}>₪45</div>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-neutral-200 pb-2">
                    <div>
                      <div className="font-medium">{t("sample_item_2")}</div>
                      <div className="text-sm text-neutral-500">{t("sample_description")}</div>
                    </div>
                    <div className="text-lg font-semibold" style={{ color: form.getValues().primaryColor }}>₪38</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 
                  className="text-lg font-semibold mb-3" 
                  style={{ color: form.getValues().primaryColor }}
                >
                  {t("main_courses")}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-dashed border-neutral-200 pb-2">
                    <div>
                      <div className="font-medium">{t("sample_item_3")}</div>
                      <div className="text-sm text-neutral-500">{t("sample_description")}</div>
                    </div>
                    <div className="text-lg font-semibold" style={{ color: form.getValues().primaryColor }}>₪85</div>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-neutral-200 pb-2">
                    <div>
                      <div className="font-medium">{t("sample_item_4")}</div>
                      <div className="text-sm text-neutral-500">{t("sample_description")}</div>
                    </div>
                    <div className="text-lg font-semibold" style={{ color: form.getValues().primaryColor }}>₪72</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 py-4 border-t border-neutral-200 flex justify-between items-center">
              <div className="text-sm text-neutral-500">{t("powered_by")}</div>
              <div className="flex space-x-3 space-x-reverse">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: form.getValues().secondaryColor, color: 'white' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </div>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: form.getValues().secondaryColor, color: 'white' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </div>
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: form.getValues().secondaryColor, color: 'white' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Edit mode - allow customization
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t("branding")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="block mb-2">{t("restaurant_logo")}</Label>
                  <FileUpload
                    onFileSelected={(file) => setLogoFile(file)}
                    currentImageUrl={restaurant.logo || ""}
                    accept="image/*"
                    maxSize={2}
                    label={t("upload_logo")}
                    previewSize="lg"
                  />
                  <p className="text-sm text-neutral-500 mt-2">
                    {t("logo_requirements")}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="block mb-3">{t("restaurant_name")}</Label>
                  <Input value={restaurant.name} readOnly />
                  <p className="text-sm text-neutral-500 mt-2">
                    {t("name_edit_info")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("appearance_settings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div>
                    <Label className="block mb-3">{t("primary_color")}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <ColorPicker
                          value={form.watch("primaryColor")}
                          onChange={(color) => form.setValue("primaryColor", color)}
                          options={primaryColorOptions}
                        />
                        <div className="flex items-center mt-3">
                          <Input
                            value={form.watch("primaryColor")}
                            onChange={(e) => form.setValue("primaryColor", e.target.value)}
                            className="w-24 mr-3"
                          />
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: form.watch("primaryColor") }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        {getStyleSample(form.watch("primaryColor"))}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 mt-2">
                      {t("primary_color_description")}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="block mb-3">{t("secondary_color")}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <ColorPicker
                          value={form.watch("secondaryColor")}
                          onChange={(color) => form.setValue("secondaryColor", color)}
                          options={secondaryColorOptions}
                        />
                        <div className="flex items-center mt-3">
                          <Input
                            value={form.watch("secondaryColor")}
                            onChange={(e) => form.setValue("secondaryColor", e.target.value)}
                            className="w-24 mr-3"
                          />
                          <div 
                            className="w-6 h-6 rounded-full" 
                            style={{ backgroundColor: form.watch("secondaryColor") }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        {getStyleSample(form.watch("secondaryColor"))}
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 mt-2">
                      {t("secondary_color_description")}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="block">{t("rtl_support")}</Label>
                      <Switch 
                        checked={form.watch("rtl")} 
                        onCheckedChange={(checked) => form.setValue("rtl", checked)}
                      />
                    </div>
                    <p className="text-sm text-neutral-500 mt-2">
                      {t("rtl_description")}
                    </p>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 space-x-reverse">
                <Button variant="outline" onClick={() => form.reset()}>
                  <RefreshCcw className="ml-2 h-4 w-4" />
                  {t("reset")}
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)}>
                  <Save className="ml-2 h-4 w-4" />
                  {t("save_changes")}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
