/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OrderRecord } from '../data/mock-data.ts';
import { formatPriceEur, formatPriceXaf } from '../utils/shop-logic.ts';

interface ClientDashboardViewProps {
  orders: OrderRecord[];
  onNavigate: (view: string, productId?: string) => void;
  currency: 'EUR' | 'USD' | 'XAF';
}

export const ClientDashboardView: React.FC<ClientDashboardViewProps> = ({
  orders,
  onNavigate,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'invoices' | 'api' | 'profile'>('downloads');
  const [assetSearch, setAssetSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeInvoice, setActiveInvoice] = useState(orders[0] || null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard?.writeText(key);
    setCopiedKey(key);
    showToast(`Clé de licence ${key} copiée !`);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleRegenerateTokens = () => {
    showToast('Tokens HMAC régénérés avec succès. Validité prolongée de 48 heures.');
  };

  const handleExportAllZip = () => {
    showToast("Génération de l'archive NovaDigital_Factures_2024.zip en cours...");
  };

  return (
    <div className="w-full bg-[#0f131c] text-[#dfe2ee] min-h-screen">
      <div className="relative w-full overflow-hidden">
        {/* Glows */}
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-[#571bc1]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-0 w-80 h-80 bg-[#009eb9]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-6 pb-16 w-full">
          <div role="status" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">Espace de démonstration : profil, commandes, licences, factures et fichiers sont des exemples. Aucun compte ni fichier réel n’est connecté.</div>
          {/* Section 1: Client Header & Identity */}
          <section className="flex flex-col gap-4 mb-8">
            <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 font-mono text-xs text-[#c7c4d7]">
              <button onClick={() => onNavigate('accueil')} className="hover:text-[#c0c1ff] transition-colors">
                Accueil
              </button>
              <span className="material-symbols-outlined text-sm opacity-60">chevron_right</span>
              <span>Espace Client</span>
              <span className="material-symbols-outlined text-sm opacity-60">chevron_right</span>
              <span className="text-[#4cd7f6] font-semibold">
                {activeTab === 'downloads' ? 'Téléchargements & Licences' : 'Historique & Factures'}
              </span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {activeTab === 'downloads'
                      ? 'Mes Téléchargements & Licences Actives'
                      : 'Commandes & Facturation'}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#262a33] text-[#4cd7f6] text-xs font-semibold border border-[#31353e]">
                    <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                    Compte Vérifié Pro
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#c7c4d7]">
                  Bienvenue, <span className="text-white font-semibold">Alexandre Martin</span> (
                  <span className="font-mono text-[#c0c1ff]">alexandre.martin@techfounder.io</span>) •{' '}
                  <span className="text-white font-semibold">8 actifs numériques acquis</span>
                </p>
              </div>

              {/* Status and Action */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#181c24] px-3 py-1.5 rounded-lg border border-[#262a33]">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-sm">cloud_sync</span>
                  <span className="font-mono text-xs text-[#c7c4d7]">Mode demo local</span>
                </div>
                <button
                  onClick={handleRegenerateTokens}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold transition-colors border border-[#31353e]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">cached</span>
                  <span>Régénérer Tokens</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-2 border-b border-[#262a33]">
              <button
                onClick={() => setActiveTab('downloads')}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'downloads'
                    ? 'bg-[#571bc1] text-white shadow-sm'
                    : 'bg-[#181c24] text-[#c7c4d7] hover:text-white hover:bg-[#1c2028]'
                }`}
              >
                <span className="material-symbols-outlined text-base">cloud_download</span>
                <span>Téléchargements & Fichiers</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#0a0e16] text-[#4cd7f6] text-[10px] font-mono">8</span>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'invoices'
                    ? 'bg-[#571bc1] text-white shadow-sm'
                    : 'bg-[#181c24] text-[#c7c4d7] hover:text-white hover:bg-[#1c2028]'
                }`}
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>Historique & Factures</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#0a0e16] text-[#4cd7f6] text-[10px] font-mono">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('api')}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'api'
                    ? 'bg-[#571bc1] text-white shadow-sm'
                    : 'bg-[#181c24] text-[#c7c4d7] hover:text-white hover:bg-[#1c2028]'
                }`}
              >
                <span className="material-symbols-outlined text-base">key</span>
                <span>Clés API & Dépôts GitHub</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#0a0e16] text-[#4cd7f6] text-[10px] font-mono">3</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'profile'
                    ? 'bg-[#571bc1] text-white shadow-sm'
                    : 'bg-[#181c24] text-[#c7c4d7] hover:text-white hover:bg-[#1c2028]'
                }`}
              >
                <span className="material-symbols-outlined text-base">shield_person</span>
                <span>Sécurité & Profil</span>
              </button>
            </div>
          </section>

          {/* TAB 1: DOWNLOADS & LICENSES */}
          {activeTab === 'downloads' && (
            <div className="space-y-6">
              {/* Dynamic Update Banner */}
              <section className="p-4 rounded-xl bg-gradient-to-r from-[#262a33] via-[#1c2028] to-[#181c24] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#31353e]">
                <div className="flex items-start md:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8083ff]/20 text-[#c0c1ff] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">upgrade</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider text-[#4cd7f6] font-bold">
                        Mise à jour disponible
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                      <span className="font-mono text-xs text-[#c7c4d7]">Patch Next.js 15.2</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white mt-0.5">
                      <span className="font-semibold text-[#c0c1ff]">Nexus SaaS Starter Kit v2.4</span> est prêt pour le déploiement. Votre accès à vie synchronise automatiquement les derniers correctifs RLS Supabase.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => showToast("Demo only: no update file is connected.")}
                  className="px-4 py-2 rounded-lg bg-[#c0c1ff] text-[#1000a9] text-xs font-bold hover:bg-white transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Mettre à jour l'archive</span>
                </button>
              </section>

              {/* Toolbar & Filters */}
              <div className="p-2.5 rounded-xl bg-[#181c24] shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border border-[#262a33]">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#908fa0] text-base">
                    search
                  </span>
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    placeholder="Filtrer vos assets, templates, e-books, repos ou clés de licence..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0a0e16] text-white placeholder-[#908fa0] text-xs focus:outline-none border border-[#31353e]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#0a0e16] text-white text-xs px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
                  >
                    <option value="all">Tous les types (8)</option>
                    <option value="boilerplates">Boilerplates SaaS & Code</option>
                    <option value="ui">Templates UI & Figma</option>
                    <option value="formations">Formations & Guides</option>
                  </select>
                </div>
              </div>

              {/* 12-Column Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Asset Download Cards (8 cols) */}
                <div className="lg:col-span-8 space-y-4">
                  {/* ITEM 1: Nexus SaaS Starter Kit */}
                  <article className="p-6 rounded-xl bg-[#1c2028] shadow-md hover:bg-[#262a33]/60 transition-all duration-300 relative overflow-hidden group border border-[#262a33]">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#8083ff]"></div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-44 h-32 rounded-lg bg-[#0a0e16] shrink-0 overflow-hidden relative shadow-sm border border-[#31353e]/40">
                        <img
                          alt="Nexus SaaS Starter Kit"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR48kTeJZSudKRgyUf0FGm12Bv08EIPABioG8L33AhP7u2hpoGiXToV18UKdERwodMn2feh3EfodM2CWE7Mnk39siwNj4fjKbGsUa7UuODYvXYVoRQ6_t7xw2R4WSvMSIma5Pu3W31QLG96HJA7qzb4B84yL_uCK1nSQwmDg_Q8ua0Yvv2CcMSGJFMxWvYBfhsIxzaUeDIgJ1AGdbTwPzDL7Gkfw2Hi5b7amAZygLKwMl97wZSe5kK"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0a0e16]/90 font-mono text-[10px] text-[#4cd7f6]">
                          Next.js 15
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white truncate">
                              Nexus SaaS Starter Kit
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-[#571bc1]/40 text-[#d0bcff] text-[10px] font-bold">
                              v2.4
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#4cd7f6] bg-[#181c24] px-2.5 py-0.5 rounded-full border border-[#31353e]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                            Signé & Actif (47h)
                          </span>
                        </div>

                        <p className="text-xs text-[#c7c4d7] line-clamp-2">
                          Boilerplate fullstack de référence : Next.js 15 App Router, TypeScript, Supabase RLS multi-tenant, abonnements Stripe & Tailwind CSS v4.
                        </p>

                        {/* License key box */}
                        <div className="p-2 rounded-lg bg-[#0a0e16]/70 space-y-1.5 border border-[#262a33]">
                          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                            <span className="text-[#c7c4d7] flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#908fa0]">verified</span>
                              Licence Commerciale Illimitée :
                            </span>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-0.5 rounded bg-[#262a33] text-[#c0c1ff] font-bold">
                                NOVA-NX-9412-88B1-AUTH
                              </code>
                              <button
                                onClick={() => handleCopyKey('NOVA-NX-9412-88B1-AUTH')}
                                className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1c2028] hover:bg-[#31353e] text-[#4cd7f6] transition-colors"
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {copiedKey === 'NOVA-NX-9412-88B1-AUTH' ? 'check' : 'content_copy'}
                                </span>
                                <span>{copiedKey === 'NOVA-NX-9412-88B1-AUTH' ? 'Copié !' : 'Copier'}</span>
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#c7c4d7]">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#908fa0]">folder_shared</span>
                              Dépôt GitHub synchronisé :
                            </span>
                            <span className="text-[#4cd7f6] flex items-center gap-1 font-semibold">
                              novadigital/nexus-saas-enterprise
                              <span className="material-symbols-outlined text-xs">open_in_new</span>
                            </span>
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#908fa0] pt-1">
                          <span>Taille : 34.2 Mo</span>
                          <span>•</span>
                          <span>Quota : 2/5 téléchargements</span>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => showToast("Demo only: no product archive is connected.")}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8083ff] to-[#571bc1] text-white text-xs font-bold hover:opacity-95 transition-opacity shadow-sm flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Télécharger l'archive ZIP (34 Mo)</span>
                          </button>
                          <button
                            onClick={() => alert("Redirection vers le repo GitHub privé novadigital/nexus-saas-enterprise")}
                            className="px-4 py-2 rounded-lg bg-[#181c24] hover:bg-[#262a33] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-[#31353e]"
                          >
                            <span className="material-symbols-outlined text-sm">code</span>
                            <span>Accéder au Repo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* ITEM 2: L'Art du Solopreneur */}
                  <article className="p-6 rounded-xl bg-[#1c2028] shadow-md hover:bg-[#262a33]/60 transition-all duration-300 relative overflow-hidden group border border-[#262a33]">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-44 h-32 rounded-lg bg-[#0a0e16] shrink-0 overflow-hidden relative shadow-sm border border-[#31353e]/40">
                        <img
                          alt="L'Art du Solopreneur"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8gpPZyIuS9_Ha2A0mSTPTS57y9XWlAyQX4xJL6K9R60YgbXUx4SmOcRCOrweReqKVzbZP8ZqxaYOxFhTEEZwX1b6wEnPKPKCbD-U2S-GVaLr0tOHjnfe1wPANH5lEOj2cxeHpRttJLlN-sJf3JDDuxs52212Nm5VKY2263qy5yMlltDGDBtIr9VdKCsGGCgwwBrUAFEqBk8zZKjkQL6RMPY9NcTz-x0QxuULza2d4DwUuw4E1u7ep"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0a0e16]/90 font-mono text-[10px] text-[#d0bcff]">
                          Livre & Notion
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white truncate">
                              L'Art du Solopreneur Tech — Systèmes & Playbooks
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-[#181c24] text-[#c7c4d7] text-[10px] font-semibold border border-[#31353e]">
                              Édition 2025
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#181c24] text-[#908fa0] font-mono text-[11px] border border-[#31353e]">
                            Accès Perpétuel
                          </span>
                        </div>

                        <p className="text-xs text-[#c7c4d7] line-clamp-2">
                          Le manuel d'ingénierie financière et d'exécution logicielle pour monétiser vos projets solos sans levée de fonds. Inclus : 28 checklists Notion et modèles.
                        </p>

                        <div className="p-2 rounded-lg bg-[#0a0e16]/70 flex flex-wrap items-center gap-3 font-mono text-[11px] text-[#c7c4d7] border border-[#262a33]">
                          <span className="flex items-center gap-1 text-white">
                            <span className="material-symbols-outlined text-xs text-[#4cd7f6]">description</span>
                            PDF Haute Définition
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-white">
                            <span className="material-symbols-outlined text-xs text-[#4cd7f6]">menu_book</span>
                            Format ePub
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-white">
                            <span className="material-symbols-outlined text-xs text-[#c0c1ff]">view_quilt</span>
                            Workspace Notion v3
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => showToast("Demo only: no product archive is connected.")}
                            className="px-4 py-2 rounded-lg bg-[#181c24] hover:bg-[#262a33] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 border border-[#31353e]"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Télécharger le Pack (PDF + ePub)</span>
                          </button>
                          <button
                            onClick={() => alert("Redirection vers la duplication du template Notion officiel !")}
                            className="px-4 py-2 rounded-lg bg-[#0a0e16] hover:bg-[#181c24] text-[#4cd7f6] text-xs font-semibold transition-colors flex items-center gap-1 border border-[#31353e]"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                            <span>Dupliquer le Template Notion</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* ITEM 3: Figma Pro UI Kit */}
                  <article className="p-6 rounded-xl bg-[#1c2028] shadow-md hover:bg-[#262a33]/60 transition-all duration-300 relative overflow-hidden group border border-[#262a33]">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-44 h-32 rounded-lg bg-[#0a0e16] shrink-0 overflow-hidden relative shadow-sm border border-[#31353e]/40">
                        <img
                          alt="Figma Pro UI Kit"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxcxzcs_2w-9QoBsryUQDqp-w1Sc8klDaSQoGX9cq7S5pG3-Uf49yd-7amEthXaLswjirBY6Mgfa0-3BU9UdB84pdgbLedMbdyzWq7uEDCzKMwPxw9BwDVqrJ9A2FTDkCs0Bk4fEgdROGQva2tb7hWpljkCfwQRepmKSSwkeuKdkM3Z-Yt2cl7oefCp-cRWk-TW4C06v72xSMNxqm-K6T1Ionyj4gbnwckH0_m8-5719EVIGcRD3I0"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0a0e16]/90 font-mono text-[10px] text-[#4cd7f6]">
                          Figma .FIG
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white truncate">
                              Figma Pro UI Kit & Design System 2025
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-[#571bc1]/40 text-[#d0bcff] text-[10px] font-bold">
                              v3.1
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#181c24] text-[#4cd7f6] font-mono text-[11px] border border-[#31353e]">
                            Licence Commerciale
                          </span>
                        </div>

                        <p className="text-xs text-[#c7c4d7] line-clamp-2">
                          Plus de 650 composants modulaires, auto-layout 5.0, variables multi-thèmes WCAG AAA et 45 maquettes d'applications SaaS prêtes.
                        </p>

                        <div className="p-2 rounded-lg bg-[#0a0e16]/70 flex flex-wrap items-center justify-between font-mono text-[11px] text-[#c7c4d7] border border-[#262a33]">
                          <span>
                            Clé Community : <code className="text-[#c0c1ff] font-bold">FIG-SYNC-9810-NOVA</code>
                          </span>
                          <span className="text-[#4cd7f6]">Fichier natif source .fig</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => alert("Ouverture du fichier dans Figma Community")}
                            className="px-4 py-2 rounded-lg bg-[#181c24] hover:bg-[#262a33] text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 border border-[#31353e]"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            <span>Ouvrir dans Figma</span>
                          </button>
                          <button
                            onClick={() => showToast("Demo only: no product file is connected.")}
                            className="px-4 py-2 rounded-lg bg-[#0a0e16] hover:bg-[#181c24] text-[#dfe2ee] text-xs font-medium transition-colors flex items-center gap-1.5 border border-[#31353e]"
                          >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Télécharger .fig (82 Mo)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>

                  {/* ITEM 4: Masterclass Video Next.js */}
                  <article className="p-6 rounded-xl bg-[#1c2028] shadow-md hover:bg-[#262a33]/60 transition-all duration-300 relative overflow-hidden group border border-[#262a33]">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-44 h-32 rounded-lg bg-[#0a0e16] shrink-0 overflow-hidden relative shadow-sm border border-[#31353e]/40">
                        <img
                          alt="Masterclass Video"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCER-ey3mu-soEmcUuhMpz5Hh2o1KAgaoTDT7rdegMij9_gPX0vDuPvJUwWb9tD74CBB9AVYX2SWeaZUv_Z4wcJPWOFQf61ju8u0awx5Pz62V5ilKYv41a-OgCe8KoV4QB3FMnr5Ie_cMSxHhJxayBdwDpakRIJLrxSGbEP1OB6hbTuHD58OaTCj6e4L3tZ1V81mO7uAy41uhABKTICuoh6EwzA59RhlXRGhq9dGx0fo8EnUtuXW_ao"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0a0e16]/90 font-mono text-[10px] text-[#c0c1ff]">
                          Masterclass 4K
                        </span>
                        <div className="absolute inset-0 bg-[#0a0e16]/30 flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-3xl opacity-90 group-hover:scale-110 transition-transform">
                            play_circle
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white truncate">
                            Masterclass : De 0 à 1 000€ MRR avec Next.js & Stripe
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#181c24] text-[#908fa0] font-mono text-[11px] border border-[#31353e]">
                            Streaming Illimité
                          </span>
                        </div>

                        <p className="text-xs text-[#c7c4d7] line-clamp-2">
                          18 sessions vidéo pas à pas : architecture webhooks Stripe, abonnements avec prélèvements automatiques SEPA/CB, et optimisation du tunnel.
                        </p>

                        <div className="p-2.5 rounded-lg bg-[#0a0e16]/70 space-y-1.5 border border-[#262a33]">
                          <div className="flex items-center justify-between text-xs text-[#c7c4d7]">
                            <span>Progression : <strong className="text-white">65% complété</strong></span>
                            <span className="font-mono">12/18 modules terminés</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#262a33] overflow-hidden">
                            <div className="h-full bg-[#4cd7f6] rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => alert("Lancement du lecteur vidéo 4K pour le module 13")}
                            className="px-4 py-2 rounded-lg bg-[#c0c1ff] hover:bg-white text-[#1000a9] text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            <span>Continuer le visionnage (Module 13)</span>
                          </button>
                          <button
                            onClick={() => showToast("Téléchargement des snippets et slides (140 Mo) démarré !")}
                            className="px-4 py-2 rounded-lg bg-[#181c24] hover:bg-[#262a33] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-[#31353e]"
                          >
                            <span className="material-symbols-outlined text-sm">folder_zip</span>
                            <span>Télécharger slides & snippets (140 Mo)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>

                {/* Right Side: Security, Storage Quotas & Support (4 cols) */}
                <aside className="lg:col-span-4 space-y-4">
                  <div className="p-6 rounded-xl bg-[#181c24] shadow-md space-y-4 border border-[#262a33]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#009eb9]/20 text-[#4cd7f6] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg">enhanced_encryption</span>
                      </div>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">Sécurité des Liens</h3>
                    </div>
                    <p className="text-xs text-[#c7c4d7] leading-relaxed">
                      Pour prémunir les fuites d'archives et garantir l'authenticité de vos fichiers, NovaDigital génère des <strong className="text-white">URLs signées HMAC-SHA256</strong> cryptographiques adossées à Supabase Storage.
                    </p>
                    <div className="p-3 rounded-lg bg-[#0a0e16] space-y-2 text-xs border border-[#262a33]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#908fa0]">Validité du token :</span>
                        <span className="font-mono text-[#4cd7f6] font-bold">48 heures</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#908fa0]">Protection Hotlinking :</span>
                        <span className="text-white font-mono">IP Verrouillée</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#908fa0]">Re-génération :</span>
                        <span className="text-white font-mono">Illimitée</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#c7c4d7] font-mono">
                      <span className="material-symbols-outlined text-[#4cd7f6] text-sm">verified</span>
                      <span>Intégrité des dépôts vérifiée par PGP</span>
                    </div>
                  </div>

                  {/* GitHub Organization Integration */}
                  <div className="p-6 rounded-xl bg-[#181c24] shadow-md space-y-3 border border-[#262a33]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#262a33] text-white flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-lg">hub</span>
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white">GitHub Sync</h3>
                          <p className="text-[11px] text-[#908fa0]">3 dépôts liés</p>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]"></span>
                    </div>
                    <p className="text-xs text-[#c7c4d7]">
                      Votre compte GitHub <code className="text-[#c0c1ff] font-bold">@alex-martin-dev</code> bénéficie d'invitations automatiques en tant que collaborateur externe sur nos dépôts privés.
                    </p>
                    <button
                      onClick={() => alert("Console des autorisations GitHub ouverte !")}
                      className="w-full py-2 px-3 rounded-lg bg-[#0a0e16] hover:bg-[#262a33] text-white text-xs font-semibold text-center block transition-colors border border-[#31353e]"
                    >
                      Gérer les accès GitHub
                    </button>
                  </div>

                  {/* VIP Support */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-[#1c2028] to-[#181c24] shadow-md space-y-3 border border-[#31353e]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#571bc1]/40 text-[#d0bcff] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-lg">support_agent</span>
                      </div>
                      <div>
                        <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-white">Assistance Pro</h3>
                        <span className="font-mono text-[10px] text-[#4cd7f6]">Canal Dédié &lt; 2h</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#c7c4d7]">
                      Un souci de configuration d'environnement ou une clé refusée ? Échangez directement avec les auteurs du template.
                    </p>
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => alert("Redirection vers le serveur Discord VIP NovaDigital !")}
                        className="w-full py-2 px-3 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-[#31353e]"
                      >
                        <span className="material-symbols-outlined text-sm text-[#d0bcff]">forum</span>
                        <span>Rejoindre le Discord VIP</span>
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICES & ORDERS */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-[#181c24] shadow-md space-y-2 border border-[#262a33]">
                  <div className="flex items-center justify-between text-xs text-[#908fa0] uppercase tracking-wider font-semibold">
                    <span>Volume Total Investi</span>
                    <span className="material-symbols-outlined text-lg text-[#c0c1ff]">account_balance_wallet</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">314,00 €</span>
                    <span className="text-xs text-[#908fa0]">EUR</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#c7c4d7]">
                    <span className="text-[#4cd7f6]">≈ 205 980 FCFA</span>
                    <span>•</span>
                    <span>{orders.length} transactions</span>
                  </div>
                  <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    <span>100% Livraisons instantanées</span>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-[#181c24] shadow-md space-y-2 border border-[#262a33]">
                  <div className="flex items-center justify-between text-xs text-[#908fa0] uppercase tracking-wider font-semibold">
                    <span>Dernier Règlement</span>
                    <span className="material-symbols-outlined text-lg text-[#4cd7f6]">schedule</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">
                      {formatPriceEur(orders[0]?.totalEur || 88)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-xs font-semibold">
                      Récent
                    </span>
                  </div>
                  <div className="text-xs text-[#c7c4d7]">
                    <span className="font-mono text-[#c0c1ff]">{orders[0]?.orderNumber}</span>
                    <span> • {orders[0]?.date}</span>
                  </div>
                  <div className="pt-2 text-xs text-[#908fa0] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#4cd7f6]">credit_card</span>
                    <span>{orders[0]?.paymentLabel}</span>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-[#181c24] shadow-md space-y-2 border border-[#262a33]">
                  <div className="flex items-center justify-between text-xs text-[#908fa0] uppercase tracking-wider font-semibold">
                    <span>Statut Fiscal B2B</span>
                    <span className="material-symbols-outlined text-lg text-[#d0bcff]">corporate_fare</span>
                  </div>
                  <div className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                    Studio Martin Tech
                  </div>
                  <div className="font-mono text-xs text-[#c7c4d7]">FR 82 912384910</div>
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[#4cd7f6]">Auto-liquidation TVA (0%)</span>
                    <span className="px-2 py-0.5 rounded bg-[#262a33] text-white font-mono text-[10px] border border-[#31353e]">
                      VIES Validé
                    </span>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-[#181c24] border border-[#262a33]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#c7c4d7]">Filtrer l'année :</span>
                  <button className="px-3 py-1 rounded bg-[#262a33] text-white text-xs font-semibold border border-[#31353e]">
                    Toutes ({orders.length})
                  </button>
                  <button className="px-3 py-1 rounded bg-[#0a0e16] text-[#908fa0] text-xs hover:text-white">
                    2025
                  </button>
                  <button className="px-3 py-1 rounded bg-[#0a0e16] text-[#908fa0] text-xs hover:text-white">
                    2024
                  </button>
                </div>
                <button
                  onClick={handleExportAllZip}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold transition-colors border border-[#31353e]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base text-[#4cd7f6]">folder_zip</span>
                  <span>Exporter factures de l'année (.ZIP)</span>
                </button>
              </div>

              {/* Grid: Order Cards vs Live Invoice Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-4">
                  {orders.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#31353e] bg-[#181c24] p-8 text-center">
                      <span className="material-symbols-outlined text-3xl text-[#908fa0]">receipt_long</span>
                      <h2 className="mt-3 text-base font-semibold text-white">Aucune commande pour le moment</h2>
                      <p className="mt-2 text-sm text-[#c7c4d7]">Les commandes de démonstration apparaîtront ici après leur création.</p>
                      <button type="button" onClick={() => onNavigate('catalogue')} className="mt-4 min-h-11 rounded-lg bg-[#8083ff] px-4 text-sm font-semibold text-[#0d0096]">Parcourir le catalogue</button>
                    </div>
                  ) : orders.map((ord) => (
                    <article
                      key={ord.id}
                      onClick={() => setActiveInvoice(ord)}
                      className={`p-6 rounded-xl bg-[#181c24] shadow-md transition-all cursor-pointer border ${
                        activeInvoice?.id === ord.id
                          ? 'border-[#8083ff] bg-[#1c2028]'
                          : 'border-[#262a33] hover:bg-[#1c2028]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262a33]">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-md bg-[#262a33] text-[#c0c1ff] font-mono text-xs font-bold border border-[#31353e]">
                            {ord.orderNumber}
                          </span>
                          <span className="text-xs text-[#c7c4d7] flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {ord.date}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Payé & Confirmé
                          </span>
                          <span className="text-xs font-mono text-[#908fa0] px-2 py-0.5 rounded bg-[#0a0e16]">
                            {ord.paymentLabel}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="py-3 space-y-2">
                        {ord.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#0a0e16]/60 border border-[#262a33]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                alt={it.product.title}
                                className="w-10 h-10 rounded-lg object-cover shrink-0"
                                src={it.product.image}
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-white truncate">{it.product.title}</h4>
                                <div className="text-[11px] text-[#908fa0] flex items-center gap-2">
                                  <span>{it.licenseTier === 'agency' ? 'Licence Agence' : 'Licence Standard'}</span>
                                  <span>•</span>
                                  <span>{it.product.formatLabel}</span>
                                </div>
                              </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-white shrink-0">
                              {formatPriceEur(it.priceEur * (it.quantity || 1))}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total & Action */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-[#908fa0]">Total payé TTC :</span>
                          <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#4cd7f6]">
                            {formatPriceEur(ord.totalEur)}
                          </span>
                          <span className="font-mono text-[11px] text-[#908fa0]">
                            ({formatPriceXaf(ord.totalEur)})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInvoice(ord);
                              showToast(`Facture ${ord.invoiceRef} sélectionnée pour prévisualisation.`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-[#31353e]"
                          >
                            <span className="material-symbols-outlined text-sm text-[#4cd7f6]">picture_as_pdf</span>
                            <span>Facture PDF ({ord.invoiceRef})</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Right: Interactive Invoice Document Previewer (4 cols) */}
                <aside className="lg:col-span-4 sticky top-24">
                  {activeInvoice && (
                    <div className="p-6 rounded-xl bg-[#181c24] shadow-xl space-y-4 border border-[#262a33]">
                      <div className="flex items-center justify-between pb-2 border-b border-[#262a33]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#4cd7f6]">verified_user</span>
                          <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                            Facture Fiscale
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#262a33] text-[#4cd7f6] font-mono text-xs font-bold">
                          {activeInvoice.invoiceRef}
                        </span>
                      </div>

                      <div className="p-4 rounded-lg bg-[#0a0e16] text-xs space-y-3 border border-[#262a33]">
                        {/* Legal issuer */}
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-[#c0c1ff] font-bold">ÉMETTEUR LÉGAL :</div>
                          <p className="font-semibold text-white">NovaDigital Inc. SAS</p>
                          <p className="text-[#c7c4d7]">128 Rue de la Boétie, 75008 Paris, France</p>
                          <p className="text-[#908fa0] font-mono">SIRET : 912 345 678 00012</p>
                          <p className="text-[#908fa0] font-mono">N° TVA : FR 45 912345678</p>
                        </div>

                        <div className="h-px bg-[#262a33]"></div>

                        {/* Customer */}
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-[#4cd7f6] font-bold">CLIENT FACTURÉ :</div>
                          <p className="font-semibold text-white">
                            {activeInvoice.clientName} ({activeInvoice.companyName || 'Particulier'})
                          </p>
                          <p className="text-[#c7c4d7]">{activeInvoice.clientEmail}</p>
                          <p className="text-[#908fa0]">France (Union Européenne)</p>
                          <p className="text-[#908fa0] font-mono">N° TVA : {activeInvoice.vatNumber || 'Non renseigné'}</p>
                        </div>

                        <div className="h-px bg-[#262a33]"></div>

                        {/* Financial Ledger */}
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between text-[#c7c4d7]">
                            <span>Commande :</span>
                            <span className="font-mono text-white">{activeInvoice.orderNumber}</span>
                          </div>
                          <div className="flex justify-between text-[#c7c4d7]">
                            <span>Date d'émission :</span>
                            <span className="font-mono text-white">{activeInvoice.date}</span>
                          </div>
                          <div className="flex justify-between text-[#c7c4d7]">
                            <span>Taux TVA appliqué :</span>
                            <span className="font-mono text-emerald-400">0% (B2B Intracomm.)</span>
                          </div>
                          <div className="flex justify-between text-xs pt-2 text-white font-bold">
                            <span>Montant Net Total :</span>
                            <span className="text-[#4cd7f6] font-['Plus_Jakarta_Sans'] text-base">
                              {formatPriceEur(activeInvoice.totalEur)}
                            </span>
                          </div>
                        </div>

                        {/* QR & Hash */}
                        <div className="pt-2 flex items-center justify-between gap-3 bg-[#181c24] p-3 rounded-lg border border-[#262a33]">
                          <div className="space-y-1 min-w-0">
                            <span className="text-[10px] text-[#908fa0] uppercase font-bold tracking-wider block">
                              Empreinte SHA-256
                            </span>
                            <p className="font-mono text-[9px] text-[#c7c4d7] truncate">
                              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                              <span className="material-symbols-outlined text-xs">verified</span>
                              <span>Conforme Chorus Pro</span>
                            </div>
                          </div>

                          <div className="w-12 h-12 bg-white rounded p-1 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full text-black" fill="currentColor" viewBox="0 0 25 25">
                              <rect x="1" y="1" width="7" height="7"></rect>
                              <rect x="2" y="2" width="5" height="5" fill="#fff"></rect>
                              <rect x="3" y="3" width="3" height="3"></rect>
                              <rect x="17" y="1" width="7" height="7"></rect>
                              <rect x="18" y="2" width="5" height="5" fill="#fff"></rect>
                              <rect x="19" y="3" width="3" height="3"></rect>
                              <rect x="1" y="17" width="7" height="7"></rect>
                              <rect x="2" y="18" width="5" height="5" fill="#fff"></rect>
                              <rect x="3" y="19" width="3" height="3"></rect>
                              <rect x="10" y="2" width="2" height="4"></rect>
                              <rect x="13" y="4" width="2" height="2"></rect>
                              <rect x="10" y="8" width="4" height="2"></rect>
                              <rect x="3" y="10" width="3" height="2"></rect>
                              <rect x="8" y="12" width="4" height="2"></rect>
                              <rect x="14" y="11" width="2" height="4"></rect>
                              <rect x="18" y="10" width="4" height="2"></rect>
                              <rect x="10" y="17" width="3" height="2"></rect>
                              <rect x="15" y="17" width="3" height="2"></rect>
                              <rect x="11" y="21" width="2" height="3"></rect>
                              <rect x="19" y="19" width="4" height="4"></rect>
                            </svg>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => showToast(`Facture ${activeInvoice.invoiceRef}.pdf téléchargée !`)}
                        className="w-full py-2.5 px-4 rounded-lg bg-[#571bc1] hover:bg-[#8083ff] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                      >
                        <span className="material-symbols-outlined text-base">download_for_offline</span>
                        <span>Télécharger {activeInvoice.invoiceRef} (PDF)</span>
                      </button>

                      <p className="text-[10px] text-[#908fa0] text-center leading-relaxed">
                        Document justificatif conforme aux articles 289 et 289-0 du CGI français. Conservation 10 ans sur coffre-fort NovaVault.
                      </p>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          {/* TAB 3: API KEYS & REPOS */}
          {activeTab === 'api' && (
            <div className="p-6 rounded-xl bg-[#181c24] border border-[#262a33] space-y-4">
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                Clés API & Dépôts GitHub Associés
              </h3>
              <p className="text-xs text-[#c7c4d7]">
                Gérez vos jetons d'accès programmatiques pour installer vos templates directement via CLI ou intégrer les composants dans vos pipelines CI/CD.
              </p>
              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-lg bg-[#0a0e16] flex items-center justify-between gap-4 border border-[#262a33]">
                  <div>
                    <div className="text-xs font-bold text-white">Token d'accès CLI Nova (Lecture seule)</div>
                    <code className="text-xs text-[#4cd7f6] font-mono">nova_live_9412_token_88b1_authenticated</code>
                  </div>
                  <button
                    onClick={() => handleCopyKey('nova_live_9412_token_88b1_authenticated')}
                    className="px-3 py-1.5 bg-[#262a33] hover:bg-[#31353e] text-white text-xs rounded transition-colors"
                  >
                    Copier
                  </button>
                </div>
                <div className="p-4 rounded-lg bg-[#0a0e16] flex items-center justify-between gap-4 border border-[#262a33]">
                  <div>
                    <div className="text-xs font-bold text-white">Compte GitHub rattaché</div>
                    <span className="text-xs text-[#c0c1ff] font-mono">@alex-martin-dev (Collaborateur actif)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-xs font-mono font-semibold">
                    Synchronisé
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeTab === 'profile' && (
            <div className="p-6 rounded-xl bg-[#181c24] border border-[#262a33] space-y-4 max-w-xl">
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                Paramètres de Sécurité & Profil
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#908fa0] mb-1">Nom complet</label>
                  <input
                    type="text"
                    disabled
                    value="Alexandre Martin"
                    className="w-full px-3 py-2 rounded bg-[#0a0e16] text-white border border-[#262a33]"
                  />
                </div>
                <div>
                  <label className="block text-[#908fa0] mb-1">E-mail</label>
                  <input
                    type="email"
                    disabled
                    value="alexandre.martin@techfounder.io"
                    className="w-full px-3 py-2 rounded bg-[#0a0e16] text-white border border-[#262a33]"
                  />
                </div>
                <div>
                  <label className="block text-[#908fa0] mb-1">Entreprise & TVA</label>
                  <input
                    type="text"
                    disabled
                    value="Studio Martin Tech (FR 82 912384910)"
                    className="w-full px-3 py-2 rounded bg-[#0a0e16] text-white border border-[#262a33]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#31353e] text-white shadow-2xl flex items-center gap-3 border border-[#464554] animate-bounce">
          <span className="material-symbols-outlined text-[#4cd7f6] text-xl">check_circle</span>
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
