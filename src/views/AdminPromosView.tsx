/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PromoCode } from '../utils/shop-logic.ts';

interface AdminPromosViewProps {
  promos: PromoCode[];
  onCreatePromo: (promo: PromoCode) => void;
  onTogglePromo: (code: string) => void;
  onNavigate: (view: string) => void;
}

export const AdminPromosView: React.FC<AdminPromosViewProps> = ({
  promos,
  onCreatePromo,
  onTogglePromo,
  onNavigate,
}) => {
  const [filterState, setFilterState] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
  const [search, setSearch] = useState('');

  // Creation form states
  const [newCode, setNewCode] = useState('CYBERSALE25');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(20);
  const [minSpend, setMinSpend] = useState(50);
  const [maxUsage, setMaxUsage] = useState(250);
  const [description, setDescription] = useState('Campagne Cyber 2025');
  const [activeImmediately, setActiveImmediately] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleRandomCode = () => {
    const prefixes = ['CYBER', 'NOVA', 'TURBO', 'STACK', 'PROMO', 'BUILD', 'DEV'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    setNewCode(`${prefix}${num}`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    const created: PromoCode = {
      code: newCode.trim().toUpperCase(),
      description,
      type: discountType,
      value: Number(discountValue),
      minSpendEur: Number(minSpend),
      usageCount: 0,
      maxUsage: Number(maxUsage) || 500,
      active: activeImmediately,
    };

    onCreatePromo(created);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      handleRandomCode();
    }, 2000);
  };

  const filteredPromos = promos.filter((p) => {
    if (filterState === 'active' && !p.active) return false;
    if (filterState === 'expired' && p.active) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-8 text-[#dfe2ee]">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#262a33]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#908fa0]">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Console</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#4cd7f6] font-semibold">Codes Promo & Rabais</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Gestion des Codes Promo & Réductions
          </h1>
          <p className="text-xs sm:text-sm text-[#c7c4d7] max-w-2xl">
            Configurez vos coupons de réduction, règles de panier minimum, remises en pourcentage ou montant fixe et analysez le ROI.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => alert("Fichier export_promos_2025.csv téléchargé.")}
            className="px-4 py-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold flex items-center gap-2 border border-[#31353e]"
            type="button"
          >
            <span className="material-symbols-outlined text-base text-[#908fa0]">file_download</span>
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('code-input');
              el?.focus();
            }}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8083ff] to-[#571bc1] text-white text-xs font-bold shadow-md hover:brightness-110 flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>+ Créer un Code Promo</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#181c24] border border-[#262a33] space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#908fa0] uppercase tracking-wider font-semibold">Codes Actifs</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">
                  {promos.filter((p) => p.active).length}
                </span>
                <span className="text-xs text-[#908fa0]">/ {promos.length}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#262a33] flex items-center justify-center text-[#c0c1ff]">
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
            </div>
          </div>
          <p className="text-[11px] text-[#4cd7f6] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span> +2 cette semaine
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#181c24] border border-[#262a33] space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#908fa0] uppercase tracking-wider font-semibold">CA Stimulé</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">19 450 €</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#262a33] flex items-center justify-center text-[#4cd7f6]">
              <span className="material-symbols-outlined text-xl">trending_up</span>
            </div>
          </div>
          <p className="text-[11px] text-[#c7c4d7]">Sur 218 commandes avec coupon</p>
        </div>

        <div className="p-5 rounded-xl bg-[#181c24] border border-[#262a33] space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#908fa0] uppercase tracking-wider font-semibold">Total Remises</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">2 840 €</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#262a33] flex items-center justify-center text-[#d0bcff]">
              <span className="material-symbols-outlined text-xl">loyalty</span>
            </div>
          </div>
          <p className="text-[11px] text-[#908fa0]">Marge brute préservée : 86%</p>
        </div>

        <div className="p-5 rounded-xl bg-[#181c24] border border-[#262a33] space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#908fa0] uppercase tracking-wider font-semibold">Meilleur Coupon</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm font-bold text-[#4cd7f6] bg-[#262a33] px-2 py-0.5 rounded">
                  WELCOME10
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#262a33] flex items-center justify-center text-[#4cd7f6]">
              <span className="material-symbols-outlined text-xl">workspace_premium</span>
            </div>
          </div>
          <p className="text-[11px] text-[#c7c4d7]">142 utilisations • 10 650 € CA</p>
        </div>
      </div>

      {/* Main Grid: 8 Cols Table + 4 Cols Creation Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Interactive Coupons Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-3.5 rounded-xl bg-[#181c24] flex flex-col md:flex-row md:items-center justify-between gap-3 border border-[#262a33]">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: `Tous (${promos.length})` },
                { id: 'active', label: `Actifs (${promos.filter((p) => p.active).length})` },
                { id: 'expired', label: `Inactifs (${promos.filter((p) => !p.active).length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterState(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterState === f.id
                      ? 'bg-[#262a33] text-white border border-[#31353e]'
                      : 'text-[#908fa0] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#908fa0] text-sm">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer code..."
                className="bg-[#0a0e16] text-white placeholder-[#908fa0] pl-8 pr-3 py-1.5 rounded-lg text-xs border border-[#31353e] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#181c24] border border-[#262a33] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1c2028] text-[#908fa0] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Code & Campagne</th>
                    <th className="py-3 px-4">Remise</th>
                    <th className="py-3 px-4">Panier Min</th>
                    <th className="py-3 px-4">Quota</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262a33]">
                  {filteredPromos.map((p) => {
                    const usagePercent = Math.min(100, Math.round((p.usageCount / p.maxUsage) * 100));
                    return (
                      <tr key={p.code} className="hover:bg-[#1c2028]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-bold text-[#c0c1ff] flex items-center gap-1.5">
                              {p.code}
                              <button
                                onClick={() => navigator.clipboard?.writeText(p.code)}
                                className="text-[#908fa0] hover:text-white"
                                title="Copier"
                              >
                                <span className="material-symbols-outlined text-[13px]">content_copy</span>
                              </button>
                            </span>
                            <span className="text-[11px] text-[#908fa0]">{p.description}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-white">
                          {p.type === 'percent' ? `-${p.value}%` : `-${p.value} €`}
                        </td>

                        <td className="py-3.5 px-4 text-[#c7c4d7]">
                          {p.minSpendEur > 0 ? `Min. ${p.minSpendEur} €` : '0 € (Sans min)'}
                        </td>

                        <td className="py-3.5 px-4 min-w-[130px]">
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[10px]">
                              <span className="text-white font-bold">{p.usageCount}</span>
                              <span className="text-[#908fa0]">/ {p.maxUsage}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0a0e16] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#8083ff] rounded-full"
                                style={{ width: `${usagePercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 ${
                              p.active
                                ? 'bg-[#009eb9]/20 text-[#4cd7f6]'
                                : 'bg-[#93000a]/20 text-[#ffb4ab]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {p.active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onTogglePromo(p.code)}
                            className="p-1 rounded hover:bg-[#262a33] text-[#908fa0] hover:text-white transition-colors"
                            title={p.active ? 'Désactiver' : 'Activer'}
                          >
                            <span className="material-symbols-outlined text-base">
                              {p.active ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Quick Creation Panel */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="p-6 rounded-xl bg-[#181c24] border border-[#262a33] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#262a33]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8083ff] animate-pulse"></span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-white">Nouveau Code Promo</h2>
              </div>
              <span className="font-mono text-xs text-[#4cd7f6]">#DRAFT</span>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#c7c4d7] font-semibold" htmlFor="code-input">Code Unique (Majuscules)</label>
                  <button
                    type="button"
                    onClick={handleRandomCode}
                    className="text-[#4cd7f6] hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                    <span>Aléatoire</span>
                  </button>
                </div>
                <input
                  id="code-input"
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-[#0a0e16] text-[#c0c1ff] font-mono font-bold px-3 py-2 rounded-lg border border-[#31353e] uppercase focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#c7c4d7] mb-1 font-semibold">Description / Campagne</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0a0e16] text-white px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#c7c4d7] mb-1 font-semibold">Type Remise</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full bg-[#0a0e16] text-white px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
                  >
                    <option value="percent">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#c7c4d7] mb-1 font-semibold">
                    Valeur ({discountType === 'percent' ? '%' : '€'})
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full bg-[#0a0e16] text-white font-mono px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#c7c4d7] mb-1 font-semibold">Panier Min (€)</label>
                  <input
                    type="number"
                    value={minSpend}
                    onChange={(e) => setMinSpend(Number(e.target.value))}
                    className="w-full bg-[#0a0e16] text-white font-mono px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#c7c4d7] mb-1 font-semibold">Limite Quota</label>
                  <input
                    type="number"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(Number(e.target.value))}
                    className="w-full bg-[#0a0e16] text-white font-mono px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#1c2028] flex items-center justify-between border border-[#262a33]">
                <div className="flex flex-col">
                  <span className="font-semibold text-white">Activer immédiatement</span>
                  <span className="text-[10px] text-[#908fa0]">Prêt à l'usage au checkout</span>
                </div>
                <input
                  type="checkbox"
                  checked={activeImmediately}
                  onChange={(e) => setActiveImmediately(e.target.checked)}
                  className="h-4 w-4 accent-[#8083ff]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#8083ff] text-[#0d0096] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>{saveSuccess ? 'Code Promo Enregistré !' : 'Enregistrer le code promo'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Section: Acquisition Channels */}
      <div className="p-6 rounded-xl bg-[#181c24] border border-[#262a33] shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6]">insights</span>
              Synthèse d'Efficacité & ROI par Canal Marketing
            </h3>
            <p className="text-xs text-[#c7c4d7]">
              Mesurez la réactivité des clients et le taux de conversion généré par vos codes promo.
            </p>
          </div>
          <span className="font-mono text-xs text-[#4cd7f6] bg-[#262a33] px-3 py-1 rounded-full border border-[#31353e]">
            ROI Global : +412%
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1c2028] text-[#908fa0] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Canal d'Acquisition</th>
                <th className="py-2.5 px-4">Codes Clés</th>
                <th className="py-2.5 px-4">Utilisations</th>
                <th className="py-2.5 px-4">Taux Conversion</th>
                <th className="py-2.5 px-4">CA Généré</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262a33]">
              <tr className="hover:bg-[#1c2028]/60">
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8083ff] text-base">mail</span>
                  Newsletter Hebdomadaire
                </td>
                <td className="py-3 px-4 font-mono text-[#c0c1ff]">WELCOME10</td>
                <td className="py-3 px-4 font-mono text-white font-bold">142</td>
                <td className="py-3 px-4 text-[#4cd7f6] font-bold">14.2%</td>
                <td className="py-3 px-4 font-mono font-bold text-white">10 650 €</td>
              </tr>
              <tr className="hover:bg-[#1c2028]/60">
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-base">tag</span>
                  Twitter / X & Tech Founders
                </td>
                <td className="py-3 px-4 font-mono text-[#c0c1ff]">NEXT15LAUNCH</td>
                <td className="py-3 px-4 font-mono text-white font-bold">89</td>
                <td className="py-3 px-4 text-[#4cd7f6] font-bold">9.8%</td>
                <td className="py-3 px-4 font-mono font-bold text-white">5 890 €</td>
              </tr>
              <tr className="hover:bg-[#1c2028]/60">
                <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#d0bcff] text-base">forum</span>
                  Discord Développeurs VIP
                </td>
                <td className="py-3 px-4 font-mono text-[#c0c1ff]">FOUNDER360</td>
                <td className="py-3 px-4 font-mono text-white font-bold">200</td>
                <td className="py-3 px-4 text-[#d0bcff] font-bold">22.4%</td>
                <td className="py-3 px-4 font-mono font-bold text-white">2 910 €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
