import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Menu, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function Header({ title, onMenuToggle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-neutral-200 py-2 px-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-4 text-neutral-600 hover:text-primary" 
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6 text-primary"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <h1 className="text-xl font-semibold text-neutral-700">{title}</h1>
        </div>
      </div>
      <div className="flex items-center">
        <div className="relative mr-4">
          <div className="flex items-center border border-neutral-300 rounded-md px-3 py-1 bg-white">
            <Search className="h-4 w-4 text-neutral-400 mr-2" />
            <Input 
              type="text" 
              placeholder="Search files..." 
              className="border-none shadow-none focus-visible:ring-0 h-7 text-sm" 
            />
          </div>
        </div>
        <Button className="bg-primary hover:bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm flex items-center">
          <Settings className="mr-1 h-4 w-4" />
          Settings
        </Button>
      </div>
    </header>
  );
}
