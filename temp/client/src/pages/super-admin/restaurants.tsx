import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, ExternalLink, QrCode, Store, ToggleLeft, ToggleRight, Trash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
  admin?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function RestaurantsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  // Query to fetch all restaurants
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/restaurants');
      const data = await res.json();
      return data as Restaurant[];
    },
  });

  // Toggle restaurant status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/restaurants/${id}`, { isActive });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "סטטוס המסעדה עודכן",
        description: data.isActive 
          ? "המסעדה הופעלה בהצלחה ועכשיו זמינה למשתמשים" 
          : "המסעדה הושבתה בהצלחה ואינה זמינה למשתמשים",
      });
      setIsStatusDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון סטטוס המסעדה",
        description: "אירעה שגיאה, אנא נסה שנית",
        variant: "destructive",
      });
    },
  });

  // Delete restaurant mutation
  const deleteRestaurantMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/restaurants/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "המסעדה נמחקה בהצלחה",
        description: "המסעדה הוסרה מהמערכת",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants'] });
    },
    onError: () => {
      toast({
        title: "שגיאה במחיקת המסעדה",
        description: "אירעה שגיאה, אנא נסה שנית",
        variant: "destructive",
      });
    },
  });

  // Handle toggling restaurant status
  const handleToggleStatus = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsStatusDialogOpen(true);
  };

  // Handle deleting a restaurant
  const handleDeleteRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsDeleteDialogOpen(true);
  };

  // Filter restaurants based on search query
  const filteredRestaurants = restaurants?.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ניהול מסעדות</h1>
            <p className="text-muted-foreground">ניהול כל המסעדות במערכת</p>
          </div>
          <Button asChild>
            <a href="/super-admin/qr-codes">
              <QrCode className="ml-2 h-4 w-4" />
              ניהול קודי QR
            </a>
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>רשימת מסעדות</CardTitle>
              <CardDescription>ניהול מסעדות פעילות ולא פעילות</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <Input
                placeholder="חיפוש לפי שם או סלאג..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>טוען נתונים...</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70px]">סטטוס</TableHead>
                      <TableHead>שם</TableHead>
                      <TableHead className="hidden md:table-cell">מנהל</TableHead>
                      <TableHead className="hidden md:table-cell">דוא"ל</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRestaurants && filteredRestaurants.length > 0 ? (
                      filteredRestaurants.map((restaurant) => (
                        <TableRow key={restaurant.id} className={!restaurant.isActive ? "opacity-60" : ""}>
                          <TableCell>
                            <div className="flex items-center">
                              <Switch
                                checked={restaurant.isActive}
                                onCheckedChange={() => handleToggleStatus(restaurant)}
                                className="data-[state=checked]:bg-green-500"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              {restaurant.logo ? (
                                <div className="w-8 h-8 rounded overflow-hidden">
                                  <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded">
                                  <Store className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div className="mr-2 rtl:mr-0 rtl:ml-2">
                                <div className="font-medium">{restaurant.name}</div>
                                <div className="text-xs text-muted-foreground">/{restaurant.slug}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {restaurant.admin?.name || "לא מוגדר"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {restaurant.admin?.email || "לא מוגדר"}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/menus/${restaurant.slug}`, '_blank')}
                                title="צפה בתפריט"
                                className="h-8 w-8 p-0"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(restaurant)}
                                title={restaurant.isActive ? "השבת מסעדה" : "הפעל מסעדה"}
                                className="h-8 w-8 p-0"
                              >
                                {restaurant.isActive ? (
                                  <ToggleRight className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                asChild
                              >
                                <a href={`/restaurant-admin/dashboard?id=${restaurant.id}`}>
                                  <Edit className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRestaurant(restaurant)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          לא נמצאו מסעדות
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toggle Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedRestaurant?.isActive ? "השבתת מסעדה" : "הפעלת מסעדה"}</DialogTitle>
            <DialogDescription>
              {selectedRestaurant?.isActive
                ? "האם ברצונך להשבית את המסעדה? מסעדה מושבתת לא תהיה זמינה למשתמשים אך הנתונים יישמרו."
                : "האם ברצונך להפעיל את המסעדה מחדש? המסעדה תהיה זמינה למשתמשים."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="status-switch" className="font-medium">סטטוס המסעדה</Label>
                <Switch
                  id="status-switch"
                  checked={selectedRestaurant ? !selectedRestaurant.isActive : false}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedRestaurant?.isActive
                  ? "השבתת המסעדה תמנע את הגישה אליה, אך הנתונים יישמרו במערכת."
                  : "הפעלת המסעדה תאפשר למשתמשים לצפות בה שוב."}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              ביטול
            </Button>
            <Button 
              onClick={() => {
                if (selectedRestaurant) {
                  toggleStatusMutation.mutate({
                    id: selectedRestaurant.id,
                    isActive: !selectedRestaurant.isActive
                  });
                }
              }}
              disabled={toggleStatusMutation.isPending}
            >
              {toggleStatusMutation.isPending 
                ? "מעדכן..." 
                : selectedRestaurant?.isActive ? "השבת מסעדה" : "הפעל מסעדה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Restaurant Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את המסעדה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו אינה הפיכה. מחיקת המסעדה תגרום למחיקת כל הנתונים שלה, כולל התפריטים והקטגוריות.
              <div className="mt-2 font-medium">
                שקול להשבית את המסעדה במקום למחוק אותה.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (selectedRestaurant) {
                  deleteRestaurantMutation.mutate(selectedRestaurant.id);
                }
              }}
              disabled={deleteRestaurantMutation.isPending}
            >
              {deleteRestaurantMutation.isPending ? "מוחק..." : "מחק מסעדה"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}