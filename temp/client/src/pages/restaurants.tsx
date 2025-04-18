import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLocale } from "@/contexts/locale-context";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  PlusCircle,
  Search,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { Restaurant, User, insertRestaurantSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function Restaurants() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchParams] = useState(new URLSearchParams(location.split("?")[1]));
  const action = searchParams.get("action");
  const idParam = searchParams.get("id");
  const restaurantId = idParam ? parseInt(idParam) : undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(!!action);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<number | undefined>(restaurantId);
  const [file, setFile] = useState<File | null>(null);

  const isSuperAdmin = user?.role === "super_admin";

  const { data: restaurants, isLoading: isLoadingRestaurants } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    enabled: !!user,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!user && isSuperAdmin,
  });

  const { data: currentRestaurant, isLoading: isLoadingCurrentRestaurant } = useQuery<Restaurant>({
    queryKey: ["/api/restaurants", currentRestaurantId],
    enabled: !!currentRestaurantId,
  });

  // Filter restaurant admins
  const restaurantAdmins = users?.filter(u => u.role === "restaurant_admin");

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(1, { message: t("name_required") }),
    description: z.string().optional(),
    adminId: z.number().min(1, { message: t("manager_required") }),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    status: z.string().default("setup"),
    primaryColor: z.string().default("#e65100"),
    secondaryColor: z.string().default("#f57c00"),
    rtl: z.boolean().default(true),
  });

  // Get filtered restaurants
  const filteredRestaurants = restaurants?.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Restaurant form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      adminId: isSuperAdmin ? 0 : user?.id ?? 0,
      phone: "",
      email: "",
      address: "",
      status: "setup",
      primaryColor: "#e65100",
      secondaryColor: "#f57c00",
      rtl: true,
    },
  });

  // Load current restaurant data into form when editing
  useEffect(() => {
    if (currentRestaurant && action === "edit") {
      form.reset({
        name: currentRestaurant.name,
        description: currentRestaurant.description || "",
        adminId: currentRestaurant.adminId,
        phone: currentRestaurant.phone || "",
        email: currentRestaurant.email || "",
        address: currentRestaurant.address || "",
        status: currentRestaurant.status,
        primaryColor: currentRestaurant.primaryColor || "#e65100",
        secondaryColor: currentRestaurant.secondaryColor || "#f57c00",
        rtl: currentRestaurant.rtl || false,
      });
    }
  }, [currentRestaurant, action, form]);

  // Handle dialog visibility based on URL parameters
  useEffect(() => {
    setShowDialog(!!action);
    if (action === "edit" && idParam) {
      setCurrentRestaurantId(parseInt(idParam));
    }
  }, [action, idParam]);

  // Reset URL when dialog is closed
  const closeDialog = () => {
    setShowDialog(false);
    setLocation("/restaurants");
    form.reset();
    setCurrentRestaurantId(undefined);
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (action === "edit" && currentRestaurantId) {
        // Update existing restaurant
        await apiRequest("PUT", `/api/restaurants/${currentRestaurantId}`, data);
        toast({
          title: t("success"),
          description: t("restaurant_updated"),
        });
      } else {
        // Create new restaurant
        await apiRequest("POST", "/api/restaurants", data);
        toast({
          title: t("success"),
          description: t("restaurant_created"),
        });
      }

      // Refresh restaurants data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      closeDialog();
    } catch (error) {
      console.error("Error saving restaurant:", error);
      toast({
        title: t("error"),
        description: t("restaurant_save_error"),
        variant: "destructive",
      });
    }
  };

  // Handle restaurant deletion
  const handleDeleteRestaurant = async () => {
    if (!currentRestaurantId) return;

    try {
      await apiRequest("DELETE", `/api/restaurants/${currentRestaurantId}`, undefined);
      toast({
        title: t("success"),
        description: t("restaurant_deleted"),
      });

      // Refresh restaurants data
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      setShowDeleteDialog(false);
      closeDialog();
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      toast({
        title: t("error"),
        description: t("restaurant_delete_error"),
        variant: "destructive",
      });
    }
  };

  // Handle add restaurant button click
  const handleAddRestaurant = () => {
    setCurrentRestaurantId(undefined);
    form.reset({
      name: "",
      description: "",
      adminId: isSuperAdmin ? 0 : user?.id ?? 0,
      phone: "",
      email: "",
      address: "",
      status: "setup",
      primaryColor: "#e65100",
      secondaryColor: "#f57c00",
      rtl: true as boolean,
    });
    setShowDialog(true);
    setLocation("/restaurants?action=add");
  };

  // Handle edit restaurant button click
  const handleEditRestaurant = (id: number) => {
    setCurrentRestaurantId(id);
    setLocation(`/restaurants?action=edit&id=${id}`);
  };

  // Handle view restaurant button click
  const handleViewRestaurant = (id: number) => {
    setLocation(`/restaurant/${id}/dashboard`);
  };

  // Handle delete restaurant button click
  const openDeleteDialog = (id: number) => {
    setCurrentRestaurantId(id);
    setShowDeleteDialog(true);
  };

  // Function to get status badge element
  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{t("active")}</Badge>;
    } else if (status === "inactive") {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">{t("inactive")}</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{t("setup")}</Badge>;
    }
  };

  if (isLoadingRestaurants || (isLoadingUsers && isSuperAdmin)) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-heading">{t("restaurants")}</h1>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative">
            <Input
              type="text"
              placeholder={t("search")}
              className="py-2 px-4 pr-10 rounded-lg border border-neutral-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-3 text-neutral-400 h-4 w-4" />
          </div>
          <Button onClick={handleAddRestaurant}>
            <PlusCircle className="ml-2 h-4 w-4" />
            {t("add_restaurant")}
          </Button>
        </div>
      </div>

      {/* Restaurants List */}
      <Card className="overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-neutral-200">
          <CardTitle className="text-lg font-semibold font-heading">{t("restaurants")}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("icon")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("name")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("manager")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("status")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("address")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("created_at")}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredRestaurants && filteredRestaurants.length > 0 ? (
                filteredRestaurants.map((restaurant) => {
                  const manager = users?.find(u => u.id === restaurant.adminId);
                  const createdDate = new Date(restaurant.createdAt).toLocaleDateString();

                  return (
                    <tr key={restaurant.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Avatar className="h-12 w-12 border-2 inline-block" style={{ borderColor: restaurant.primaryColor || '#e65100' }}>
                          {restaurant.logo ? (
                            <AvatarImage src={restaurant.logo} alt={restaurant.name} className="p-1" />
                          ) : (
                            <AvatarFallback style={{ backgroundColor: restaurant.primaryColor || '#e65100', color: 'white' }}>
                              {restaurant.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">{restaurant.name}</div>
                        <div className="text-sm text-neutral-500">{restaurant.phone || t("no_phone")}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">{manager?.name || "-"}</div>
                        <div className="text-sm text-neutral-500">{manager?.email || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(restaurant.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {restaurant.address || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {createdDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button variant="ghost" size="sm" onClick={() => handleViewRestaurant(restaurant.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditRestaurant(restaurant.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700" 
                            onClick={() => openDeleteDialog(restaurant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-neutral-500">
                    {searchTerm ? t("no_results") : t("no_restaurants")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <CardFooter className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-between">
          <Button variant="ghost" size="sm" disabled>
            {t("previous")}
          </Button>
          <span className="text-sm text-neutral-500">{t("page_info", { current: 1, total: 1 })}</span>
          <Button variant="ghost" size="sm" disabled>
            {t("next")}
          </Button>
        </CardFooter>
      </Card>

      {/* Restaurant Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {action === "edit" ? t("edit_restaurant_title") : t("add_restaurant_title")}
            </DialogTitle>
            <DialogDescription>
              {action === "edit" 
                ? t("edit_restaurant_description") 
                : t("add_restaurant_description")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FormLabel>{t("restaurant_logo")}</FormLabel>
                  <FileUpload
                    onFileSelected={(file) => setFile(file)}
                    currentImageUrl={currentRestaurant?.logo || ''}
                    accept="image/*"
                    maxSize={2}
                    label={t("upload_logo")}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("restaurant_name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isSuperAdmin && (
                  <FormField
                    control={form.control}
                    name="adminId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("manager")}</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_manager")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {restaurantAdmins?.map((admin) => (
                              <SelectItem key={admin.id} value={admin.id.toString()}>
                                {admin.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("status")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_status")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="setup">{t("setup")}</SelectItem>
                          <SelectItem value="active">{t("active")}</SelectItem>
                          <SelectItem value="inactive">{t("inactive")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("address")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("description")}</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="rtl"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-x-reverse rounded-md border p-3">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 text-primary focus:ring-primary border-neutral-300 rounded"
                        />
                      </FormControl>
                      <FormLabel className="mr-2 text-sm font-normal">{t("rtl_support")}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t("cancel")}
                </Button>
                {action === "edit" && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    {t("delete")}
                  </Button>
                )}
                <Button type="submit">
                  {action === "edit" ? t("save_changes") : t("add_restaurant")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              {t("confirm_delete")}
            </DialogTitle>
            <DialogDescription>
              {t("delete_restaurant_confirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteRestaurant}>
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}