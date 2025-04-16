import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, Download, Settings, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/layouts/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function QRCodePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrSize, setQrSize] = useState<number>(300);
  const [colorInvert, setColorInvert] = useState<boolean>(false);
  const [primaryColor, setPrimaryColor] = useState<string>("#000000");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Fetch restaurant data
  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['/api/restaurants', user?.restaurantId],
    queryFn: async () => {
      if (!user?.restaurantId) return null;
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}`);
      return res.json();
    },
    enabled: !!user?.restaurantId
  });

  // Generate QR code URL
  const getQRCodeUrl = (size: number = 300) => {
    if (!restaurant?.slug) return '';
    
    const menuUrl = encodeURIComponent(`${window.location.origin}/menus/${restaurant.slug}`);
    const colorParam = primaryColor.replace('#', '');
    const bgParam = backgroundColor.replace('#', '');
    
    return `https://api.qrserver.com/v1/create-qr-code/?data=${menuUrl}&size=${size}x${size}&color=${colorParam}&bgcolor=${bgParam}`;
  };

  // Get menu URL
  const getMenuUrl = () => {
    if (!restaurant?.slug) return '';
    return `${window.location.origin}/menus/${restaurant.slug}`;
  };

  // Copy menu URL to clipboard
  const copyMenuUrl = () => {
    navigator.clipboard.writeText(getMenuUrl());
    toast({
      title: "הועתק לזכרון",
      description: "קישור התפריט הועתק ללוח"
    });
  };

  // Download QR code as PNG
  const downloadQRCode = () => {
    if (imageRef.current && imageRef.current.complete) {
      const canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(imageRef.current, 0, 0);
        
        // Add restaurant name as text at the bottom
        if (restaurant?.name) {
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = primaryColor;
          ctx.textAlign = 'center';
          ctx.fillText(restaurant.name, canvas.width / 2, canvas.height - 20);
        }
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${restaurant?.slug || 'restaurant'}-qr-code.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        toast({
          title: "QR הורד בהצלחה",
          description: "קוד QR נשמר בהתקן שלך"
        });
      }
    }
  };

  // Update QR code when settings change
  useEffect(() => {
    if (restaurant?.primaryColor) {
      setPrimaryColor(restaurant.primaryColor);
    }
  }, [restaurant]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">קוד QR</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href="/restaurant-admin/menu-settings">
                <Settings className="ml-2 h-4 w-4" />
                הגדרות תפריט
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p>טוען נתונים...</p>
        ) : !restaurant?.slug ? (
          <Card>
            <CardHeader>
              <CardTitle>אין כתובת לתפריט</CardTitle>
              <CardDescription>
                יש להגדיר כתובת תפריט בהגדרות המסעדה כדי ליצור קוד QR
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/restaurant-admin/menu-settings">
                  הגדרות תפריט
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>קוד QR לתפריט המקוון</CardTitle>
                  <CardDescription>
                    קוד QR לסריקה ישירה לתפריט המקוון של {restaurant.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="p-4 border rounded-lg bg-white">
                    {getQRCodeUrl() && (
                      <>
                        <img 
                          ref={imageRef}
                          src={getQRCodeUrl(qrSize)}
                          alt="QR Code" 
                          className={colorInvert ? "filter invert" : ""}
                          style={{ 
                            backgroundColor: backgroundColor,
                            maxWidth: "100%",
                            height: "auto"
                          }}
                        />
                        <div className="text-center mt-2 font-semibold" style={{ color: primaryColor }}>
                          {restaurant.name}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center space-x-2">
                  <Button variant="outline" onClick={downloadQRCode}>
                    <Download className="ml-2 h-4 w-4" />
                    הורד כתמונה
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>כתובת תפריט מקוון</CardTitle>
                  <CardDescription>
                    כתובת URL של התפריט המקוון שלך
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 border rounded w-full overflow-x-auto text-left" dir="ltr">
                      <code className="text-sm">{getMenuUrl()}</code>
                    </div>
                    <Button variant="outline" size="icon" onClick={copyMenuUrl}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>התאמה אישית</CardTitle>
                <CardDescription>
                  התאם את העיצוב של קוד ה-QR שלך
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">גודל</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[200, 300, 400].map((size) => (
                      <Button
                        key={size}
                        variant={qrSize === size ? "default" : "outline"}
                        onClick={() => setQrSize(size)}
                      >
                        {size}px
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">צבע קוד</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="p-1 h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 p-2 border rounded text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">צבע רקע</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="p-1 h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 p-2 border rounded text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="block text-sm font-medium">היפוך צבעים</label>
                  <input
                    type="checkbox"
                    checked={colorInvert}
                    onChange={(e) => setColorInvert(e.target.checked)}
                    className="ml-2 h-4 w-4"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  קודי QR שנוצרו יכולים להיסרק על ידי רוב מכשירי הסלולר באמצעות המצלמה.
                </p>
              </CardFooter>
            </Card>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">טיפים לשימוש בקוד QR</h2>
          <Card>
            <CardContent className="p-6">
              <ul className="space-y-3 list-disc list-inside text-muted-foreground">
                <li>מקם את קוד ה-QR במקום בולט בכניסה למסעדה.</li>
                <li>הדפס את קוד ה-QR על תפריטים פיזיים, שלטים ועלוני פרסום.</li>
                <li>ודא שהקוד מודפס בגודל מספיק גדול כדי שניתן יהיה לסרוק אותו בקלות.</li>
                <li>אל תקמר או תעקם את הקוד QR בעת ההדפסה - זה עלול לפגוע ביכולת הסריקה.</li>
                <li>לפני הפצה, בדוק את הקוד עם מספר טלפונים כדי לוודא שהוא עובד כראוי.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}