'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
}

// Context for Select component
const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}>({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
  triggerRef: React.createRef(),
});

export function Select({ value, onValueChange, children, className = '' }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, triggerRef }}>
      <div className={`relative ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(SelectContext);

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      className={`
        flex items-center justify-between w-full px-3 py-2
        text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
        rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${className}
      `}
      aria-haspopup="listbox"
      aria-expanded={open}
    >
      {children}
      <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
    </button>
  );
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const { open, setOpen, triggerRef } = React.useContext(SelectContext);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`
        absolute z-50 w-full mt-1 bg-white dark:bg-gray-800
        border border-gray-300 dark:border-gray-600 rounded-md shadow-lg
        ${className}
      `}
      role="listbox"
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;

  const handleClick = () => {
    onValueChange(value);
    setOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        w-full px-3 py-2 text-sm text-left
        ${isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }
        focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
        ${className}
      `}
      role="option"
      aria-selected={isSelected}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder = 'Select...' }: SelectValueProps) {
  const { value } = React.useContext(SelectContext);
  
  // Find the selected item's text
  const selectedText = React.useMemo(() => {
    if (!value) return placeholder;
    
    // This is a simplified version - in a real implementation,
    // we'd need to traverse children to find the matching SelectItem
    return value;
  }, [value, placeholder]);

  return (
    <span className="block truncate">
      {selectedText}
    </span>
  );
}