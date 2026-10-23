/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, formatPriceEur, formatPriceXaf, EUR_TO_XAF_RATE } from '../utils/shop-logic.ts';

interface CatalogViewProps {
  products: Product[];
  onNavigate: (view: string, productId?: string) => void;
  onAddToCart: (product: Product, licenseTier?: 'standard' | 'agency') => void;
  initialCategory?: string;
  currency: 'EUR' | 'USD' | 'XAF';
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  onNavigate,
  onAddToCart,
  initialCategory = 'all',
  currency,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [minRating, setMinRating] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'pop' | 'new' | 'price-asc' | 'price-desc' | 'rating'>('pop');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<'standard' | 'extended' | 'personal'>('standard');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => !p.isDraft);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    list = list.filter((p) => p.priceEur <= maxPrice);

    if (minRating > 0) {
      list = list.filter((p) => p.rating >= minRating);
    }

    switch (sortOrder) {
      case 'price-asc':
        list.sort((a, b) => a.priceEur - b.priceEur);
        break;
      case 'price-desc':
        list.sort((a, b) => b.priceEur - a.priceEur);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'new':
        list.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'pop':
      default:
        list.sort((a, b) => b.reviewCount * b.rating - a.reviewCount * a.rating);
        break;
    }

    return list;
  }, [products, search, selectedCategory, maxPrice, minRating, sortOrder]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setMaxPrice(200);
    setMinRating(0);
    setSelectedLicense('standard');
  };

  const fcfaPrice = Math.round(maxPrice * EUR_TO_XAF_RATE);

  return (
    <div className="w-full bg-[#0f131c] text-[#dfe2ee]">
      <div className="relative w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Ambient Glows */}
        <div className="absolute top-12 left-1/4 w-96 h-96 bg-[#8083ff]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-48 right-10 w-80 h-80 bg-[#009eb9]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Breadcrumb & Header */}
        <section className="relative z-10 space-y-2 mb-8">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-[#c7c4d7]">
            <button
              onClick={() => onNavigate('accueil')}
              className="hover:text-[#c0c1ff] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              <span>Accueil</span>
            </button>
            <span className="text-[#464554] font-mono">/</span>
            <span className="text-white font-medium">Catalogue des Produits Digitaux</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#262a33] text-[#4cd7f6] font-['JetBrains_Mono'] text-xs mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                Dernière synchronisation licences : Instantanée
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                Explorez nos{' '}
                <span className="bg-gradient-to-r from-[#c0c1ff] via-[#d0bcff] to-[#4cd7f6] bg-clip-text text-transparent">
                  180+ Ressources
                </span>{' '}
                Digitales
              </h1>
              <p className="text-sm sm:text-base text-[#c7c4d7] max-w-2xl mt-1 leading-relaxed">
                Templates frontend d'élite, design systems Figma complets, boilerplates SaaS sécurisés et formations expertes.
              </p>
            </div>

            {/* Quick Stats Widget */}
            <div className="flex items-center gap-4 bg-[#181c24] px-4 py-2.5 rounded-xl shrink-0 shadow-sm border border-[#262a33]">
              <div className="text-left">
                <span className="block font-['JetBrains_Mono'] text-[11px] text-[#908fa0] uppercase tracking-wider">
                  Taux de mise à jour
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#c0c1ff]">99.4%</span>
              </div>
              <div className="w-px h-8 bg-[#31353e]"></div>
              <div className="text-left">
                <span className="block font-['JetBrains_Mono'] text-[11px] text-[#908fa0] uppercase tracking-wider">
                  Avis vérifiés
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#4cd7f6]">4.92/5</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter Control Bar (Top Bar) */}
        <section className="relative z-10 bg-[#181c24] rounded-xl p-3 mb-6 shadow-sm border border-[#262a33]">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#908fa0] text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un template, Next.js, Figma, SaaS boilerplate, JWT..."
                className="w-full bg-[#0a0e16] text-[#dfe2ee] placeholder-[#908fa0] text-xs sm:text-sm pl-10 pr-12 py-2.5 rounded-lg focus:outline-none focus:bg-[#1c2028] border border-[#31353e]/60"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[#908fa0] px-1.5 py-0.5 rounded bg-[#1c2028] hidden sm:block">
                ⌘K
              </span>
            </div>

            {/* Controls: Sorting, View Toggle & Count */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
              <div className="text-xs text-[#c7c4d7] flex items-center gap-1.5 px-2">
                <span className="w-2 h-2 rounded-full bg-[#8083ff]"></span>
                <span>
                  Affichage de <strong className="text-white">{filteredProducts.length}</strong> sur 184 ressources
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Selector */}
                <div className="flex items-center bg-[#0a0e16] rounded-lg px-3 py-1.5 border border-[#31353e]">
                  <span className="material-symbols-outlined text-[#908fa0] text-sm mr-1">sort</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    aria-label="Trier les résultats"
                    className="bg-transparent text-[#dfe2ee] text-xs font-medium focus:outline-none cursor-pointer pr-1"
                  >
                    <option className="bg-[#1c2028]" value="pop">Les plus populaires</option>
                    <option className="bg-[#1c2028]" value="new">Nouveautés (v2.4)</option>
                    <option className="bg-[#1c2028]" value="price-asc">Prix croissant</option>
                    <option className="bg-[#1c2028]" value="price-desc">Prix décroissant</option>
                    <option className="bg-[#1c2028]" value="rating">Mieux notés (★ 4.8+)</option>
                  </select>
                </div>

                {/* View Switcher */}
                <div className="flex items-center bg-[#0a0e16] p-1 rounded-lg border border-[#31353e]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                      viewMode === 'grid' ? 'bg-[#1c2028] text-[#c0c1ff]' : 'text-[#c7c4d7] hover:text-white'
                    }`}
                    title="Affichage en Grille"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">grid_view</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded flex items-center justify-center transition-colors ${
                      viewMode === 'list' ? 'bg-[#1c2028] text-[#c0c1ff]' : 'text-[#c7c4d7] hover:text-white'
                    }`}
                    title="Affichage en Liste"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">view_list</span>
                  </button>
                </div>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                  className="lg:hidden flex items-center gap-1 bg-[#262a33] px-3 py-2 rounded-lg text-white text-xs font-semibold"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  <span>Filtres</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Area: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR: Faceted Filters */}
          <aside
            className={`lg:col-span-3 lg:sticky lg:top-24 space-y-4 ${
              mobileFilterOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="bg-[#181c24] rounded-xl p-4 shadow-sm space-y-6 border border-[#262a33]">
              <div className="flex items-center justify-between pb-1 border-b border-[#262a33]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#c0c1ff] text-base">tune</span>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-white">Filtres Facettés</h2>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-[#4cd7f6] hover:underline flex items-center gap-0.5"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">restart_alt</span>
                  <span>Réinitialiser</span>
                </button>
              </div>

              {/* Section 1: Categories */}
              <div className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold">
                  Catégories d'actifs
                </h3>
                <div className="space-y-1 pt-1">
                  {[
                    { id: 'all', label: 'Toutes les catégories', count: 184 },
                    { id: 'boilerplates', label: 'Boilerplates SaaS', count: 19 },
                    { id: 'ui', label: 'Templates & UI Figma', count: 42 },
                    { id: 'formations', label: 'Formations Vidéo', count: 29 },
                    { id: 'ebooks', label: 'Ebooks & Guides PDF', count: 35 },
                    { id: 'presets', label: 'Presets & Audio', count: 22 },
                  ].map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center justify-between group cursor-pointer p-1.5 rounded-lg hover:bg-[#1c2028] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === cat.id}
                          onChange={() => setSelectedCategory(cat.id)}
                          className="w-3.5 h-3.5 rounded bg-[#0a0e16] text-[#8083ff] focus:ring-0 cursor-pointer accent-[#8083ff]"
                        />
                        <span className="text-xs text-[#dfe2ee] group-hover:text-[#c0c1ff] transition-colors">
                          {cat.label}
                        </span>
                      </div>
                      <span className="font-['JetBrains_Mono'] text-[11px] text-[#908fa0] px-1.5 py-0.5 rounded bg-[#0a0e16]">
                        {cat.count}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 2: Interactive Price Range */}
              <div className="space-y-2 border-t border-[#262a33] pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold">
                    Fourchette de Prix
                  </h3>
                  <span className="font-['JetBrains_Mono'] text-xs text-[#d0bcff] font-bold">
                    0 € — {maxPrice} €
                  </span>
                </div>
                <div className="pt-1">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#8083ff] bg-[#31353e] rounded-lg h-2 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-[#908fa0] mt-1">
                    <span>0 € (Gratuit)</span>
                    <span>200 € (131 000 FCFA)</span>
                  </div>
                </div>
                <div className="p-2 bg-[#1c2028] rounded-lg flex items-center justify-between text-xs text-[#c7c4d7] border border-[#31353e]/40">
                  <span>Conversion temps réel :</span>
                  <span className="font-['JetBrains_Mono'] text-[#4cd7f6] font-semibold">
                    ≈ {fcfaPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              {/* Section 3: License Type */}
              <div className="space-y-2 border-t border-[#262a33] pt-4">
                <h3 className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold">
                  Type de Licence
                </h3>
                <div className="space-y-1.5 pt-1">
                  {[
                    { id: 'standard', title: 'Commerciale Standard', desc: '1 projet client final' },
                    { id: 'extended', title: 'Licence Étendue (SaaS)', desc: 'Projets SaaS & revente autorisée' },
                    { id: 'personal', title: 'Usage Personnel', desc: 'Apprentissage & sandbox perso' },
                  ].map((lic) => (
                    <label
                      key={lic.id}
                      className="flex items-start gap-2 group cursor-pointer p-1.5 rounded-lg hover:bg-[#1c2028] transition-colors"
                    >
                      <input
                        type="radio"
                        name="license-sidebar"
                        checked={selectedLicense === lic.id}
                        onChange={() => setSelectedLicense(lic.id as any)}
                        className="mt-0.5 w-3.5 h-3.5 text-[#8083ff] accent-[#8083ff]"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs text-[#dfe2ee] font-medium">{lic.title}</span>
                        <span className="text-[11px] text-[#908fa0]">{lic.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 4: Rating Filters */}
              <div className="space-y-2 border-t border-[#262a33] pt-4">
                <h3 className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold">
                  Évaluation Minimale
                </h3>
                <div className="space-y-1 pt-1">
                  <button
                    onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors ${
                      minRating === 4 ? 'bg-[#1c2028] text-white' : 'hover:bg-[#1c2028] text-[#c7c4d7]'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-1 text-[#4cd7f6]">
                      {[...Array(4)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                      <span className="material-symbols-outlined text-sm text-[#464554]">star</span>
                      <span className="text-xs text-[#dfe2ee] ml-1">4.0 et plus</span>
                    </div>
                    <span className="font-mono text-xs text-[#908fa0]">142</span>
                  </button>
                  <button
                    onClick={() => setMinRating(minRating === 3 ? 0 : 3)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors ${
                      minRating === 3 ? 'bg-[#1c2028] text-white' : 'hover:bg-[#1c2028] text-[#c7c4d7]'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-1 text-[#4cd7f6]">
                      {[...Array(3)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                      <span className="material-symbols-outlined text-sm text-[#464554]">star</span>
                      <span className="material-symbols-outlined text-sm text-[#464554]">star</span>
                      <span className="text-xs text-[#dfe2ee] ml-1">3.0 et plus</span>
                    </div>
                    <span className="font-mono text-xs text-[#908fa0]">178</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Mini Banner */}
            <div className="bg-[#262a33] rounded-xl p-4 space-y-1.5 border border-[#31353e]">
              <div className="flex items-center gap-1.5 text-[#c0c1ff] text-xs font-semibold">
                <span className="material-symbols-outlined text-base">bolt</span>
                <span>Clé de Licence Instantanée</span>
              </div>
              <p className="text-xs text-[#c7c4d7] leading-relaxed">
                Délivrée automatiquement à la confirmation du panier. Accès GitHub direct sous 60 secondes.
              </p>
            </div>
          </aside>

          {/* RIGHT COLUMN: Product Grid / List */}
          <main className="lg:col-span-9 space-y-6">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-[#181c24] rounded-xl border border-[#262a33]">
                <span className="material-symbols-outlined text-4xl text-[#908fa0] mb-3">search_off</span>
                <h3 className="text-base font-bold text-white">Aucun produit ne correspond à ces critères</h3>
                <p className="text-xs text-[#c7c4d7] mt-1 max-w-sm mx-auto">
                  Essayez d'ajuster votre recherche ou réinitialisez les filtres pour afficher l'ensemble du catalogue.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 bg-[#8083ff] text-white text-xs font-semibold rounded-lg hover:bg-[#c0c1ff] hover:text-[#1000a9] transition-colors"
                >
                  Réinitialiser tous les filtres
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
                    : 'flex flex-col gap-4'
                }
              >
                {filteredProducts.map((p) => (
                  <article
                    key={p.id}
                    className={`group relative flex ${
                      viewMode === 'grid' ? 'flex-col' : 'flex-col sm:flex-row'
                    } bg-[#181c24] rounded-xl overflow-hidden hover:bg-[#1c2028] transition-all duration-300 shadow-md border border-[#262a33]`}
                  >
                    <div
                      className={`relative ${
                        viewMode === 'grid' ? 'w-full aspect-video' : 'w-full sm:w-64 sm:h-auto aspect-video sm:aspect-auto'
                      } overflow-hidden bg-[#0a0e16] cursor-pointer shrink-0`}
                      onClick={() => onNavigate('produit', p.id)}
                    >
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={p.title}
                        src={p.image}
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a0e16]/80 backdrop-blur-md text-[#4cd7f6] text-[11px] font-semibold border border-[#31353e]/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-ping"></span>
                        <span>{p.formatLabel}</span>
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1">
                        {p.tags.slice(0, 2).map((t, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-[#31353e]/90 backdrop-blur-md text-white font-['JetBrains_Mono'] text-[10px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs mb-1">
                          <span className="text-[#c0c1ff] uppercase font-bold tracking-wider text-[11px]">
                            {p.categoryLabel}
                          </span>
                          <div className="flex items-center gap-1 text-[#4cd7f6] font-['JetBrains_Mono']">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                            <span className="text-white font-semibold">{p.rating}</span>
                            <span className="text-[#908fa0]">({p.reviewCount})</span>
                          </div>
                        </div>

                        <h3
                          onClick={() => onNavigate('produit', p.id)}
                          className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white group-hover:text-[#c0c1ff] transition-colors cursor-pointer line-clamp-1"
                        >
                          {p.title}
                        </h3>

                        <p className="text-xs text-[#c7c4d7] line-clamp-2 mt-1 leading-relaxed">
                          {p.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1 mt-3">
                          {p.techStack.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-[#1c2028] text-[10px] text-[#908fa0] font-mono border border-[#31353e]/40"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#262a33] flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white">
                              {formatPriceEur(p.priceEur)}
                            </span>
                            {p.oldPriceEur && (
                              <span className="text-xs text-[#908fa0] line-through">
                                {formatPriceEur(p.oldPriceEur)}
                              </span>
                            )}
                          </div>
                          <span className="block font-['JetBrains_Mono'] text-[11px] text-[#4cd7f6]">
                            ≈ {formatPriceXaf(p.priceEur)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onNavigate('produit', p.id)}
                            className="p-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] transition-colors flex items-center justify-center"
                            title="Aperçu interactif"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                          </button>
                          <button
                            onClick={() => onAddToCart(p, 'standard')}
                            className="px-3.5 py-2 rounded-lg bg-[#c0c1ff] hover:bg-white text-[#1000a9] text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-sm">shopping_bag</span>
                            <span>Ajouter</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <nav
              aria-label="Pagination Catalogue"
              className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0a0e16] p-4 rounded-xl border border-[#262a33]"
            >
              <div className="text-xs text-[#c7c4d7]">
                Page <span className="font-bold text-white">{currentPage}</span> sur <span className="font-bold text-white">16</span> — 8 résultats par page
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg bg-[#181c24] text-[#908fa0] hover:text-white disabled:opacity-40 transition-colors"
                  type="button"
                  aria-label="Page précédente"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold font-mono flex items-center justify-center ${
                    currentPage === 1 ? 'bg-[#8083ff] text-white shadow-sm' : 'bg-[#1c2028] text-white'
                  }`}
                  type="button"
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold font-mono flex items-center justify-center ${
                    currentPage === 2 ? 'bg-[#8083ff] text-white shadow-sm' : 'bg-[#1c2028] text-[#c7c4d7] hover:text-white'
                  }`}
                  type="button"
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(3)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold font-mono flex items-center justify-center ${
                    currentPage === 3 ? 'bg-[#8083ff] text-white shadow-sm' : 'bg-[#1c2028] text-[#c7c4d7] hover:text-white'
                  }`}
                  type="button"
                >
                  3
                </button>
                <span className="w-6 text-center text-[#908fa0] font-mono text-xs">...</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(16, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-[#262a33] hover:bg-[#8083ff] hover:text-white text-[#dfe2ee] text-xs font-semibold transition-colors flex items-center gap-1"
                  type="button"
                >
                  <span>Suivant</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </nav>

            {/* Guarantee mini row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-[#181c24] p-3.5 rounded-xl flex items-start gap-2.5 border border-[#262a33]">
                <span className="material-symbols-outlined text-[#4cd7f6] text-xl">verified</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Vérification de Code</h4>
                  <p className="text-[11px] text-[#c7c4d7] mt-0.5">Zéro dépendance obsolète. Audité par SonarQube & Snyk.</p>
                </div>
              </div>
              <div className="bg-[#181c24] p-3.5 rounded-xl flex items-start gap-2.5 border border-[#262a33]">
                <span className="material-symbols-outlined text-[#c0c1ff] text-xl">flash_on</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Déploiement en 1 Clic</h4>
                  <p className="text-[11px] text-[#c7c4d7] mt-0.5">Compatibles Vercel, Railway, Docker VPS sans friction.</p>
                </div>
              </div>
              <div className="bg-[#181c24] p-3.5 rounded-xl flex items-start gap-2.5 border border-[#262a33]">
                <span className="material-symbols-outlined text-[#d0bcff] text-xl">published_with_changes</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Mises à Jour Gratuites</h4>
                  <p className="text-[11px] text-[#c7c4d7] mt-0.5">Accès permanent aux versions majeures via votre espace.</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
