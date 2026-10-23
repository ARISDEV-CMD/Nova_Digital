/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Product, formatPriceEur, formatPriceXaf, formatPriceUsd } from '../utils/shop-logic.ts';

interface AdminProductsViewProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onCreateProduct: (product: Product) => void;
  onNavigate: (view: string, productId?: string) => void;
}

export const AdminProductsView: React.FC<AdminProductsViewProps> = ({
  products,
  onUpdateProduct,
  onCreateProduct,
  onNavigate,
}) => {
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [syncToast, setSyncToast] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form states for drawer
  const [formTitle, setFormTitle] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState<any>('boilerplates');
  const [formPriceEur, setFormPriceEur] = useState(69);
  const [formFormat, setFormFormat] = useState('Next.js 15 AppRouter');
  const [formFileSize, setFormFileSize] = useState('34.2 Mo');
  const [formGithub, setFormGithub] = useState('novadigital/nexus-saas-enterprise');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const filteredProducts = products.filter((p) => {
    if (filterCat !== 'all' && p.category !== filterCat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.formatLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsNewProduct(false);
    setFormTitle(p.title);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormPriceEur(p.priceEur);
    setFormFormat(p.formatLabel);
    setFormFileSize(p.fileSize);
    setFormGithub(p.githubRepo || '');
    setFormSubtitle(p.subtitle);
    setFormDescription(p.description);
    setDrawerOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setIsNewProduct(true);
    setFormTitle('Nouveau Template Pro 2025');
    setFormSku(`SKU-NEW-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('boilerplates');
    setFormPriceEur(59);
    setFormFormat('Next.js 15 + TypeScript');
    setFormFileSize('28.5 Mo');
    setFormGithub('novadigital/new-starter');
    setFormSubtitle('Description courte du starter kit...');
    setFormDescription('Description complète pour les développeurs...');
    setDrawerOpen(true);
  };

  const handleToggleStatus = (p: Product) => {
    const updated = { ...p, isDraft: !p.isDraft };
    onUpdateProduct(updated);
  };

  const handleSaveDrawer = () => {
    setSaveLoading(true);
    setTimeout(() => {
      setSaveLoading(false);
      if (isNewProduct) {
        const newProd: Product = {
          id: `prod-${Date.now()}`,
          sku: formSku,
          title: formTitle,
          subtitle: formSubtitle,
          category: formCategory,
          categoryLabel: formCategory.toUpperCase(),
          priceEur: Number(formPriceEur),
          rating: 5.0,
          reviewCount: 1,
          image:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDR48kTeJZSudKRgyUf0FGm12Bv08EIPABioG8L33AhP7u2hpoGiXToV18UKdERwodMn2feh3EfodM2CWE7Mnk39siwNj4fjKbGsUa7UuODYvXYVoRQ6_t7xw2R4WSvMSIma5Pu3W31QLG96HJA7qzb4B84yL_uCK1nSQwmDg_Q8ua0Yvv2CcMSGJFMxWvYBfhsIxzaUeDIgJ1AGdbTwPzDL7Gkfw2Hi5b7amAZygLKwMl97wZSe5kK',
          deliveryType: 'instant',
          formatLabel: formFormat,
          fileSize: formFileSize,
          tags: ['Next.js 15', 'TypeScript'],
          techStack: ['React 19', 'Next.js', 'Tailwind'],
          description: formDescription,
          githubRepo: formGithub,
        };
        onCreateProduct(newProd);
      } else if (editingProduct) {
        const updated: Product = {
          ...editingProduct,
          title: formTitle,
          sku: formSku,
          category: formCategory,
          priceEur: Number(formPriceEur),
          formatLabel: formFormat,
          fileSize: formFileSize,
          githubRepo: formGithub,
          subtitle: formSubtitle,
          description: formDescription,
        };
        onUpdateProduct(updated);
      }
      setDrawerOpen(false);
    }, 600);
  };

  const handleSyncBuckets = () => {
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 3500);
  };

  return (
    <div className="flex flex-col w-full text-[#dfe2ee]">
      {/* Header Panel */}
      <div className="relative w-full mb-8">
        <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2 border-b border-[#262a33]">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs bg-[#1c2028] text-[#4cd7f6] border border-[#31353e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse"></span>
                CATALOG_ENGINE :: v3.8.4
              </span>
              <span className="font-mono text-xs text-[#908fa0]">storage-bucket: eu-west-3-vault</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Catalogue & Gestion des Produits Digitaux
            </h1>
            <p className="text-xs sm:text-sm text-[#c7c4d7]">
              Gérez vos actifs numériques, tarification multi-devises (EUR, USD, XAF), dépôts GitHub privés et buckets de fichiers Supabase protégés par signature HMAC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncBuckets}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#262a33] hover:bg-[#31353e] text-white text-xs font-semibold transition-all border border-[#31353e]"
              type="button"
            >
              <span className="material-symbols-outlined text-base text-[#4cd7f6]">sync</span>
              <span>Verifier la connexion des fichiers</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#8083ff] to-[#571bc1] text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(128,131,255,0.3)]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>+ Nouveau Produit Digital</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl bg-[#181c24] p-5 border border-[#262a33] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#908fa0] uppercase tracking-wider font-semibold">
            <span>Total Produits Actifs</span>
            <span className="material-symbols-outlined text-[#c0c1ff] text-lg">view_in_ar</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">{products.length}</span>
            <span className="font-mono text-xs text-[#4cd7f6]">+3 ce mois</span>
          </div>
          <p className="text-[11px] text-[#c7c4d7] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
            100% disponibles sur le CDN Edge
          </p>
        </div>

        <div className="rounded-xl bg-[#181c24] p-5 border border-[#262a33] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#908fa0] uppercase tracking-wider font-semibold">
            <span>Panier Moyen / Asset</span>
            <span className="material-symbols-outlined text-[#d0bcff] text-lg">payments</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-white">2 012 €</span>
            <span className="font-mono text-xs text-[#c0c1ff]">+14.2%</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-[#908fa0]">
            <span>$ 2 180 USD</span>
            <span>•</span>
            <span>1 320 000 XAF</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#181c24] p-5 border border-[#262a33] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#908fa0] uppercase tracking-wider font-semibold">
            <span>Top Produit du Mois</span>
            <span className="material-symbols-outlined text-[#4cd7f6] text-lg">verified</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-white truncate">Nexus Starter Kit</span>
            <span className="font-mono text-xs font-bold text-[#4cd7f6]">18 420 €</span>
          </div>
          <span className="text-[11px] text-[#c7c4d7]">267 commandes ce mois</span>
        </div>

        <div className="rounded-xl bg-[#181c24] p-5 border border-[#262a33] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#908fa0] uppercase tracking-wider font-semibold">
            <span>Espace Fichiers Sécurisé</span>
            <span className="material-symbols-outlined text-[#c0c1ff] text-lg">cloud_sync</span>
          </div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-bold text-white">12.4 / 50 Go</span>
            <span className="font-mono text-[#c0c1ff]">24.8% utilisé</span>
          </div>
          <div className="w-full bg-[#262a33] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#8083ff] h-full rounded-full" style={{ width: '24.8%' }}></div>
          </div>
        </div>
      </section>

      {/* Filter Chips & Search */}
      <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3.5 rounded-xl bg-[#181c24] mb-6 border border-[#262a33]">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `Tous (${products.length})` },
            { id: 'boilerplates', label: 'SaaS Boilerplates (8)' },
            { id: 'ui', label: 'Templates & UI Kits (7)' },
            { id: 'formations', label: 'Formations Vidéo (5)' },
            { id: 'ebooks', label: 'E-books (4)' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterCat === c.id
                  ? 'bg-[#8083ff] text-[#0d0096]'
                  : 'bg-[#1c2028] text-[#c7c4d7] hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#908fa0] text-base">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer SKU, titre, hash..."
            className="w-full bg-[#0a0e16] text-white placeholder-[#908fa0] pl-9 pr-3 py-1.5 rounded-lg text-xs focus:outline-none border border-[#31353e]"
          />
        </div>
      </section>

      {/* Table */}
      <section className="w-full rounded-2xl bg-[#181c24] border border-[#262a33] overflow-hidden mb-8 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px]">
            <thead className="bg-[#1c2028] text-[#908fa0] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-5">Produit & Métadonnées</th>
                <th className="py-3 px-4">Format / Type</th>
                <th className="py-3 px-4">Grille Tarifaire Multi-Devises</th>
                <th className="py-3 px-4">Stockage Source & Sécurité</th>
                <th className="py-3 px-4 text-center">Ventes & Notes</th>
                <th className="py-3 px-4 text-center">Statut Store</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262a33]">
              {filteredProducts.map((p) => {
                const isLive = !p.isDraft;
                return (
                  <tr key={p.id} className="hover:bg-[#1c2028]/60 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          alt={p.title}
                          className="w-12 h-12 rounded-xl object-cover bg-[#0a0e16] shrink-0 border border-[#31353e]"
                          src={p.image}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => handleOpenEdit(p)}
                              className="font-['Plus_Jakarta_Sans'] font-bold text-white truncate cursor-pointer hover:text-[#c0c1ff]"
                            >
                              {p.title}
                            </span>
                            <span className="material-symbols-outlined text-[#4cd7f6] text-sm">verified</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[#908fa0]">
                            <span className="font-mono text-[11px]">{p.sku}</span>
                            <span>•</span>
                            <span className="text-[#4cd7f6] text-[11px] font-mono">{p.githubRepo || 'Local Bucket'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#262a33] text-white text-[11px] border border-[#31353e]">
                        {p.formatLabel}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{formatPriceEur(p.priceEur)}</span>
                          <span className="text-[#908fa0] text-[11px]">/ {formatPriceUsd(p.priceEur)}</span>
                        </div>
                        <span className="font-mono text-[11px] text-[#4cd7f6] font-semibold">
                          {formatPriceXaf(p.priceEur)}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col text-[11px]">
                        <span className="font-mono text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs text-[#4cd7f6]">lock</span>
                          {p.sku.toLowerCase()}-v2.zip
                        </span>
                        <span className="text-[#908fa0] font-mono">{p.fileSize} • HMAC-SHA256</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1 font-bold text-white">
                          <span className="material-symbols-outlined text-[#c0c1ff] text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                            star
                          </span>
                          {p.rating}
                        </div>
                        <span className="text-[#908fa0] text-[10px]">{p.reviewCount} avis</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ${
                          isLive ? 'bg-[#8083ff]' : 'bg-[#31353e]'
                        }`}
                        title={isLive ? 'En ligne' : 'Brouillon'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                            isLive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        ></span>
                      </button>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded text-[#908fa0] hover:text-white hover:bg-[#262a33] transition-colors"
                          title="Modifier"
                        >
                          <span className="material-symbols-outlined text-base">edit_note</span>
                        </button>
                        <button
                          onClick={() => onNavigate('produit', p.id)}
                          className="p-1.5 rounded text-[#908fa0] hover:text-[#4cd7f6] hover:bg-[#262a33] transition-colors"
                          title="Aperçu public"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
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

      {/* Slide-over Drawer for Edit/Create */}
      {drawerOpen && createPortal((
        <aside className="fixed inset-y-0 right-0 z-50 flex h-dvh max-h-dvh w-full flex-col overflow-hidden border-l border-[#262a33] bg-[#181c24] shadow-2xl animate-in slide-in-from-right sm:max-w-xl">
          <div className="shrink-0 p-6 bg-[#1c2028] flex items-center justify-between border-b border-[#262a33]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#8083ff] text-[#0d0096] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-xl">tune</span>
              </div>
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white">
                  {isNewProduct ? 'Créer un Produit Digital' : 'Configuration Produit'}
                </h2>
                <p className="font-mono text-xs text-[#908fa0]">{formSku}</p>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 text-[#908fa0] hover:text-white rounded-lg hover:bg-[#262a33] transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-4 text-xs">
            <div>
              <label className="block text-[#c7c4d7] mb-1 font-semibold">Titre public du produit</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-[#0a0e16] text-white px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#c7c4d7] mb-1 font-semibold">SKU Référence</label>
                <input
                  type="text"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="w-full bg-[#0a0e16] text-white px-3 py-2 rounded-lg font-mono border border-[#31353e] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#c7c4d7] mb-1 font-semibold">Catégorie</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#0a0e16] text-white px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
                >
                  <option value="boilerplates">Boilerplates SaaS</option>
                  <option value="ui">Templates & UI Kits</option>
                  <option value="formations">Formations Vidéo</option>
                  <option value="ebooks">E-books & Playbooks</option>
                  <option value="presets">Presets & Audio</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#c7c4d7] mb-1 font-semibold">Prix en Euros (€)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  value={formPriceEur}
                  onChange={(e) => setFormPriceEur(Number(e.target.value))}
                  className="w-full bg-[#0a0e16] text-white font-mono px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
                />
                <span className="absolute right-3 text-[#908fa0]">€</span>
              </div>
              <p className="text-[11px] text-[#4cd7f6] mt-1 font-mono">
                Équivaut à ~ {Math.round(formPriceEur * 655.957).toLocaleString('fr-FR')} FCFA / $ {Math.round(formPriceEur * 1.08)} USD
              </p>
            </div>

            <div>
              <label className="block text-[#c7c4d7] mb-1 font-semibold">Format & Stack</label>
              <input
                type="text"
                value={formFormat}
                onChange={(e) => setFormFormat(e.target.value)}
                className="w-full bg-[#0a0e16] text-white px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#c7c4d7] mb-1 font-semibold">Dépôt GitHub privé lié</label>
              <input
                type="text"
                value={formGithub}
                onChange={(e) => setFormGithub(e.target.value)}
                className="w-full bg-[#0a0e16] text-white font-mono px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#c7c4d7] mb-1 font-semibold">Sous-titre / Accroche</label>
              <input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                className="w-full bg-[#0a0e16] text-white px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#c7c4d7] mb-1 font-semibold">Description complète</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#0a0e16] text-white px-3 py-2 rounded-lg border border-[#31353e] focus:outline-none"
              />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 shrink-0 border-t border-[#262a33] bg-[#1c2028] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex items-center justify-between shadow-[0_-8px_20px_rgba(10,14,22,0.35)]">
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 text-[#908fa0] hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveDrawer}
              disabled={saveLoading}
              className="px-6 py-2 rounded-lg bg-[#8083ff] text-[#0d0096] font-bold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-md"
            >
              <span className="material-symbols-outlined text-base">
                {saveLoading ? 'refresh' : 'save'}
              </span>
              <span>{saveLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </div>
        </aside>
      ), document.body)}

      {/* Sync Toast */}
      {syncToast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#262a33] text-white shadow-2xl border border-[#31353e] animate-in fade-in">
          <div className="w-8 h-8 rounded-lg bg-[#009eb9] flex items-center justify-center text-[#002f38]">
            <span className="material-symbols-outlined text-[18px]">cloud_done</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white">Synchronisation indisponible</div>
            <div className="font-mono text-[11px] text-[#4cd7f6]">Backend non connecte : aucun bucket synchronise.</div>
          </div>
        </div>
      )}
    </div>
  );
};
