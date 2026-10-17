import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from '@/lib/serverT';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing use of ardenbouet.me, the blog, shop, and related services.',
  alternates: {
    canonical: 'https://ardenbouet.me/terms',
    languages: {
      en: 'https://ardenbouet.me/terms',
      fr: 'https://ardenbouet.me/fr/terms',
    },
  },
};

const LAST_UPDATED = 'October 18, 2026';

export default function TermsPage() {
  const locale = getLocale();
  const isFr = locale === 'fr';

  return (
    <main className="blog-ui mx-auto max-w-[680px] px-6 py-16 sm:py-20">
      <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#9b9b9b]">
        {isFr ? 'Légal' : 'Legal'}
      </p>
      <h1 className="mt-3 font-story text-[34px] leading-[42px] text-[#242424] dark:text-[#e6e6e6] sm:text-[40px] sm:leading-[48px]">
        {isFr ? 'Conditions d’utilisation' : 'Terms of Use'}
      </h1>
      <p className="mt-3 text-[14px] text-[#6b6b6b]">
        {isFr ? 'Dernière mise à jour' : 'Last updated'}: {LAST_UPDATED}
      </p>

      <div className="mt-12 space-y-10 text-[16px] leading-[28px] text-[#3f3f3f] dark:text-[#b3b3b3]">
        {isFr ? <TermsFr /> : <TermsEn />}
      </div>

      <p className="mt-16 text-[14px] text-[#6b9b9b]">
        <Link href={isFr ? '/fr' : '/'} className="hover:text-[#242424] dark:hover:text-[#e6e6e6]">
          ← {isFr ? 'Accueil' : 'Home'}
        </Link>
        <span className="mx-2 text-[#d4d4d4]">·</span>
        <Link href={isFr ? '/fr/privacy' : '/privacy'} className="hover:text-[#242424] dark:hover:text-[#e6e6e6]">
          {isFr ? 'Confidentialité' : 'Privacy Policy'}
        </Link>
      </p>
    </main>
  );
}

function TermsEn() {
  return (
    <>
      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">1. Agreement</h2>
        <p className="mt-3">
          By using <strong className="text-[#242424] dark:text-[#e6e6e6]">ardenbouet.me</strong> (the “Site”), including the blog, shop, newsletter, writer tools, and booking features, you agree to these Terms and the Privacy Policy.
          If you do not agree, do not use the Site.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">2. The service</h2>
        <p className="mt-3">
          The Site provides portfolio content, articles, digital products and services for sale, optional reader accounts, writer invitations, donations, and meeting scheduling.
          Features may change, pause, or end at any time without notice.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">3. Accounts</h2>
        <p className="mt-3">
          Some features require signing in with Google or GitHub. You are responsible for activity under your account and for keeping provider access secure.
          We may suspend or terminate accounts that abuse the service, spam, or violate these Terms.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">4. Content</h2>
        <p className="mt-3">
          Site content (articles, designs, code samples, product materials) is owned by Arden Bouet or licensed partners unless stated otherwise.
          You may not copy, resell, or redistribute paid digital products beyond the license granted at purchase.
        </p>
        <p className="mt-3">
          If you post comments or other user content, you grant us a non-exclusive license to display and moderate it on the Site.
          Do not post illegal, harmful, or infringing material.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">5. Shop & payments</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Prices are shown on product pages and may change.</li>
          <li>Payments are processed by Stripe. Additional Stripe terms may apply.</li>
          <li>Digital products are generally delivered via download link or email after successful payment.</li>
          <li>Because digital goods are delivered immediately, refunds are limited except where required by law or if a file is defective and we cannot fix it.</li>
          <li>Services (e.g. consulting packages) are delivered according to the description on the product page or a separate agreement.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">6. Newsletter & communications</h2>
        <p className="mt-3">
          If you subscribe, you agree to receive occasional emails. You can unsubscribe via the link in any message.
          We may also send transactional emails (receipts, booking confirmations, security notices).
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">7. Bookings</h2>
        <p className="mt-3">
          Meeting slots are subject to availability. You agree to provide accurate contact details.
          Cancellations should be made with reasonable notice using the link provided in the confirmation when available.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">8. Acceptable use</h2>
        <p className="mt-3">You agree not to:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Attempt to break, scrape aggressively, or overload the Site.</li>
          <li>Use the Site for unlawful purposes.</li>
          <li>Impersonate others or harvest personal data.</li>
          <li>Share paid product files publicly or in a way that violates the purchase license.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">9. Disclaimers</h2>
        <p className="mt-3">
          The Site and content are provided “as is”. Articles and code samples are for information and education; they are not professional legal, financial, or engineering advice for your specific situation.
          We do not warrant uninterrupted or error-free operation.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">10. Limitation of liability</h2>
        <p className="mt-3">
          To the fullest extent permitted by law, Arden Bouet is not liable for indirect, incidental, or consequential damages arising from use of the Site or purchased products.
          Total liability for any claim related to a purchase is limited to the amount you paid for that purchase.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">11. Governing law</h2>
        <p className="mt-3">
          These Terms are governed by the laws of Kenya, without regard to conflict-of-law rules, unless mandatory consumer protections in your country require otherwise.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">12. Changes</h2>
        <p className="mt-3">
          We may update these Terms. The “Last updated” date will change when we do.
          Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">13. Contact</h2>
        <p className="mt-3">
          Questions: <a href="mailto:hello@ardenbouet.me" className="text-[#2467AC] underline underline-offset-2">hello@ardenbouet.me</a>
        </p>
      </section>
    </>
  );
}

