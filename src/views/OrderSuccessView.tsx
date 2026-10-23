/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OrderRecord } from '../data/mock-data.ts';
import { formatPriceEur, formatPriceXaf } from '../utils/shop-logic.ts';
import { EmptyState } from '../components/feedback/EmptyState.tsx';
import { Button } from '../components/ui/Button.tsx';

interface OrderSuccessViewProps {
  order: OrderRecord;
  onNavigate: (view: string) => void;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({ order, onNavigate }) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [downloadedZip, setDownloadedZip] = useState(false);
  const [downloadedInvoice, setDownloadedInvoice] = useState(false);

  const terminalSnippet = `curl -H "X-License-Key: ${
    order.items[0]?.licenseKey || 'DEMO-NON-ACTIVE'
  }" https://api.novadigital.dev/v2/install.sh | bash`;

  const handleCopySnippet = () => {
    navigator.clipboard?.writeText(terminalSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleDownloadZip = () => {
    setDownloadedZip(true);
    setTimeout(() => setDownloadedZip(false), 3000);
  };

  const handleDownloadInvoice = () => {
    setDownloadedInvoice(true);
    setTimeout(() => setDownloadedInvoice(false), 3000);
  };

  if (order.status !== 'paid') return <div className="mx-auto max-w-3xl px-4 py-20"><div className="mb-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100" role="status">Demo order only - payment pending. No payment was sent, and no downloads or licenses are available.</div><EmptyState title="Commande de demonstration creee" description={`Reference ${order.orderNumber}. Un vrai paiement et la livraison necessitent la connexion des services du serveur.`} action={<Button variant="secondary" onClick={()=>onNavigate('catalogue')}>Retour au catalogue</Button>} icon="pending_actions"/></div>;

  return (
    <div className="w-full bg-[#0f131c] text-[#dfe2ee]">
      <div className="relative w-full overflow-hidden">
        {/* Glows */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-b from-[#8083ff]/15 via-[#571bc1]/20 to-transparent blur-3xl pointer-events-none rounded-full"></div>
        <div className="absolute top-72 -right-24 w-96 h-96 bg-[#4cd7f6]/10 blur-3xl pointer-events-none rounded-full"></div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          {/* Top Status Banner */}
          <section className="mb-10">
            <div className="bg-[#181c24] rounded-xl p-6 lg:p-8 shadow-xl relative overflow-hidden border border-[#262a33]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4cd7f6] via-[#8083ff] to-[#571bc1]"></div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262a33] text-[#4cd7f6] text-xs font-semibold border border-[#31353e]">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4cd7f6] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4cd7f6]"></span>
                    </span>
                    <span className="font-mono">Paiement Validé & Sécurisé par Supabase Vault</span>
                  </div>
                  <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                    Vos ressources sont générées et prêtes au déploiement.
                  </h1>
                  <p className="text-sm text-[#c7c4d7]">
                    Transaction confirmée. Les artefacts logiciels, clés de licence chiffrées et tokens de téléchargement ont été associés de façon permanente à votre compte.
                  </p>
                </div>

                {/* Identifiers card */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 bg-[#1c2028] rounded-xl p-4 min-w-[280px] border border-[#31353e]">
                  <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#262a33]">
                    <span className="text-[11px] text-[#908fa0] uppercase tracking-wider font-semibold">RÉF. COMMANDE</span>
                    <span className="font-mono text-xs text-[#4cd7f6] bg-[#262a33] px-2 py-0.5 rounded font-bold">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#262a33]">
                    <span className="text-[11px] text-[#908fa0] uppercase tracking-wider font-semibold">MODE RÈGLEMENT</span>
                    <span className="font-mono text-xs text-[#c7c4d7] truncate max-w-[140px]">
                      {order.paymentLabel}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="block text-[11px] text-[#908fa0] mb-0.5 font-semibold uppercase">DESTINATION EMAIL</span>
                    <span className="font-mono text-xs text-white truncate block font-medium">
                      {order.clientEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Download Delivery Hub (8 cols) */}
            <main className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4cd7f6]">cloud_download</span>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">
                    Actifs Prêts au Téléchargement
                  </h2>
                </div>
                <span className="font-mono text-xs text-[#908fa0] hidden sm:inline-block">
                  Jeton d'accès HMAC actif
                </span>
              </div>

              {/* Product Download Cards */}
              {order.items.map((item, idx) => (
                <article
                  key={idx}
                  className="bg-[#181c24] rounded-xl p-6 shadow-xl relative overflow-hidden border border-[#262a33] transition-all hover:bg-[#1c2028]"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#8083ff]/20 flex items-center justify-center shrink-0 text-[#c0c1ff]">
                        <span className="material-symbols-outlined text-3xl">folder_zip</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#571bc1] text-[#d0bcff] font-semibold">
                            {item.licenseTier === 'agency' ? 'Licence Agence' : 'Licence Standard'}
                          </span>
                          <span className="font-mono text-xs text-[#908fa0]">
                            {item.product.fileSize}
                          </span>
                        </div>
                        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white">
                          {item.product.title}
                        </h3>
                        <p className="text-xs text-[#c7c4d7] mt-1">{item.product.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between shrink-0 gap-1 bg-[#262a33] md:bg-transparent p-2 md:p-0 rounded-lg">
                      <span className="font-mono text-xs text-[#4cd7f6] flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
                        Jeton HMAC Valide
                      </span>
                      <span className="text-[11px] text-[#908fa0]">Expire dans 47h 58m</span>
                    </div>
                  </div>

                  {/* Quota bar */}
                  <div className="bg-[#1c2028] rounded-lg p-3.5 my-3 border border-[#262a33]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-sm text-[#908fa0]">data_usage</span>
                        Quota de téléchargement sécurisé
                      </span>
                      <span className="font-mono text-xs text-[#4cd7f6] font-bold">0 / 5 consommés</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#262a33] overflow-hidden">
                      <div className="h-full bg-[#4cd7f6] rounded-full w-[8%]"></div>
                    </div>
                    <p className="text-[11px] text-[#908fa0] mt-1.5">
                      La limite protège votre jeton contre les fuites. Réinitialisation instantanée via votre espace client.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <button
                      onClick={handleDownloadZip}
                      className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#8083ff] via-[#494bd6] to-[#571bc1] hover:brightness-110 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>
                        {downloadedZip ? 'Téléchargement lancé (Archive .ZIP)...' : `Télécharger l'archive ZIP (${item.product.fileSize})`}
                      </span>
                    </button>
                    {item.product.githubRepo && (
                      <button
                        onClick={() => alert(`Invitation GitHub envoyée à ${order.clientEmail} pour le dépôt privé ${item.product.githubRepo} !`)}
                        className="py-2.5 px-4 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-[#31353e]"
                      >
                        <span className="material-symbols-outlined text-base">code</span>
                        <span>Accéder au Dépôt GitHub</span>
                      </button>
                    )}
                  </div>

                  {/* Terminal snippet */}
                  <div className="mt-4 pt-3 bg-[#0a0e16]/80 rounded-lg p-3 flex items-center justify-between gap-3 border border-[#262a33]">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="material-symbols-outlined text-[#908fa0] text-base">terminal</span>
                      <span className="font-mono text-xs text-[#c7c4d7] truncate select-all">
                        {terminalSnippet}
                      </span>
                    </div>
                    <button
                      onClick={handleCopySnippet}
                      className="px-2 py-1 rounded hover:bg-[#262a33] text-[#908fa0] hover:text-white transition-colors shrink-0"
                      title="Copier la commande"
                    >
                      <span className="material-symbols-outlined text-base">
                        {copiedSnippet ? 'check' : 'content_copy'}
                      </span>
                    </button>
                  </div>
                </article>
              ))}

              {/* Security Assurance Card */}
              <div className="bg-[#181c24] rounded-xl p-6 shadow-xl space-y-4 border border-[#262a33]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#c0c1ff]">verified</span>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                    Protocole de Sécurité & Intégrité Cryptographique
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-[#1c2028] rounded-lg p-3.5 space-y-1 border border-[#262a33]">
                    <div className="flex items-center gap-1.5 text-[#4cd7f6] font-bold">
                      <span className="material-symbols-outlined text-base">link_off</span>
                      <span>Liens Inaliénables</span>
                    </div>
                    <p className="text-[#c7c4d7] leading-relaxed">
                      Chaque URL est signée numériquement par HMAC-SHA256 et strictement attachée à votre empreinte IP.
                    </p>
                  </div>

                  <div className="bg-[#1c2028] rounded-lg p-3.5 space-y-1 border border-[#262a33]">
                    <div className="flex items-center gap-1.5 text-[#c0c1ff] font-bold">
                      <span className="material-symbols-outlined text-base">shield</span>
                      <span>Anti-Hotlinking</span>
                    </div>
                    <p className="text-[#c7c4d7] leading-relaxed">
                      Les tentatives d'aspiration automatisée révoquent immédiatement le jeton sans compromettre le compte.
                    </p>
                  </div>

                  <div className="bg-[#1c2028] rounded-lg p-3.5 space-y-1 border border-[#262a33]">
                    <div className="flex items-center gap-1.5 text-[#d0bcff] font-bold">
                      <span className="material-symbols-outlined text-base">all_inclusive</span>
                      <span>Génération Illimitée</span>
                    </div>
                    <p className="text-[#c7c4d7] leading-relaxed">
                      Accès à vie. Si votre jeton expire, un nouveau lien peut être régénéré à tout instant sans frais.
                    </p>
                  </div>
                </div>

                {/* Deep Link into Client Area */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0a0e16]/80 p-4 rounded-lg border border-[#262a33]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#262a33] flex items-center justify-center text-[#908fa0]">
                      <span className="material-symbols-outlined text-lg">lock_person</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Retrouvez toutes vos licences et fichiers à tout moment
                      </span>
                      <span className="text-[11px] text-[#c7c4d7]">
                        Accédez à votre espace client NovaDigital pour gérer vos clés API et historique.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('mon-espace-client')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold shrink-0 transition-colors border border-[#31353e]"
                  >
                    <span>Mon Espace Client</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            </main>

            {/* Right: Official Tax Invoice & Auth Sidebar (4 cols) */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d0bcff]">receipt_long</span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">Facturation & Fiscalité</h2>
              </div>

              {/* Official Invoice Card */}
              <div className="bg-[#181c24] rounded-xl p-6 shadow-xl border border-[#262a33] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#262a33]">
                  <span className="text-xs uppercase tracking-wider text-[#908fa0] font-semibold">
                    Facture Fiscale B2B
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#009eb9]/30 text-[#4cd7f6] font-mono text-xs font-bold">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    ACQUITTÉE
                  </span>
                </div>

                <div className="bg-[#1c2028] rounded-lg p-3.5 space-y-2 text-xs border border-[#262a33]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#c7c4d7]">Facture N°</span>
                    <span className="font-mono text-white font-bold">{order.invoiceRef}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#c7c4d7]">Date d'émission</span>
                    <span className="text-white font-mono">{order.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#c7c4d7]">Régime Fiscal</span>
                    <span className="font-mono text-[#4cd7f6]">TVA 0% (Auto-liquidation)</span>
                  </div>
                  <div className="h-px bg-[#262a33] my-1"></div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs font-bold text-white">Montant Total Payé</span>
                    <div className="text-right">
                      <span className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-white">
                        {formatPriceEur(order.totalEur)}
                      </span>
                      <span className="block font-mono text-[11px] text-[#4cd7f6]">
                        ~ {formatPriceXaf(order.totalEur)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PDF Download Action */}
                <button
                  onClick={handleDownloadInvoice}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-[#31353e]"
                >
                  <span className="material-symbols-outlined text-base text-[#c0c1ff]">
                    {downloadedInvoice ? 'check' : 'download_for_offline'}
                  </span>
                  <span>
                    {downloadedInvoice ? 'Facture PDF générée !' : `Télécharger la Facture PDF (${order.invoiceRef})`}
                  </span>
                </button>

                {/* Cryptographic Stamp & QR Verification */}
                <div className="bg-[#0a0e16] p-4 rounded-lg space-y-3 border border-[#262a33]">
                  <div className="flex items-center gap-3">
                    {/* SVG Vector QR Code */}
                    <div className="w-14 h-14 bg-white rounded p-1 shrink-0 flex items-center justify-center">
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
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Signature Fiscale Certifiée</span>
                      <span className="text-[10px] text-[#908fa0] block leading-tight">
                        Vérifiable par l'administration fiscale européenne & zone CEMAC.
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#908fa0] uppercase tracking-wider block mb-1">
                      EMPREINTE SHA-256
                    </span>
                    <div className="bg-[#181c24] px-2 py-1 rounded font-mono text-[10px] text-[#4cd7f6] break-all leading-tight border border-[#262a33]">
                      8f9b48c1e309bbd4c67676e100f9a2e612cb723498cf11dbd562203e87d00f72
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Card */}
              <div className="bg-[#181c24] rounded-xl p-4 shadow-xl flex items-start gap-3 border border-[#262a33]">
                <span className="material-symbols-outlined text-[#4cd7f6] text-2xl shrink-0 mt-0.5">contact_support</span>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-white block">Une question sur vos fichiers ?</span>
                  <p className="text-xs text-[#c7c4d7]">
                    Notre assistance intervient sous 2h pour les requêtes d'accès Git et l'approvisionnement des licences.
                  </p>
                  <a
                    className="inline-flex items-center gap-1 text-xs text-[#c0c1ff] hover:underline pt-1 font-semibold"
                    href="mailto:support@novadigital.dev"
                  >
                    <span>Contacter l'équipe d'ingénieurs</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
