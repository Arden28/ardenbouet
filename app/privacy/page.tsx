import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from '@/lib/serverT';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Arden Bouet collects, uses, and protects your information.',
  alternates: {
    canonical: 'https://ardenbouet.me/privacy',
    languages: {
      en: 'https://ardenbouet.me/privacy',
      fr: 'https://ardenbouet.me/fr/privacy',
    },
  },
};

const LAST_UPDATED = 'October 18, 2026';

export default function PrivacyPage() {
  const locale = getLocale();
  const isFr = locale === 'fr';

  return (
    <main className="blog-ui mx-auto max-w-[680px] px-6 py-16 sm:py-20">
      <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#9b9b9b]">
        {isFr ? 'Légal' : 'Legal'}
      </p>
      <h1 className="mt-3 font-story text-[34px] leading-[42px] text-[#242424] dark:text-[#e6e6e6] sm:text-[40px] sm:leading-[48px]">
        {isFr ? 'Politique de confidentialité' : 'Privacy Policy'}
      </h1>
      <p className="mt-3 text-[14px] text-[#6b6b6b]">
        {isFr ? 'Dernière mise à jour' : 'Last updated'}: {LAST_UPDATED}
      </p>

      <div className="prose-legal mt-12 space-y-10 text-[16px] leading-[28px] text-[#3f3f3f] dark:text-[#b3b3b3]">
        {isFr ? <PrivacyFr /> : <PrivacyEn />}
      </div>

      <p className="mt-16 text-[14px] text-[#6b6b6b]">
        <Link href={isFr ? '/fr' : '/'} className="hover:text-[#242424] dark:hover:text-[#e6e6e6]">
          ← {isFr ? 'Accueil' : 'Home'}
        </Link>
        <span className="mx-2 text-[#d4d4d4]">·</span>
        <Link href={isFr ? '/fr/terms' : '/terms'} className="hover:text-[#242424] dark:hover:text-[#e6e6e6]">
          {isFr ? 'Conditions d’utilisation' : 'Terms of Use'}
        </Link>
      </p>
    </main>
  );
}

function PrivacyEn() {
  return (
    <>
      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">1. Who we are</h2>
        <p className="mt-3">
          This website is operated by <strong className="text-[#242424] dark:text-[#e6e6e6]">Arden Bouet</strong> (“I”, “me”, “we”).
          It includes a personal portfolio, blog, digital shop, newsletter, and optional booking tools.
          Contact: <a href="mailto:hello@ardenbouet.me" className="text-[#2467AC] underline underline-offset-2">hello@ardenbouet.me</a>.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">2. Information we collect</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Account data</strong>, when you sign in with Google or GitHub: name, email, profile image, and provider account id.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Contact form</strong>, name, email, project details, budget range, and related fields you submit.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Newsletter</strong>, email address and confirmation status.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Shop & payments</strong>, name, email, product purchased, and payment references processed by Stripe (we do not store full card numbers).</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Bookings</strong>, name, email, timezone, notes, and meeting time if you schedule a call.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Blog activity</strong>, optional highlights, bookmarks, claps, and comments when signed in; anonymous clap keys for visitors.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Technical data</strong>, IP address, user agent, and basic server logs for security and abuse prevention.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">3. How we use information</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>To operate the site, blog, shop, and writer tools.</li>
          <li>To respond to inquiries and deliver digital products or services you purchase.</li>
          <li>To send newsletter issues you subscribed to (you can unsubscribe anytime).</li>
          <li>To schedule and manage meetings.</li>
          <li>To prevent spam, fraud, and abuse.</li>
          <li>To improve reliability and content (aggregated, non-identifying analytics where used).</li>
        </ul>
        <p className="mt-3">We do not sell your personal data.</p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">4. Processors & third parties</h2>
        <p className="mt-3">We rely on trusted providers to run the site:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Hosting / infrastructure</strong>, application and database hosting.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Stripe</strong>, payment processing for the shop and donations.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Google / GitHub</strong>, authentication when you choose to sign in.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Google Calendar</strong>, only if you book a meeting and calendar integration is enabled.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Email delivery</strong>, transactional mail (confirmations, receipts, newsletter).</li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">5. Cookies & local storage</h2>
        <p className="mt-3">
          We use essential cookies/session storage for sign-in, security, and preferences (for example theme).
          We may use privacy-friendly analytics. You can clear cookies in your browser at any time.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">6. Data retention</h2>
        <p className="mt-3">
          We keep account, order, and booking records as long as needed to provide the service, meet legal obligations, and resolve disputes.
          Newsletter emails are kept until you unsubscribe or request deletion.
          Server logs are rotated on a reasonable schedule.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">7. Your rights</h2>
        <p className="mt-3">
          Depending on where you live, you may request access, correction, export, or deletion of your personal data.
          Email <a href="mailto:hello@ardenbouet.me" className="text-[#2467AC] underline underline-offset-2">hello@ardenbouet.me</a> and we will respond within a reasonable time.
          If you signed in with Google or GitHub, you can also revoke access from your provider settings.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">8. Children</h2>
        <p className="mt-3">
          This site is not directed at children under 16. We do not knowingly collect their personal information.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">9. Changes</h2>
        <p className="mt-3">
          We may update this policy from time to time. The “Last updated” date at the top will change when we do.
          Continued use of the site after changes means you accept the updated policy.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">10. Contact</h2>
        <p className="mt-3">
          Questions about privacy: <a href="mailto:hello@ardenbouet.me" className="text-[#2467AC] underline underline-offset-2">hello@ardenbouet.me</a>
        </p>
      </section>
    </>
  );
}

