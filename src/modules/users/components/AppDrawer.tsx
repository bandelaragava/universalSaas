// src/modules/users/components/AppDrawer.tsx
import React, { ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function AppDrawer({ isOpen, onClose, title, children }: AppDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <aside
        className={`absolute right-0 top-0 h-full w-80 bg-card dark:bg-gray-800 rounded-l-lg shadow-xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {title || "Drawer"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
          {children}
        </div>
      </aside>
    </div>
  );
}




