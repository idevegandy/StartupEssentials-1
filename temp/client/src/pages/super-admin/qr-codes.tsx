import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, Share, ExternalLink } from "lucide-react";
import AdminLayout from "@/components/layouts/admin-layout";
import { apiRequest } from "@/lib/queryClient";

interface Restaurant {
  id: number;
  name: string;
  slug: string;
  logo?: string;
}

export default function QRCodesManagement() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [qrSize, setQrSize] = useState("medium");
  const [activeTab, setActiveTab] = useState("standard");

  // Query to fetch all restaurants
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['/api/restaurants'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/restaurants');
      const data = await res.json();
      return data as Restaurant[];
    },
  });

  const getQRCodeUrl = (slug: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/menus/${slug}`;
  };

  const getMenuUrl = (slug: string) => {
    return `/menus/${slug}`;
  };

  const downloadQRCode = () => {
    if (!selectedRestaurant) return;
    
    const restaurant = restaurants?.find(r => r.id === selectedRestaurant);
    if (!restaurant) return;
    
    // In a real app, we would generate and download the QR code image
    alert(`QR code for ${restaurant.name} will be downloaded`);
  };

  const printQRCode = () => {
    if (!selectedRestaurant) return;
    
    const restaurant = restaurants?.find(r => r.id === selectedRestaurant);
    if (!restaurant) return;
    
    // In a real app, we would prepare the QR code for printing
    alert(`QR code for ${restaurant.name} will be prepared for printing`);
  };

  const shareQRCode = () => {
    if (!selectedRestaurant) return;
    
    const restaurant = restaurants?.find(r => r.id === selectedRestaurant);
    if (!restaurant) return;
    
    // In a real app, we would share the QR code
    alert(`QR code for ${restaurant.name} will be shared`);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <p className="text-lg">טוען נתונים...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול קודי QR</h1>
          <p className="text-muted-foreground">יצירת וניהול קודי QR עבור תפריטי המסעדות</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>יצירת קוד QR</CardTitle>
            <CardDescription>בחר מסעדה כדי ליצור או לנהל את קוד ה-QR שלה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">בחר מסעדה</label>
                <Select onValueChange={(value) => setSelectedRestaurant(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מסעדה" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants?.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">גודל</label>
                <Select value={qrSize} onValueChange={setQrSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר גודל" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">קטן</SelectItem>
                    <SelectItem value="medium">בינוני</SelectItem>
                    <SelectItem value="large">גדול</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="standard">סטנדרטי</TabsTrigger>
                <TabsTrigger value="custom">מותאם אישית</TabsTrigger>
              </TabsList>
              <TabsContent value="standard" className="py-4">
                <div className="flex flex-col items-center">
                  {selectedRestaurant ? (
                    <>
                      <div className="border p-6 rounded-lg mb-6 bg-white">
                        {/* Placeholder for the QR code image */}
                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                          קוד QR
                        </div>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground">
                          סריקת קוד ה-QR תוביל למסך התפריט של המסעדה
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {restaurants?.find(r => r.id === selectedRestaurant)?.name}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={downloadQRCode}>
                          <Download className="h-4 w-4 ml-2" />
                          הורדה
                        </Button>
                        <Button variant="outline" onClick={printQRCode}>
                          <Printer className="h-4 w-4 ml-2" />
                          הדפסה
                        </Button>
                        <Button variant="outline" onClick={shareQRCode}>
                          <Share className="h-4 w-4 ml-2" />
                          שיתוף
                        </Button>
                      </div>
                      <div className="mt-4">
                        <Button 
                          variant="link" 
                          onClick={() => {
                            const restaurant = restaurants?.find(r => r.id === selectedRestaurant);
                            if (restaurant) {
                              window.open(getMenuUrl(restaurant.slug), '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4 ml-1" />
                          צפה בתפריט
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-center py-12 text-muted-foreground">
                      בחר מסעדה כדי לראות את קוד ה-QR שלה
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="custom" className="py-4">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">צבע ראשי</label>
                      <Input type="color" defaultValue="#000000" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">צבע רקע</label>
                      <Input type="color" defaultValue="#FFFFFF" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-2 block">תוסף לוגו</label>
                      <Input type="file" accept="image/*" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">מיתוג</label>
                      <Input placeholder="טקסט נוסף (אופציונלי)" />
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <Button disabled={!selectedRestaurant}>
                      יצירת קוד QR מותאם אישית
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>כל קודי ה-QR</CardTitle>
            <CardDescription>רשימת כל קודי ה-QR של המסעדות במערכת</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {restaurants?.map((restaurant) => (
                <Card key={restaurant.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex justify-center mb-3">
                      {/* Placeholder for the QR code image */}
                      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                        קוד QR
                      </div>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedRestaurant(restaurant.id)}>
                        ערוך
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getMenuUrl(restaurant.slug), '_blank')}
                      >
                        צפה בתפריט
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}