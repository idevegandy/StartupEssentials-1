import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Restaurant } from "@shared/schema";
import { QRCodeSVG } from "qrcode.react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Download,
  Share,
  QrCode,
  Link as LinkIcon,
  Loader2,
  Facebook,
  Twitter,
  Mail,
  Smartphone,
} from "lucide-react";

export default function QrCodePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [menuUrl, setMenuUrl] = useState("");
  const [qrSize, setQrSize] = useState(200);
  const [qrColor, setQrColor] = useState("#000000");
  const [qrBackground, setQrBackground] = useState("#FFFFFF");

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: [user?.restaurantId ? `/api/restaurants/${user.restaurantId}` : null],
    enabled: !!user?.restaurantId,
  });

  useEffect(() => {
    if (restaurant) {
      // Get the base URL from environment or fallback to current host
      const baseUrl = window.location.origin;
      setMenuUrl(`${baseUrl}/menus/${restaurant.slug}`);
    }
  }, [restaurant]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    toast({
      title: "קישור הועתק",
      description: "קישור התפריט הועתק ללוח",
    });
  };

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      // Download the PNG file
      const downloadLink = document.createElement("a");
      downloadLink.download = `${restaurant?.slug || 'restaurant'}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `תפריט ${restaurant?.name}`,
          text: `צפה בתפריט של ${restaurant?.name}`,
          url: menuUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopyUrl(); // Fallback to copy if Web Share API is not available
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!restaurant) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <QrCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">לא נמצאו נתונים</h2>
          <p className="text-gray-500">לא ניתן למצוא מידע על המסעדה</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-slide-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">קוד QR</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>קוד QR של {restaurant.name}</CardTitle>
                <CardDescription>
                  צור, התאם אישית והורד את קוד ה-QR עבור המסעדה שלך
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="space-y-6">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="basic">בסיסי</TabsTrigger>
                    <TabsTrigger value="customize">התאמה אישית</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-64 h-64 bg-white border border-gray-200 p-4 flex items-center justify-center rounded-md shadow-sm">
                        <QRCodeSVG
                          id="qr-code-svg"
                          value={menuUrl}
                          size={200}
                          level="H"
                          includeMargin={true}
                          fgColor="#000000"
                          bgColor="#FFFFFF"
                        />
                      </div>

                      <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">קישור לתפריט</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <Input
                            type="text"
                            value={menuUrl}
                            readOnly
                            className="flex-1 min-w-0 block rounded-r-md text-sm"
                          />
                          <Button
                            type="button"
                            onClick={handleCopyUrl}
                            className="inline-flex items-center px-3 py-2 rounded-l-md"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex space-x-3 space-x-reverse w-full">
                        <Button
                          type="button"
                          onClick={handleDownload}
                          className="flex-1 inline-flex justify-center items-center"
                        >
                          <Download className="ml-1 h-4 w-4" />
                          הורדה
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleShare}
                          className="flex-1 inline-flex justify-center items-center"
                        >
                          <Share className="ml-1 h-4 w-4" />
                          שיתוף
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="customize" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">גודל</label>
                        <Input
                          type="number"
                          value={qrSize}
                          onChange={(e) => setQrSize(parseInt(e.target.value) || 200)}
                          min={100}
                          max={400}
                          step={10}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">צבע</label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={qrColor}
                            onChange={(e) => setQrColor(e.target.value)}
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                          <input
                            type="color"
                            value={qrColor}
                            onChange={(e) => setQrColor(e.target.value)}
                            className="w-10 h-10 p-1 border rounded-md"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">צבע רקע</label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={qrBackground}
                            onChange={(e) => setQrBackground(e.target.value)}
                            pattern="^#[0-9A-Fa-f]{6}$"
                          />
                          <input
                            type="color"
                            value={qrBackground}
                            onChange={(e) => setQrBackground(e.target.value)}
                            className="w-10 h-10 p-1 border rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center mt-4">
                      <div className="w-64 h-64 bg-white border border-gray-200 p-4 flex items-center justify-center rounded-md shadow-sm">
                        <QRCodeSVG
                          id="qr-code-svg-custom"
                          value={menuUrl}
                          size={qrSize}
                          level="H"
                          includeMargin={true}
                          fgColor={qrColor}
                          bgColor={qrBackground}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        const svg = document.getElementById("qr-code-svg-custom");
                        if (!svg) return;
                        
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement("canvas");
                        const ctx = canvas.getContext("2d");
                        const img = new Image();
                        
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          const pngFile = canvas.toDataURL("image/png");
                          
                          // Download the PNG file
                          const downloadLink = document.createElement("a");
                          downloadLink.download = `${restaurant.slug}-custom-qr-code.png`;
                          downloadLink.href = pngFile;
                          downloadLink.click();
                        };
                        
                        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                      }}
                      className="w-full"
                    >
                      <Download className="ml-2 h-4 w-4" />
                      הורד קוד QR מותאם אישית
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>שיתוף תפריט</CardTitle>
                <CardDescription>
                  שתף את התפריט באמצעות מדיה חברתית או ישירות
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שיתוף באמצעות קישור</label>
                  <div className="flex rounded-md shadow-sm">
                    <Input
                      type="text"
                      value={menuUrl}
                      readOnly
                      className="flex-1 min-w-0 block rounded-r-md text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center px-3 py-2 rounded-l-md"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">שיתוף במדיה חברתית</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="flex items-center justify-center"
                      onClick={() => {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(menuUrl)}`, '_blank');
                      }}
                    >
                      <Facebook className="ml-2 h-4 w-4" />
                      פייסבוק
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center"
                      onClick={() => {
                        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(menuUrl)}&text=${encodeURIComponent(`תפריט ${restaurant.name}`)}`, '_blank');
                      }}
                    >
                      <Twitter className="ml-2 h-4 w-4" />
                      טוויטר
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center"
                      onClick={() => {
                        window.open(`mailto:?subject=${encodeURIComponent(`תפריט ${restaurant.name}`)}&body=${encodeURIComponent(`צפה בתפריט של ${restaurant.name}: ${menuUrl}`)}`, '_blank');
                      }}
                    >
                      <Mail className="ml-2 h-4 w-4" />
                      אימייל
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-center"
                      onClick={() => {
                        window.open(`https://wa.me/?text=${encodeURIComponent(`צפה בתפריט של ${restaurant.name}: ${menuUrl}`)}`, '_blank');
                      }}
                    >
                      <Smartphone className="ml-2 h-4 w-4" />
                      וואטסאפ
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">משובים יכילו:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm text-gray-600">
                      <LinkIcon className="ml-2 h-4 w-4 text-primary-500" />
                      קישור ישיר לתפריט
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                      <QrCode className="ml-2 h-4 w-4 text-primary-500" />
                      קוד QR סריק
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
