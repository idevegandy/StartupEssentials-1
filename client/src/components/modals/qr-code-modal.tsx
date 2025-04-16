import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeUrl, getMenuUrl } from "@/lib/utils";
import { Restaurant } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Printer, Download } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

export default function QRCodeModal({ isOpen, onClose, restaurant }: QRCodeModalProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const qrCodeUrl = generateQRCodeUrl(restaurant.slug);
  const menuUrl = getMenuUrl(restaurant.slug);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(menuUrl).then(() => {
      toast({
        title: "הקישור הועתק ללוח",
        description: "כעת תוכל להדביק את הקישור בכל מקום",
      });
    });
  };
  
  const downloadQRCode = () => {
    setIsDownloading(true);
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${restaurant.slug}-qrcode.png`;
    
    // Simulate download delay
    setTimeout(() => {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloading(false);
    }, 1000);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">קוד QR לסריקה</DialogTitle>
          <DialogDescription>
            לקוחות יכולים לסרוק את הקוד כדי לצפות בתפריט
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-2 py-4 flex flex-col items-center">
          <h4 className="text-slate-900 dark:text-white font-medium text-lg mb-2">
            {restaurant.name}
          </h4>
          
          <div className="bg-white p-4 rounded-lg mb-4 shadow">
            <div className="w-48 h-48 flex items-center justify-center">
              <img 
                src={qrCodeUrl} 
                alt={`QR Code for ${restaurant.name}`} 
                className="w-full h-full"
              />
            </div>
          </div>
          
          <div className="w-full mb-4">
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                קישור לתפריט:
              </span>
            </div>
            <div className="flex">
              <Input 
                type="text" 
                readOnly 
                value={menuUrl}
                className="rounded-l-none"
              />
              <Button
                onClick={copyToClipboard}
                className="rounded-r-none"
                type="button"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={downloadQRCode}
              disabled={isDownloading}
            >
              <Download className="ml-2 h-4 w-4" />
              {isDownloading ? "מוריד..." : "הורדת קוד QR"}
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => window.print()}
            >
              <Printer className="ml-2 h-4 w-4" />
              הדפסה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
