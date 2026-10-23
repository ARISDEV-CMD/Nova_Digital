/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, PromoCode } from '../utils/shop-logic.ts';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'nexus-saas',
    sku: 'NX-NEXT15-FULL',
    title: 'Nexus SaaS Starter Kit',
    subtitle: 'Next.js 14/15, Stripe Billing, Supabase Auth, Emails React et dashboards prêts.',
    category: 'boilerplates',
    categoryLabel: 'SaaS Boilerplate',
    priceEur: 69,
    oldPriceEur: 119,
    rating: 4.95,
    reviewCount: 142,
    badge: 'Best Seller',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR48kTeJZSudKRgyUf0FGm12Bv08EIPABioG8L33AhP7u2hpoGiXToV18UKdERwodMn2feh3EfodM2CWE7Mnk39siwNj4fjKbGsUa7UuODYvXYVoRQ6_t7xw2R4WSvMSIma5Pu3W31QLG96HJA7qzb4B84yL_uCK1nSQwmDg_Q8ua0Yvv2CcMSGJFMxWvYBfhsIxzaUeDIgJ1AGdbTwPzDL7Gkfw2Hi5b7amAZygLKwMl97wZSe5kK',
    deliveryType: 'instant',
    formatLabel: 'Next.js 15 AppRouter',
    fileSize: '34.2 Mo',
    tags: ['Next.js 15', 'TypeScript', 'Supabase Auth', 'Stripe + Mobile Money', 'Docker Ready'],
    techStack: ['Next.js 15', 'TypeScript 5.6', 'Tailwind CSS v4', 'Supabase RLS', 'Stripe Billing'],
    githubRepo: 'novadigital/nexus-saas-enterprise',
    description: 'Stack complète Next.js 14/15 avec App Router, Server Actions, authentification Supabase sécurisée par RLS, abonnements Stripe & passerelles Mobile Money intégrées, emails transactionnels Resend et interface Tailwind v4.',
  },
  {
    id: 'figma-pro-kit',
    sku: 'FG-DS-ELITE',
    title: 'NexusUI — Figma Pro UI Kit & Design System',
    subtitle: 'Plus de 3 500 variants, auto-layout 5.0, variables multi-modes et documentation.',
    category: 'ui',
    categoryLabel: 'Design System',
    priceEur: 49,
    oldPriceEur: 89,
    rating: 4.98,
    reviewCount: 112,
    badge: 'Nouveau',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxcxzcs_2w-9QoBsryUQDqp-w1Sc8klDaSQoGX9cq7S5pG3-Uf49yd-7amEthXaLswjirBY6Mgfa0-3BU9UdB84pdgbLedMbdyzWq7uEDCzKMwPxw9BwDVqrJ9A2FTDkCs0Bk4fEgdROGQva2tb7hWpljkCfwQRepmKSSwkeuKdkM3Z-Yt2cl7oefCp-cRWk-TW4C06v72xSMNxqm-K6T1Ionyj4gbnwckH0_m8-5719EVIGcRD3I0',
    deliveryType: 'instant',
    formatLabel: 'Fichier Figma (.fig)',
    fileSize: '82.0 Mo',
    tags: ['Figma Variables', 'WCAG AAA', '650+ Composants', 'Auto-Layout 5.0', 'Dark & Light'],
    techStack: ['Figma Tokens', 'Variables 2024', 'AutoLayout 5.0', 'Components Library'],
    description: 'Le système de conception ultime pour applications web et mobile Web3 & Fintech. 120+ pages configurées, tokens typographiques stricts et variantes interactives.',
  },
  {
    id: 'fullstack-masterclass',
    sku: 'CRS-ARCH-4K',
    title: 'Développeur Full-Stack Moderne : Du Monolithe aux Edge Workers',
    subtitle: 'Concevez, déployez et scalez des microservices réels avec Node, TypeScript, Docker.',
    category: 'formations',
    categoryLabel: 'Masterclass Vidéo',
    priceEur: 89,
    oldPriceEur: 149,
    rating: 4.95,
    reviewCount: 289,
    badge: 'Top Noté',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCER-ey3mu-soEmcUuhMpz5Hh2o1KAgaoTDT7rdegMij9_gPX0vDuPvJUwWb9tD74CBB9AVYX2SWeaZUv_Z4wcJPWOFQf61ju8u0awx5Pz62V5ilKYv41a-OgCe8KoV4QB3FMnr5Ie_cMSxHhJxayBdwDpakRIJLrxSGbEP1OB6hbTuHD58OaTCj6e4L3tZ1V81mO7uAy41uhABKTICuoh6EwzA59RhlXRGhq9dGx0fo8EnUtuXW_ao',
    deliveryType: 'video',
    formatLabel: 'Vidéo 4K + Projets',
    fileSize: '8.4 Go',
    tags: ['18h de Contenu', 'Certificat Inclus', '3 Projets Concrets', 'Discord VIP'],
    techStack: ['Node.js 20', 'TypeScript', 'Docker', 'Redis', 'Cloudflare Workers'],
    description: 'Maîtrisez Next.js App Router avancé, Server Actions sans latence, caches Redis distribués, et déploiements multi-régions sur Cloudflare & AWS.',
  },
  {
    id: 'art-du-solopreneur',
    sku: 'BK-SOLO-2025',
    title: "L'Art du Solopreneur Tech : Systèmes & Playbooks",
    subtitle: 'Stratégies concrètes pour passer de développeur salarié à 10k€/mois.',
    category: 'ebooks',
    categoryLabel: 'E-book + Templates',
    priceEur: 29,
    oldPriceEur: 45,
    rating: 4.85,
    reviewCount: 193,
    badge: 'Guide Pro',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8gpPZyIuS9_Ha2A0mSTPTS57y9XWlAyQX4xJL6K9R60YgbXUx4SmOcRCOrweReqKVzbZP8ZqxaYOxFhTEEZwX1b6wEnPKPKCbD-U2S-GVaLr0tOHjnfe1wPANH5lEOj2cxeHpRttJLlN-sJf3JDDuxs52212Nm5VKY2263qy5yMlltDGDBtIr9VdKCsGGCgwwBrUAFEqBk8zZKjkQL6RMPY9NcTz-x0QxuULza2d4DwUuw4E1u7ep',
    deliveryType: 'book',
    formatLabel: 'PDF + EPUB + Notion',
    fileSize: '18.4 Mo',
    tags: ['340 Pages', 'Exemples GitHub', '50 Templates Notion', 'Audio inclus'],
    techStack: ['PDF Retina', 'ePub 3', 'Notion OS', 'Spreadsheets'],
    description: 'Stratégies concrètes pour passer de développeur salarié à 10k€/mois avec ses propres micro-produits digitaux. Manuel d’ingénierie financière et d’exécution logicielle.',
  },
  {
    id: 'velox-store',
    sku: 'VLX-SHPFY-MEDUSA',
    title: 'Velox Store — Template Headless E-commerce',
    subtitle: 'Score Google Lighthouse 100/100 garanti. Conçu pour marques D2C et marketplaces.',
    category: 'boilerplates',
    categoryLabel: 'Template E-commerce',
    priceEur: 69,
    oldPriceEur: 99,
    rating: 4.91,
    reviewCount: 47,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcc2EqkGfcoimZytrzb_UiXSrgFjgvahjuJz0xOvnsfT_c4RdqvH-kPd6EKZztJr7Q5_M_fKSBZChlfIukLagW5FDtwNHDep6tXlHr84SSTPRY4gyL-vgXaAtJmPwu-8u2_I1g0LxB-XCCGf0dPUG2wyRuVWtKkvfKbEa8rZRTGgYZRlR0W-oxCIZPp63vk5g9B0W6ijGg3OnNGRSyFajYIZm7bk0g31gQ-sGcsKMkus6dMWkzpZt5',
    deliveryType: 'instant',
    formatLabel: 'Code Source + Live Demo',
    fileSize: '22.1 Mo',
    tags: ['Lighthouse 100', 'Panier Instantané', 'Shopify Headless', 'Tailwind CSS'],
    techStack: ['Next.js', 'Medusa.js / Shopify', 'Tailwind', 'Stripe'],
    description: 'Template e-commerce headless ultra-performant. Score de performance Google Lighthouse 100/100 garanti. Panier fluide en slide-over et i18n multilingue natif.',
  },
  {
    id: 'kinetic-flow',
    sku: 'KNT-FLOW-REACT',
    title: 'KineticFlow — Composants React & Framer Motion',
    subtitle: 'Donnez vie à vos interfaces avec des transitions fluides à 60fps et physique naturelle.',
    category: 'presets',
    categoryLabel: 'Presets & Motion',
    priceEur: 45,
    oldPriceEur: 65,
    rating: 4.87,
    reviewCount: 38,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBp_FwOVU1p3uLebqn7kw_DRFWP8cDjmT4RDzXSTofYrTi0PTfyPq7eH60CUgnah8iji0ps3Oo9hbqgvSsQezhjZcqjMyGxJaboqLKhONfKiszvl05KDmxKc3pmG00Hr1krOK9JjfWSb3AzrQtPipFYpT3BTp6AnO5Zh06lF3RN1p24I70INt5tXfi_NO5BSQerIrH1wC6bBuYayDmGj8cNRmMn8znJCoKC8hBugyuBNWf3dHNUoYJa',
    deliveryType: 'instant',
    formatLabel: 'Framer Motion + Lottie',
    fileSize: '14.5 Mo',
    tags: ['80+ Animations', 'Copy-Paste', 'Smooth Scroll', 'React 19 Ready'],
    techStack: ['React 19', 'Framer Motion', 'Tailwind', 'Canvas'],
    description: 'Donnez vie à vos landing pages avec des transitions fluides à 60fps : curseurs magnétiques, effets de scroll parallax et modals avec physique naturelle.',
  },
  {
    id: 'neurochat-ai',
    sku: 'AI-NEURO-RAG',
    title: 'NeuroChat AI — Boilerplate Assistants & RAG Complet',
    subtitle: 'Déployez votre assistant IA personnalisé en moins de 30 minutes avec Vector DB.',
    category: 'boilerplates',
    categoryLabel: 'AI Starter Kit',
    priceEur: 99,
    oldPriceEur: 149,
    rating: 4.97,
    reviewCount: 92,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjfmbTD1I-cgRAfIK5tWvvmLpWziZNav9N07VhdFLq040gAWzR1w_S9eHOI98lEccwHMdPFp49m8SesSBKcKmrodxYw0JjD66XNweVsiW6rgbDD8BeyuuK5dC1R2F0qBGMoOZpb_5S0mRJbczBiw-PgwCTzufcublNuUibMT8yOgrYWiFp2Oln0mPLMbOb5QmmHzzh-xpHqNgZWUt5Xwhk3ZiDCmyxMaQ6BRWuUm6sno2T2mBaYgpv',
    deliveryType: 'instant',
    formatLabel: 'Prêt pour Vercel',
    fileSize: '28.3 Mo',
    tags: ['OpenAI + Claude', 'Streaming SSE', 'Pinecone Vector DB', 'OAuth 2.0'],
    techStack: ['Next.js 15', 'LangChain', 'Pinecone', 'OpenAI SDK'],
    description: 'Déployez votre assistant IA personnalisé en moins de 30 minutes. Intègre Vector DB (Pinecone), streaming des réponses en direct et facturation par crédits.',
  },
  {
    id: 'cyberglyph-3d',
    sku: 'GLYPH-3D-4K',
    title: 'CyberGlyph — 120 Icônes 3D Holographiques & Web3',
    subtitle: 'Pack complet de glyphes volumétriques avec reflets iridescents ajustables.',
    category: 'presets',
    categoryLabel: 'Pack Créatif 3D',
    priceEur: 39,
    oldPriceEur: 59,
    rating: 4.93,
    reviewCount: 71,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvq2iBn0IORpKcS2V-bRGyY2Vd5lmG1Nm1sE_I4P0j7xLkLVW2i28sqmM6IsDpBKS5MZvTg1FtsUlmP8u3y8H1bPr_hth00Xwl2xE7vGTvH5y-it6kVrUeL4NVgNi0rSCu1xsHfQZJ_UIii_7Pxn0pasE98PEMsliItYh-5iaYjaiz2vWP5aiLWRrQv3C9Jz7jNqYlwPZUGs_KmEmUwYA7DkSQV7CTymLDHnkdDwyu3R19n7IiBvmI',
    deliveryType: 'instant',
    formatLabel: 'Fichiers 3D (.blend + PNG)',
    fileSize: '412 Mo',
    tags: ['4K Transparent', 'Blender Native', 'Cycles & Eevee', 'Licence Illimitée'],
    techStack: ['Blender 4.2', 'Cycles', 'GLTF', 'PNG 4K'],
    description: 'Pack complet de glyphes volumétriques avec reflets iridescents ajustables. Exportés en résolution 4K sans fond et sources Blender facilement éditables.',
  },
];

