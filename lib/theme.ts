// lib/theme.ts — theme constants shared by the server layout and the client toggle.
export const THEME_KEY = 'arden_theme';

/** Inline <head> script: sets the theme class before first paint (no flash). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`;