function TermsFr() {
  return (
    <>
      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">1. Acceptation</h2>
        <p className="mt-3">
          En utilisant <strong className="text-[#242424] dark:text-[#e6e6e6]">ardenbouet.me</strong> (le « Site »), y compris le blog, la boutique, la newsletter, les outils auteurs et les réservations, vous acceptez ces Conditions et la Politique de confidentialité.
          Sinon, n’utilisez pas le Site.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">2. Le service</h2>
        <p className="mt-3">
          Le Site propose un portfolio, des articles, des produits et services numériques, des comptes lecteurs optionnels, des invitations auteurs, des dons et la prise de rendez-vous.
          Les fonctionnalités peuvent évoluer, être suspendues ou arrêtées sans préavis.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">3. Comptes</h2>
        <p className="mt-3">
          Certaines fonctions nécessitent une connexion Google ou GitHub. Vous êtes responsable de l’activité de votre compte.
          Nous pouvons suspendre un compte en cas d’abus, de spam ou de violation des présentes Conditions.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">4. Contenu</h2>
        <p className="mt-3">
          Le contenu du Site appartient à Arden Bouet ou à des partenaires, sauf mention contraire.
          Vous ne pouvez pas copier ni revendre les produits numériques payants au-delà de la licence d’achat.
        </p>
        <p className="mt-3">
          En publiant des commentaires, vous nous accordez une licence non exclusive pour les afficher et les modérer.
          Pas de contenu illégal, nuisible ou contrefaisant.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">5. Boutique & paiements</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Les prix sont indiqués sur les pages produits et peuvent changer.</li>
          <li>Les paiements sont traités par Stripe.</li>
          <li>Les produits numériques sont généralement livrés par lien de téléchargement ou e-mail après paiement.</li>
          <li>Les remboursements sont limités (livraison immédiate), sauf obligation légale ou fichier défectueux non corrigeable.</li>
          <li>Les services sont fournis selon la description du produit ou un accord séparé.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">6. Newsletter</h2>
        <p className="mt-3">
          En vous inscrivant, vous acceptez de recevoir des e-mails occasionnels. Désinscription possible via le lien dans chaque message.
          E-mails transactionnels (reçus, confirmations) possibles.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">7. Réservations</h2>
        <p className="mt-3">
          Les créneaux dépendent des disponibilités. Fournissez des coordonnées exactes.
          Annulez avec un préavis raisonnable via le lien de confirmation lorsque disponible.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">8. Usage acceptable</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Ne pas tenter de compromettre, surcharger ou scraper abusivement le Site.</li>
          <li>Pas d’usage illégal.</li>
          <li>Pas d’usurpation d’identité ni de collecte de données personnelles.</li>
          <li>Ne pas diffuser publiquement des fichiers de produits payants hors licence.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">9. Avertissements</h2>
        <p className="mt-3">
          Le Site et son contenu sont fournis « en l’état ». Articles et extraits de code sont informatifs ; ce ne sont pas des conseils professionnels adaptés à votre cas.
          Pas de garantie de disponibilité sans interruption.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">10. Responsabilité</h2>
        <p className="mt-3">
          Dans les limites autorisées par la loi, Arden Bouet n’est pas responsable des dommages indirects liés à l’usage du Site ou des produits.
          La responsabilité totale pour un achat est limitée au montant payé pour cet achat.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">11. Droit applicable</h2>
        <p className="mt-3">
          Ces Conditions sont régies par le droit kényan, sauf dispositions impératives de protection des consommateurs de votre pays.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">12. Modifications</h2>
        <p className="mt-3">
          Ces Conditions peuvent être mises à jour. La date en haut de page sera actualisée.
          L’usage continu vaut acceptation.
        </p>
      </section>

      <section>
        <h2 className="font-sans text-[18px] font-semibold text-[#242424] dark:text-[#e6e6e6]">13. Contact</h2>
        <p className="mt-3">
          Questions : <a href="mailto:hello@ardenbouet.me" className="text-[#2467AC] underline underline-offset-2">hello@ardenbouet.me</a>
        </p>
      </section>
    </>
  );
}