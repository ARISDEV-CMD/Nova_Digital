/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CartItem,
  PromoCode,
  calculateSubtotal,
  validatePromoCode,
  formatPriceEur,
  formatPriceXaf,
  EUR_TO_XAF_RATE,
} from '../utils/shop-logic.ts';
import { OrderRecord } from '../data/mock-data.ts';

interface CheckoutViewProps {
  cartItems: CartItem[];
  onRemoveItem: (index: number) => void;
  promos: PromoCode[];
  onOrderCompleted: (order: OrderRecord) => void;
  onNavigate: (view: string) => void;
  currency: 'EUR' | 'USD' | 'XAF';
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cartItems,
  onRemoveItem,
  promos,
  onOrderCompleted,
  onNavigate,
  currency,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [vat, setVat] = useState('');

  const [paymentTab, setPaymentTab] = useState<'card' | 'momo' | 'paypal'>('card');


  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = calculateSubtotal(cartItems);
  const appliedPromoResult = appliedPromo ? validatePromoCode(appliedPromo, subtotal, promos) : null;
  const discountAmount = appliedPromoResult?.valid ? appliedPromoResult.discount : 0;

  const handleApplyPromo = () => {
    const res = validatePromoCode(promoInput, subtotal, promos);
    if (res.valid) {
      setAppliedPromo(promoInput.toUpperCase());
      setPromoMessage(res.message);
    } else {
      setAppliedPromo('');
      setPromoMessage(res.message);
    }
  };

  const finalTotalEur = Math.max(0, subtotal - discountAmount);
  const finalTotalXaf = Math.round(finalTotalEur * EUR_TO_XAF_RATE);

