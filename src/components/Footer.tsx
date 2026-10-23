/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface FooterProps {
  onNavigate: (view: string, productId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 4000);
    }
  };

  return (
    <footer className="w-full bg-[#0a0e16] text-[#dfe2ee] border-t border-[#1c2028]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-[#1c2028]">
          {/* Col 1: Brand & Value */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/assets/images/logo.png" alt="" className="w-7 h-7 object-contain" />
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold tracking-tight text-white">
                NovaDigital
              </span>
            </div>
            <p className="text-[#c7c4d7] text-sm leading-relaxed">
              La place de marché d'actifs numériques premium pour concepteurs, développeurs et bâtisseurs d'exception.
              Livraison instantanée 24/7.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#c7c4d7]">
              <span className="material-symbols-outlined text-[#4cd7f6] text-base">verified_user</span>
              <span>Licences Authentifiées & Prêtes à Déployer</span>
            </div>
          </div>

          {/* Col 2: Catalogues */}
          <div className="space-y-3">
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-white">
              Catalogues & Outils
            </h3>
            <ul className="space-y-2 text-sm text-[#c7c4d7]">
              <li>
                <button
                  onClick={() => onNavigate('catalogue')}
                  className="hover:text-[#c0c1ff] transition-colors text-left"
                >
                  Tous les Produits
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalogue-templates')}
                  className="hover:text-[#c0c1ff] transition-colors text-left"
                >
                  Templates Next.js & UI Kits
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalogue-formations')}
                  className="hover:text-[#c0c1ff] transition-colors text-left"
                >
                  Guides & Ebooks Techniques
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('offres-speciales')}
                  className="hover:text-[#c0c1ff] transition-colors text-left"
                >
                  Packs & Bundles Exclusifs
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Guarantees */}
          <div className="space-y-3">
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-white">
              Confiance & Garanties
            </h3>
            <ul className="space-y-2 text-sm text-[#c7c4d7]">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-sm">bolt</span>
                <span>Téléchargement 100% Instantané</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c0c1ff] text-sm">security</span>
                <span>Paiement Chiffré SSL 256-bit</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#d0bcff] text-sm">assignment_return</span>
                <span>Garantie Sérénité 30 Jours</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-sm">support_agent</span>
                <span>Support Technique Réactif</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-3">
            <h3 className="font-['Plus_Jakarta_Sans'] text-base font-semibold text-white">
              Restez à la Pointe
            </h3>
            <p className="text-[#c7c4d7] text-sm">
              Recevez les nouveaux templates chaque semaine directement dans votre boîte mail.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex items-center rounded-lg bg-[#262a33] px-3 py-2 border border-[#31353e]">
                <span className="material-symbols-outlined text-[#908fa0] text-sm mr-2">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@domaine.com"
                  required
                  className="bg-transparent text-[#dfe2ee] placeholder-[#908fa0] text-sm focus:outline-none w-full"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-[#571bc1] hover:bg-[#8083ff] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{subscribed ? 'Inscrit ! Code : NOVA15' : "S'inscrire"}</span>
                <span className="material-symbols-outlined text-sm">
                  {subscribed ? 'check' : 'arrow_forward'}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom row: Payment rails and copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#908fa0]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#1c2028] text-[#dfe2ee] font-mono border border-[#31353e]/40">
              Stripe
            </span>
            <span className="px-2.5 py-1 rounded bg-[#1c2028] text-[#dfe2ee] font-mono border border-[#31353e]/40">
              MTN MoMo
            </span>
            <span className="px-2.5 py-1 rounded bg-[#1c2028] text-[#dfe2ee] font-mono border border-[#31353e]/40">
              Orange Money
            </span>
            <span className="px-2.5 py-1 rounded bg-[#1c2028] text-[#dfe2ee] font-mono border border-[#31353e]/40">
              PayPal
            </span>
            <span className="px-2.5 py-1 rounded bg-[#1c2028] text-[#dfe2ee] font-mono border border-[#31353e]/40">
              Visa / Mastercard
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('mon-espace-client')}
              className="hover:text-[#dfe2ee] transition-colors"
            >
              Espace Client
            </button>
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="hover:text-[#dfe2ee] transition-colors"
            >
              Console Admin
            </button>
            <span>© 2025 NovaDigital Inc. Tous droits réservés.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
