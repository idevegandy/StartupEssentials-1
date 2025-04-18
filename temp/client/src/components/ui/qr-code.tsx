import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Printer, RefreshCw } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
  imageSettings?: {
    src: string;
    height: number;
    width: number;
    excavate: boolean;
  };
  onRegenerate?: () => void;
  restaurantName?: string;
}

export function QRCodeGenerator({
  value,
  size = 128,
  bgColor = "#FFFFFF",
  fgColor = "#000000",
  level = "M",
  includeMargin = true,
  imageSettings,
  onRegenerate,
  restaurantName
}: QRCodeGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const handleDownload = () => {
    if (!qrCodeRef.current) return;

    // Create a canvas element
    const canvas = document.createElement("canvas");
    const svgElement = qrCodeRef.current.querySelector("svg");
    
    if (!svgElement) return;
    
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svg64 = btoa(xml);
    const b64Start = 'data:image/svg+xml;base64,';
    const image64 = b64Start + svg64;
    
    // Create an image to draw to canvas
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      
      // Add restaurant name if provided
      if (restaurantName) {
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(restaurantName, canvas.width / 2, canvas.height + 20);
      }
      
      // Create a download link
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${restaurantName || 'restaurant'}-qrcode.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = image64;
  };

  const handlePrint = useReactToPrint({
    content: () => qrCodeRef.current,
    documentTitle: `${restaurantName || 'Restaurant'} QR Code`,
    onBeforeGetContent: () => {
      setIsLoading(true);
      return new Promise<void>((resolve) => {
        resolve();
      });
    },
    onAfterPrint: () => {
      setIsLoading(false);
    },
  });

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  return (
    <div className="flex flex-col">
      <div ref={qrCodeRef} className="bg-white border border-neutral-200 rounded-lg p-4 inline-block">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
          level={level}
          includeMargin={includeMargin}
          imageSettings={imageSettings}
        />
        {restaurantName && (
          <div className="text-center mt-2 text-sm font-medium">{restaurantName}</div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="default" onClick={handleRegenerate} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("generate_qr")}
        </Button>
        
        <Button variant="outline" onClick={handleDownload} disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          {t("download")}
        </Button>
        
        <Button variant="outline" onClick={handlePrint} disabled={isLoading}>
          <Printer className="mr-2 h-4 w-4" />
          {t("print")}
        </Button>
      </div>
    </div>
  );
}