function PrivacyFr() {
  return (
    <>
      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">1. Qui nous sommes</h2>
        <p className="mt-3">
          Ce site est exploité par <strong className="text-[#242424] dark:text-[#e6e6e6]">Arden Bouet</strong> (« je », « nous »).
          Il comprend un portfolio, un blog, une boutique numérique, une newsletter et des outils de réservation optionnels.
          Contact : <a href="mailto:hello@ardenbouet.me" className="text-[#2467AC] underline underline-offset-2">hello@ardenbouet.me</a>.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">2. Données collectées</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Compte</strong>, connexion Google ou GitHub : nom, e-mail, image de profil, identifiant fournisseur.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Formulaire de contact</strong>, nom, e-mail, détails du projet, budget, etc.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Newsletter</strong>, adresse e-mail et statut de confirmation.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Boutique & paiements</strong>, nom, e-mail, produit acheté, références de paiement via Stripe (pas de numéro de carte complet stocké chez nous).</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Réservations</strong>, nom, e-mail, fuseau horaire, notes, créneau si vous planifiez un appel.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Activité blog</strong>, surlignages, favoris, claps et commentaires (compte) ; clés anonymes pour les visiteurs.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Données techniques</strong>, adresse IP, user-agent, journaux serveur pour la sécurité.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">3. Utilisation des données</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Faire fonctionner le site, le blog, la boutique et les outils auteurs.</li>
          <li>Répondre aux demandes et livrer les produits ou services achetés.</li>
          <li>Envoyer la newsletter (désinscription possible à tout moment).</li>
          <li>Gérer les rendez-vous.</li>
          <li>Prévenir le spam, la fraude et les abus.</li>
          <li>Améliorer la fiabilité et le contenu (analytique agrégée le cas échéant).</li>
        </ul>
        <p className="mt-3">Nous ne vendons pas vos données personnelles.</p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">4. Sous-traitants</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Hébergement</strong>, application et base de données.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Stripe</strong>, paiements boutique et dons.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Google / GitHub</strong>, authentification.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">Google Calendar</strong>, si vous réservez un créneau.</li>
          <li><strong className="text-[#242424] dark:text-[#e6e6e6]">E-mail</strong>, messages transactionnels et newsletter.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">5. Cookies</h2>
        <p className="mt-3">
          Cookies et stockage local essentiels pour la session, la sécurité et les préférences (ex. thème).
          Analytique respectueuse de la vie privée le cas échéant. Vous pouvez effacer les cookies dans votre navigateur.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">6. Conservation</h2>
        <p className="mt-3">
          Comptes, commandes et réservations conservés le temps nécessaire au service, aux obligations légales et aux litiges.
          E-mails newsletter jusqu’à désinscription ou demande de suppression. Journaux serveur rotatifs.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">7. Vos droits</h2>
        <p className="mt-3">
          Selon votre pays, vous pouvez demander l’accès, la rectification, l’export ou la suppression de vos données.
          Écrivez à <a href="mailto:hello@ardenbouet.me" className="text-[#2467AC] underline underline-offset-2">hello@ardenbouet.me</a>.
          Vous pouvez aussi révoquer l’accès Google/GitHub dans les réglages du fournisseur.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">8. Mineurs</h2>
        <p className="mt-3">Ce site ne s’adresse pas aux moins de 16 ans. Nous ne collectons pas sciemment leurs données.</p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">9. Modifications</h2>
        <p className="mt-3">
          Cette politique peut être mise à jour. La date en haut de page sera actualisée.
          L’utilisation continue du site vaut acceptation de la version en vigueur.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">10. Contact</h2>
        <p className="mt-3">
          Questions : <a href="mailto:hello@ardenbouet.me" className="text-[#2467AC] underline underline-offset-2">hello@ardenbouet.me</a>
        </p>
      </section>
    </>
  );
}