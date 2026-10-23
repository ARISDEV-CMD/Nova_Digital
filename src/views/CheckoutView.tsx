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
  const [email, setEmail] = useState('alexandre.martin@techfounder.io');
  const [name, setName] = useState('Alexandre Martin');
  const [vat, setVat] = useState('FR 82 912384910');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');

  const [paymentTab, setPaymentTab] = useState<'card' | 'momo' | 'paypal'>('card');
  const [cardNum, setCardNum] = useState('4532 •••• •••• 8920');
  const [cardExp, setCardExp] = useState('11/27');
  const [cardCvc, setCardCvc] = useState('884');

  const [momoCountry, setMomoCountry] = useState('CI');
  const [momoOp, setMomoOp] = useState<'orange' | 'mtn'>('orange');
  const [momoPhone, setMomoPhone] = useState('07 00 00 00 00');

  const [promoInput, setPromoInput] = useState('WELCOME10');
  const [appliedPromo, setAppliedPromo] = useState<string>('WELCOME10');
  const [promoMessage, setPromoMessage] = useState<string>('Code WELCOME10 activé (-10 € offerts)');
  const [discountAmount, setDiscountAmount] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = calculateSubtotal(cartItems);

  const handleApplyPromo = () => {
    const res = validatePromoCode(promoInput, subtotal, promos);
    if (res.valid) {
      setAppliedPromo(promoInput.toUpperCase());
      setDiscountAmount(res.discount);
      setPromoMessage(res.message);
    } else {
      setAppliedPromo('');
      setDiscountAmount(0);
      setPromoMessage(res.message);
    }
  };

  const finalTotalEur = Math.max(0, subtotal - discountAmount);
  const finalTotalXaf = Math.round(finalTotalEur * EUR_TO_XAF_RATE);

  const countryPrefixes: Record<string, string> = {
    CI: '+225',
    CM: '+237',
    SN: '+221',
    BJ: '+229',
    TG: '+228',
  };

  const handleFinalCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      alert("Veuillez saisir votre adresse e-mail et votre nom pour recevoir vos fichiers.");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const newOrder: OrderRecord = {
        id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
        orderNumber: `#NOVA-${Math.floor(9400 + Math.random() * 100)}`,
        date: new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        clientName: name,
        clientEmail: email,
        companyName: vat ? 'Studio Martin Tech' : undefined,
        vatNumber: vat || undefined,
        items: cartItems.map((item, idx) => ({
          product: item.product,
          licenseTier: item.licenseTier,
          priceEur: item.priceEur,
          licenseKey: `NOVA-${item.product.sku.substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}-AUTH`,
        })),
        paymentMethod: paymentTab === 'card' ? 'stripe' : paymentTab,
        paymentLabel:
          paymentTab === 'card'
            ? 'Stripe • Visa terminant par 8920'
            : paymentTab === 'momo'
            ? `${momoOp.toUpperCase()} Money (${momoPhone})`
            : 'PayPal Express',
        totalEur: finalTotalEur,
        invoiceRef: `FAC-2025-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'paid',
        token: `live_hmac_${Date.now()}_token`,
      };

      setIsProcessing(false);
      onOrderCompleted(newOrder);
      onNavigate('confirmation');
    }, 1200);
  };

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
                        placeholder="alexandre.martin@techfounder.io"
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
                      placeholder="Alexandre Martin"
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

                {/* Account creation toggle */}
                <div className="pt-2 bg-[#1c2028]/60 p-3.5 rounded-lg space-y-2 border border-[#31353e]/40">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded bg-[#0a0e16] text-[#8083ff] accent-[#8083ff] cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-white block">
                        Créer un compte NovaDigital pour synchroniser mes accès à vie
                      </span>
                      <span className="text-[11px] text-[#c7c4d7] block">
                        Conservez l'historique des versions, releases GitHub et vos clés API au même endroit.
                      </span>
                    </div>
                  </label>
                  {createAccount && (
                    <div className="pt-2">
                      <label className="block text-xs text-white mb-1" htmlFor="account-password">
                        Mot de passe de sécurité
                      </label>
                      <input
                        id="account-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="8+ caractères alphanumériques"
                        className="w-full px-3 py-2 rounded-lg bg-[#0a0e16] text-white placeholder-[#908fa0] text-sm focus:outline-none focus:ring-1 focus:ring-[#8083ff] border border-[#31353e]"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Step 2: Payment Rail Selector */}
              <section className="rounded-xl bg-[#181c24] p-6 shadow-xl border border-[#262a33] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#262a33]">
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#571bc1] text-white font-bold text-xs">
                      2
                    </span>
                    <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                      Moyen de paiement sécurisé
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-[#908fa0]">Protocole 3D Secure 2.0</span>
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

                {/* TAB PANEL 1: Stripe Card */}
                {paymentTab === 'card' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-xs text-[#c7c4d7]">
                      <span>Cartes acceptées</span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-[#1c2028] text-[10px] font-mono font-bold text-white border border-[#31353e]">
                          VISA
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#1c2028] text-[10px] font-mono font-bold text-white border border-[#31353e]">
                          MASTERCARD
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#1c2028] text-[10px] font-mono font-bold text-white border border-[#31353e]">
                          AMEX
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-white mb-1" htmlFor="card-num">Numéro de carte</label>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[#908fa0] text-lg">credit_card</span>
                        <input
                          id="card-num"
                          type="text"
                          value={cardNum}
                          onChange={(e) => setCardNum(e.target.value)}
                          placeholder="4532 •••• •••• 8920"
                          className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#0a0e16] text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#8083ff] border border-[#31353e]"
                        />
                        <span className="material-symbols-outlined absolute right-3 text-[#4cd7f6] text-lg">lock</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white mb-1" htmlFor="card-exp">Date d'expiration</label>
                        <input
                          id="card-exp"
                          type="text"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          placeholder="MM / AA"
                          className="w-full px-3 py-2.5 rounded-lg bg-[#0a0e16] text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#8083ff] border border-[#31353e]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-white mb-1" htmlFor="card-cvc">Cryptogramme CVC</label>
                        <input
                          id="card-cvc"
                          type="password"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="CVC"
                          maxLength={4}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#0a0e16] text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#8083ff] border border-[#31353e]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB PANEL 2: Mobile Money (MTN / Orange) */}
                {paymentTab === 'momo' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-3.5 rounded-lg bg-[#1c2028]/60 space-y-1 border border-[#31353e]/40">
                      <div className="flex items-center gap-2 text-[#4cd7f6] text-xs font-bold">
                        <span className="material-symbols-outlined text-base">cell_tower</span>
                        <span>Réseau Afrique Centrale & Ouest (Instant USSD)</span>
                      </div>
                      <p className="text-xs text-[#c7c4d7]">
                        Après validation, un message contextuel s'affichera directement sur votre téléphone portable pour autoriser le débit sécurisé.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-white mb-1" htmlFor="momo-country">Pays du compte</label>
                        <select
                          id="momo-country"
                          value={momoCountry}
                          onChange={(e) => setMomoCountry(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#0a0e16] text-white text-xs focus:outline-none border border-[#31353e]"
                        >
                          <option value="CI">Côte d'Ivoire (+225)</option>
                          <option value="CM">Cameroun (+237)</option>
                          <option value="SN">Sénégal (+221)</option>
                          <option value="BJ">Bénin (+229)</option>
                          <option value="TG">Togo (+228)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-white mb-1">Opérateur Télécom</label>
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            onClick={() => setMomoOp('orange')}
                            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg cursor-pointer border text-xs font-semibold ${
                              momoOp === 'orange'
                                ? 'bg-[#1c2028] border-[#4cd7f6] text-white'
                                : 'bg-[#0a0e16] border-[#31353e] text-[#c7c4d7]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="momo-op"
                              checked={momoOp === 'orange'}
                              onChange={() => setMomoOp('orange')}
                              className="accent-[#4cd7f6]"
                            />
                            <span>Orange</span>
                          </label>
                          <label
                            onClick={() => setMomoOp('mtn')}
                            className={`flex items-center justify-center gap-1.5 p-2 rounded-lg cursor-pointer border text-xs font-semibold ${
                              momoOp === 'mtn'
                                ? 'bg-[#1c2028] border-[#4cd7f6] text-white'
                                : 'bg-[#0a0e16] border-[#31353e] text-[#c7c4d7]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="momo-op"
                              checked={momoOp === 'mtn'}
                              onChange={() => setMomoOp('mtn')}
                              className="accent-[#4cd7f6]"
                            />
                            <span>MTN MoMo</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-white mb-1" htmlFor="momo-phone">Numéro de téléphone mobile</label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 font-mono text-[#c7c4d7] text-xs font-bold">
                          {countryPrefixes[momoCountry] || '+225'}
                        </span>
                        <input
                          id="momo-phone"
                          type="tel"
                          value={momoPhone}
                          onChange={(e) => setMomoPhone(e.target.value)}
                          placeholder="07 00 00 00 00"
                          className="w-full pl-16 pr-4 py-2.5 rounded-lg bg-[#0a0e16] text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#4cd7f6] border border-[#31353e]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB PANEL 3: PayPal Express */}
                {paymentTab === 'paypal' && (
                  <div className="p-6 rounded-xl bg-[#1c2028] text-center space-y-3 border border-[#31353e]">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#571bc1] flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                    </div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">PayPal Express Checkout</h4>
                    <p className="text-xs text-[#c7c4d7] max-w-sm mx-auto">
                      Vous serez redirigé en toute sécurité vers l'interface PayPal pour valider votre transaction en 1 clic avec votre solde ou compte bancaire relié.
                    </p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#262a33] text-[#d0bcff] text-xs font-semibold">
                      <span className="material-symbols-outlined text-sm">verified</span> Protection des Achats PayPal
                    </span>
                  </div>
                )}

                {/* Big Final Call to Action */}
                <div className="pt-4 space-y-2">
                  <button
                    type="submit"
                    disabled={isProcessing || cartItems.length === 0}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#571bc1] via-[#8083ff] to-[#009eb9] hover:brightness-110 active:scale-[0.99] text-white font-['Plus_Jakarta_Sans'] text-base font-bold flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isProcessing ? 'hourglass_top' : 'lock_open'}
                    </span>
                    <span>
                      {isProcessing
                        ? 'Traitement sécurisé en cours...'
                        : paymentTab === 'momo'
                        ? `Valider ${finalTotalXaf.toLocaleString('fr-FR')} FCFA & Télécharger`
                        : `Payer ${formatPriceEur(finalTotalEur)} & Télécharger mes fichiers`}
                    </span>
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                  </button>
                  <p className="text-center text-xs text-[#908fa0]">
                    Accès direct au dashboard de téléchargement et aux archives ZIP dès validation bancaire.
                  </p>
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
                    {cartItems.length} {cartItems.length > 1 ? 'articles' : 'article'}
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
                            <span className="text-[11px] text-[#908fa0] font-mono">{item.product.formatLabel}</span>
                            <span className="text-xs font-bold text-white font-mono">{formatPriceEur(item.priceEur)}</span>
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
                        {discountAmount > 0 ? 'check_circle' : 'error'}
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
