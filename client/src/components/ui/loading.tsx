import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  text?: string;
}

export default function Loading({ size = "medium", text = "טוען..." }: LoadingProps) {
  const sizes = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-12">
      <Loader2 className={`${sizes[size]} animate-spin text-primary-600 mb-2`} />
      {text && <p className="text-slate-500 dark:text-slate-400 text-sm">{text}</p>}
    </div>
  );
}
