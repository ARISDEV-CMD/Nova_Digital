/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminLayout } from './components/AdminLayout.tsx';
const HomeView = lazy(() => import('./views/HomeView.tsx').then((module) => ({ default: module.HomeView })));
const CatalogView = lazy(() => import('./views/CatalogView.tsx').then((module) => ({ default: module.CatalogView })));
const ProductDetailView = lazy(() => import('./views/ProductDetailView.tsx').then((module) => ({ default: module.ProductDetailView })));
const CheckoutView = lazy(() => import('./views/CheckoutView.tsx').then((module) => ({ default: module.CheckoutView })));
const OrderSuccessView = lazy(() => import('./views/OrderSuccessView.tsx').then((module) => ({ default: module.OrderSuccessView })));
const ClientDashboardView = lazy(() => import('./views/ClientDashboardView.tsx').then((module) => ({ default: module.ClientDashboardView })));
const AdminDashboardView = lazy(() => import('./views/AdminDashboardView.tsx').then((module) => ({ default: module.AdminDashboardView })));
const AdminProductsView = lazy(() => import('./views/AdminProductsView.tsx').then((module) => ({ default: module.AdminProductsView })));
const AdminPromosView = lazy(() => import('./views/AdminPromosView.tsx').then((module) => ({ default: module.AdminPromosView })));
import {
  INITIAL_PRODUCTS,
  INITIAL_PROMOS,
  OrderRecord,
} from './data/mock-data.ts';
import { Product, CartItem, PromoCode } from './utils/shop-logic.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('accueil');
  const [selectedProductId, setSelectedProductId] = useState<string>('nexus-saas');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>(INITIAL_PROMOS);
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'XAF'>('EUR');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [latestOrder, setLatestOrder] = useState<OrderRecord | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartToast, setCartToast] = useState<{ message: string; kind: 'added' | 'removed' } | null>(null);

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProductId]);

  const handleNavigate = (view: string, productId?: string) => {
    const nextView = view.startsWith('catalogue-') || view === 'catalogue' ? 'catalogue' : view === 'offres-speciales' ? 'accueil' : view;
    const nextCategory = view === 'catalogue-templates' ? 'boilerplates' : view === 'catalogue-formations' ? 'formations' : view === 'catalogue' ? 'all' : catalogCategory;
    const nextProductId = productId || selectedProductId;
    window.history.pushState({ currentView: nextView, selectedProductId: nextProductId, catalogCategory: nextCategory }, '', window.location.href);
    setCurrentView(nextView);
    setCatalogCategory(nextCategory);
    if (productId) setSelectedProductId(productId);
    if (view === 'offres-speciales') setTimeout(() => document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => {
    window.history.replaceState({ currentView, selectedProductId, catalogCategory }, '', window.location.href);
    const restoreNavigation = (event: PopStateEvent) => {
      const destination = event.state as { currentView?: string; selectedProductId?: string; catalogCategory?: string } | null;
      setCurrentView(destination?.currentView || 'accueil');
      setSelectedProductId(destination?.selectedProductId || 'nexus-saas');
      setCatalogCategory(destination?.catalogCategory || 'all');
    };
    window.addEventListener('popstate', restoreNavigation);
    return () => window.removeEventListener('popstate', restoreNavigation);
  }, []);

  const handleAddToCart = (product: Product, licenseTier: 'standard' | 'agency' = 'standard') => {
    const price = licenseTier === 'standard' ? product.priceEur : 179;
    setCartItems((prev) => {
      const existing = prev.findIndex((item) => item.product.id === product.id && item.licenseTier === licenseTier);
      if (existing < 0) return [...prev, { product, licenseTier, priceEur: price, quantity: 1 }];
      return prev.map((item, index) => index === existing ? { ...item, quantity: (item.quantity || 1) + 1 } : item);
    });
    setCartToast({ message: `${product.title} a ete ajoute au panier.`, kind: 'added' });
  };

  const handleRemoveFromCart = (index: number) => {
    const item = cartItems[index];
    setCartItems((prev) => prev.filter((_, i) => i !== index));
    if (item) setCartToast({ message: `${item.product.title} a ete retire du panier.`, kind: 'removed' });
  };

  useEffect(() => {
    if (!cartToast) return;
    const timer = window.setTimeout(() => setCartToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [cartToast]);

  const handleOrderCompleted = (order: OrderRecord) => {
    setLatestOrder(order);
    setOrders((prev) => [order, ...prev]);
    setCartItems([]); // Clear cart
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleCreateProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleCreatePromo = (newPromo: PromoCode) => {
    setPromos((prev) => [newPromo, ...prev]);
  };

  const handleTogglePromo = (code: string) => {
    setPromos((prev) =>
      prev.map((p) => (p.code === code ? { ...p, active: !p.active } : p))
    );
  };

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const isAdminView =
    currentView === 'admin-dashboard' ||
    currentView === 'admin-produits' ||
    currentView === 'admin-promos';

  // Render Admin views inside AdminLayout
  if (isAdminView) {
    return (
      <AdminLayout currentView={currentView} onNavigate={handleNavigate}>
        <Suspense fallback={<div className="p-8 text-sm text-[#c7c4d7]" role="status">Chargement de la vue...</div>}>
        {currentView === 'admin-dashboard' && (
          <AdminDashboardView onNavigate={handleNavigate} />
        )}
        {currentView === 'admin-produits' && (
          <AdminProductsView
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onCreateProduct={handleCreateProduct}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'admin-promos' && (
          <AdminPromosView
            promos={promos}
            onCreatePromo={handleCreatePromo}
            onTogglePromo={handleTogglePromo}
            onNavigate={handleNavigate}
          />
        )}
      </Suspense>
      </AdminLayout>
    );
  }

  // Render Public / Storefront views
  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] flex flex-col justify-between selection:bg-[#8083ff] selection:text-[#0d0096]">
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currency={currency}
        onCurrencyChange={setCurrency}
        cartCount={cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}
        products={products.filter((product) => !product.isDraft)}
      />

      <main className="w-full pt-20 flex-1 bg-[#0f131c]">
        <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-sm text-[#c7c4d7]" role="status">Chargement de la page...</div>}>
        <div key={`${currentView}-${currentView === 'produit' ? selectedProductId : ''}`} className="page-transition">
        {currentView === 'accueil' && (
          <HomeView
            products={products}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            currency={currency}
          />
        )}

        {currentView === 'catalogue' && (
          <CatalogView
            key={catalogCategory}
            initialCategory={catalogCategory}
            products={products}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            currency={currency}
          />
        )}

        {currentView === 'produit' && (
          <ProductDetailView
            product={selectedProduct}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            currency={currency}
          />
        )}

        {currentView === 'checkout' && (
          <CheckoutView
            cartItems={cartItems}
            onRemoveItem={handleRemoveFromCart}
            promos={promos}
            onOrderCompleted={handleOrderCompleted}
            onNavigate={handleNavigate}
            currency={currency}
          />
        )}

        {currentView === 'confirmation' && (latestOrder ? (
            <OrderSuccessView order={latestOrder} onNavigate={handleNavigate} />
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
              <h1 className="text-xl font-bold text-white">Aucune commande a confirmer</h1>
              <p className="mt-2 text-sm text-[#c7c4d7]">Une commande de demo apparaitra ici apres sa creation depuis le panier.</p>
              <button type="button" onClick={() => handleNavigate('catalogue')} className="mt-5 min-h-11 rounded-xl bg-[#8083ff] px-5 text-sm font-semibold text-[#0d0096]">Voir le catalogue</button>
            </div>
          ) )}

        {currentView === 'mon-espace-client' && (
          <ClientDashboardView
            orders={orders}
            onNavigate={handleNavigate}
            currency={currency}
          />
        )}
        </div>
        </Suspense>
      </main>

      <Footer onNavigate={handleNavigate} />
      {cartToast && <div role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-[#4cd7f6]/40 bg-[#181c24] p-4 text-[#dfe2ee] shadow-2xl sm:bottom-6 sm:left-auto sm:right-6"><span className="material-symbols-outlined mt-0.5 text-[#4cd7f6]">{cartToast.kind === 'added' ? 'check_circle' : 'remove_shopping_cart'}</span><span className="min-w-0 flex-1 text-sm"><strong className="block">{cartToast.kind === 'added' ? 'Ajoute au panier !' : 'Retire du panier'}</strong><span className="mt-1 block text-xs text-[#c7c4d7]">{cartToast.message}</span></span><button type="button" aria-label="Fermer la notification" onClick={() => setCartToast(null)} className="text-[#908fa0] hover:text-white"><span className="material-symbols-outlined">close</span></button></div>}
    </div>
  );
}
