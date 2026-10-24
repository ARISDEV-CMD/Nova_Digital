/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import {Product,filterCatalogProducts,EUR_TO_XAF_RATE} from '../utils/shop-logic.ts';
import {ProductCard} from '../components/products/ProductCard.tsx';import {EmptyState} from '../components/feedback/EmptyState.tsx';import {Button} from '../components/ui/Button.tsx';import {Badge} from '../components/ui/Badge.tsx';
import { ProductGridSkeleton, Skeleton } from '../components/feedback/Skeleton.tsx';

interface CatalogViewProps {
  products: Product[];
  onNavigate: (view: string, productId?: string) => void;
  onAddToCart: (product: Product, licenseTier?: 'standard' | 'agency') => void;
  initialCategory?: string;
  currency: 'EUR' | 'USD' | 'XAF';
  loading?: boolean;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  onNavigate,
  onAddToCart,
  initialCategory = 'all',
  currency,
  loading = false,
}) => {
  const [search,setSearch]=useState('');
  const [selectedCategory,setSelectedCategory]=useState<string>(initialCategory);
  const [maxPrice,setMaxPrice]=useState(200);
  const [deliveryType,setDeliveryType]=useState<Product['deliveryType']|'all'>('all');
  const [viewMode,setViewMode]=useState<'grid'|'list'>('grid');
  const [sortOrder,setSortOrder]=useState<'manual'|'price-asc'|'price-desc'>('manual');
  const [mobileFilterOpen,setMobileFilterOpen]=useState(false);
  const [currentPage,setCurrentPage]=useState(1);const pageSize=8;
  const filteredProducts=useMemo(()=>filterCatalogProducts(products,{search,category:selectedCategory,maxPrice,deliveryType:deliveryType==='all'?undefined:deliveryType,sort:sortOrder==='manual'?undefined:sortOrder}),[products,search,selectedCategory,maxPrice,deliveryType,sortOrder]);
  const publishedProducts=products.filter(p=>!p.isDraft);const totalPages=Math.max(1,Math.ceil(filteredProducts.length/pageSize));const visibleProducts=filteredProducts.slice((currentPage-1)*pageSize,currentPage*pageSize);const fcfaPrice=Math.round(maxPrice*EUR_TO_XAF_RATE);
  const courseCategories=Array.from(new Map(publishedProducts.map(product=>[product.category,{id:product.category,label:product.categoryLabel}])).values());
  const categories=[{id:'all',label:'Toutes les formations',count:publishedProducts.length},...courseCategories.map(category=>({...category,count:publishedProducts.filter(product=>product.category===category.id).length}))];
  useEffect(()=>{setCurrentPage(1)},[search,selectedCategory,maxPrice,deliveryType,sortOrder]);
  const handleCategoryChange=(category:string)=>{
    setSelectedCategory(category);
    if(category==='all') onNavigate('catalogue');
    else if(category==='formations') onNavigate('catalogue-formations');
    else if(category==='boilerplates') onNavigate('catalogue-templates');
    else onNavigate(`catalogue-categorie-${category}`);
  };
  const handleResetFilters=()=>{setSearch('');handleCategoryChange(initialCategory);setMaxPrice(200);setDeliveryType('all');setSortOrder('manual')};

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
                  Ressources
                </span>{' '}
                Digitales
              </h1>
              <p className="text-sm sm:text-base text-[#c7c4d7] max-w-2xl mt-1 leading-relaxed">
                Templates frontend d'élite, design systems Figma complets, boilerplates SaaS sécurisés et formations expertes.
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-[#262a33] bg-[#181c24] px-4 py-3"><div><span className="block text-[11px] uppercase tracking-wider text-[#908fa0]">Produits présentés</span>{loading ? <Skeleton className="mt-1 h-6 w-8" /> : <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white">{publishedProducts.length}</span>}</div><div className="h-8 w-px bg-[#31353e]"/><div><span className="block text-[11px] uppercase tracking-wider text-[#908fa0]">Mode</span><span className="font-['Plus_Jakarta_Sans'] text-sm font-semibold text-[#4cd7f6]">Démo locale</span></div></div>
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
                  {loading ? <Skeleton className="h-4 w-40" /> : <>{filteredProducts.length} résultat{filteredProducts.length>1?'s':''} sur {publishedProducts.length} produit{publishedProducts.length>1?'s':''}</>}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort Selector */}
                <div className="flex items-center bg-[#0a0e16] rounded-lg px-3 py-1.5 border border-[#31353e]">
                  <span className="material-symbols-outlined text-[#908fa0] text-sm mr-1">sort</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'manual'|'price-asc'|'price-desc')}
                    aria-label="Trier les résultats"
                    className="bg-transparent text-[#dfe2ee] text-xs font-medium focus:outline-none cursor-pointer pr-1"
                  >
                    <option className="bg-[#1c2028]" value="manual">Ordre du catalogue</option><option className="bg-[#1c2028]" value="price-asc">Prix croissant</option><option className="bg-[#1c2028]" value="price-desc">Prix décroissant</option></select>
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
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center justify-between group cursor-pointer p-1.5 rounded-lg hover:bg-[#1c2028] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === cat.id}
                          onChange={() => handleCategoryChange(cat.id)}
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

              <div className="space-y-2 border-t border-[#262a33] pt-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-[#908fa0]">Mode de livraison</h3><div className="space-y-1">{[{id:'all',label:'Tous les formats'},{id:'instant',label:'Téléchargement direct'},{id:'github',label:'Dépôt GitHub'},{id:'video',label:'Formation vidéo'},{id:'book',label:'Ebook'}].map(option=><label key={option.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-[#c7c4d7] transition-colors hover:bg-[#1c2028]"><input type="radio" name="delivery" checked={deliveryType===option.id} onChange={()=>setDeliveryType(option.id as Product['deliveryType']|'all')} className="accent-[#8083ff]"/>{option.label}</label>)}</div></div>
            </div>

            <div className="rounded-xl border border-[#31353e] bg-[#181c24] p-4"><Badge tone="warning">Catalogue de démonstration</Badge><p className="mt-2 text-xs leading-5 text-[#c7c4d7]">Les informations et tarifs présentés sont des exemples à confirmer avant publication.</p></div>
          </aside>

          {/* RIGHT COLUMN: Product Grid / List */}
          <main className="lg:col-span-9 space-y-6">
            {loading ? <ProductGridSkeleton count={8} horizontal={viewMode === 'list'} /> : filteredProducts.length===0?<EmptyState icon="search_off" title="Aucun produit trouvé" description="Modifiez la recherche ou les filtres pour afficher d’autres produits." action={<Button variant="secondary" onClick={handleResetFilters}>Réinitialiser les filtres</Button>}/>:<div className={viewMode==='grid'?'grid grid-cols-1 gap-5 md:grid-cols-2':'flex flex-col gap-4'}>{visibleProducts.map(product=><ProductCard key={product.id} product={product} currency={currency} layout={viewMode} onOpen={selected=>onNavigate('produit',selected.id)} onAddToCart={selected=>onAddToCart(selected,'standard')}/>)}</div>}
            {!loading && totalPages>1&&<nav aria-label="Pagination du catalogue" className="flex flex-col items-center justify-between gap-3 rounded-xl border border-[#262a33] bg-[#0a0e16] p-4 sm:flex-row"><p className="text-xs text-[#c7c4d7]">Page {currentPage} sur {totalPages} · {filteredProducts.length} résultats</p><div className="flex items-center gap-2"><Button size="sm" variant="secondary" disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}>Précédent</Button><Button size="sm" variant="secondary" disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>Suivant</Button></div></nav>}
            <p role="note" className="rounded-xl border border-[#31353e] bg-[#181c24] p-4 text-xs leading-5 text-[#908fa0]">Les indicateurs de confiance seront affichés lorsqu’ils pourront être vérifiés.</p>
          </main>
        </div>
      </div>
    </div>
  );
};
