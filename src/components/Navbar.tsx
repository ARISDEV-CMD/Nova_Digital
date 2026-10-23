/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, productId?: string) => void;
  currency: 'EUR' | 'USD' | 'XAF';
  onCurrencyChange: (currency: 'EUR' | 'USD' | 'XAF') => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currency,
  onCurrencyChange,
  cartCount,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
              <img src="/assets/images/logo.png" alt="" className="w-8 h-8 object-contain group-hover:scale-105 transition-transform" />
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#dfe2ee] tracking-tight group-hover:text-[#c0c1ff] transition-colors">
                NovaDigital
              </span>
            </button>
            <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full bg-[#262a33] text-[#4cd7f6] font-['JetBrains_Mono'] text-xs font-medium">
              Digital Assets v2.4
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation Principale">
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
            <button
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
            </button>
          </nav>

          {/* Actions: Currency, Search, Cart, Profile, Admin */}
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

            {/* Quick search button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Recherche rapide"
              className="p-2 text-[#c7c4d7] hover:text-[#dfe2ee] hover:bg-[#262a33] rounded-lg transition-colors flex items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>

            {/* Cart trigger */}
            <button
              onClick={() => onNavigate('checkout')}
              aria-label={`Panier d'achats (${cartCount} articles)`}
              className="relative p-2 text-[#c7c4d7] hover:text-[#dfe2ee] hover:bg-[#262a33] rounded-lg transition-colors flex items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">shopping_bag</span>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#4cd7f6] text-[#002f38] rounded-full flex items-center justify-center text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-[#31353e] hidden sm:block"></div>

            {/* Client profile */}
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
              <span className="material-symbols-outlined text-[#c7c4d7] text-base hidden md:inline group-hover:text-[#dfe2ee]">
                expand_more
              </span>
            </button>

            {/* Admin Console Switcher */}
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#571bc1] hover:bg-[#8083ff] text-[#dfe2ee] rounded-lg text-xs font-semibold transition-colors shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
              <span>Accès Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-xl bg-[#1c2028] border border-[#31353e] rounded-xl shadow-2xl overflow-hidden">
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
            <div className="p-3 text-xs text-[#c7c4d7] bg-[#181c24]">
              <span className="text-[#908fa0] mr-2">Suggestions :</span>
              <button
                type="button"
                onClick={() => {
                  onNavigate('produit', 'nexus-saas');
                  setIsSearchOpen(false);
                }}
                className="hover:text-[#4cd7f6] mr-3 underline"
              >
                Nexus SaaS Starter Kit
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('produit', 'figma-pro-kit');
                  setIsSearchOpen(false);
                }}
                className="hover:text-[#4cd7f6] mr-3 underline"
              >
                NexusUI Figma
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('produit', 'art-du-solopreneur');
                  setIsSearchOpen(false);
                }}
                className="hover:text-[#4cd7f6] underline"
              >
                L'Art du Solopreneur
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
