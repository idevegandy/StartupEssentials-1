import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Share } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Restaurant } from "@shared/schema";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

export default function QrCodeModal({ isOpen, onClose, restaurant }: QrCodeModalProps) {
  const { toast } = useToast();
  const [menuUrl, setMenuUrl] = useState("");
  
  useEffect(() => {
    // Get the base URL from environment or fallback to current host
    const baseUrl = window.location.origin;
    setMenuUrl(`${baseUrl}/menus/${restaurant.slug}`);
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
      downloadLink.download = `${restaurant.slug}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `תפריט ${restaurant.name}`,
          text: `צפה בתפריט של ${restaurant.name}`,
          url: menuUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopyUrl(); // Fallback to copy if Web Share API is not available
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>קוד QR של {restaurant.name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center">
          {/* QR Code Image */}
          <div className="w-48 h-48 bg-white border border-gray-200 p-2 flex items-center justify-center mb-4">
            <QRCodeSVG
              id="qr-code-svg"
              value={menuUrl}
              size={192}
              level="H"
              includeMargin={true}
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>
          
          {/* Menu URL */}
          <div className="w-full mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">קישור לתפריט</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <Input
                type="text"
                value={menuUrl}
                readOnly
                className="flex-1 min-w-0 block w-full rounded-r-md text-sm"
                id="menu-url"
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
          
          {/* Download & Share Buttons */}
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
        
        <DialogFooter className="flex flex-row-reverse sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
