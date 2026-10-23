/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, formatPriceEur, formatPriceXaf } from '../utils/shop-logic.ts';

interface ProductDetailViewProps {
  product: Product;
  onNavigate: (view: string, productId?: string) => void;
  onAddToCart: (product: Product, licenseTier?: 'standard' | 'agency') => void;
  currency: 'EUR' | 'USD' | 'XAF';
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onNavigate,
  onAddToCart,
  currency,
}) => {
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [licenseTier, setLicenseTier] = useState<'standard' | 'agency'>('standard');
  const [activeTab, setActiveTab] = useState<'inclus' | 'specs' | 'avis'>('inclus');
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);

  // Gallery thumbnails with distinct high-res assets
  const galleryThumbnails = [
    {
      label: 'Dashboard Admin',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDR48kTeJZSudKRgyUf0FGm12Bv08EIPABioG8L33AhP7u2hpoGiXToV18UKdERwodMn2feh3EfodM2CWE7Mnk39siwNj4fjKbGsUa7UuODYvXYVoRQ6_t7xw2R4WSvMSIma5Pu3W31QLG96HJA7qzb4B84yL_uCK1nSQwmDg_Q8ua0Yvv2CcMSGJFMxWvYBfhsIxzaUeDIgJ1AGdbTwPzDL7Gkfw2Hi5b7amAZygLKwMl97wZSe5kK',
      badge: 'Vue Principale',
    },
    {
      label: 'Supabase Auth & RLS',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDTooo9Cdyc7x4ELDe6g5VEbOT2aTrYfzztpjNcwhxYYfOI4uZWAy4EjpYdqOeshh9PQlhQ8NUjbstwXpOp8-2DugOdOlwvQJllt52qN2Vdkok7OM3wnlzUJJngxmBdw8ZRUEJxAWMOWmS4N43W6NJ9re9KZpP-5IQl0cg4uTN0fzzaf3GCpaLQUpN_BTd9LkVJuSBA7DJiTqz466oExGCc_bXu0t9WjSzEUGr637n1rAxWwXJbLL9C',
      badge: 'Auth Supabase',
    },
    {
      label: 'Composants & Layouts',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCLv2b99SqgWfIVizFRP_iP9NCRzFlfRfXfonQz7DqrjBEQaYCT4LLqyDWUtaVmDJBTN7Ni-WBnBWb71TLEMfXByAwHT-wPYo2JGN1otLDH5xGLtLuyzq8UHsYlSuP6PL2OX84A9ULwxScAWA_u9zyaoGhDajFnV2mDAX56aNthVbhqJIwHeO4GNGFC58i24RdmpfhkMG_xUUBq5Ug58o3JnuarFcJUT38j-YD5IyGbi1n42tFIydVs',
      badge: 'Design System',
    },
    {
      label: 'Vue Mobile Responsive',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDZT8fPpXhVysksA-W1xGRbjF-erY62ahL4LjMXJdnCzWNz9Hx12gHNJaAcwCf80yRyF3cY9eP1VLhM4UNSVacxFgvQycc-MXakwELXuR4t-1p7Bk3DgwkY_d2-HbwH5VL2Amn0Vf2_DGBY3hftL5tTgwcvVDUfpMaP1JAlIne4YQkZl6eSlWsjRHZoDInM3F1jt04YpwcSD2riU9F8SrnGOrd1Ym_TytkZM4D8kOefpEHkxkYA4_5x',
      badge: 'Responsive 60fps',
    },
  ];

  const currentPriceEur = licenseTier === 'standard' ? product.priceEur : 179;
  const currentOldPriceEur = licenseTier === 'standard' ? product.oldPriceEur || 119 : 299;

  const handleAddCart = () => {
    onAddToCart(product, licenseTier);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2400);
  };

  const handleDirectBuy = () => {
    onAddToCart(product, licenseTier);
    onNavigate('checkout');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewName.trim() && reviewComment.trim()) {
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewSubmitted(false);
        setReviewFormOpen(false);
        setReviewName('');
        setReviewComment('');
      }, 3000);
    }
  };

  return (
    <div className="w-full bg-[#0f131c] text-[#dfe2ee]">
      <div className="relative w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Subtle Ambient Glows */}
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-[#8083ff]/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-96 right-10 w-[420px] h-[420px] bg-[#009eb9]/10 rounded-full blur-[160px] pointer-events-none"></div>

        {/* 1. Breadcrumbs */}
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center justify-between gap-3 mb-6 text-xs text-[#c7c4d7]">
          <ol className="flex items-center flex-wrap gap-2">
            <li>
              <button
                onClick={() => onNavigate('accueil')}
                className="hover:text-[#c0c1ff] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                <span>Accueil</span>
              </button>
            </li>
            <li className="text-[#908fa0]">/</li>
            <li>
              <button onClick={() => onNavigate('catalogue')} className="hover:text-[#c0c1ff] transition-colors">
                Catalogue
              </button>
            </li>
            <li className="text-[#908fa0]">/</li>
            <li>
              <span className="text-[#908fa0]">{product.categoryLabel}</span>
            </li>
            <li className="text-[#908fa0]">/</li>
            <li className="text-white font-semibold truncate max-w-xs">{product.title}</li>
          </ol>
          <div className="inline-flex items-center gap-2 font-mono text-xs bg-[#262a33] px-3 py-1 rounded-full text-[#4cd7f6] border border-[#31353e]">
            <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse"></span>
            <span>Dernière release: v2.4 (Il y a 3 jours)</span>
          </div>
        </nav>

        {/* 2. Main Showcase Grid (Gallery vs Sticky Buy Box) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Media Gallery & Architecture Highlights (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Master Stage */}
            <div className="relative rounded-xl bg-[#181c24] overflow-hidden shadow-2xl border border-[#262a33]">
              {/* Window controls bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#0a0e16]/80 backdrop-blur-md border-b border-[#262a33]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d0bcff]/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]/80"></span>
                  <span className="ml-2 font-mono text-xs text-[#908fa0]">nexus-saas-enterprise.tsx</span>
                </div>
                <span className="font-mono text-xs text-[#4cd7f6] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-xs">bolt</span> Next.js 14/15 App Router
                </span>
              </div>

              {/* Main Preview Image */}
              <div className="relative aspect-video w-full overflow-hidden bg-[#262a33]">
                <img
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  src={galleryThumbnails[selectedThumb].image}
                />
                <div className="absolute bottom-4 left-4 bg-[#0a0e16]/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-lg border border-[#31353e]/60">
                  <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-ping"></span>
                  <span className="text-xs font-semibold text-white">
                    {galleryThumbnails[selectedThumb].badge} : Multi-tenant & SSR Activé
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Interactive Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {galleryThumbnails.map((thumb, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedThumb(index)}
                  className={`relative aspect-video rounded-lg overflow-hidden bg-[#262a33] transition-all p-0.5 text-left focus:outline-none border ${
                    selectedThumb === index
                      ? 'border-[#8083ff] shadow-[0_0_12px_rgba(128,131,255,0.35)] opacity-100'
                      : 'border-[#31353e] opacity-70 hover:opacity-100'
                  }`}
                  type="button"
                >
                  <img alt={thumb.label} className="w-full h-full object-cover rounded" src={thumb.image} />
                  <span className="absolute inset-x-0 bottom-0 bg-[#0a0e16]/90 py-0.5 text-center text-[10px] text-white truncate px-1 font-medium">
                    {thumb.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Interactive Demo Trigger Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#181c24] shadow-md border border-[#262a33]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#262a33] flex items-center justify-center text-[#4cd7f6] shrink-0">
                  <span className="material-symbols-outlined">captive_portal</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Environnement de Démo Interactif</p>
                  <p className="text-xs text-[#c7c4d7]">Explorez l'espace client complet avec authentification et Stripe en mode Sandbox.</p>
                </div>
              </div>
              <button
                onClick={() => alert("Environnement Sandbox de démonstration ouvert ! Identifiant démo : demo@novadigital.io")}
                className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors group border border-[#31353e]"
              >
                <span>Tester la Démo en Direct</span>
                <span className="material-symbols-outlined text-xs text-[#4cd7f6] group-hover:translate-x-0.5 transition-transform">
                  open_in_new
                </span>
              </button>
            </div>

            {/* Feature Matrix Visual Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-[#181c24] border border-[#262a33]">
                <div className="flex items-center justify-between text-[#908fa0] text-xs">
                  <span className="font-mono">Lighthouse</span>
                  <span className="material-symbols-outlined text-[#4cd7f6] text-sm">speed</span>
                </div>
                <div className="mt-2">
                  <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">100/100</span>
                  <p className="text-[11px] text-[#c7c4d7]">Web Vitals Parfaits</p>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#181c24] border border-[#262a33]">
                <div className="flex items-center justify-between text-[#908fa0] text-xs">
                  <span className="font-mono">Sécurité</span>
                  <span className="material-symbols-outlined text-[#c0c1ff] text-sm">shield</span>
                </div>
                <div className="mt-2">
                  <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">RLS Strict</span>
                  <p className="text-[11px] text-[#c7c4d7]">Row-Level Security</p>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#181c24] border border-[#262a33]">
                <div className="flex items-center justify-between text-[#908fa0] text-xs">
                  <span className="font-mono">Billing</span>
                  <span className="material-symbols-outlined text-[#d0bcff] text-sm">currency_exchange</span>
                </div>
                <div className="mt-2">
                  <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">Multi-Rail</span>
                  <p className="text-[11px] text-[#c7c4d7]">Stripe + Mobile Money</p>
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-[#181c24] border border-[#262a33]">
                <div className="flex items-center justify-between text-[#908fa0] text-xs">
                  <span className="font-mono">Gain Temps</span>
                  <span className="material-symbols-outlined text-[#4cd7f6] text-sm">hourglass_bottom</span>
                </div>
                <div className="mt-2">
                  <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">~140h</span>
                  <p className="text-[11px] text-[#c7c4d7]">Économisées au launch</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Buy & Conversion Module (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="relative rounded-2xl bg-[#181c24] p-6 shadow-2xl overflow-hidden border border-[#262a33]">
              {/* Subtle accent top strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#8083ff] via-[#4cd7f6] to-[#571bc1]"></div>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#571bc1]/40 text-[#d0bcff] font-mono text-xs border border-[#571bc1]/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]"></span>
                  <span>Version 2.4 - Mise à jour récente</span>
                </span>
                <span className="text-xs text-[#4cd7f6] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-xs">verified</span> Actif Officiel Nova
                </span>
              </div>

              {/* Title */}
              <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight mb-2">
                {product.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#c7c4d7] mb-4 leading-relaxed">
                {product.subtitle}
              </p>

              {/* Social Proof */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#1c2028] mb-6 border border-[#262a33]">
                <div className="flex items-center gap-1.5 text-[#4cd7f6]">
                  <div className="flex text-[#4cd7f6]">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-white">{product.rating}</span>
                  <span className="text-xs text-[#908fa0]">({product.reviewCount} avis)</span>
                </div>
                <div className="h-3 w-px bg-[#31353e]"></div>
                <div className="flex items-center gap-1 text-xs text-[#c7c4d7]">
                  <span className="material-symbols-outlined text-xs text-[#d0bcff]">trending_up</span>
                  <span className="text-white font-semibold">1 240+</span> ventes
                </div>
              </div>

              {/* Dynamic Price Module */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold text-white tracking-tight">
                    {formatPriceEur(currentPriceEur)}
                  </span>
                  <span className="text-sm line-through text-[#908fa0]">
                    {formatPriceEur(currentOldPriceEur)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#93000a]/40 text-[#ffdad6] text-xs font-bold uppercase tracking-wider border border-[#93000a]">
                    -42% Économie
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs font-mono text-[#908fa0]">
                  <span className="text-[#4cd7f6] font-semibold">
                    ~ {formatPriceXaf(currentPriceEur)}
                  </span>
                  <span>Paiement unique • Zéro royalties</span>
                </div>
              </div>

              {/* License Selector Segment */}
              <div className="space-y-3 mb-6">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Sélectionnez votre type de licence :
                </label>

                {/* Option 1: Standard */}
                <label
                  onClick={() => setLicenseTier('standard')}
                  className={`flex items-start justify-between p-3.5 rounded-xl cursor-pointer transition-colors border ${
                    licenseTier === 'standard'
                      ? 'bg-[#1c2028] border-[#8083ff] shadow-sm'
                      : 'bg-[#181c24] border-[#262a33] hover:bg-[#1c2028]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="license_tier"
                      checked={licenseTier === 'standard'}
                      onChange={() => setLicenseTier('standard')}
                      className="mt-1 text-[#8083ff] accent-[#8083ff] h-4 w-4"
                    />
                    <div>
                      <div className="text-sm font-bold text-white">Licence Standard</div>
                      <div className="text-xs text-[#c7c4d7]">
                        1 projet commercial ou client unique. Usage illimité en production.
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white shrink-0 ml-2">69 €</span>
                </label>

                {/* Option 2: Agency */}
                <label
                  onClick={() => setLicenseTier('agency')}
                  className={`flex items-start justify-between p-3.5 rounded-xl cursor-pointer transition-colors border ${
                    licenseTier === 'agency'
                      ? 'bg-[#1c2028] border-[#8083ff] shadow-sm'
                      : 'bg-[#181c24] border-[#262a33] hover:bg-[#1c2028]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="license_tier"
                      checked={licenseTier === 'agency'}
                      onChange={() => setLicenseTier('agency')}
                      className="mt-1 text-[#8083ff] accent-[#8083ff] h-4 w-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">Licence Agence</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-[#009eb9] text-[#002f38]">
                          Pro
                        </span>
                      </div>
                      <div className="text-xs text-[#c7c4d7]">
                        Projets illimités, code source complet, accès aux dépôts GitHub privés Nova.
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white shrink-0 ml-2">179 €</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleDirectBuy}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#8083ff] via-[#494bd6] to-[#571bc1] hover:brightness-110 text-white text-sm font-bold tracking-wide shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-lg">bolt</span>
                  <span>Acheter & Télécharger Immédiatement</span>
                </button>

                <button
                  onClick={handleAddCart}
                  className={`w-full py-2.5 px-6 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-[#31353e] ${
                    addedAnimation
                      ? 'bg-[#009eb9] text-[#002f38]'
                      : 'bg-[#262a33] hover:bg-[#31353e] text-white'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    {addedAnimation ? 'check' : 'shopping_bag'}
                  </span>
                  <span>{addedAnimation ? 'Ajouté au Panier ✓' : 'Ajouter au Panier'}</span>
                </button>
              </div>

              {/* Instant Trust Points */}
              <div className="rounded-xl bg-[#0a0e16]/80 p-4 space-y-2.5 text-xs text-[#c7c4d7] border border-[#262a33]">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base shrink-0 mt-0.5">
                    mark_email_read
                  </span>
                  <span>Livré instantanément par email et accessible à vie dans votre <strong>espace client</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#c0c1ff] text-base shrink-0 mt-0.5">
                    update
                  </span>
                  <span>Mises à jour gratuites à vie incluses (Next.js 15 roadmap ready).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#d0bcff] text-base shrink-0 mt-0.5">
                    folder_zip
                  </span>
                  <span>Archive ZIP (34 Mo) : Source TypeScript, Migrations SQL Supabase, Configs.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base shrink-0 mt-0.5">
                    credit_score
                  </span>
                  <span>Paiements chiffrés SSL : Stripe, MTN MoMo, Orange Money & PayPal.</span>
                </div>
              </div>

              {/* Guarantee micro badge */}
              <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-[#908fa0] border-t border-[#262a33]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#4cd7f6]">lock</span>
                  Chiffrement SHA-256
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-[#d0bcff]">verified_user</span>
                  Garantie Code Fonctionnel 30j
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Comprehensive Tabs Section */}
        <section className="mt-16 pt-8 border-t border-[#1c2028]">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 bg-[#181c24] p-1.5 rounded-xl max-w-2xl mb-8 border border-[#262a33]">
            <button
              onClick={() => setActiveTab('inclus')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'inclus'
                  ? 'bg-[#262a33] text-white shadow-sm'
                  : 'text-[#c7c4d7] hover:text-white'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              <span>Ce qui est inclus</span>
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'specs'
                  ? 'bg-[#262a33] text-white shadow-sm'
                  : 'text-[#c7c4d7] hover:text-white'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">terminal</span>
              <span>Spécifications & Prérequis</span>
            </button>
            <button
              onClick={() => setActiveTab('avis')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'avis'
                  ? 'bg-[#262a33] text-white shadow-sm'
                  : 'text-[#c7c4d7] hover:text-white'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">rate_review</span>
              <span>Avis Clients Vérifiés (142)</span>
            </button>
          </div>

          {/* TAB 1: Ce qui est inclus */}
          {activeTab === 'inclus' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-[#181c24] shadow-sm space-y-3 border border-[#262a33]">
                  <div className="w-10 h-10 rounded-lg bg-[#262a33] text-[#4cd7f6] flex items-center justify-center">
                    <span className="material-symbols-outlined">layers</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">Stack Technologique Pure</h3>
                  <p className="text-xs text-[#c7c4d7]">Architecture modulaire sans dépendance superflue, construite pour scaler.</p>
                  <ul className="space-y-1.5 text-xs text-[#c7c4d7] pt-2">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span> Next.js 14.2+ (App Router, Server Actions)</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span> TypeScript 5 en mode strict</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span> Tailwind CSS 4 & Shadcn UI Dark Custom</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span> Lucide Icons & Material Symbols Pro</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-[#181c24] shadow-sm space-y-3 border border-[#262a33]">
                  <div className="w-10 h-10 rounded-lg bg-[#262a33] text-[#c0c1ff] flex items-center justify-center">
                    <span className="material-symbols-outlined">database</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">Backend Supabase Clé en Main</h3>
                  <p className="text-xs text-[#c7c4d7]">Base PostgreSQL prête avec modèles relationnels prédéfinis et sécurité RLS.</p>
                  <ul className="space-y-1.5 text-xs text-[#c7c4d7] pt-2">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]"></span> Auth complète : Magic Link, Google, GitHub</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]"></span> Scripts de migration SQL & Seed data inclus</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]"></span> Row Level Security (RLS) blindé</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#c0c1ff]"></span> Supabase Storage prêt pour avatars & fichiers</li>
                  </ul>
                </div>

                <div className="p-6 rounded-xl bg-[#181c24] shadow-sm space-y-3 border border-[#262a33]">
                  <div className="w-10 h-10 rounded-lg bg-[#262a33] text-[#d0bcff] flex items-center justify-center">
                    <span className="material-symbols-outlined">point_of_sale</span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">Facturation Multi-Zone</h3>
                  <p className="text-xs text-[#c7c4d7]">Recevez des abonnements Stripe et Mobile Money (MTN, Orange) pré-câblés.</p>
                  <ul className="space-y-1.5 text-xs text-[#c7c4d7] pt-2">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]"></span> Stripe Billing Portal & Webhooks sécurisés</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]"></span> Passerelle Mobile Money (MTN, Orange) native</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]"></span> Facturation automatique TVA & devises</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff]"></span> Gestion du churn et emails de relance</li>
                  </ul>
                </div>
              </div>

              {/* Source Directory Tree */}
              <div className="p-6 rounded-xl bg-[#181c24] border border-[#262a33]">
                <h4 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-white mb-3">
                  Structure de l'Archive Source Décompressée
                </h4>
                <div className="p-4 rounded-lg bg-[#0a0e16] font-mono text-xs text-[#c7c4d7] overflow-x-auto leading-relaxed border border-[#262a33]">
                  <span className="text-[#4cd7f6]">nexus-saas-kit/</span><br />
                  ├── <span className="text-[#c0c1ff]">app/</span> <span className="text-[#908fa0]"># Next.js 14/15 App Router (Layouts, Server Actions)</span><br />
                  │   ├── (auth)/             <span className="text-[#908fa0]"># Flux Login, Register, Magic Link, Verification</span><br />
                  │   ├── (dashboard)/        <span className="text-[#908fa0]"># Espace client SaaS, Settings, Équipes, Factures</span><br />
                  │   └── api/                <span className="text-[#908fa0]"># Webhooks Stripe, Webhooks MoMo, Supabase Webhooks</span><br />
                  ├── <span className="text-[#c0c1ff]">components/</span> <span className="text-[#908fa0]"># 48+ Composants UI accessibles</span><br />
                  ├── <span className="text-[#c0c1ff]">supabase/</span> <span className="text-[#908fa0]"># Migrations SQL versionnées, schemas, triggers RLS</span><br />
                  ├── <span className="text-[#c0c1ff]">lib/</span> <span className="text-[#908fa0]"># Client Stripe, Supabase Client & Server, Email Resend</span><br />
                  ├── <span className="text-[#d0bcff]">.env.example</span> <span className="text-[#908fa0]"># Variables pré-configurées avec commentaires</span><br />
                  └── <span className="text-[#d0bcff]">README.md</span> <span className="text-[#908fa0]"># Guide d'installation pas-à-pas en 10 minutes</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Spécifications */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-[#181c24] space-y-4 border border-[#262a33]">
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6]">checklist</span>
                  <span>Prérequis Système & Environnement</span>
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#262a33]/40 border border-[#31353e]/40">
                    <strong className="text-white text-xs block font-semibold">Node.js 18.17+ ou Node.js 20+</strong>
                    <span className="text-xs text-[#c7c4d7]">Compatible npm, pnpm (recommandé), yarn et bun.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#262a33]/40 border border-[#31353e]/40">
                    <strong className="text-white text-xs block font-semibold">Compte Supabase (Gratuit ou Pro)</strong>
                    <span className="text-xs text-[#c7c4d7]">Le palier gratuit Supabase suffit pour débuter le développement.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#262a33]/40 border border-[#31353e]/40">
                    <strong className="text-white text-xs block font-semibold">Compte Développeur Stripe</strong>
                    <span className="text-xs text-[#c7c4d7]">Clés API test et webhooks configurables en 2 minutes.</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#262a33]/40 border border-[#31353e]/40">
                    <strong className="text-white text-xs block font-semibold">Service Transactionnel Email (Resend ou Brevo)</strong>
                    <span className="text-xs text-[#c7c4d7]">Templates d'emails HTML modernes rédigés en français et anglais.</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#181c24] space-y-4 border border-[#262a33]">
                <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#d0bcff]">tune</span>
                  <span>Fiche Technique du Produit</span>
                </h3>
                <div className="divide-y divide-[#262a33] text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#908fa0]">Taille du fichier :</span>
                    <span className="text-white font-mono">{product.fileSize}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#908fa0]">Langage :</span>
                    <span className="text-white font-mono">TypeScript 100% Type-Safe</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#908fa0]">Framework CSS :</span>
                    <span className="text-white font-mono">Tailwind CSS v4</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#908fa0]">Déploiement cible :</span>
                    <span className="text-white font-mono">Vercel, AWS Amplify, Docker VPS</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#908fa0]">Support & Mises à jour :</span>
                    <span className="text-[#4cd7f6] font-semibold">Gratuit • Mises à jour à vie</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0a0e16] text-xs text-[#c7c4d7] border border-[#262a33]">
                  <span className="font-bold text-white">Licence commerciale perpétuelle :</span> Vous conservez 100% de la
                  propriété intellectuelle de votre produit SaaS construit à partir de ce template. Zéro royalties.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Avis Clients */}
          {activeTab === 'avis' && (
            <div className="flex flex-col gap-6">
              {/* Rating Overview Bar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-xl bg-[#181c24] items-center border border-[#262a33]">
                <div className="md:col-span-4 text-center md:text-left space-y-1">
                  <span className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold text-white tracking-tight">
                    {product.rating}
                  </span>
                  <div className="flex items-center justify-center md:justify-start text-[#4cd7f6]">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[#c7c4d7]">Basé sur 142 achats certifiés par NovaDigital</p>
                </div>
                <div className="md:col-span-5 space-y-1.5">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-[#908fa0]">5 étoiles</span>
                    <div className="flex-1 h-2 rounded-full bg-[#262a33] overflow-hidden">
                      <div className="h-full bg-[#4cd7f6] rounded-full" style={{ width: '94%' }}></div>
                    </div>
                    <span className="w-8 text-white font-semibold text-right">94%</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-[#908fa0]">4 étoiles</span>
                    <div className="flex-1 h-2 rounded-full bg-[#262a33] overflow-hidden">
                      <div className="h-full bg-[#4cd7f6] rounded-full" style={{ width: '5%' }}></div>
                    </div>
                    <span className="w-8 text-white font-semibold text-right">5%</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-[#908fa0]">3 étoiles</span>
                    <div className="flex-1 h-2 rounded-full bg-[#262a33] overflow-hidden">
                      <div className="h-full bg-[#4cd7f6] rounded-full" style={{ width: '1%' }}></div>
                    </div>
                    <span className="w-8 text-white font-semibold text-right">1%</span>
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-center md:justify-end">
                  <button
                    onClick={() => setReviewFormOpen(!reviewFormOpen)}
                    className="px-4 py-2 rounded-lg bg-[#571bc1] hover:bg-[#8083ff] text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">rate_review</span>
                    <span>Rédiger un Avis</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Review Form */}
              {reviewFormOpen && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="p-6 rounded-xl bg-[#181c24] space-y-4 shadow-lg border border-[#31353e]"
                >
                  <h4 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-white">
                    Partagez votre retour d'expérience
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#c7c4d7] mb-1">Votre Nom & Titre</label>
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="Ex: Marc L., Développeur Fullstack"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-[#1c2028] text-white placeholder-[#908fa0] text-xs focus:outline-none border border-[#31353e]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#c7c4d7] mb-1">Note globale</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1c2028] text-white text-xs focus:outline-none border border-[#31353e]"
                      >
                        <option value="5">5/5 - Exceptionnel, a dépassé mes attentes</option>
                        <option value="4">4/5 - Très bien, très solide</option>
                        <option value="3">3/5 - Correct</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[#c7c4d7] mb-1">Votre commentaire détaillé</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Qualité du code, clarté des instructions, temps gagné..."
                      required
                      rows={3}
                      className="w-full p-3 rounded-lg bg-[#1c2028] text-white placeholder-[#908fa0] text-xs focus:outline-none border border-[#31353e]"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewFormOpen(false)}
                      className="px-4 py-2 rounded-lg bg-[#262a33] text-white text-xs"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#009eb9] hover:bg-[#4cd7f6] text-[#002f38] text-xs font-bold"
                    >
                      {reviewSubmitted ? 'Avis transmis avec succès !' : "Publier l'Avis"}
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {[
                  {
                    author: 'Alexandre Leclerc',
                    role: 'Fondateur chez SyncMetrics • Licence Agence',
                    initials: 'AL',
                    time: 'Il y a 6 jours',
                    comment:
                      '« C’est sans aucun doute le starter kit Next.js 14 le plus propre du marché francophone. Les Server Actions sont impeccablement structurées, la synchronisation des webhooks Stripe fonctionne du premier coup avec la CLI, et le support Supabase RLS est irréprochable. Nous avons déployé notre MVP en 48 heures au lieu de 3 semaines. Remboursé dès le premier abonné. »',
                  },
                  {
                    author: 'Kouamé Diallo',
                    role: 'Tech Lead chez KoriPay Labs • Licence Standard',
                    initials: 'KD',
                    time: 'Il y a 2 semaines',
                    comment:
                      '« La compatibilité directe avec les rails de paiement africains (MTN Mobile Money et Orange Money) à côté de Stripe est une pépite rare. Habituellement, il faut tout coder à la main pour adapter les starters américains. Là, tout est documenté, typé en TypeScript et opérationnel immédiatement. »',
                  },
                  {
                    author: 'Sarah Moreau',
                    role: 'Solopreneuse • Licence Standard',
                    initials: 'SM',
                    time: 'Il y a 1 mois',
                    comment:
                      '« Code hyper lisible et zéro mauvaise surprise. Même en tant que développeuse junior sur le App Router, j\'ai pu modifier le layout du dashboard en une matinée. Petit bonus très appréciable : la documentation Markdown intégrée directement à la racine du projet. Bravo NovaDigital. »',
                  },
                ].map((rev, idx) => (
                  <div key={idx} className="p-6 rounded-xl bg-[#181c24] shadow-sm space-y-2 border border-[#262a33]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#571bc1] flex items-center justify-center font-bold text-white text-xs">
                          {rev.initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-semibold">{rev.author}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-[#009eb9]/30 text-[#4cd7f6] text-[10px] font-medium">
                              <span className="material-symbols-outlined text-[11px]">verified</span> Acheteur vérifié
                            </span>
                          </div>
                          <p className="text-xs text-[#908fa0]">{rev.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[#4cd7f6] text-xs">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                              star
                            </span>
                          ))}
                        </div>
                        <span className="text-[#c7c4d7] font-mono text-[11px] ml-1">{rev.time}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-[#dfe2ee] leading-relaxed pt-1">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. Frequently Bought Together Bundle */}
        <section className="mt-16 p-6 lg:p-8 rounded-2xl bg-[#181c24] shadow-xl border border-[#262a33]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#d0bcff] mb-1">
                <span className="material-symbols-outlined text-xs">auto_awesome</span> Pack Booster de Lancement
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white tracking-tight">
                Fréquemment achetés ensemble
              </h2>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-[#571bc1]/40 text-[#d0bcff] text-xs font-semibold border border-[#571bc1]/50">
              Offre Bundle Spéciale : -25% immédiats
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Sequence of 3 items */}
            <div className="lg:col-span-8 flex flex-col md:flex-row items-center gap-3">
              {/* Item 1 */}
              <div className="w-full md:w-1/3 p-3.5 rounded-xl bg-[#1c2028] flex flex-col justify-between h-full border border-[#262a33]">
                <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 bg-[#262a33]">
                  <img alt={product.title} className="w-full h-full object-cover" src={product.image} />
                </div>
                <div>
                  <span className="text-[11px] text-[#4cd7f6] font-semibold">Article principal</span>
                  <p className="text-xs font-bold text-white truncate">{product.title}</p>
                  <span className="text-xs font-bold text-white font-mono">{formatPriceEur(69)}</span>
                </div>
              </div>

              <span className="material-symbols-outlined text-lg text-[#908fa0] shrink-0">add</span>

              {/* Item 2 */}
              <div className="w-full md:w-1/3 p-3.5 rounded-xl bg-[#1c2028] flex flex-col justify-between h-full border border-[#262a33]">
                <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 bg-[#262a33]">
                  <img
                    alt="Nexus UI Figma Kit"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxcxzcs_2w-9QoBsryUQDqp-w1Sc8klDaSQoGX9cq7S5pG3-Uf49yd-7amEthXaLswjirBY6Mgfa0-3BU9UdB84pdgbLedMbdyzWq7uEDCzKMwPxw9BwDVqrJ9A2FTDkCs0Bk4fEgdROGQva2tb7hWpljkCfwQRepmKSSwkeuKdkM3Z-Yt2cl7oefCp-cRWk-TW4C06v72xSMNxqm-K6T1Ionyj4gbnwckH0_m8-5719EVIGcRD3I0"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[#d0bcff] font-semibold">Figma File Pro</span>
                  <p className="text-xs font-bold text-white truncate">Nexus Figma UI Kit (800+ frames)</p>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-xs font-bold text-white">45 €</span>
                    <span className="line-through text-[#908fa0] text-[10px]">59 €</span>
                  </div>
                </div>
              </div>

              <span className="material-symbols-outlined text-lg text-[#908fa0] shrink-0">add</span>

              {/* Item 3 */}
              <div className="w-full md:w-1/3 p-3.5 rounded-xl bg-[#1c2028] flex flex-col justify-between h-full border border-[#262a33]">
                <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 bg-[#262a33]">
                  <img
                    alt="Formation Video SaaS Architecture"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCER-ey3mu-soEmcUuhMpz5Hh2o1KAgaoTDT7rdegMij9_gPX0vDuPvJUwWb9tD74CBB9AVYX2SWeaZUv_Z4wcJPWOFQf61ju8u0awx5Pz62V5ilKYv41a-OgCe8KoV4QB3FMnr5Ie_cMSxHhJxayBdwDpakRIJLrxSGbEP1OB6hbTuHD58OaTCj6e4L3tZ1V81mO7uAy41uhABKTICuoh6EwzA59RhlXRGhq9dGx0fo8EnUtuXW_ao"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-[#4cd7f6] font-semibold">Masterclass Vidéo (4h)</span>
                  <p className="text-xs font-bold text-white truncate">De 0 à 1 000 MRR avec Next.js</p>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-xs font-bold text-white">49 €</span>
                    <span className="line-through text-[#908fa0] text-[10px]">79 €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bundle Checkout Box */}
            <div className="lg:col-span-4 p-5 rounded-xl bg-[#0a0e16] flex flex-col justify-between h-full border border-[#262a33]">
              <div>
                <span className="text-[11px] text-[#908fa0] uppercase tracking-wider block mb-1">
                  Total du Bundle (3 Produits)
                </span>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold text-white">122 €</span>
                  <span className="text-xs text-[#908fa0] line-through">163 €</span>
                  <span className="px-2 py-0.5 rounded bg-[#009eb9] text-[#002f38] text-[10px] font-bold">
                    -25%
                  </span>
                </div>
                <p className="text-xs text-[#c7c4d7] mb-4 leading-relaxed">
                  Recevez le starter kit de code complet, la maquette Figma officielle haute-fidélité, ainsi que la formation vidéo étape-par-étape.
                </p>
              </div>

              <button
                onClick={() => {
                  setBundleAdded(true);
                  onAddToCart(product, 'standard');
                  setTimeout(() => {
                    onNavigate('checkout');
                  }, 800);
                }}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  bundleAdded
                    ? 'bg-[#571bc1] text-white'
                    : 'bg-[#009eb9] hover:bg-[#4cd7f6] text-[#002f38]'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-base">
                  {bundleAdded ? 'done_all' : 'shopping_cart_checkout'}
                </span>
                <span>{bundleAdded ? 'Pack de 3 articles ajouté !' : 'Acheter le Bundle Complet (-25%)'}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