export const INITIAL_PROMOS: PromoCode[] = [
  {
    code: 'WELCOME10',
    description: 'Bienvenue Nouveaux Membres',
    type: 'fixed',
    value: 10,
    minSpendEur: 0,
    usageCount: 142,
    maxUsage: 500,
    active: true,
  },
  {
    code: 'FOUNDER360',
    description: 'Bundle Spécial Créateurs',
    type: 'percent',
    value: 45,
    minSpendEur: 149,
    usageCount: 48,
    maxUsage: 100,
    active: true,
  },
  {
    code: 'NEXT15LAUNCH',
    description: 'Lancement Boilerplate Next 15',
    type: 'fixed',
    value: 25,
    minSpendEur: 69,
    usageCount: 89,
    maxUsage: 100,
    active: true,
    expiresIn: 'Expire dans 48h',
  },
  {
    code: 'BLACKCYBER',
    description: 'Opération Black Friday 2025',
    type: 'percent',
    value: 30,
    minSpendEur: 0,
    usageCount: 0,
    maxUsage: 1000,
    active: true,
    expiresIn: '28 Nov',
  },
  {
    code: 'DEVCOMMUNITY',
    description: 'Partenariat Discord VIP',
    type: 'percent',
    value: 15,
    minSpendEur: 30,
    usageCount: 200,
    maxUsage: 200,
    active: false,
    expiresIn: 'Épuisé',
  },
];

