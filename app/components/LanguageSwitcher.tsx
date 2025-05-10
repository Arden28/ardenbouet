'use client'; // 👈 very important!

import { useTranslation } from 'react-i18next';
import { LanguagesIcon } from 'lucide-react'; // 🌐 Icon
import { useState } from 'react';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
  
    const changeLanguage = (lng: string) => {
      i18n.changeLanguage(lng);
      setOpen(false); // close dropdown after selecting
    };
  
    return (
      <div className="relative z-10 inline-block text-left">
        {/* Trigger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
        >
          <LanguagesIcon className="w-5 h-5" />
        </button>
  
        {/* Dropdown menu */}
        {open && (
          <div className="absolute right-0 w-32 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <button
                onClick={() => changeLanguage('en')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                🇬🇧 English
              </button>
              <button
                onClick={() => changeLanguage('fr')}
                className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
              >
                🇫🇷 Français
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
