import type { ReactNode } from 'react';

const lastUpdated = '24 octobre 2026';
const supportEmail = 'support@novadigital.dev';

function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-[#262a33] py-7 last:border-b-0">
      <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-[#c7c4d7]">{children}</div>
    </section>
  );
}

export function PrivacyPolicyView() {
  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="mb-8 border-b border-[#262a33] pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4cd7f6]">NovaDigital</p>
        <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Politique de confidentialité</h1>
        <p className="mt-3 text-sm text-[#a9afbf]">Dernière mise à jour : {lastUpdated}</p>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[#c7c4d7]">
          Cette politique explique quelles données NovaDigital traite lorsque vous consultez le site,
          créez un compte ou utilisez les formations et les outils d’apprentissage.
        </p>
      </header>

      <PolicySection title="Responsable et contact">
        <p>
          Le service est exploité sous le nom NovaDigital. Pour toute question ou demande concernant vos
          données personnelles, écrivez à <a className="text-[#c0c1ff] underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          Nous pouvons vous demander des informations raisonnables pour vérifier votre identité avant de traiter une demande.
        </p>
      </PolicySection>

      <PolicySection title="Données traitées et utilisation de Google">
        <p>Selon les fonctions que vous utilisez, NovaDigital peut traiter :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>les informations de compte : adresse e-mail, nom, identifiant de compte et, pour un compte créé par e-mail, un mot de passe stocké sous forme de hachage cryptographique ;</li>
          <li>les informations de connexion Google : identifiant Google unique, adresse e-mail, nom et, si Google le fournit, photo de profil ;</li>
          <li>les informations nécessaires à l’apprentissage : formations consultées, progression, leçons terminées, activité d’apprentissage et préférences de plan d’étude ;</li>
          <li>les informations nécessaires au fonctionnement et à la sécurité du service, comme les données techniques de connexion traitées par l’hébergeur.</li>
        </ul>
        <p>
          La connexion Google sert uniquement à vérifier votre identité, créer ou retrouver votre compte NovaDigital,
          afficher les informations de profil utiles et maintenir votre session. Nous demandons les informations de base du profil et de l’adresse e-mail ; nous ne
          demandons pas l’accès à Gmail, Google Drive ou à d’autres contenus de votre compte Google. Nous n’utilisons pas
          ces données Google pour la publicité et ne les vendons pas.
        </p>
      </PolicySection>

      <PolicySection title="Finalités et bases du traitement">
        <ul className="list-disc space-y-2 pl-5">
          <li>Créer et sécuriser votre compte, vous connecter et fournir les fonctions demandées : exécution du service que vous utilisez.</li>
          <li>Enregistrer votre progression et vos préférences d’apprentissage : fourniture des fonctions de formation.</li>
          <li>Protéger le site, prévenir les abus et résoudre les incidents : intérêt légitime à maintenir un service sûr et fonctionnel.</li>
          <li>Répondre à vos demandes relatives à votre compte ou à vos données : fournir l’assistance demandée et respecter nos obligations applicables.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Prestataires et partage des données">
        <p>
          Les données sont accessibles uniquement lorsque cela est nécessaire au fonctionnement du service. NovaDigital
          utilise Vercel pour l’hébergement et l’exécution de certaines fonctions serveur, et Supabase pour la base de
          données et le stockage des contenus. Google intervient lorsque vous choisissez la connexion Google.
        </p>
        <p>
          Le parcours panier actuellement présenté comme une démonstration ne débite aucun paiement. Si le parcours
          d’achat de formation via Notch Pay est activé, les informations nécessaires à la transaction sont transmises
          à ce prestataire. Les données nécessaires à la commande et son état peuvent être enregistrés dans la base
          NovaDigital ; NovaDigital ne stocke pas les numéros complets de carte bancaire.
        </p>
        <p>
          Ces prestataires traitent les données pour fournir leurs services et peuvent les héberger dans différentes
          régions. Ils appliquent leurs propres engagements de sécurité et de protection des données.
        </p>
      </PolicySection>

      <PolicySection title="Durée de conservation">
        <p>
          Les données de compte et de progression sont conservées tant que le compte est actif et aussi longtemps que
          nécessaire pour fournir les fonctions demandées. Vous pouvez demander leur suppression à l’adresse indiquée
          ci-dessus. Certaines informations de commande ou de sécurité peuvent être conservées plus longtemps lorsque
          la loi l’exige ou pour établir, exercer ou défendre un droit.
        </p>
      </PolicySection>

      <PolicySection title="Cookies essentiels">
        <p>
          La connexion utilise des cookies techniques nécessaires à la protection contre les requêtes frauduleuses et
          au maintien de votre session. La session peut rester active jusqu’à 14 jours, sauf déconnexion ou suppression
          des cookies dans votre navigateur. Le site n’intègre actuellement aucun cookie publicitaire ni outil de
          mesure d’audience tiers.
        </p>
      </PolicySection>

      <PolicySection title="Vos droits">
        <p>
          Selon la législation applicable, vous pouvez demander l’accès à vos données, leur rectification ou leur
          effacement, la limitation de certains traitements, vous opposer à certains traitements et demander la
          portabilité des données lorsque ce droit s’applique. Adressez votre demande à{' '}
          <a className="text-[#c0c1ff] underline underline-offset-4" href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          Vous pouvez également introduire une réclamation auprès de l’autorité de protection des données compétente,
          notamment la CNIL si vous résidez en France.
        </p>
      </PolicySection>

      <p className="pt-6 text-xs leading-6 text-[#8f96a6]">
        Cette politique peut être mise à jour si les fonctions ou les traitements du service évoluent. La date indiquée
        en haut de page correspond à la version actuellement publiée.
      </p>
    </article>
  );
}
