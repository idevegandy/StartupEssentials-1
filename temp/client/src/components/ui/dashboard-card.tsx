import { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/contexts/locale-context";

interface DashboardCardProps {
  icon: ReactNode;
  iconColor: string;
  iconBgColor: string;
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
}

export function DashboardCard({
  icon,
  iconColor,
  iconBgColor,
  title,
  value,
  change,
  changeLabel
}: DashboardCardProps) {
  const { t } = useLocale();
  
  const isPositiveChange = change !== undefined && change >= 0;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${iconBgColor} ${iconColor} flex items-center justify-center`} style={{ backgroundColor: 'rgb(var(--primary) / 0.1)' }}>
            {icon}
          </div>
          <div className="mr-4 flex-1">
            <p className="text-sm text-neutral-500">{title}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>
        
        {change !== undefined && (
          <div className={`mt-4 text-sm flex items-center ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveChange ? (
              <ArrowUp className="ml-1 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-1 h-4 w-4" />
            )}
            <span>
              {Math.abs(change)}% {changeLabel || t("from_last_month")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
