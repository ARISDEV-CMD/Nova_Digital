/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotionPreference } from '../hooks/use-reduced-motion.ts';
import { SearchIcon } from '@animateicons/react/lucide/search-icon';
import { ShoppingBagIcon } from '@animateicons/react/lucide/shopping-bag-icon';
import { IconButton } from './ui/IconButton.tsx';
import type { Product } from '../utils/shop-logic.ts';
import { PriceDisplay } from './ui/PriceDisplay.tsx';

interface NavbarProps {
  currentView: string;
  isAdmin: boolean;
  onNavigate: (view: string, productId?: string) => void;
  currency: 'EUR' | 'USD' | 'XAF';
  onCurrencyChange: (currency: 'EUR' | 'USD' | 'XAF') => void;
  cartCount: number;
  products: Product[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  isAdmin,
  onNavigate,
  currency,
  onCurrencyChange,
  cartCount,
  products,
}) => {
  const prefersReducedMotion = useReducedMotionPreference();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('catalogue');
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f131c]/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#262a33]/50">
        <div className="h-20 max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Brand zone */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              onClick={() => onNavigate('accueil')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
              aria-label="NovaDigital Accueil"
            >
              <img src="/assets/images/logo.png" alt="" className="w-15 h-15 object-contain group-hover:scale-105 transition-transform" />
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#dfe2ee] tracking-tight group-hover:text-[#c0c1ff] transition-colors">
                NovaDigital
              </span>
            </button>
            <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full bg-[#262a33] text-[#4cd7f6] font-['JetBrains_Mono'] text-xs font-medium">
              Digital Assets v2.4
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-between gap-5" aria-label="Navigation Principale">
            <button
              onClick={() => onNavigate('accueil')}
              className={`px-3.5 py-2 rounded-lg text-sm transition-colors ${
                currentView === 'accueil'
                  ? 'text-[#dfe2ee] bg-[#262a33] font-semibold'
                  : 'text-[#c7c4d7] hover:text-[#dfe2ee] hover:bg-[#262a33]/60'
              }`}
            >
              Accueil
            </button>
            <button
              onClick={() => onNavigate('catalogue')}
              className={`px-3.5 py-2 rounded-lg text-sm transition-colors ${
                currentView === 'catalogue'
                  ? 'text-[#dfe2ee] bg-[#262a33] font-semibold'
                  : 'text-[#c7c4d7] hover:text-[#dfe2ee] hover:bg-[#262a33]/60'
              }`}
            >
              Catalogue
            </button>
            {/* <button
              onClick={() => onNavigate('catalogue-templates')}
              className="px-3.5 py-2 rounded-lg text-sm text-[#c7c4d7] hover:text-[#dfe2ee] hover:bg-[#262a33]/60 transition-colors"
            >
              Templates & UI
            </button>
            <button
              onClick={() => onNavigate('catalogue-formations')}
              className="px-3.5 py-2 rounded-lg text-sm text-[#c7c4d7] hover:text-[#dfe2ee] hover:bg-[#262a33]/60 transition-colors"
            >
              Formations & Guides
            </button>
            <button
              onClick={() => onNavigate('offres-speciales')}
              className="px-3.5 py-2 rounded-lg text-sm text-[#c7c4d7] hover:text-[#dfe2ee] hover:bg-[#262a33]/60 transition-colors"
            >
              Offres Spéciales
            </button> */}
          </nav>

            {/* Actions: Currency, Search, Cart and Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Currency selector */}
            <div className="hidden sm:flex items-center bg-[#181c24] px-2.5 py-1.5 rounded-lg border border-[#31353e]/60">
              <span className="material-symbols-outlined text-[#908fa0] text-base mr-1">payments</span>
              <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as 'EUR' | 'USD' | 'XAF')}
                aria-label="Changer la devise"
                className="bg-transparent text-[#dfe2ee] text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                <option className="bg-[#1c2028] text-[#dfe2ee]" value="EUR">EUR (€)</option>
                <option className="bg-[#1c2028] text-[#dfe2ee]" value="USD">USD ($)</option>
                <option className="bg-[#1c2028] text-[#dfe2ee]" value="XAF">XAF (FCFA)</option>
              </select>
            </div>

            {/* Search field opens the full search modal */}
            <label className="hidden md:flex h-10 w-48 xl:w-64 items-center gap-2 rounded-lg border border-[#31353e] bg-[#181c24] px-3 text-[#908fa0] transition-colors hover:border-[#5557a8] focus-within:border-[#8083ff]">
              <SearchIcon size={18} color="currentColor" isAnimated={!prefersReducedMotion} />
              <input
                type="search"
                readOnly
                aria-label="Ouvrir la recherche"
                placeholder="Rechercher…"
                onClick={() => setIsSearchOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsSearchOpen(true);
                  }
                }}
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-sm text-[#dfe2ee] placeholder:text-[#8f96a6] outline-none"
              />
            </label>
            <span className="md:hidden">
              <IconButton label="Recherche rapide" onClick={() => setIsSearchOpen(true)}>
                <SearchIcon size={20} color="currentColor" isAnimated={!prefersReducedMotion} />
              </IconButton>
            </span>

            {/* Cart trigger */}
            <IconButton
              label={`Panier d'achats (${cartCount} articles)`}
              onClick={() => onNavigate('checkout')}
              className="relative"
            >
              <ShoppingBagIcon size={20} color="currentColor" isAnimated={!prefersReducedMotion} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#4cd7f6] px-1 text-[10px] font-bold text-[#002f38]">
                  {cartCount}
                </span>
              )}
            </IconButton>

            <div className="h-6 w-px bg-[#31353e] hidden sm:block"></div>

            {/* Profile actions */}
            {isAdmin ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  className="flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-[#262a33] group"
                  title="Profil administrateur"
                  aria-label="Ouvrir le menu du profil administrateur"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8083ff] text-[#1000a9] ring-1 ring-[#4cd7f6]/40">
                    <span className="material-symbols-outlined text-[19px]">admin_panel_settings</span>
                  </span>
                  <span className="material-symbols-outlined hidden text-base text-[#c7c4d7] group-hover:text-[#dfe2ee] md:inline">expand_more</span>
                </button>
                {isProfileMenuOpen && (
                  <div aria-label="Menu du profil administrateur" className="absolute right-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-xl border border-[#31353e] bg-[#181c24] p-2 shadow-2xl">
                    <div className="border-b border-[#31353e] px-3 py-2">
                      <p className="text-xs font-semibold text-white">Espace administrateur</p>
                      <p className="mt-1 text-[11px] text-[#908fa0]">Accès rapide à la console</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { onNavigate('admin-dashboard'); setIsProfileMenuOpen(false); }}
                      className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-[#dfe2ee] transition-colors hover:bg-[#262a33] hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[19px] text-[#8083ff]">space_dashboard</span>
                      Revenir au tableau de bord
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('mon-espace-client')}
                className="flex items-center gap-1.5 p-1 hover:bg-[#262a33] rounded-full transition-colors group"
                title="Mon Espace Client"
                aria-label="Espace Client"
              >
                <img
                  alt="Profile Alexandre Martin"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#4cd7f6]/40"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbbjLYCH0Mu1qdXRxpc4SdyhwaYINyKT1x4Y7FhYzfWXiaC74k_7y3vHXglNYbaBpwvAbcjaIa29YhIAFaiBtKGksRuPWBASe0emMeqDLh4O0rEHV5C-E0Gub6whkWesIkVNoEZVrFovvpZCTEXG0Mhku94Dl1mUmqpkPKH7OMNIrwKXo33iHXMMue4Cz2OA-h0HWRpUA-Vyygxty3Yi_67ryvPoNcabjGKRB0ET8mK_lRdCjJ-hjF"
                />
                <span className="material-symbols-outlined text-[#c7c4d7] text-base hidden md:inline group-hover:text-[#dfe2ee]">expand_more</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          key="search-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          role="presentation"
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.985 }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }}
            className="w-full max-w-xl bg-[#1c2028] border border-[#31353e] rounded-xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Recherche de produits"
          >
            <form onSubmit={handleSearchSubmit} className="p-3 border-b border-[#31353e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#908fa0]">terminal</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher starter kit, Figma, Saas, Guide..."
                autoFocus
                className="flex-1 bg-transparent text-[#dfe2ee] placeholder-[#908fa0] text-sm focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-[#8083ff] text-white text-xs font-semibold rounded-md hover:bg-[#c0c1ff] hover:text-[#1000a9] transition-colors"
              >
                Rechercher
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-[#908fa0] hover:text-white"
                aria-label="Fermer la recherche"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </form>
            <div className="border-b border-[#31353e] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#908fa0]">{searchQuery.trim() ? 'Résultats produits' : 'Produits populaires'}</div>
            <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
              {products.filter((product) => {
                const query = searchQuery.trim().toLocaleLowerCase();
                return !query || `${product.title} ${product.subtitle} ${product.description} ${product.categoryLabel} ${product.tags.join(' ')}`.toLocaleLowerCase().includes(query);
              }).slice(0, 5).map((product) => (
                <button key={product.id} type="button" onClick={() => { onNavigate('produit', product.id); setIsSearchOpen(false); }} className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[#262a33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cd7f6]">
                  <img src={product.image} alt="" className="h-12 w-14 shrink-0 rounded-md object-cover" loading="lazy" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{product.title}</span><span className="mt-0.5 block truncate text-xs text-[#908fa0]">{product.categoryLabel} · {product.formatLabel}</span></span>
                  <PriceDisplay amountEur={product.priceEur} currency={currency} className="shrink-0 text-sm font-semibold text-[#4cd7f6]" />
                  <span aria-hidden="true" className="material-symbols-outlined text-base text-[#908fa0]">visibility</span>
                </button>
              ))}
              {products.filter((product) => {
                const query = searchQuery.trim().toLocaleLowerCase();
                return !query || `${product.title} ${product.subtitle} ${product.description} ${product.categoryLabel} ${product.tags.join(' ')}`.toLocaleLowerCase().includes(query);
              }).length === 0 && <p className="p-5 text-center text-sm text-[#908fa0]">Aucun produit ne correspond. Essayez un autre terme.</p>}
            </div>
            <div className="border-t border-[#31353e] p-3 text-right"><button type="button" onClick={handleSearchSubmit} className="text-xs font-semibold text-[#c0c1ff] hover:text-white">Voir tous les résultats <span aria-hidden="true">?</span></button></div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
};
