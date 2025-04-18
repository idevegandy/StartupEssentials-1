import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  children
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="mt-4 sm:mt-0 flex items-center">
        {children}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="bg-primary-700 hover:bg-primary-800 text-white">
            <i className="fas fa-plus ml-2"></i>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
