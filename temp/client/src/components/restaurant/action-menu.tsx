import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

interface ActionMenuProps {
  onView: () => void;
  onEdit: () => void;
  onQRCode: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
}

export default function ActionMenu({
  onView,
  onEdit,
  onQRCode,
  onResetPassword,
  onDelete
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  return (
    <div ref={menuRef} className="relative inline-block text-right">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        <MoreVertical className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 origin-top-left rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <button
              onClick={() => {
                onView();
                setIsOpen(false);
              }}
              className="block w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <i className="fas fa-eye ml-2"></i>צפה בתפריט
            </button>
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="block w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <i className="fas fa-edit ml-2"></i>ערוך מסעדה
            </button>
            <button
              onClick={() => {
                onResetPassword();
                setIsOpen(false);
              }}
              className="block w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <i className="fas fa-key ml-2"></i>איפוס סיסמה
            </button>
            <button
              onClick={() => {
                onQRCode();
                setIsOpen(false);
              }}
              className="block w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <i className="fas fa-qrcode ml-2"></i>קוד QR
            </button>
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700"
            >
              <i className="fas fa-trash ml-2"></i>מחק מסעדה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
