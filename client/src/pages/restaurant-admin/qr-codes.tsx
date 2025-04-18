import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, QrCode, Share } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layouts/admin-layout";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";

export default function QRCodesManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("standard");
  const [qrSize, setQrSize] = useState(250);
  const [showBorder, setShowBorder] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [showText, setShowText] = useState(true);
  
  // Get the restaurant info
  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery({
    queryKey: [`/api/restaurants/${user?.restaurantId}`],
    queryFn: async () => {
      if (!user?.restaurantId) return null;
      const res = await apiRequest('GET', `/api/restaurants/${user.restaurantId}`);
      return res.json();
    },
    enabled: !!user?.restaurantId,
  });
  
  // Generate menu URL
  const menuUrl = useMemo(() => {
    if (!restaurant?.slug) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/menus/${restaurant.slug}`;
  }, [restaurant?.slug]);
  
  // Generate QR code URL
  const qrCodeUrl = useMemo(() => {
    if (!menuUrl) return '';
    
    // Encode the URL for the QR code
    const encodedUrl = encodeURIComponent(menuUrl);
    
    // Base QR code URL from QR Server API
    let url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodedUrl}&size=${qrSize}x${qrSize}&margin=10`;
    
    // Add color if available from the restaurant
    if (restaurant?.primaryColor) {
      const color = restaurant.primaryColor.replace('#', '');
      url += `&color=${color}`;
    }
    
    return url;
  }, [menuUrl, qrSize, restaurant?.primaryColor]);
  
  // Handle download QR code
  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `menu-qr-${restaurant?.slug || 'restaurant'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "הורדת קוד QR",
        description: "קוד ה-QR הורד בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה בהורדת קוד QR",
        description: "אירעה שגיאה בהורדת קוד ה-QR",
        variant: "destructive",
      });
    }
  };
  
  // Handle share QR code
  const handleShareQR = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `תפריט של ${restaurant?.name}`,
          text: `צפה בתפריט של ${restaurant?.name}`,
          url: menuUrl,
        });
        
        toast({
          title: "שיתוף תפריט",
          description: "התפריט שותף בהצלחה",
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(menuUrl);
        
        toast({
          title: "קישור הועתק",
          description: "קישור לתפריט הועתק ללוח",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בשיתוף",
        description: "אירעה שגיאה בשיתוף התפריט",
        variant: "destructive",
      });
    }
  };
  
  // Create the print-friendly QR code page
  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const restaurantName = restaurant?.name || 'מסעדה';
    const restaurantLogo = restaurant?.logo || '';
    const primaryColor = restaurant?.primaryColor || '#14b8a6';
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>קוד QR לתפריט - ${restaurantName}</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              max-width: 500px;
              margin: 0 auto;
              padding: ${showBorder ? '20px' : '0'};
              border: ${showBorder ? `2px solid ${primaryColor}` : 'none'};
              border-radius: 8px;
            }
            .header {
              margin-bottom: 20px;
              display: ${showLogo || showText ? 'block' : 'none'};
            }
            .logo {
              max-width: 100px;
              max-height: 100px;
              margin-bottom: 10px;
              display: ${showLogo && restaurantLogo ? 'inline-block' : 'none'};
            }
            h1 {
              color: ${primaryColor};
              font-size: 24px;
              margin: 10px 0;
              display: ${showText ? 'block' : 'none'};
            }
            p {
              color: #666;
              margin-bottom: 20px;
              display: ${showText ? 'block' : 'none'};
            }
            .qr-code {
              width: ${qrSize}px;
              height: ${qrSize}px;
              margin: 0 auto;
            }
            .footer {
              margin-top: 20px;
              font-size: 14px;
              color: #888;
              display: ${showText ? 'block' : 'none'};
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                padding: 0;
              }
              .qr-container {
                border: ${showBorder ? `2px solid ${primaryColor}` : 'none'};
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print();" style="margin-bottom: 20px; padding: 8px 16px; background-color: ${primaryColor}; color: white; border: none; border-radius: 4px; cursor: pointer;">
              הדפס קוד QR
            </button>
          </div>
          
          <div class="qr-container">
            <div class="header">
              ${showLogo && restaurantLogo ? `<img src="${restaurantLogo}" alt="${restaurantName}" class="logo">` : ''}
              ${showText ? `<h1>סרוק לצפייה בתפריט של ${restaurantName}</h1>` : ''}
              ${showText ? '<p>סרוק את קוד ה-QR באמצעות המצלמה בטלפון שלך לצפייה בתפריט</p>' : ''}
            </div>
            
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" width="${qrSize}" height="${qrSize}">
            </div>
            
            ${showText ? `<div class="footer">
              <p>${menuUrl}</p>
            </div>` : ''}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  if (isLoadingRestaurant) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <p>טוען נתונים...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (!restaurant) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <h2 className="text-2xl font-bold mb-2">לא נמצאה מסעדה</h2>
          <p className="text-muted-foreground mb-4">לא ניתן למצוא את פרטי המסעדה</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול קודי QR</h1>
          <p className="text-muted-foreground">יצירת ושיתוף קודי QR לתפריט שלך</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{restaurant.name}</CardTitle>
              <CardDescription>
                צור ושתף קודי QR לתפריט המסעדה שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="standard" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="standard" className="flex-1">סטנדרטי</TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1">מותאם אישית</TabsTrigger>
                  <TabsTrigger value="print" className="flex-1">הדפסה</TabsTrigger>
                </TabsList>
                
                <TabsContent value="standard" className="flex justify-center">
                  <div className="text-center">
                    <div className="border rounded-lg p-4 mb-4 inline-block">
                      {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="mx-auto" width="200" height="200" />}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      סרוק את קוד ה-QR כדי לצפות בתפריט
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button onClick={handleDownloadQR}>
                        <Download className="ml-2 h-4 w-4" />
                        הורד
                      </Button>
                      <Button variant="outline" onClick={handleShareQR}>
                        <Share className="ml-2 h-4 w-4" />
                        שתף קישור
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">גודל קוד QR</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <Button 
                          variant={qrSize === 200 ? "default" : "outline"} 
                          onClick={() => setQrSize(200)}
                          className="w-full"
                        >
                          קטן
                        </Button>
                        <Button 
                          variant={qrSize === 250 ? "default" : "outline"} 
                          onClick={() => setQrSize(250)}
                          className="w-full"
                        >
                          בינוני
                        </Button>
                        <Button 
                          variant={qrSize === 300 ? "default" : "outline"} 
                          onClick={() => setQrSize(300)}
                          className="w-full"
                        >
                          גדול
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center mt-6">
                      <div className="border rounded-lg p-4 mb-4 inline-block">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="mx-auto" width={Math.min(qrSize, 300)} height={Math.min(qrSize, 300)} />}
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button onClick={handleDownloadQR}>
                          <Download className="ml-2 h-4 w-4" />
                          הורד
                        </Button>
                        <Button variant="outline" onClick={handleShareQR}>
                          <Share className="ml-2 h-4 w-4" />
                          שתף קישור
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="print">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">אפשרויות הדפסה</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <Button 
                          variant={showBorder ? "default" : "outline"} 
                          onClick={() => setShowBorder(!showBorder)}
                          className="w-full"
                        >
                          {showBorder ? "עם מסגרת" : "ללא מסגרת"}
                        </Button>
                        <Button 
                          variant={showLogo ? "default" : "outline"} 
                          onClick={() => setShowLogo(!showLogo)}
                          className="w-full"
                        >
                          {showLogo ? "עם לוגו" : "ללא לוגו"}
                        </Button>
                        <Button 
                          variant={showText ? "default" : "outline"} 
                          onClick={() => setShowText(!showText)}
                          className="w-full"
                        >
                          {showText ? "עם טקסט" : "ללא טקסט"}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">גודל קוד QR</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <Button 
                          variant={qrSize === 200 ? "default" : "outline"} 
                          onClick={() => setQrSize(200)}
                          className="w-full"
                        >
                          קטן
                        </Button>
                        <Button 
                          variant={qrSize === 250 ? "default" : "outline"} 
                          onClick={() => setQrSize(250)}
                          className="w-full"
                        >
                          בינוני
                        </Button>
                        <Button 
                          variant={qrSize === 300 ? "default" : "outline"} 
                          onClick={() => setQrSize(300)}
                          className="w-full"
                        >
                          גדול
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-center mt-6">
                      <Button onClick={handlePrintQR}>
                        <QrCode className="ml-2 h-4 w-4" />
                        הדפס קוד QR
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>מידע שימושי</CardTitle>
              <CardDescription>
                מידע על השימוש בקודי QR לתפריט שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg mb-2">קישור לתפריט שלך</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 bg-muted rounded text-sm overflow-hidden overflow-ellipsis">
                    {menuUrl}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(menuUrl);
                      toast({
                        title: "הקישור הועתק",
                        description: "קישור לתפריט הועתק ללוח",
                      });
                    }}
                  >
                    העתק
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-lg mb-2">כיצד להשתמש בקודי QR</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                      1
                    </div>
                    <span>הורד או הדפס את קוד ה-QR מהאפשרויות משמאל</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                      2
                    </div>
                    <span>הצב את קוד ה-QR במקומות בולטים במסעדה, כגון דלת הכניסה, שולחנות, או תפריטים מודפסים</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                      3
                    </div>
                    <span>הלקוחות יכולים לסרוק את קוד ה-QR עם מצלמת הטלפון הנייד שלהם</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                      4
                    </div>
                    <span>הסריקה תוביל אותם ישירות לדף התפריט המקוון של המסעדה שלך</span>
                  </li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-lg mb-2">יתרונות של תפריט QR דיגיטלי</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 text-primary mt-0.5">•</div>
                    <span>עדכון קל ומהיר של התפריט ללא צורך בהדפסה מחדש</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 text-primary mt-0.5">•</div>
                    <span>הוספת תמונות ותיאורים מפורטים למנות</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 text-primary mt-0.5">•</div>
                    <span>חוויית משתמש נוחה ומודרנית ללקוחות</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="flex-shrink-0 text-primary mt-0.5">•</div>
                    <span>ידידותי לסביבה - הפחתת השימוש בנייר</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}