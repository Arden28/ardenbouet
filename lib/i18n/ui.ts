// lib/i18n/ui.ts — EN/FR strings for the account, auth, writer, donation and booking UI.
// Pure module (usable from server and client). Keys are flat "area.key"; {var} interpolation.
import type { Locale } from './config';

const en = {
  // Auth
  'auth.joinTitle': 'Join Arden’s blog.',
  'auth.signInTitle': 'Welcome back.',
  'auth.joinBody': 'Create an account to clap, respond, highlight, save stories and follow new writing.',
  'auth.signInBody': 'Sign in to pick up where you left off.',
  'auth.continueWith': 'Continue with {provider}',
  'auth.haveAccount': 'Already have an account?',
  'auth.noAccount': 'No account?',
  'auth.switchToSignIn': 'Sign in',
  'auth.switchToJoin': 'Create one',
  'auth.terms': 'By continuing, you agree to the Terms of Service and acknowledge the Privacy Policy. We only use your name, email and avatar from the provider.',
  'auth.notConfigured': 'Sign-in is not configured yet.',
  'auth.error.OAuthAccountNotLinked': 'This email is already linked to another sign-in method. Use the provider you signed up with.',
  'auth.error.AccessDenied': 'Access was denied. Your account may be suspended.',
  'auth.error.default': 'Sign-in failed. Please try again.',
  'auth.signedInAs': 'Signed in as {name}',
  'auth.signOut': 'Sign out',
} as const;

export type UiKey = keyof typeof en;

const fr: Record<UiKey, string> = {
  'auth.joinTitle': 'Rejoignez le blog d’Arden.',
  'auth.signInTitle': 'Bon retour parmi nous.',
  'auth.joinBody': 'Créez un compte pour applaudir, répondre, surligner, enregistrer des articles et suivre les nouvelles publications.',
  'auth.signInBody': 'Connectez-vous pour reprendre là où vous vous étiez arrêté.',
  'auth.continueWith': 'Continuer avec {provider}',
  'auth.haveAccount': 'Vous avez déjà un compte ?',
  'auth.noAccount': 'Pas de compte ?',
  'auth.switchToSignIn': 'Se connecter',
  'auth.switchToJoin': 'Créez-en un',
  'auth.terms': 'En continuant, vous acceptez les Conditions d’utilisation et la Politique de confidentialité. Nous utilisons uniquement votre nom, votre e-mail et votre avatar.',
  'auth.notConfigured': 'La connexion n’est pas encore configurée.',
  'auth.error.OAuthAccountNotLinked': 'Cet e-mail est déjà associé à une autre méthode de connexion. Utilisez celle avec laquelle vous vous êtes inscrit.',
  'auth.error.AccessDenied': 'Accès refusé. Votre compte est peut-être suspendu.',
  'auth.error.default': 'La connexion a échoué. Veuillez réessayer.',
  'auth.signedInAs': 'Connecté en tant que {name}',
  'auth.signOut': 'Se déconnecter',
};

const dicts: Record<Locale, Record<UiKey, string>> = { en, fr };

export type UiT = (key: UiKey, vars?: Record<string, string | number>) => string;

export function uiT(locale: Locale): UiT {
  const d = dicts[locale] ?? en;
  return (key, vars) => {
    let s: string = d[key] ?? en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    return s;
  };
}
