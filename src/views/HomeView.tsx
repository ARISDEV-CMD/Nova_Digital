/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { useReducedMotionPreference } from '../hooks/use-reduced-motion.ts';
import { Product } from '../utils/shop-logic.ts';
import {ProductCard} from '../components/products/ProductCard.tsx';import {SectionHeader} from '../components/ui/SectionHeader.tsx';import {Button} from '../components/ui/Button.tsx';
import { FAQS, TESTIMONIALS } from '../data/mock-data.ts';
import { ProductGridSkeleton } from '../components/feedback/Skeleton.tsx';

interface HomeViewProps {
  products: Product[];
  onNavigate: (view: string, productId?: string) => void;
  onAddToCart: (product: Product, licenseTier?: 'standard' | 'agency') => void;
  currency: 'EUR' | 'USD' | 'XAF';
  loading?: boolean;
}

const COURSE_CATEGORY_PRESENTATION = [
  { id: 'ai_automation', illustration: '/assets/illustrations/categories/ai-automation.svg', color: 'text-[#4cd7f6]', title: 'Intelligence artificielle', desc: 'IA générative, assistants et automatisation' },
  { id: 'web_development', illustration: '/assets/illustrations/categories/web-development.svg', color: 'text-[#c0c1ff]', title: 'Développement web', desc: 'Programmation, applications et bases de données' },
  { id: 'design_visual', illustration: '/assets/illustrations/categories/design-visual.svg', color: 'text-[#d0bcff]', title: 'Design graphique', desc: 'Création visuelle, identité et outils graphiques' },
  { id: 'digital_marketing', illustration: '/assets/illustrations/categories/digital-marketing.svg', color: 'text-[#4cd7f6]', title: 'Marketing digital', desc: 'SEO, publicité en ligne et stratégie' },
  { id: 'video_content', illustration: '/assets/illustrations/categories/video-content.svg', color: 'text-[#c0c1ff]', title: 'Vidéo & création de contenu', desc: 'Vidéo, photographie et formats sociaux' },
  { id: 'productivity', illustration: '/assets/illustrations/categories/productivity.svg', color: 'text-[#d0bcff]', title: 'Bureautique & productivité', desc: 'Outils de travail, organisation et méthodes' },
  { id: 'data_bi', illustration: '/assets/illustrations/categories/data-analysis.svg', color: 'text-[#4cd7f6]', title: 'Data & analyse', desc: 'Données, visualisation et analyse décisionnelle' },
  { id: 'cybersecurity', illustration: '/assets/illustrations/categories/cybersecurity.svg', color: 'text-[#c0c1ff]', title: 'Cybersécurité', desc: 'Sécurité, réseaux et systèmes' },
  { id: 'entrepreneurship', illustration: '/assets/illustrations/categories/entrepreneurship.svg', color: 'text-[#d0bcff]', title: 'Entrepreneuriat & gestion', desc: 'Gestion de projet, activité et finances' },
  { id: 'career', illustration: '/assets/illustrations/categories/career.svg', color: 'text-[#4cd7f6]', title: 'Carrière numérique', desc: 'Compétences professionnelles et évolution' },
] as const;

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  onNavigate,
  onAddToCart,
  currency,
  loading = false,
}) => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');
  const prefersReducedMotion = useReducedMotionPreference();
  const revealVariants: Variants = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.55, ease: 'easeOut' },
    },
  };
  const revealStaggerVariants: Variants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { delayChildren: prefersReducedMotion ? 0 : 0.04, staggerChildren: prefersReducedMotion ? 0 : 0.08 },
    },
  };
  const revealItemVariants: Variants = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' },
    },
  };

  const featuredProducts = products
    .filter((product) => product.courseStatus === 'published' && product.isAvailable === true)
    .slice(0, 4);
  const trainingCategoryCounts = products.reduce<Record<string, number>>((counts, product) => {
    if (product.courseStatus === 'published' && !product.isDraft) {
      counts[product.category] = (counts[product.category] || 0) + 1;
    }
    return counts;
  }, {});
  const trainingCategories = COURSE_CATEGORY_PRESENTATION
    .map((category, order) => ({ ...category, order, count: trainingCategoryCounts[category.id] || 0 }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count || a.order - b.order)
    .slice(0, 5);

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('catalogue');
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
      setTimeout(() => {
        setNewsletterSubmitted(false);
        setNewsletterEmail('');
      }, 4000);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#0f131c]">
      {/* Hero Section */}
      <motion.section className="relative w-full overflow-hidden bg-[#0a0e16]" variants={revealVariants} initial="hidden" animate="visible">
        {/* Atmospheric lighting effects */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#8083ff]/20 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-48 -right-20 w-[420px] h-[420px] bg-[#4cd7f6]/10 blur-[140px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-20 w-[400px] h-[400px] bg-[#571bc1]/30 blur-[130px] rounded-full pointer-events-none"></div>

        <motion.div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-y-8 px-4 pt-16 pb-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-x-8 lg:px-6 lg:pt-9 lg:pb-24" variants={revealStaggerVariants}>
          <motion.div className="flex flex-col items-center text-center lg:items-start lg:text-left" variants={revealStaggerVariants}>
          {/* Live Status Pill */}
          <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#262a33]/80 backdrop-blur-md mb-6 shadow-sm border border-[#31353e]/40" variants={revealItemVariants}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4cd7f6]"></span>
            </span>
            <span className="font-['JetBrains_Mono'] text-xs text-[#4cd7f6] font-semibold tracking-wider">
              NOVA CATALOGUE 2025
            </span>
            <span className="text-[#908fa0]">/</span>
            <span className="text-xs text-[#c7c4d7] font-medium">
              1 420+ Composants & Boilerplates prêts
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 className="font-['Plus_Jakarta_Sans'] text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#dfe2ee] max-w-4xl tracking-tight leading-none mb-6" variants={revealItemVariants}>
            Développez vos compétences dans tous les domaines du numérique
          </motion.h1>

          {/* Subtitle */}
          <motion.p className="text-base sm:text-lg text-[#c7c4d7] max-w-2xl mx-auto mb-10 leading-relaxed" variants={revealItemVariants}>
            Développement web, intelligence artificielle, marketing digital, création vidéo, data, cybersécurité et bien plus : des formations pratiques pour apprendre à votre rythme et appliquer vos acquis sur des projets concrets.
          </motion.p>

          {/* Search Console Bar */}
          <motion.form
            onSubmit={handleHeroSearch}
            className="w-full max-w-2xl bg-[#1c2028]/90 backdrop-blur-xl p-1 rounded-xl shadow-xl mb-4 border border-[#31353e]/80"
           variants={revealItemVariants}>
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="material-symbols-outlined text-[#908fa0] text-xl">terminal</span>
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                autoComplete="off"
                placeholder="Rechercher un starter kit, design system, guide..."
                className="w-full bg-transparent text-[#dfe2ee] placeholder-[#908fa0] text-sm focus:outline-none"
              />
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-[#262a33] text-[#c7c4d7] font-mono text-[11px]">
                ⌘K
              </span>
              <button
                type="submit"
                className="shrink-0 px-3.5 sm:px-5 py-2 rounded-lg bg-gradient-to-r from-[#8083ff] to-[#571bc1] hover:opacity-95 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5"
              >
                <span className="hidden sm:inline">Rechercher</span>
                <span className="material-symbols-outlined text-sm">search</span>
              </button>
            </div>
          </motion.form>

          {/* Popular Tags */}
          <motion.div className="mb-10 flex flex-wrap items-center justify-center gap-2 text-xs lg:justify-start" variants={revealStaggerVariants}>
            <span className="text-[#908fa0] mr-1">Populaire :</span>
            {['SaaS Starter', 'Figma Design System', 'Masterclass Next.js', 'Prompt Packs'].map((tag) => (
              <motion.button
                key={tag}
                type="button"
                onClick={() => onNavigate('catalogue')}
                className="px-3 py-1 rounded-full bg-[#181c24] hover:bg-[#262a33] text-[#c7c4d7] hover:text-[#c0c1ff] font-['JetBrains_Mono'] transition-colors border border-[#31353e]/50"
               variants={revealItemVariants}>
                {tag}
              </motion.button>
            ))}
          </motion.div>

          {/* Call to Action Buttons */}
          <motion.div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto" variants={revealStaggerVariants}>
            <motion.button
              onClick={() => onNavigate('catalogue')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-[#8083ff] via-[#571bc1] to-[#009eb9] hover:brightness-110 text-white text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
             variants={revealItemVariants}>
              <span>Explorer le Catalogue</span>
              <span className="material-symbols-outlined text-base">north_east</span>
            </motion.button>
            <motion.button
              onClick={() => {
                const bundleSection = document.getElementById('bundles');
                bundleSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#262a33]/70 hover:bg-[#262a33] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-[#31353e]"
             variants={revealItemVariants}>
              <span className="material-symbols-outlined text-[#4cd7f6] text-base">local_offer</span>
              <span>Voir les Bundles Promo</span>
            </motion.button>
          </motion.div>

          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-[34rem] lg:col-start-2 lg:row-start-1 lg:max-w-none"
            variants={revealItemVariants}
          >
            <motion.img
              src="/assets/illustrations/hero-digital-studio.svg"
              alt=""
              aria-hidden="true"
              className="h-auto w-full drop-shadow-[0_28px_70px_rgba(76,215,246,0.12)]"
              animate={prefersReducedMotion ? undefined : { y: [0, -9, 0], rotate: [0, 0.5, 0] }}
              transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-[12%] left-[2%] rounded-xl border border-[#4cd7f6]/20 bg-[#101722]/90 px-3 py-2 shadow-xl backdrop-blur-md sm:left-[5%]"
              initial={false}
              animate={prefersReducedMotion ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity, delay: 0.4 }}
            >
              <span className="flex items-center gap-2 text-[11px] font-medium text-[#dfe2ee]">
                <span className="h-2 w-2 rounded-full bg-[#4cd7f6] shadow-[0_0_12px_#4cd7f6]" />
                Vos idées, prêtes à lancer
              </span>
            </motion.div>
          </motion.div>

          {/* Reassurance Strip */}
          <motion.div className="col-span-full mt-2 grid w-full grid-cols-1 gap-4 border-t border-[#1c2028] pt-6 sm:grid-cols-3" variants={revealStaggerVariants}>
            <motion.div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-[#181c24]/50 border border-[#31353e]/30" variants={revealItemVariants}>
              <span className="material-symbols-outlined text-[#4cd7f6] text-2xl">groups</span>
              <div className="text-left">
                <p className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white leading-tight">14 000+</p>
                <p className="text-xs text-[#908fa0]">Créateurs & Devs Actifs</p>
              </div>
            </motion.div>
            <motion.div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-[#181c24]/50 border border-[#31353e]/30" variants={revealItemVariants}>
              <span className="material-symbols-outlined text-[#4cd7f6] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <div className="text-left">
                <p className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white leading-tight">4.9 / 5</p>
                <p className="text-xs text-[#908fa0]">+2 800 Avis Vérifiés</p>
              </div>
            </motion.div>
            <motion.div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-[#181c24]/50 border border-[#31353e]/30" variants={revealItemVariants}>
              <span className="material-symbols-outlined text-[#c0c1ff] text-2xl">lock</span>
              <div className="text-left">
                <p className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white leading-tight">Stripe & MoMo</p>
                <p className="text-xs text-[#908fa0]">MTN / Orange & Cartes</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Categories Grid */}
      <motion.section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-16" variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="font-['JetBrains_Mono'] text-xs text-[#4cd7f6] tracking-wider uppercase font-semibold">
              Se former dans le numérique
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white mt-1">
              Catégories populaires
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#c7c4d7] max-w-md">
            Explore des formations concrètes dans les domaines du numérique.
          </p>
        </div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" variants={revealStaggerVariants}>
          {loading ? Array.from({ length: 5 }, (_, index) => (
            <div key={index} aria-hidden="true" className="min-h-[220px] animate-pulse rounded-xl border border-[#262a33] bg-[#181c24] p-6">
              <div className="h-12 w-12 rounded-lg bg-[#262a33]" />
              <div className="mt-6 h-4 w-3/4 rounded bg-[#262a33]" />
              <div className="mt-3 h-3 w-full rounded bg-[#262a33]" />
              <div className="mt-10 h-3 w-1/2 rounded bg-[#262a33]" />
            </div>
          )) : trainingCategories.length ? trainingCategories.map((category) => (
            <motion.button
              key={category.id}
              type="button"
              onClick={() => onNavigate('catalogue-categorie-' + category.id)}
              className="group flex min-h-[220px] flex-col justify-between rounded-xl border border-[#262a33] bg-[#181c24] p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#8083ff]/40 hover:bg-[#1c2028] hover:shadow-[0_12px_32px_rgb(0_0_0_/_0.18)] motion-reduce:transform-none"
              variants={revealItemVariants}
              whileHover={prefersReducedMotion ? undefined : { y: -3 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            >
              <div className="space-y-4">
                <div className={'flex h-12 w-12 items-center justify-center rounded-lg bg-[#262a33] transition-transform group-hover:scale-110 ' + category.color}>
                  <img src={category.illustration} alt="" aria-hidden="true" loading="lazy" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" />
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white transition-colors group-hover:text-[#c0c1ff]">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#c7c4d7]">{category.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#262a33]/60 pt-4">
                <span className="font-['JetBrains_Mono'] text-xs text-[#908fa0]">
                  {category.count} formation{category.count > 1 ? 's' : ''}
                </span>
                <span aria-hidden="true" className="material-symbols-outlined text-base text-[#908fa0] transition-all group-hover:translate-x-1 group-hover:text-white">
                  arrow_forward
                </span>
              </div>
            </motion.button>
          )) : (
            <div className="col-span-full rounded-xl border border-dashed border-[#31353e] bg-[#181c24] p-6 text-center text-sm text-[#c7c4d7]">
              Les domaines de formation apparaîtront ici dès qu’une formation sera publiée.
            </div>
          )}
        </motion.div>
      </motion.section>

      {/* Featured Products Section */}
      <motion.section className="w-full bg-[#0a0e16]/60 py-16 border-y border-[#1c2028]" id="catalogue" variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
        <motion.div className="max-w-7xl mx-auto px-4 lg:px-6" variants={revealStaggerVariants}>
          <motion.div variants={revealItemVariants}><SectionHeader eyebrow="Sélection Nova Digital" title="Ressources pour créer et lancer vos projets" description="Une sélection de ressources numériques présentée à titre de démonstration." className="mb-10" action={<Button variant="secondary" onClick={()=>onNavigate('catalogue')} trailingIcon={<span aria-hidden="true" className="material-symbols-outlined text-base">arrow_right_alt</span>}>Voir le catalogue</Button>}/></motion.div>
          {loading ? <ProductGridSkeleton count={4} compact /> : featuredProducts.length ? <motion.div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4" variants={revealStaggerVariants}>{featuredProducts.map(product=><motion.div key={product.id} variants={revealItemVariants}><ProductCard product={product} currency={currency} compact onOpen={selected=>onNavigate('produit',selected.id)} onAddToCart={selected=>onAddToCart(selected,'standard')} onQuickBuy={selected=>{onAddToCart(selected,'standard');onNavigate('checkout')}}/></motion.div>)}</motion.div> : <div className="rounded-xl border border-dashed border-[#31353e] bg-[#181c24] p-6 text-center"><p className="text-sm text-[#c7c4d7]">Les formations pilotes sont en cours de préparation. Elles apparaîtront ici après validation de leur contenu et de leur tarif.</p><Button variant="secondary" className="mt-4" onClick={() => onNavigate('catalogue-formations')}>Voir les formations</Button></div>}
        </motion.div>
      </motion.section>

      {/* Special Bundle Offer Showcase */}
      <motion.section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-16" id="bundles" variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
        <div className="relative rounded-lg bg-gradient-to-r from-[#1c2028] to-[#181c24] p-6 lg:p-10 overflow-hidden shadow-xl border border-[#31353e]">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#8083ff]/20 rounded-full blur-[100px] pointer-events-none"></div>
          <motion.div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" variants={revealStaggerVariants}>
            <motion.div className="lg:col-span-7 space-y-4" variants={revealItemVariants}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#571bc1] text-white font-['JetBrains_Mono'] text-xs font-semibold">
                <span className="material-symbols-outlined text-sm text-[#4cd7f6]">redeem</span>
                <span>MEGA BUNDLE LIMITÉ</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Le Pack Ultime « Founder 360° »
              </h3>
              <p className="text-sm sm:text-base text-[#c7c4d7] leading-relaxed">
                Réunissez le SaaS Starter Nexus, le Design System Figma 2024, la Masterclass Full-Stack et les 50
                playbooks Notion dans un bundle clés en main à tarif unique.
              </p>
              <motion.div className="flex flex-wrap items-center gap-4 pt-1" variants={revealStaggerVariants}>
                <motion.div className="flex items-center gap-1.5 text-white text-xs font-medium" variants={revealItemVariants}>
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">check_circle</span>
                  <span>Licence Commerciale Illimitée</span>
                </motion.div>
                <motion.div className="flex items-center gap-1.5 text-white text-xs font-medium" variants={revealItemVariants}>
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">check_circle</span>
                  <span>Mises à jour à vie (v2 & v3)</span>
                </motion.div>
                <motion.div className="flex items-center gap-1.5 text-white text-xs font-medium" variants={revealItemVariants}>
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">check_circle</span>
                  <span>Canal Discord VIP Inclus</span>
                </motion.div>
              </motion.div>
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl font-extrabold text-white">
                      129 €
                    </span>
                    <span className="text-base text-[#908fa0] line-through">236 €</span>
                  </div>
                  <span className="block font-['JetBrains_Mono'] text-xs text-[#4cd7f6]">
                    ou 84 500 FCFA
                  </span>
                </div>
                <button
                  disabled={featuredProducts.length < 4}
                  onClick={() => {
                    // Add all 4 products to cart with discount
                    featuredProducts.forEach((p) => onAddToCart(p, 'standard'));
                    onNavigate('checkout');
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-[#8083ff] to-[#571bc1] hover:brightness-110 text-white text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
                  <span>{featuredProducts.length < 4 ? 'Pack bientôt disponible' : 'Débloquer le Pack Ultime (-45%)'}</span>
                </button>
              </div>
            </motion.div>

            {/* Bundle artwork */}
            <motion.div className="lg:col-span-5 flex justify-center" variants={revealItemVariants}>
              <motion.img
                src="/assets/illustrations/bundle-universe.svg"
                alt="Illustration du pack de ressources : code, design, formation et guides"
                className="h-auto w-full max-w-lg drop-shadow-[0_24px_64px_rgba(128,131,255,0.16)]"
                initial={false}
                animate={prefersReducedMotion ? undefined : { y: [0, -7, 0] }}
                transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* 3 Value Pillars */}
      <motion.section className="w-full bg-[#181c24] py-16 border-y border-[#262a33]" variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
        <motion.div className="max-w-7xl mx-auto px-4 lg:px-6" variants={revealStaggerVariants}>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-['JetBrains_Mono'] text-xs text-[#4cd7f6] uppercase font-semibold">
              Standards d’Excellence
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white mt-1">
              Pourquoi choisir NovaDigital ?
            </h2>
            <p className="text-sm text-[#c7c4d7] mt-2">
              Nous supprimons les frictions techniques et financières afin que vous puissiez lancer vos idées à la vitesse de la lumière.
            </p>
          </div>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={revealStaggerVariants}>
            <motion.div className="p-8 rounded-xl bg-[#1c2028]/80 shadow-sm flex flex-col items-start border border-[#31353e]/50" variants={revealItemVariants}>
              <div className="w-14 h-14 rounded-xl bg-[#8083ff]/20 text-[#c0c1ff] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">cloud_sync</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white mb-2">
                Accès instantané & à vie
              </h3>
              <p className="text-sm text-[#c7c4d7] leading-relaxed">
                Téléchargez vos archives zip et vos accès Git dès la validation du paiement. Vos liens restent disponibles
                à vie sur votre espace client avec chaque mise à jour future sans frais.
              </p>
            </motion.div>

            <motion.div className="p-8 rounded-xl bg-[#1c2028]/80 shadow-sm flex flex-col items-start border border-[#31353e]/50" variants={revealItemVariants}>
              <div className="w-14 h-14 rounded-xl bg-[#009eb9]/20 text-[#4cd7f6] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">forum</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white mb-2">
                Support direct Discord privé
              </h3>
              <p className="text-sm text-[#c7c4d7] leading-relaxed">
                Pas de tickets perdus. Échangez directement avec les auteurs de chaque template sur notre Discord réservé
                aux acquéreurs pour résoudre vos bugs ou demander des extensions.
              </p>
            </motion.div>

            <motion.div className="p-8 rounded-xl bg-[#1c2028]/80 shadow-sm flex flex-col items-start border border-[#31353e]/50" variants={revealItemVariants}>
              <div className="w-14 h-14 rounded-xl bg-[#571bc1]/20 text-[#d0bcff] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">currency_exchange</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white mb-2">
                Paiement local & multi-devises
              </h3>
              <p className="text-sm text-[#c7c4d7] leading-relaxed">
                Réglez sans barrière géographique par Carte Bancaire internationale, Apple Pay, Google Pay ou Mobile Money local
                (MTN MoMo, Orange Money) en FCFA, EUR et USD.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Verified Testimonials Section */}
      <motion.section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-16" variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
        <motion.div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4" variants={revealItemVariants}>
          <div>
            <span className="font-['JetBrains_Mono'] text-xs text-[#4cd7f6] tracking-wider uppercase font-semibold">
              Communauté Élite
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white mt-1">
              Ce que disent nos créateurs
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#4cd7f6]">4.9/5</span>
            <div className="flex text-[#4cd7f6]">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              ))}
            </div>
            <span className="text-xs text-[#908fa0] ml-1">sur 2 800+ transactions</span>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={revealStaggerVariants}>
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.id}
              className="p-6 rounded-xl bg-[#181c24] shadow-sm flex flex-col justify-between border border-[#262a33]"
             variants={revealItemVariants}>
              <div className="space-y-4">
                <div className="flex text-[#4cd7f6]">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <p className="text-sm text-[#c7c4d7] italic leading-relaxed">{t.text}</p>
              </div>
              <div className="flex items-center gap-3 pt-6 mt-4 border-t border-[#262a33]">
                <img className="w-11 h-11 rounded-full object-cover ring-1 ring-[#31353e]" alt={t.name} src={t.avatar} />
                <div>
                  <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                  <p className="text-xs text-[#908fa0]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Interactive FAQ Section */}
      <motion.section className="w-full bg-[#0a0e16]/80 py-16 border-t border-[#1c2028]" variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
        <motion.div className="max-w-4xl mx-auto px-4 lg:px-6" variants={revealStaggerVariants}>
          <motion.div className="text-center mb-10" variants={revealItemVariants}>
            <span className="font-['JetBrains_Mono'] text-xs text-[#4cd7f6] uppercase font-semibold">
              Transparence & Réponses
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white mt-1">
              Questions Fréquentes
            </h2>
            <p className="text-sm text-[#c7c4d7] mt-2">
              Tout ce que vous devez savoir sur nos licences, livraisons et garanties.
            </p>
          </motion.div>

          <motion.div className="space-y-3" variants={revealStaggerVariants}>
            {FAQS.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <motion.div key={faq.id} className="rounded-xl bg-[#181c24] border border-[#262a33] overflow-hidden" variants={revealItemVariants}>
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between text-white font-semibold text-sm sm:text-base hover:text-[#c0c1ff] transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`material-symbols-outlined transition-transform duration-200 text-[#908fa0] ${
                        isOpen ? 'rotate-180 text-[#4cd7f6]' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-[#c7c4d7] text-sm leading-relaxed border-t border-[#262a33]/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* VIP Newsletter Section (-15% Offer) */}
      <motion.section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-16" variants={revealVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
        <motion.div className="relative rounded-lg bg-[#1c2028] p-6 lg:p-12 overflow-hidden shadow-2xl border border-[#31353e]" variants={revealItemVariants}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#4cd7f6]/10 rounded-full blur-[90px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8083ff]/10 rounded-full blur-[90px] pointer-events-none"></div>

          <motion.div className="relative z-10 max-w-3xl mx-auto text-center space-y-4" variants={revealStaggerVariants}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262a33] text-[#4cd7f6] font-['JetBrains_Mono'] text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">percent</span>
              <span>OFFRE DE BIENVENUE VIP</span>
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              Obtenez -15% immédiats sur votre première acquisition
            </h3>
            <p className="text-sm sm:text-base text-[#c7c4d7]">
              Rejoignez le cercle restreint de nos 14 000 ingénieurs et créateurs. Recevez un code de réduction instantané
              ainsi que notre curation hebdomadaire des meilleurs composants détachables.
            </p>

            <motion.form
              onSubmit={handleNewsletterSubmit}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto"
             variants={revealItemVariants}>
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#908fa0] text-lg">
                  alternate_email
                </span>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="votre.email@domaine.com"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-[#181c24] text-white placeholder-[#908fa0] text-sm focus:outline-none focus:bg-[#0a0e16] border border-[#31353e]"
                />
              </div>
              <button
                type="submit"
                className={`w-full sm:w-auto shrink-0 px-6 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5 ${
                  newsletterSubmitted
                    ? 'bg-[#009eb9] text-[#002f38]'
                    : 'bg-[#c0c1ff] hover:bg-white text-[#1000a9]'
                }`}
              >
                <span>{newsletterSubmitted ? 'Code envoyé : WELCOME10' : 'Débloquer -15%'}</span>
                <span className="material-symbols-outlined text-sm">
                  {newsletterSubmitted ? 'check' : 'send'}
                </span>
              </button>
            </motion.form>
            <p className="text-xs text-[#908fa0]">Zéro spam. Désinscription en 1 clic à tout instant.</p>
          </motion.div>
        </motion.div>
      </motion.section>
    </div>
  );
};
