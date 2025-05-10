import React, { createContext, useState, useEffect } from 'react';
import { translations } from './data/translation';


  export const AppContext = createContext();

  export const AppProvider = ({ children }) => {
    // Initialize from localStorage or default values
    const [language, setLanguage] = useState(() => {
      const savedLanguage = localStorage.getItem('language');
      return savedLanguage && ['en', 'fr'].includes(savedLanguage) ? savedLanguage : 'en';
    });

    // Save to localStorage on change
    useEffect(() => {
      localStorage.setItem('language', language);
    }, [language]);

    const t = (key) => translations[language][key] || key;


  return (
    <AppContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};