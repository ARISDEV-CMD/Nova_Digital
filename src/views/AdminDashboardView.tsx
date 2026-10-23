/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface AdminDashboardViewProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'stripe' | 'momo' | 'orange'>('all');
  const [revokedTokens, setRevokedTokens] = useState<string[]>([]);

  const handleRevoke = (orderId: string) => {
    if (confirm(`Voulez-vous révoquer le jeton de téléchargement pour la commande ${orderId} ?`)) {
      setRevokedTokens((prev) => [...prev, orderId]);
    }
  };

  return (
    <div className="flex flex-col w-full text-[#dfe2ee]">
      {/* Header & Quick Action Buttons */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#262a33]">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs bg-[#8083ff]/20 text-[#c0c1ff] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8083ff] animate-pulse"></span>
              STREAMING EN DIRECT
            </span>
            <span className="font-mono text-xs text-[#908fa0]">•</span>
            <span className="font-mono text-xs text-[#908fa0]">SYNC CLOUD: ACTIF</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Tableau de Bord & Métriques Clés
          </h1>
          <p className="text-sm text-[#c7c4d7]">
            Suivi en temps réel des transactions Stripe, Mobile Money et distribution sécurisée des licences digitales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#181c24] p-1 rounded-xl border border-[#262a33]">
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#8083ff] text-[#0d0096]">
              30 derniers jours
            </span>
            <span className="px-3 py-1.5 rounded-lg text-xs text-[#908fa0] hover:text-white cursor-pointer">
              Ce trimestre
            </span>
            <span className="px-3 py-1.5 rounded-lg text-xs text-[#908fa0] hover:text-white cursor-pointer">
              2025
            </span>
          </div>
          <button
            onClick={() => onNavigate('admin-produits')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8083ff] to-[#571bc1] text-white text-xs font-bold shadow-lg shadow-[#8083ff]/20 hover:opacity-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Gérer les Produits</span>
          </button>
        </div>
      </section>

      {/* 4 Primary KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 py-8">
        {/* KPI 1: CA Global */}
        <div className="relative overflow-hidden bg-[#181c24] rounded-xl p-5 shadow-sm border border-[#262a33] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#908fa0] tracking-wider uppercase font-semibold">
                Chiffre d'affaires Global
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">48 290,00 €</span>
              </div>
              <span className="font-mono text-xs text-[#4cd7f6]">~31 676 000 FCFA</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
              <span>+18.4%</span>
            </div>
          </div>

          {/* Sparkline SVG */}
          <div className="my-4 h-12 w-full flex items-end">
            <svg className="w-full h-full text-[#8083ff]" fill="none" preserveAspectRatio="none" viewBox="0 0 160 40">
              <path d="M0 34 Q 20 30, 40 25 T 80 18 T 120 12 T 160 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
              <path d="M0 34 Q 20 30, 40 25 T 80 18 T 120 12 T 160 4 L 160 40 L 0 40 Z" fill="currentColor" fillOpacity="0.08"></path>
            </svg>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-[#908fa0] border-t border-[#262a33]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8083ff]"></span>Stripe: 34 120 €</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4cd7f6]"></span>MoMo: 14 170 €</span>
          </div>
        </div>

        {/* KPI 2: Volume Commandes */}
        <div className="relative overflow-hidden bg-[#181c24] rounded-xl p-5 shadow-sm border border-[#262a33] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#908fa0] tracking-wider uppercase font-semibold">
                Volume de Commandes
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">642</span>
                <span className="text-xs text-[#908fa0]">payées</span>
              </div>
              <span className="font-mono text-xs text-[#c7c4d7]">Taux de conversion : 4.8%</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
              <span>+12.1%</span>
            </div>
          </div>

          <div className="my-4 h-12 w-full flex items-end">
            <svg className="w-full h-full text-[#d0bcff]" fill="none" preserveAspectRatio="none" viewBox="0 0 160 40">
              <path d="M0 30 Q 30 20, 60 26 T 110 14 T 160 8" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
              <path d="M0 30 Q 30 20, 60 26 T 110 14 T 160 8 L 160 40 L 0 40 Z" fill="currentColor" fillOpacity="0.08"></path>
            </svg>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-[#908fa0] border-t border-[#262a33]">
            <span>Validation checkout</span>
            <span className="font-mono text-white font-semibold">98.2% sans abandon</span>
          </div>
        </div>

        {/* KPI 3: Téléchargements Signés */}
        <div className="relative overflow-hidden bg-[#181c24] rounded-xl p-5 shadow-sm border border-[#262a33] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#908fa0] tracking-wider uppercase font-semibold">
                Téléchargements Signés
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">1 894</span>
                <span className="text-xs text-[#908fa0]">requêtes</span>
              </div>
              <span className="font-mono text-xs text-[#4cd7f6]">0 échec bucket Supabase</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">format_image_left</span>
              <span>100% SEC</span>
            </div>
          </div>

          <div className="my-4 h-12 w-full flex items-end">
            <svg className="w-full h-full text-[#4cd7f6]" fill="none" preserveAspectRatio="none" viewBox="0 0 160 40">
              <path d="M0 24 Q 25 36, 65 18 T 120 16 T 160 6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
              <path d="M0 24 Q 25 36, 65 18 T 120 16 T 160 6 L 160 40 L 0 40 Z" fill="currentColor" fillOpacity="0.08"></path>
            </svg>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-[#908fa0] border-t border-[#262a33]">
            <span>Expiration token</span>
            <span className="font-mono text-white font-semibold">60 min HMAC-SHA256</span>
          </div>
        </div>

        {/* KPI 4: Panier Moyen & Rétention */}
        <div className="relative overflow-hidden bg-[#181c24] rounded-xl p-5 shadow-sm border border-[#262a33] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] text-[#908fa0] tracking-wider uppercase font-semibold">
                Panier Moyen
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">75,20 €</span>
              </div>
              <span className="font-mono text-xs text-[#c7c4d7]">Multi-achats : 34%</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">repeat</span>
              <span>+6.4%</span>
            </div>
          </div>

          <div className="my-4 h-12 w-full flex items-end">
            <svg className="w-full h-full text-[#e1e0ff]" fill="none" preserveAspectRatio="none" viewBox="0 0 160 40">
              <path d="M0 28 Q 30 32, 70 20 T 115 12 T 160 5" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
              <path d="M0 28 Q 30 32, 70 20 T 115 12 T 160 5 L 160 40 L 0 40 Z" fill="currentColor" fillOpacity="0.08"></path>
            </svg>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs text-[#908fa0] border-t border-[#262a33]">
            <span>Cross-sell conversion</span>
            <span className="font-mono text-white font-semibold">22.8%</span>
          </div>
        </div>
      </section>

      {/* Dual Chart & Breakdown Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">
        {/* Left Chart (8 cols) */}
        <div className="lg:col-span-8 bg-[#181c24] rounded-xl p-6 shadow-sm border border-[#262a33] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c0c1ff] text-xl">ssid_chart</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                  Dynamique du Chiffre d'Affaires
                </h2>
              </div>
              <p className="text-xs text-[#908fa0] mt-0.5">
                Distribution journalière Stripe (Cartes/SEPA) vs Mobile Money (MTN & Orange)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8083ff]"></span>
                <span className="text-[#c7c4d7]">Stripe (€)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]"></span>
                <span className="text-[#c7c4d7]">MoMo (FCFA/€)</span>
              </div>
            </div>
          </div>

          {/* SVG Multi-curve Chart */}
          <div className="relative w-full h-64 flex flex-col justify-end">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="w-full h-px bg-[#908fa0]"></div>
              <div className="w-full h-px bg-[#908fa0]"></div>
              <div className="w-full h-px bg-[#908fa0]"></div>
              <div className="w-full h-px bg-[#908fa0]"></div>
            </div>

            <svg className="w-full h-full relative z-10" fill="none" preserveAspectRatio="none" viewBox="0 0 600 240">
              <defs>
                <linearGradient id="stripeGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8083ff" stopOpacity="0.35"></stop>
                  <stop offset="100%" stopColor="#8083ff" stopOpacity="0.0"></stop>
                </linearGradient>
                <linearGradient id="momoGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.25"></stop>
                  <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0"></stop>
                </linearGradient>
              </defs>
              <path
                d="M0,170 C50,165 90,130 140,120 C200,110 240,150 300,100 C360,60 410,90 470,55 C530,20 570,35 600,25 L600,240 L0,240 Z"
                fill="url(#stripeGrad)"
              ></path>
              <path
                d="M0,170 C50,165 90,130 140,120 C200,110 240,150 300,100 C360,60 410,90 470,55 C530,20 570,35 600,25"
                stroke="#8083ff"
                strokeLinecap="round"
                strokeWidth="3"
              ></path>
              <path
                d="M0,210 C50,205 90,185 140,180 C200,175 240,195 300,170 C360,140 410,160 470,120 C530,95 570,105 600,85 L600,240 L0,240 Z"
                fill="url(#momoGrad)"
              ></path>
              <path
                d="M0,210 C50,205 90,185 140,180 C200,175 240,195 300,170 C360,140 410,160 470,120 C530,95 570,105 600,85"
                stroke="#4cd7f6"
                strokeDasharray="4 2"
                strokeLinecap="round"
                strokeWidth="2.5"
              ></path>
              <circle cx="300" cy="100" fill="#dfe2ee" r="4" stroke="#8083ff" strokeWidth="2.5"></circle>
              <circle cx="470" cy="55" fill="#dfe2ee" r="4" stroke="#8083ff" strokeWidth="2.5"></circle>
              <circle cx="470" cy="120" fill="#dfe2ee" r="4" stroke="#4cd7f6" strokeWidth="2"></circle>
            </svg>

            <div className="flex justify-between items-center pt-3 text-[#908fa0] font-mono text-[11px]">
              <span>01 Nov</span>
              <span>08 Nov</span>
              <span>15 Nov</span>
              <span>22 Nov</span>
              <span className="text-[#4cd7f6] font-bold">30 Nov (Aujourd'hui)</span>
            </div>
          </div>

          <div className="pt-4 mt-4 bg-[#1c2028] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs border border-[#262a33]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-base">bolt</span>
              <span>Pic journalier : <strong className="text-white">3 420,00 €</strong> (Lancement SaaS Starter v3)</span>
            </div>
            <span className="font-mono text-[#908fa0]">Latence webhooks Stripe: 118ms</span>
          </div>
        </div>

        {/* Right Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-[#181c24] rounded-xl p-6 shadow-sm border border-[#262a33] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#262a33]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#d0bcff] text-xl">pie_chart</span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">Ventes par Produit</h2>
            </div>
            <span className="font-mono text-xs text-[#908fa0]">Q4-2025</span>
          </div>

          <div className="space-y-4 py-3">
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8083ff]"></span>
                  Boilerplates SaaS Next.js
                </span>
                <span className="font-mono font-bold text-white">42%</span>
              </div>
              <div className="h-1.5 w-full bg-[#262a33] rounded-full overflow-hidden">
                <div className="h-full bg-[#8083ff] rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4cd7f6]"></span>
                  Templates UI & Kits Figma
                </span>
                <span className="font-mono font-bold text-white">28%</span>
              </div>
              <div className="h-1.5 w-full bg-[#262a33] rounded-full overflow-hidden">
                <div className="h-full bg-[#4cd7f6] rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#571bc1]"></span>
                  Formations & Masterclasses
                </span>
                <span className="font-mono font-bold text-white">18%</span>
              </div>
              <div className="h-1.5 w-full bg-[#262a33] rounded-full overflow-hidden">
                <div className="h-full bg-[#571bc1] rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#908fa0]"></span>
                  Ebooks & Presets Audio
                </span>
                <span className="font-mono font-bold text-white">12%</span>
              </div>
              <div className="h-1.5 w-full bg-[#262a33] rounded-full overflow-hidden">
                <div className="h-full bg-[#908fa0] rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 bg-[#1c2028] rounded-xl p-3.5 border border-[#262a33]">
            <div className="text-xs text-[#908fa0] mb-2 font-semibold">Devises de Paiement Encaissées</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-[#262a33] border border-[#31353e]">
                <div className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">65%</div>
                <div className="font-mono text-[10px] text-[#c0c1ff]">EUR (€)</div>
              </div>
              <div className="p-2 rounded-lg bg-[#262a33] border border-[#31353e]">
                <div className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">25%</div>
                <div className="font-mono text-[10px] text-[#4cd7f6]">XAF (FCFA)</div>
              </div>
              <div className="p-2 rounded-lg bg-[#262a33] border border-[#31353e]">
                <div className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">10%</div>
                <div className="font-mono text-[10px] text-[#d0bcff]">USD ($)</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Sales Table */}
      <section className="bg-[#181c24] rounded-xl shadow-sm mb-8 overflow-hidden border border-[#262a33]">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262a33]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#c0c1ff] text-2xl">receipt_long</span>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                Dernières Ventes & Commandes en Direct
              </h2>
              <p className="text-xs text-[#908fa0]">Flux instantané des paiements confirmés et clés de licences signées</p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedFilter === 'all'
                  ? 'bg-[#8083ff] text-[#0d0096]'
                  : 'bg-[#262a33] text-[#c7c4d7] hover:text-white'
              }`}
            >
              Toutes (642)
            </button>
            <button
              onClick={() => setSelectedFilter('stripe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedFilter === 'stripe'
                  ? 'bg-[#8083ff] text-[#0d0096]'
                  : 'bg-[#262a33] text-[#c7c4d7] hover:text-white'
              }`}
            >
              Stripe (430)
            </button>
            <button
              onClick={() => setSelectedFilter('momo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedFilter === 'momo'
                  ? 'bg-[#8083ff] text-[#0d0096]'
                  : 'bg-[#262a33] text-[#c7c4d7] hover:text-white'
              }`}
            >
              MTN MoMo (145)
            </button>
            <button
              onClick={() => setSelectedFilter('orange')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                selectedFilter === 'orange'
                  ? 'bg-[#8083ff] text-[#0d0096]'
                  : 'bg-[#262a33] text-[#c7c4d7] hover:text-white'
              }`}
            >
              Orange Money (67)
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1c2028] text-[#908fa0] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-6">ID Commande</th>
                <th className="py-3 px-4">Date / Heure</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Produit(s)</th>
                <th className="py-3 px-4">Montant</th>
                <th className="py-3 px-4">Paiement</th>
                <th className="py-3 px-4">Distribution</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262a33]">
              {[
                {
                  id: '#NOVA-9412',
                  time: '30 Nov, 14:28:10',
                  client: 'Arnaud K.',
                  email: 'arnaud.k@techlead.ci',
                  product: 'NovaSaaS Next.js 15 Starter',
                  icon: 'code',
                  iconColor: 'text-[#4cd7f6]',
                  eur: '149,00 €',
                  sub: '97 500 XAF',
                  method: 'MTN MoMo',
                  methodColor: 'text-[#4cd7f6]',
                  status: 'Téléchargé (x1)',
                },
                {
                  id: '#NOVA-9411',
                  time: '30 Nov, 14:14:02',
                  client: 'Sophie Valette',
                  email: 'sophie@valette-design.fr',
                  product: 'NexusUI Design System Pro',
                  icon: 'draw',
                  iconColor: 'text-[#c0c1ff]',
                  eur: '79,00 €',
                  sub: 'Stripe FR',
                  method: 'Stripe Card',
                  methodColor: 'text-[#c0c1ff]',
                  status: 'Jeton délivré',
                },
                {
                  id: '#NOVA-9410',
                  time: '30 Nov, 13:51:48',
                  client: 'Marc D. N\'Goran',
                  email: 'm.ngoran@orange.ci',
                  product: 'Masterclass Microservices',
                  icon: 'school',
                  iconColor: 'text-[#4cd7f6]',
                  eur: '199,00 €',
                  sub: '130 500 XAF',
                  method: 'Orange Money',
                  methodColor: 'text-[#4cd7f6]',
                  status: 'Actif & Signé',
                },
                {
                  id: '#NOVA-9409',
                  time: '30 Nov, 13:30:15',
                  client: 'Lucas Weber',
                  email: 'l.weber@fintech.berlin',
                  product: 'L\'Art du Solopreneur Tech',
                  icon: 'menu_book',
                  iconColor: 'text-[#d0bcff]',
                  eur: '45,00 €',
                  sub: 'Code WELCOME10',
                  method: 'Stripe SEPA',
                  methodColor: 'text-[#c0c1ff]',
                  status: 'Téléchargé (x2)',
                },
              ].map((row, idx) => {
                const isRevoked = revokedTokens.includes(row.id);
                return (
                  <tr key={idx} className="hover:bg-[#1c2028] transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-[#c0c1ff]">{row.id}</td>
                    <td className="py-4 px-4 text-[#908fa0] font-mono">{row.time}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white">{row.client}</div>
                      <div className="font-mono text-[#908fa0] text-[11px] truncate max-w-[150px]">{row.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0a0e16] text-white border border-[#262a33]">
                        <span className={`material-symbols-outlined text-sm ${row.iconColor}`}>{row.icon}</span>
                        {row.product}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-white">{row.eur}</div>
                      <div className="font-mono text-[10px] text-[#908fa0]">{row.sub}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0a0e16] font-mono text-[11px] ${row.methodColor} border border-[#262a33]`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {row.method}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {isRevoked ? (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#93000a]/40 text-[#ffb4ab]">
                          Révoqué
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#009eb9]/20 text-[#4cd7f6]">
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => alert(`Reçu fiscal pour la transaction ${row.id} affiché.`)}
                          className="p-1.5 rounded text-[#908fa0] hover:text-white hover:bg-[#262a33] transition-colors"
                          title="Voir reçu"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">receipt</span>
                        </button>
                        <button
                          onClick={() => handleRevoke(row.id)}
                          className="p-1.5 rounded text-[#908fa0] hover:text-[#ffb4ab] hover:bg-[#262a33] transition-colors"
                          title="Révoquer jeton"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">key_off</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Telemetry Panels */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 rounded-xl bg-[#181c24] flex items-center gap-4 border border-[#262a33]">
          <div className="w-12 h-12 rounded-xl bg-[#009eb9]/10 text-[#4cd7f6] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">sync_saved_locally</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white">Webhooks Stripe & MTN</div>
            <div className="text-xs text-[#908fa0]">100% succès (dernières 24h)</div>
            <div className="font-mono text-xs text-[#4cd7f6]">Latence moyenne : 120ms</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#181c24] flex items-center gap-4 border border-[#262a33]">
          <div className="w-12 h-12 rounded-xl bg-[#8083ff]/10 text-[#c0c1ff] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">cloud_done</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white">Supabase Storage Chiffré</div>
            <div className="text-xs text-[#908fa0]">Bucket privé & URLs signées</div>
            <div className="font-mono text-xs text-[#c0c1ff]">42.8 Go utilisés / 100 Go</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#181c24] flex items-center gap-4 border border-[#262a33]">
          <div className="w-12 h-12 rounded-xl bg-[#571bc1]/20 text-[#d0bcff] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">local_offer</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white">Code Actif : 'WELCOME10'</div>
            <div className="text-xs text-[#908fa0]">142 utilisations ce mois-ci</div>
            <div className="font-mono text-xs text-[#d0bcff]">Génération de 10 650 € CA</div>
          </div>
        </div>
      </section>
    </div>
  );
};
