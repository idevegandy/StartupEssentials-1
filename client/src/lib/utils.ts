import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number): string {
  return `₪${(amount / 100).toFixed(0)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function getBaseUrl(): string {
  return window.location.origin;
}

export function generateQRCodeUrl(slug: string): string {
  const baseUrl = getBaseUrl();
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${baseUrl}/menus/${slug}`)}`;
}

export function getMenuUrl(slug: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/menus/${slug}`;
}

export const iconOptions = [
  { value: 'utensils', label: 'סכו״ם', icon: 'utensils' },
  { value: 'burger', label: 'המבורגר', icon: 'burger' },
  { value: 'pizza-slice', label: 'פיצה', icon: 'pizza-slice' },
  { value: 'ice-cream', label: 'גלידה', icon: 'ice-cream' },
  { value: 'coffee', label: 'קפה', icon: 'coffee' },
  { value: 'beer', label: 'בירה', icon: 'beer' },
  { value: 'wine-glass', label: 'יין', icon: 'wine-glass' },
  { value: 'cocktail', label: 'קוקטייל', icon: 'cocktail' },
  { value: 'fish', label: 'דגים', icon: 'fish' },
  { value: 'bacon', label: 'בשר', icon: 'bacon' },
  { value: 'cheese', label: 'גבינה', icon: 'cheese' },
  { value: 'carrot', label: 'ירקות', icon: 'carrot' },
  { value: 'apple-alt', label: 'פירות', icon: 'apple-alt' },
  { value: 'bread-slice', label: 'לחם', icon: 'bread-slice' },
  { value: 'cookie', label: 'עוגיות', icon: 'cookie' },
  { value: 'drumstick-bite', label: 'עוף', icon: 'drumstick-bite' },
  { value: 'egg', label: 'ביצים', icon: 'egg' },
  { value: 'lemon', label: 'הדרים', icon: 'lemon' },
  { value: 'pepper-hot', label: 'חריף', icon: 'pepper-hot' },
];
