/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, formatPriceEur, formatPriceXaf } from '../utils/shop-logic.ts';
import { FAQS, TESTIMONIALS } from '../data/mock-data.ts';

interface HomeViewProps {
  products: Product[];
  onNavigate: (view: string, productId?: string) => void;
  onAddToCart: (product: Product, licenseTier?: 'standard' | 'agency') => void;
  currency: 'EUR' | 'USD' | 'XAF';
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  onNavigate,
  onAddToCart,
  currency,
}) => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');

  const featuredProducts = products.slice(0, 4);

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
      <section className="relative w-full overflow-hidden bg-[#0a0e16]">
        {/* Atmospheric lighting effects */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#8083ff]/20 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-48 -right-20 w-[420px] h-[420px] bg-[#4cd7f6]/10 blur-[140px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-20 w-[400px] h-[400px] bg-[#571bc1]/30 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 flex flex-col items-center text-center">
          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#262a33]/80 backdrop-blur-md mb-6 shadow-sm border border-[#31353e]/40">
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
          </div>

          {/* Main Headline */}
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#dfe2ee] max-w-4xl tracking-tight leading-none mb-6">
            Accélérez vos projets tech avec des assets digitaux d’élite
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#c7c4d7] max-w-2xl mx-auto mb-10 leading-relaxed">
            Templates Next.js & Figma, formations avancées, presets créatifs et outils conçus par des experts.
            Téléchargement instantané et licence commerciale étendue incluse.
          </p>

          {/* Search Console Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="w-full max-w-2xl bg-[#1c2028]/90 backdrop-blur-xl p-1 rounded-xl shadow-xl mb-4 border border-[#31353e]/80"
          >
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
          </form>

          {/* Popular Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 text-xs">
            <span className="text-[#908fa0] mr-1">Populaire :</span>
            {['SaaS Starter', 'Figma Design System', 'Masterclass Next.js', 'Prompt Packs'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onNavigate('catalogue')}
                className="px-3 py-1 rounded-full bg-[#181c24] hover:bg-[#262a33] text-[#c7c4d7] hover:text-[#c0c1ff] font-['JetBrains_Mono'] transition-colors border border-[#31353e]/50"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('catalogue')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-[#8083ff] via-[#571bc1] to-[#009eb9] hover:brightness-110 text-white text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>Explorer le Catalogue</span>
              <span className="material-symbols-outlined text-base">north_east</span>
            </button>
            <button
              onClick={() => {
                const bundleSection = document.getElementById('bundles');
                bundleSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#262a33]/70 hover:bg-[#262a33] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-[#31353e]"
            >
              <span className="material-symbols-outlined text-[#4cd7f6] text-base">local_offer</span>
              <span>Voir les Bundles Promo</span>
            </button>
          </div>

          {/* Reassurance Strip */}
          <div className="mt-14 pt-6 w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#1c2028]">
            <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-[#181c24]/50 border border-[#31353e]/30">
              <span className="material-symbols-outlined text-[#4cd7f6] text-2xl">groups</span>
              <div className="text-left">
                <p className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white leading-tight">14 000+</p>
                <p className="text-xs text-[#908fa0]">Créateurs & Devs Actifs</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-[#181c24]/50 border border-[#31353e]/30">
              <span className="material-symbols-outlined text-[#4cd7f6] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <div className="text-left">
                <p className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white leading-tight">4.9 / 5</p>
                <p className="text-xs text-[#908fa0]">+2 800 Avis Vérifiés</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-[#181c24]/50 border border-[#31353e]/30">
              <span className="material-symbols-outlined text-[#c0c1ff] text-2xl">lock</span>
              <div className="text-left">
                <p className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white leading-tight">Stripe & MoMo</p>
                <p className="text-xs text-[#908fa0]">MTN / Orange & Cartes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="font-['JetBrains_Mono'] text-xs text-[#4cd7f6] tracking-wider uppercase font-semibold">
              Architecture d’actifs
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white mt-1">
              Catégories Populaires
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#c7c4d7] max-w-md">
            Une collection rigoureusement testée, nettoyée et mise à jour pour accélérer chaque étape de votre pipeline tech.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              icon: 'layers',
              color: 'text-[#c0c1ff]',
              title: 'Templates & UI Kits',
              desc: 'Next.js 15, Tailwind, React & Figma',
              count: '320 assets',
              cat: 'ui',
            },
            {
              icon: 'smart_display',
              color: 'text-[#4cd7f6]',
              title: 'Formations & Vidéos',
              desc: 'Masterclasses pratiques & code-alongs',
              count: '85 heures',
              cat: 'formations',
            },
            {
              icon: 'menu_book',
              color: 'text-[#d0bcff]',
              title: 'E-books & Guides',
              desc: 'Playbooks d’ingénierie & solopreneuriat',
              count: '48 manuels',
              cat: 'ebooks',
            },
            {
              icon: 'rocket_launch',
              color: 'text-[#e1e0ff]',
              title: 'Boilerplates SaaS',
              desc: 'Auth, Stripe, Emailing prêt en 1h',
              count: '19 stacks',
              cat: 'boilerplates',
            },
            {
              icon: 'graphic_eq',
              color: 'text-[#4cd7f6]',
              title: 'Presets & Audio',
              desc: 'Shaders 3D, UI SFX & assets motion',
              count: '140 packs',
              cat: 'presets',
            },
          ].map((cat, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate('catalogue')}
              className="group p-6 rounded-xl bg-[#181c24] hover:bg-[#1c2028] transition-all shadow-sm flex flex-col justify-between min-h-[220px] border border-[#262a33] text-left hover:border-[#8083ff]/40"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-lg bg-[#262a33] flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white group-hover:text-[#c0c1ff] transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[#c7c4d7] mt-1">{cat.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#262a33]/60">
                <span className="font-['JetBrains_Mono'] text-xs text-[#908fa0]">{cat.count}</span>
                <span className="material-symbols-outlined text-[#908fa0] group-hover:text-white group-hover:translate-x-1 transition-all text-base">
                  arrow_forward
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="w-full bg-[#0a0e16]/60 py-16 border-y border-[#1c2028]" id="catalogue">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[#4cd7f6] font-['JetBrains_Mono'] text-xs uppercase mb-1 font-semibold">
                <span className="material-symbols-outlined text-sm">verified</span> Sélection Éditeur
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white">
                Produits Vedettes de la Semaine
              </h2>
            </div>
            <button
              onClick={() => onNavigate('catalogue')}
              className="inline-flex items-center gap-1 text-[#c0c1ff] hover:text-white text-sm font-semibold transition-colors"
            >
              <span>Voir tout le catalogue</span>
              <span className="material-symbols-outlined text-base">arrow_right_alt</span>
            </button>
          </div>

          {/* 4 High Detail Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <article
                key={p.id}
                className="flex flex-col rounded-xl bg-[#181c24] hover:bg-[#1c2028] transition-all duration-300 shadow-md overflow-hidden group border border-[#262a33]"
              >
                <div
                  className="relative w-full aspect-video overflow-hidden bg-[#262a33] cursor-pointer"
                  onClick={() => onNavigate('produit', p.id)}
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={p.title}
                    src={p.image}
                  />
                  {p.badge && (
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#571bc1] text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {p.badge}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0a0e16]/90 backdrop-blur-md text-[#4cd7f6] font-['JetBrains_Mono'] text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                    <span>Instant</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[#908fa0] text-xs mb-1 font-['JetBrains_Mono']">
                      <span className="uppercase text-[11px] truncate">{p.categoryLabel}</span>
                      <span className="text-[#4cd7f6] flex items-center gap-0.5 shrink-0">
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        {p.rating} ({p.reviewCount})
                      </span>
                    </div>
                    <h3
                      onClick={() => onNavigate('produit', p.id)}
                      className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white group-hover:text-[#c0c1ff] transition-colors line-clamp-1 cursor-pointer"
                    >
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#c7c4d7] mt-1 line-clamp-2 leading-relaxed">
                      {p.subtitle}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#262a33]">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">
                          {formatPriceEur(p.priceEur)}
                        </span>
                        {p.oldPriceEur && (
                          <span className="text-xs text-[#908fa0] line-through ml-1.5">
                            {formatPriceEur(p.oldPriceEur)}
                          </span>
                        )}
                      </div>
                      <span className="font-['JetBrains_Mono'] text-xs text-[#4cd7f6]">
                        {formatPriceXaf(p.priceEur)}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      <button
                        onClick={() => {
                          onAddToCart(p, 'standard');
                          onNavigate('checkout');
                        }}
                        className="col-span-4 py-2 rounded-lg bg-[#c0c1ff] hover:bg-white text-[#1000a9] text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">bolt</span>
                        <span>Achat Rapide</span>
                      </button>
                      <button
                        onClick={() => onAddToCart(p, 'standard')}
                        aria-label="Ajouter au panier"
                        className="col-span-1 py-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-[#c7c4d7] hover:text-white transition-colors flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Special Bundle Offer Showcase */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-16" id="bundles">
        <div className="relative rounded-2xl bg-gradient-to-r from-[#1c2028] to-[#181c24] p-6 lg:p-10 overflow-hidden shadow-xl border border-[#31353e]">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#8083ff]/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
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
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">check_circle</span>
                  <span>Licence Commerciale Illimitée</span>
                </div>
                <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">check_circle</span>
                  <span>Mises à jour à vie (v2 & v3)</span>
                </div>
                <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">check_circle</span>
                  <span>Canal Discord VIP Inclus</span>
                </div>
              </div>
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
                  onClick={() => {
                    // Add all 4 products to cart with discount
                    featuredProducts.forEach((p) => onAddToCart(p, 'standard'));
                    onNavigate('checkout');
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-gradient-to-r from-[#8083ff] to-[#571bc1] hover:brightness-110 text-white text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
                  <span>Débloquer le Pack Ultime (-45%)</span>
                </button>
              </div>
            </div>

            {/* Graphical Visualizer */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm rounded-xl bg-[#262a33]/80 p-4 backdrop-blur-md shadow-2xl border border-[#31353e]">
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-[#1c2028] flex items-center justify-between border border-[#31353e]/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#c0c1ff]">code</span>
                      <span className="text-xs font-semibold text-white">Nexus Starter Kit</span>
                    </div>
                    <span className="font-mono text-xs text-[#908fa0]">69 €</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1c2028] flex items-center justify-between border border-[#31353e]/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4cd7f6]">draw</span>
                      <span className="text-xs font-semibold text-white">Design System 2024</span>
                    </div>
                    <span className="font-mono text-xs text-[#908fa0]">49 €</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1c2028] flex items-center justify-between border border-[#31353e]/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#d0bcff]">videocam</span>
                      <span className="text-xs font-semibold text-white">Masterclass Full-Stack</span>
                    </div>
                    <span className="font-mono text-xs text-[#908fa0]">89 €</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#1c2028] flex items-center justify-between border border-[#31353e]/40">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#e1e0ff]">menu_book</span>
                      <span className="text-xs font-semibold text-white">E-book Solopreneur</span>
                    </div>
                    <span className="font-mono text-xs text-[#908fa0]">29 €</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-white border-t border-[#31353e]">
                    <span>Réduction Bundle (-45%)</span>
                    <span className="text-[#4cd7f6]">-107 €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Value Pillars */}
      <section className="w-full bg-[#181c24] py-16 border-y border-[#262a33]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 rounded-xl bg-[#1c2028]/80 shadow-sm flex flex-col items-start border border-[#31353e]/50">
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
            </div>

            <div className="p-8 rounded-xl bg-[#1c2028]/80 shadow-sm flex flex-col items-start border border-[#31353e]/50">
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
            </div>

            <div className="p-8 rounded-xl bg-[#1c2028]/80 shadow-sm flex flex-col items-start border border-[#31353e]/50">
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
            </div>
          </div>
        </div>
      </section>

      {/* Verified Testimonials Section */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-xl bg-[#181c24] shadow-sm flex flex-col justify-between border border-[#262a33]"
            >
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
            </div>
          ))}
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="w-full bg-[#0a0e16]/80 py-16 border-t border-[#1c2028]">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <span className="font-['JetBrains_Mono'] text-xs text-[#4cd7f6] uppercase font-semibold">
              Transparence & Réponses
            </span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white mt-1">
              Questions Fréquentes
            </h2>
            <p className="text-sm text-[#c7c4d7] mt-2">
              Tout ce que vous devez savoir sur nos licences, livraisons et garanties.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div key={faq.id} className="rounded-xl bg-[#181c24] border border-[#262a33] overflow-hidden">
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
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VIP Newsletter Section (-15% Offer) */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <div className="relative rounded-2xl bg-[#1c2028] p-6 lg:p-12 overflow-hidden shadow-2xl border border-[#31353e]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#4cd7f6]/10 rounded-full blur-[90px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8083ff]/10 rounded-full blur-[90px] pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
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

            <form
              onSubmit={handleNewsletterSubmit}
              className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto"
            >
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
            </form>
            <p className="text-xs text-[#908fa0]">Zéro spam. Désinscription en 1 clic à tout instant.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
