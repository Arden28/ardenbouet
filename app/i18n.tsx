import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@/lib/i18n/resources';

// The URL decides the language (/fr prefix → middleware → x-locale). Components get a per-request
// clone pinned to that locale from <I18nProvider> (app/I18nProvider.tsx); server code uses getT().
i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    initAsync: false,
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr'],
    interpolation: { escapeValue: false },
  });

export default i18n;