  const handleFinalCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartItems.length) return;
    if (!email.trim() || !name.trim()) { setFormError('Saisissez votre nom et une adresse e-mail valide.'); return; }
    setFormError(''); setIsProcessing(true);
    setTimeout(() => {
      const newOrder: OrderRecord = {
        id: `demo-ord-${Date.now()}`, orderNumber: `#DEMO-${Math.floor(1000 + Math.random() * 9000)}`, date: new Date().toLocaleString('fr-FR'),
        clientName: name, clientEmail: email, vatNumber: vat || undefined,
        items: cartItems.map(item => ({product:item.product,licenseTier:item.licenseTier,priceEur:item.priceEur,licenseKey:'DEMO-NON-ACTIVE'})),
        paymentMethod: paymentTab === 'card' ? 'stripe' : paymentTab,
        paymentLabel: 'DEMO ONLY - NO PAYMENT PROCESSED', totalEur: finalTotalEur, invoiceRef: 'DEMO-NON-ACTIVE', status: 'pending', token: 'DEMO-NON-ACTIVE',
      };
      setIsProcessing(false); onOrderCompleted(newOrder); onNavigate('confirmation');
    }, 450);
  };

  if (cartItems.length === 0) return <div className="mx-auto max-w-3xl px-4 py-20"><div className="rounded-xl border border-[#31353e] bg-[#181c24] p-6 text-center"><h1 className="text-xl font-bold text-white">Votre panier est vide</h1><p className="mt-2 text-sm text-[#c7c4d7]">Ajoutez un produit au panier pour continuer. Aucun paiement réel n’est possible dans cette démo.</p><button type="button" onClick={()=>onNavigate('catalogue')} className="mt-5 min-h-11 rounded-xl bg-[#8083ff] px-5 text-sm font-semibold text-[#0d0096]">Retour au catalogue</button></div></div>;

  return (
    <div className="w-full bg-[#0f131c] text-[#dfe2ee] min-h-screen">
      <div className="relative w-full overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#571bc1]/20 blur-[128px] pointer-events-none"></div>
        <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full bg-[#009eb9]/15 blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-10 relative z-10">
          {/* Checkout Header Ribbon */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#1c2028]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs text-[#4cd7f6]">
                <span className="flex h-2 w-2 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                <span>COMMANDE SÉCURISÉE NOVA-9412</span>
                <span className="text-[#464554]">/</span>
                <span className="text-[#c7c4d7]">FLUX INSTANTANÉ</span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Finaliser votre commande
              </h1>
              <p className="text-xs sm:text-sm text-[#c7c4d7] max-w-xl">
                Achat direct en invité ou avec synchronisation de compte. Accès immédiat aux dépôts GitHub, bundles et clés de licence.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262a33] text-white text-xs border border-[#31353e]">
                <span className="material-symbols-outlined text-[#4cd7f6] text-sm">lock</span>
                <span>Chiffrement SSL 256 bits</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262a33] text-[#c0c1ff] text-xs font-semibold border border-[#31353e]">
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>Livraison &lt; 3s</span>
              </div>
            </div>
          </div>

          {/* Main Layout: 2 Columns Split Screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
            {/* LEFT COLUMN: Checkout Form (7 Cols) */}
            <form onSubmit={handleFinalCheckout} className="lg:col-span-7 flex flex-col gap-6">
              {/* Step 1: Digital Identity */}
              <section className="rounded-xl bg-[#181c24] p-6 shadow-xl border border-[#262a33] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#262a33]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#571bc1] text-white font-bold text-xs">
                      1
                    </span>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                      Coordonnées numériques
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-[#4cd7f6] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">mail</span>
                    Envoi direct
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-white mb-1" htmlFor="client-email">
                      Adresse e-mail de réception <span className="text-[#4cd7f6]">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-[#908fa0] text-lg pointer-events-none">
                        alternate_email
                      </span>
                      <input
                        id="client-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vous@exemple.fr"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0a0e16] text-white placeholder-[#908fa0] text-sm focus:outline-none focus:ring-1 focus:ring-[#8083ff] border border-[#31353e]"
                      />
                    </div>
                    <p className="text-[11px] text-[#c7c4d7] mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#4cd7f6]">info</span>
                      Le lien de téléchargement permanent et la facture acquittée seront envoyés à cette adresse.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1" htmlFor="client-name">
                      Nom complet ou Studio <span className="text-[#4cd7f6]">*</span>
                    </label>
                    <input
                      id="client-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom complet"
                      required
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0a0e16] text-white placeholder-[#908fa0] text-sm focus:outline-none focus:ring-1 focus:ring-[#8083ff] border border-[#31353e]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1" htmlFor="client-vat">
                      Numéro TVA intra-communautaire <span className="text-[#908fa0] text-[10px] font-normal">(Optionnel)</span>
                    </label>
                    <input
                      id="client-vat"
                      type="text"
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      placeholder="FR 82 912384910"
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0a0e16] text-white placeholder-[#908fa0] text-sm focus:outline-none focus:ring-1 focus:ring-[#8083ff] border border-[#31353e]"
                    />
                  </div>
                </div>

              </section>

              {/* Step 2: Payment Rail Selector */}
              <section className="rounded-xl bg-[#181c24] p-6 shadow-xl border border-[#262a33] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#262a33]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#571bc1] text-white font-bold text-xs">
                      2
                    </span>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">Payment options (demo)</h2>
                  </div>
                  <span className="font-mono text-xs text-[#908fa0]">Demo mode - no payment provider connected</span>
                </div>

                {/* Tab Buttons */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#0a0e16] border border-[#262a33]">
                  <button
                    type="button"
                    onClick={() => setPaymentTab('card')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      paymentTab === 'card'
                        ? 'bg-[#262a33] text-white shadow-sm'
                        : 'text-[#c7c4d7] hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[#c0c1ff] text-base">credit_card</span>
                    <span className="truncate">Carte bancaire</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTab('momo')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      paymentTab === 'momo'
                        ? 'bg-[#262a33] text-white shadow-sm'
                        : 'text-[#c7c4d7] hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[#4cd7f6] text-base">phone_android</span>
                    <span className="truncate">Mobile Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTab('paypal')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      paymentTab === 'paypal'
                        ? 'bg-[#262a33] text-white shadow-sm'
                        : 'text-[#c7c4d7] hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[#d0bcff] text-base">account_balance_wallet</span>
                    <span className="truncate">PayPal Express</span>
                  </button>
                </div>

                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100" role="status">Payment is unavailable in this demo. Card, PayPal, and Mobile Money details are not requested or transmitted. Submitting creates only a local pending demo order.</div>

                <div className="pt-4 space-y-2">
                  {formError && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-200">{formError}</p>}
                  <button type="submit" disabled={isProcessing} className="w-full min-h-12 rounded-xl bg-[#8083ff] px-6 py-3 text-sm font-bold text-[#0d0096] transition-colors hover:bg-[#a6a8ff] disabled:opacity-50">{isProcessing ? 'Preparing demo order...' : 'Create demo order'}</button>
                  <p className="text-center text-xs text-[#908fa0]">No payment will be processed. Demo orders do not unlock downloads or licenses.</p>
                </div>
              </section>

              {/* Reassurance Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#181c24] flex items-start gap-2.5 border border-[#262a33]">
                  <span className="material-symbols-outlined text-[#4cd7f6] text-lg shrink-0">verified_user</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Licence perpétuelle</h4>
                    <p className="text-[11px] text-[#c7c4d7]">Usage commercial & personnel garanti.</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#181c24] flex items-start gap-2.5 border border-[#262a33]">
                  <span className="material-symbols-outlined text-[#c0c1ff] text-lg shrink-0">history_edu</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Mises à jour incluses</h4>
                    <p className="text-[11px] text-[#c7c4d7]">Accès direct aux releases futures.</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#181c24] flex items-start gap-2.5 border border-[#262a33]">
                  <span className="material-symbols-outlined text-[#d0bcff] text-lg shrink-0">support_agent</span>
                  <div>
                    <h4 className="text-xs font-bold text-white">Support réactif</h4>
                    <p className="text-[11px] text-[#c7c4d7]">Assistance Discord & email 7j/7.</p>
                  </div>
                </div>
              </div>
            </form>

            {/* RIGHT COLUMN: Order Summary & Promo Code (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
              <div className="rounded-xl bg-[#181c24] p-6 shadow-xl border border-[#262a33] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#262a33]">
                  <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                    Récapitulatif du panier
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#262a33] text-[#4cd7f6] font-mono text-xs font-bold border border-[#31353e]">
                    {cartItems.reduce((total, item) => total + (item.quantity || 1), 0)} {cartItems.reduce((total, item) => total + (item.quantity || 1), 0) > 1 ? 'articles' : 'article'}
                  </span>
                </div>

                {/* Items List */}
                {cartItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#908fa0]">
                    <span className="material-symbols-outlined text-3xl mb-1">shopping_basket</span>
                    <p>Votre panier est vide.</p>
                    <button
                      type="button"
                      onClick={() => onNavigate('catalogue')}
                      className="mt-2 text-[#4cd7f6] underline font-semibold"
                    >
                      Parcourir le catalogue
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-xl bg-[#1c2028] flex gap-3 group transition-colors border border-[#262a33]"
                      >
                        <div className="w-16 h-16 rounded-lg bg-[#0a0e16] shrink-0 overflow-hidden relative border border-[#31353e]/40">
                          <img alt={item.product.title} className="w-full h-full object-cover" src={item.product.image} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-xs font-bold text-white truncate">{item.product.title}</h3>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(index)}
                              className="text-[#908fa0] hover:text-[#ffb4ab] transition-colors p-0.5"
                              title="Supprimer"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 py-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-[#262a33] text-[#c0c1ff] font-mono text-[10px]">
                              {item.licenseTier === 'agency' ? 'Licence Agence' : 'Licence Standard'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[#4cd7f6] text-[10px] font-mono">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#4cd7f6] animate-ping"></span>
                              Lien direct
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-[#908fa0] font-mono">{item.product.formatLabel} · Qté {item.quantity || 1}</span>
                            <span className="text-xs font-bold text-white font-mono">{formatPriceEur(item.priceEur * (item.quantity || 1))}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Discount Code Section */}
                <div className="pt-3 pb-3 bg-[#1c2028]/60 -mx-6 px-6 space-y-2 border-y border-[#262a33]">
                  <label className="block text-xs text-white font-medium" htmlFor="promo-input">
                    Code de réduction ou bon d'achat
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[#908fa0] text-base">
                        sell
                      </span>
                      <input
                        id="promo-input"
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        placeholder="Ex: WELCOME10"
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0a0e16] text-white font-mono text-xs uppercase focus:outline-none border border-[#31353e]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-bold transition-colors shrink-0 border border-[#31353e]"
                    >
                      Appliquer
                    </button>
                  </div>
                  {promoMessage && (
                    <div
                      className={`flex items-center gap-1.5 text-xs pt-1 ${
                        discountAmount > 0 ? 'text-[#4cd7f6]' : 'text-[#ffb4ab]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {appliedPromoResult?.valid ? 'check_circle' : 'error'}
                      </span>
                      <span>{promoMessage}</span>
                    </div>
                  )}
                </div>

                {/* Ledger Computation */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#c7c4d7]">
                    <span>Sous-total articles</span>
                    <span className="font-mono text-white">{formatPriceEur(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-[#4cd7f6]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">loyalty</span>
                        Réduction promo ({appliedPromo})
                      </span>
                      <span className="font-mono font-bold">-{formatPriceEur(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#c7c4d7]">
                    <span>TVA / Taxes numériques</span>
                    <span className="font-mono text-white">0,00 € (Auto-liquidation B2B)</span>
                  </div>

                  {/* Total Box */}
                  <div className="mt-3 pt-3 bg-[#1c2028] p-3.5 rounded-xl space-y-1 border border-[#31353e]">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-bold text-white">Total net à payer</span>
                      <span className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#c0c1ff]">
                        {formatPriceEur(finalTotalEur)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#908fa0]">
                      <span>Équivalent franc CFA :</span>
                      <span className="text-[#4cd7f6] font-semibold">
                        ~ {finalTotalXaf.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Guarantee Box */}
                <div className="p-3.5 rounded-xl bg-[#1c2028] flex items-center gap-3 border border-[#262a33]">
                  <div className="w-10 h-10 rounded-full bg-[#009eb9]/20 text-[#4cd7f6] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-xl">verified</span>
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white">Garantie 30 jours sérénité</h4>
                    <p className="text-[11px] text-[#c7c4d7] leading-tight">
                      Si le template ou l'ebook ne répond pas à vos attentes techniques, remboursement intégral.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