export interface OrderRecord {
  id: string;
  orderNumber: string;
  date: string;
  clientName: string;
  clientEmail: string;
  companyName?: string;
  vatNumber?: string;
  items: {
    product: Product;
    licenseTier: 'standard' | 'agency';
    priceEur: number;
    licenseKey: string;
  }[];
  paymentMethod: 'stripe' | 'momo' | 'paypal';
  paymentLabel: string;
  totalEur: number;
  invoiceRef: string;
  status: 'paid' | 'pending' | 'refunded';
  token: string;
}

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ord-9412',
    orderNumber: '#NOVA-9412',
    date: '24 Octobre 2024, 14:32',
    clientName: 'Alexandre Martin',
    clientEmail: 'alexandre.martin@techfounder.io',
    companyName: 'Studio Martin Tech',
    vatNumber: 'FR 82 912384910',
    items: [
      {
        product: INITIAL_PRODUCTS[0], // Nexus SaaS
        licenseTier: 'standard',
        priceEur: 69,
        licenseKey: 'NOVA-NX-9412-88B1-AUTH',
      },
      {
        product: INITIAL_PRODUCTS[3], // Solopreneur
        licenseTier: 'standard',
        priceEur: 29,
        licenseKey: 'NOVA-SOLO-9412-44C2-AUTH',
      },
    ],
    paymentMethod: 'stripe',
    paymentLabel: 'Stripe • Visa terminant par 8920',
    totalEur: 88,
    invoiceRef: 'FAC-2024-0891',
    status: 'paid',
    token: 'live_hmac_9412_token_safe',
  },
  {
    id: 'ord-8720',
    orderNumber: '#NOVA-8720',
    date: '12 Septembre 2024, 09:15',
    clientName: 'Alexandre Martin',
    clientEmail: 'alexandre.martin@techfounder.io',
    companyName: 'Studio Martin Tech',
    vatNumber: 'FR 82 912384910',
    items: [
      {
        product: INITIAL_PRODUCTS[1], // Figma UI Kit
        licenseTier: 'standard',
        priceEur: 49,
        licenseKey: 'NOVA-FG-8720-77A1-AUTH',
      },
    ],
    paymentMethod: 'momo',
    paymentLabel: 'MTN MoMo (Côte d’Ivoire)',
    totalEur: 49,
    invoiceRef: 'FAC-2024-0715',
    status: 'paid',
    token: 'live_hmac_8720_token_safe',
  },
  {
    id: 'ord-7105',
    orderNumber: '#NOVA-7105',
    date: '03 Août 2024, 18:40',
    clientName: 'Alexandre Martin',
    clientEmail: 'alexandre.martin@techfounder.io',
    companyName: 'Studio Martin Tech',
    vatNumber: 'FR 82 912384910',
    items: [
      {
        product: INITIAL_PRODUCTS[2], // Masterclass Video
        licenseTier: 'agency',
        priceEur: 119,
        licenseKey: 'NOVA-CRS-7105-33X8-AUTH',
      },
    ],
    paymentMethod: 'paypal',
    paymentLabel: 'PayPal Express',
    totalEur: 119,
    invoiceRef: 'FAC-2024-0589',
    status: 'paid',
    token: 'live_hmac_7105_token_safe',
  },
  {
    id: 'ord-5921',
    orderNumber: '#NOVA-5921',
    date: '15 Juin 2024, 11:05',
    clientName: 'Alexandre Martin',
    clientEmail: 'alexandre.martin@techfounder.io',
    companyName: 'Studio Martin Tech',
    vatNumber: 'FR 82 912384910',
    items: [
      {
        product: INITIAL_PRODUCTS[7], // CyberGlyph
        licenseTier: 'standard',
        priceEur: 58,
        licenseKey: 'NOVA-GLYPH-5921-99K2-AUTH',
      },
    ],
    paymentMethod: 'stripe',
    paymentLabel: 'Stripe • Mastercard',
    totalEur: 58,
    invoiceRef: 'FAC-2024-0412',
    status: 'paid',
    token: 'live_hmac_5921_token_safe',
  },
];

