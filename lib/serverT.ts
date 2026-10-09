import { cookies } from 'next/headers';

type Locale = 'en' | 'fr';

const dict: Record<Locale, Record<string, Record<string, string>>> = {
  en: {
    blog: {
      title: 'Field Notes',
      noteSingular: '{{count}} note',
      notePlural: '{{count}} notes',
      noNotes: 'No notes yet.',
      latest: 'Latest',
      archive: 'Archive',
      readNote: 'Read note →',
    },
    noteDetail: {
      contents: 'Contents',
      actions: 'Actions',
      back: '← All notes',
      readSuffix: 'read',
    },
    shopDetail: {
      back: '← Back to shop',
      about: 'About',
      included: "What's included",
      media: 'Media',
      bookNow: 'Book now →',
      buyNow: 'Buy now →',
      viewDemo: 'View demo →',
      price: 'Price',
      questions: 'Have questions?',
    },
    projectDetail: {
      back: '← All projects',
      brief: 'The Brief',
      approach: 'Approach',
      result: 'Result',
      gallery: 'Gallery',
      comingSoonTitle: 'Case study coming soon',
      comingSoonBody: "The full write-up for this build isn't published yet — the live project and a quick chat can fill in the gaps.",
      quickFacts: 'Quick Facts',
      category: 'Category',
      stack: 'Stack',
      visitSite: 'Visit live site',
      discuss: 'Discuss this build',
      questions: 'Working on something similar?',
    },
  },
  fr: {
    blog: {
      title: 'Notes de terrain',
      noteSingular: '{{count}} note',
      notePlural: '{{count}} notes',
      noNotes: "Aucune note pour l'instant.",
      latest: 'Dernière',
      archive: 'Archives',
      readNote: 'Lire la note →',
    },
    noteDetail: {
      contents: 'Sommaire',
      actions: 'Actions',
      back: '← Toutes les notes',
      readSuffix: 'de lecture',
    },
    shopDetail: {
      back: '← Retour à la boutique',
      about: 'À propos',
      included: 'Ce qui est inclus',
      media: 'Médias',
      bookNow: 'Réserver →',
      buyNow: 'Acheter →',
      viewDemo: 'Voir la démo →',
      price: 'Prix',
      questions: 'Des questions ?',
    },
    projectDetail: {
      back: '← Tous les projets',
      brief: 'Le Contexte',
      approach: 'Approche',
      result: 'Résultat',
      gallery: 'Galerie',
      comingSoonTitle: 'Étude de cas à venir',
      comingSoonBody: "Le compte-rendu complet de ce projet n'est pas encore publié — le site en ligne et un échange rapide peuvent combler les blancs en attendant.",
      quickFacts: 'En bref',
      category: 'Catégorie',
      stack: 'Stack',
      visitSite: 'Voir le site en ligne',
      discuss: 'Discuter de ce projet',
      questions: 'Un projet similaire en tête ?',
    },
  },
};

export function getLocale(): Locale {
  try {
    const lang = cookies().get('arden_lang')?.value;
    if (lang === 'fr' || lang === 'en') return lang;
  } catch {}
  return 'en';
}

export function makeT(locale: Locale) {
  return function t(key: string, params?: Record<string, string | number>): string {
    const dot = key.indexOf('.');
    const ns  = dot === -1 ? key : key.slice(0, dot);
    const sub = dot === -1 ? '' : key.slice(dot + 1);
    const val = dict[locale]?.[ns]?.[sub] ?? key;
    if (!params) return val;
    return val.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? _));
  };
}
