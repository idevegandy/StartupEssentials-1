import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarItem } from '@/types';
import { ChevronRight, ChevronDown, RefreshCw, Folder, Code, FileText, AlertTriangle } from 'lucide-react';

interface SidebarProps {
  items: SidebarItem[];
  onSelectFile: (file: SidebarItem) => void;
  isVisible: boolean;
}

export function Sidebar({ items, onSelectFile, isVisible }: SidebarProps) {
  const [filterText, setFilterText] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const filteredItems = filterText.trim() === '' 
    ? items 
    : filterItemsByText(items, filterText.toLowerCase());

  function filterItemsByText(items: SidebarItem[], text: string): SidebarItem[] {
    return items
      .filter(item => item.name.toLowerCase().includes(text) || 
        (item.type === 'folder' && item.children?.some(child => 
          child.name.toLowerCase().includes(text))))
      .map(item => {
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            children: filterItemsByText(item.children, text)
          };
        }
        return item;
      });
  }

  const renderItems = (items: SidebarItem[], level = 0) => {
    return items.map(item => {
      const isExpanded = expandedFolders[item.id];
      
      if (item.type === 'folder') {
        return (
          <div key={item.id}>
            <div 
              className={`flex items-center py-1 px-2 rounded hover:bg-neutral-100 cursor-pointer text-neutral-700`}
              style={{ paddingLeft: `${(level * 0.5) + 0.5}rem` }}
              onClick={() => toggleFolder(item.id)}
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4 mr-1 text-neutral-500" /> : 
                <ChevronRight className="h-4 w-4 mr-1 text-neutral-500" />
              }
              <Folder className="h-4 w-4 mr-1 text-neutral-500" />
              <span className="text-sm">{item.name}</span>
            </div>
            
            {isExpanded && item.children && (
              <div className="ml-4">
                {renderItems(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div 
            key={item.id}
            className={`flex items-center py-1 px-2 rounded ${item.isActive ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-neutral-100 text-neutral-700'} cursor-pointer`}
            style={{ paddingLeft: `${(level * 0.5) + 0.5}rem` }}
            onClick={() => onSelectFile(item)}
          >
            {item.hasErrors ? (
              <AlertTriangle className="h-4 w-4 mr-1 text-error" />
            ) : (
              item.name.endsWith('.js') || item.name.endsWith('.ts') || item.name.endsWith('.jsx') || item.name.endsWith('.tsx') ? 
                <Code className="h-4 w-4 mr-1 text-neutral-500" /> : 
                <FileText className="h-4 w-4 mr-1 text-neutral-500" />
            )}
            <span className="text-sm">{item.name}</span>
          </div>
        );
      }
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-700">Project Files</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
        <div className="mt-3 relative">
          <Input
            type="text"
            placeholder="Filter files..."
            className="w-full border border-neutral-300 rounded-md px-3 py-1.5 text-sm"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>
      
      <nav className="p-2">
        {renderItems(filteredItems)}
      </nav>
    </aside>
  );
}