export const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Marc-Aurèle K.',
    role: 'Lead Dev SaaS • Côte d’Ivoire',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDm-ELTvethu8hSzx-_XEQBKkCf7UAWomspvjJVgUm3nabpk2qU9xzHX4ciftR0Rw_OABD-PKXVD2aGealnfjwri_3OvVwtgnAR0AQdjDrEqfSUM3A2MLt8dL6LJOmRMkT137z6-XcNtlf5tkv2bYgFRc5b-xtOf3VreINB7SQAabTqRVAxMX0udT6w3jx-ZYMpDJfIk-RJpoNQYfxo3tFBjVsyWcbS5Zd4YRt2FI3xQrnh2OB653hi',
    text: '« Le starter kit Nexus m’a épargné au bas mot 3 semaines de setup fastidieux. Le code TypeScript est impeccable, les règles Supabase RLS sont blindées et le paiement MTN a fonctionné du premier coup depuis Abidjan. »',
    rating: 5,
  },
  {
    id: 't2',
    name: 'Éléonore V.',
    role: 'Product Designer • Paris',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSAxOoZk5IWrVyw-LY0WRhsbPLp5lEYACi__zCkvOa4q4iZYp6uYKyQTKzydcn-0CGQCQbtmB4AE8CylGgGQ2qJiV-fuhueHJHzvt8qROW1r6YJXS84cgO2MjXYeVq5DSW5hXCxzpVI9B8lac3Oh3FTaz2eKCHvgFKle_7UlnxF9T85u_EPPLeICwjLd7xaHPdiwGxMuF4BSMqiiEROkTJFgQszcbjTwQi5grdpFW7PCZkh4R0Jc8g',
    text: '« En tant que designer freelance pour des startups fintech, le kit Figma 2024 est une masterclass d’organisation. Tout est variable-tokenized, adaptable en 2 clics pour mes clients. La qualité dépasse de loin la moyenne du marché. »',
    rating: 5,
  },
  {
    id: 't3',
    name: 'Tarik B.',
    role: 'Solopreneur • Casablanca',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeNcpmqdC8VT-22FGI08FMtbKv_w6WLkItLSDzqTGMYLmHc4WD8Y-mKkFYvUiyi93gqn-xUG-LvMMy-YA_fGnwqpi1rtwk9dqq5m6FzgxtVLs3gMADPWyY46Ye40wReEx_fYqB7aUAJrrjs23ei91K6Vpmc7L6sg61MwshIhBcRNl1y5JhySb3Shs_3UjFEvfqX9veJX3ZDLupbGm5gIlz39mK8yZ1jO1YC1XwMULyeHYYvaNs6Doa',
    text: '« J’ai acheté le Guide du Solopreneur et suivi la formation Full-Stack. Deux mois plus tard, mon premier outil d’automatisation génère déjà 1 800 € de MRR. Le support sur Discord est d’une réactivité déconcertante. »',
    rating: 5,
  },
];

