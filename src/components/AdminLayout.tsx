/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AdminLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentView,
  onNavigate,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] flex">
      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#181c24] z-50 flex flex-col justify-between py-6 border-r border-[#262a33] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6">
          {/* Logo & Title */}
          <div className="px-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#31353e] flex items-center justify-center text-[#c0c1ff] shadow-[0_0_16px_rgba(192,193,255,0.15)]">
              <span className="material-symbols-outlined text-[24px]">terminal</span>
            </div>
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-tight text-white">
                NovaDigital
              </div>
              <div className="font-['JetBrains_Mono'] text-[11px] tracking-wider text-[#4cd7f6] uppercase font-semibold">
                ADMIN CONSOLE
              </div>
            </div>
          </div>

          {/* System status widgets */}
          <div className="mx-6 px-3 py-2.5 rounded-lg bg-[#1c2028] flex flex-col gap-1.5 border border-[#31353e]/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#c7c4d7] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                Stripe & MoMo
              </span>
              <span className="font-['JetBrains_Mono'] text-[#4cd7f6] font-bold">OK</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#c7c4d7] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8083ff]"></span>
                Supabase RLS
              </span>
              <span className="font-['JetBrains_Mono'] text-[#c0c1ff] font-bold">ACTIF</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-4 flex flex-col gap-1" aria-label="Console Administration">
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                currentView === 'admin-dashboard'
                  ? 'bg-[#8083ff] text-[#0d0096] font-bold shadow-[0_0_12px_rgba(128,131,255,0.25)]'
                  : 'text-[#c7c4d7] hover:bg-[#262a33] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
              Tableau de bord
            </button>

            <button
              onClick={() => onNavigate('admin-produits')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                currentView === 'admin-produits'
                  ? 'bg-[#8083ff] text-[#0d0096] font-bold shadow-[0_0_12px_rgba(128,131,255,0.25)]'
                  : 'text-[#c7c4d7] hover:bg-[#262a33] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              Produits & Assets
            </button>

            <button
              onClick={() => onNavigate('admin-promos')}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                currentView === 'admin-promos'
                  ? 'bg-[#8083ff] text-[#0d0096] font-bold shadow-[0_0_12px_rgba(128,131,255,0.25)]'
                  : 'text-[#c7c4d7] hover:bg-[#262a33] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">sell</span>
              Codes Promo & Rabais
            </button>

            <div className="h-px bg-[#262a33] my-2"></div>

            <button
              onClick={() => onNavigate('accueil')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#4cd7f6] hover:bg-[#262a33] hover:text-white transition-all text-left font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              Retourner à la Boutique
            </button>

            <button
              onClick={() => onNavigate('mon-espace-client')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#c7c4d7] hover:bg-[#262a33] hover:text-white transition-all text-left"
            >
              <span className="material-symbols-outlined text-[20px]">account_circle</span>
              Espace Client
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="px-6 flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-[#1c2028] flex items-center justify-between border border-[#31353e]/60">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#4cd7f6]"></div>
              <span className="text-xs text-[#c7c4d7]">v2.4.1-prod</span>
            </div>
            <span className="font-['JetBrains_Mono'] text-xs text-[#908fa0]">99.98% SLA</span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane with Fixed Header */}
      <div className="pl-72 flex flex-col flex-1 min-h-screen">
        {/* Admin Top Header */}
        <header className="fixed top-0 left-72 right-0 h-16 bg-[#0f131c]/80 backdrop-blur-xl z-40 flex items-center justify-between px-8 border-b border-[#262a33]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#908fa0]">Admin</span>
              <span className="material-symbols-outlined text-[#908fa0] text-[14px]">chevron_right</span>
              <span className="text-white font-semibold">Console</span>
            </div>
            <div className="hidden md:flex items-center bg-[#0a0e16] rounded-lg p-1 gap-1 border border-[#262a33]">
              <span className="px-2.5 py-1 rounded text-xs font-semibold text-[#dfe2ee] bg-[#262a33]">
                Aujourd'hui
              </span>
              <span className="px-2.5 py-1 rounded text-xs text-[#908fa0]">7 jours</span>
              <span className="px-2.5 py-1 rounded text-xs text-[#908fa0]">Ce mois</span>
              <span className="px-2.5 py-1 rounded text-xs text-[#908fa0]">2025</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1c2028] text-[#4cd7f6] border border-[#31353e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-ping"></span>
              PROD-LIVE
            </span>
            <div className="flex items-center gap-3 pl-3">
              <div className="text-right hidden xl:block">
                <div className="text-xs font-semibold text-white leading-tight">SuperAdmin Alex M.</div>
                <div className="font-['JetBrains_Mono'] text-[11px] text-[#908fa0]">alex@novadigital.internal</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#8083ff] flex items-center justify-center text-[#0d0096] font-bold">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="w-full pt-16 flex-1 px-8 py-8">
          {children}
        </main>

        {/* Admin Footer */}
        <footer className="w-full bg-[#181c24] px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#908fa0] border-t border-[#262a33]">
          <div className="flex items-center gap-4">
            <span>© 2025 NovaDigital SAS. Espace SuperAdmin sécurisé.</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline font-['JetBrains_Mono'] text-[#dfe2ee]">
              Datacenter: eu-west-3 (Paris)
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('accueil')} className="hover:text-white transition-colors">
              Retour boutique
            </button>
            <span className="hover:text-white cursor-pointer">Audits & Logs</span>
            <span className="hover:text-white cursor-pointer">Support Infra</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