export const FAQS = [
  {
    id: 'faq1',
    question: 'Comment se déroule le téléchargement immédiat après achat ?',
    answer:
      'Dès confirmation de votre transaction (par carte ou Mobile Money), votre page de confirmation génère instantanément vos liens de téléchargement directs (fichiers .zip, dépôts GitHub privés et clés de licence). Vous recevez également une copie sécurisée par e-mail et les produits sont liés pour toujours à votre espace client NovaDigital.',
  },
  {
    id: 'faq2',
    question: 'Quelle est la portée de la licence commerciale incluse ?',
    answer:
      'Tous nos templates et bibliothèques de code incluent une licence commerciale illimitée. Vous pouvez les utiliser pour un nombre indéfini de projets personnels, créer des SaaS monétisés pour vous-même ou livrer des applications clés en main pour vos clients finaux. La seule restriction formelle est la revente directe du template brut tel quel.',
  },
  {
    id: 'faq3',
    question: 'Puis-je payer avec mon compte Mobile Money (Orange, MTN) ?',
    answer:
      'Oui, absolument. Nous intégrons nativement les passerelles sécurisées pour le règlement en Francs CFA (XOF/XAF) via MTN MoMo, Orange Money, Moov et Wave. La conversion est calculée au taux exact sans frais supplémentaires cachés.',
  },
  {
    id: 'faq4',
    question: 'Comment bénéficier des futures mises à jour de code ?',
    answer:
      'Toutes les mises à jour correctives et de versions majeures sont gratuites à vie. Si un template Next.js passe à une nouvelle version du framework, vous recevez une notification par mail et le nouveau zip ou pull-request est immédiatement téléchargeable depuis votre compte.',
  },
];
