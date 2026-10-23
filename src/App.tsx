/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminLayout } from './components/AdminLayout.tsx';
import { HomeView } from './views/HomeView.tsx';
import { CatalogView } from './views/CatalogView.tsx';
import { ProductDetailView } from './views/ProductDetailView.tsx';
import { CheckoutView } from './views/CheckoutView.tsx';
import { OrderSuccessView } from './views/OrderSuccessView.tsx';
import { ClientDashboardView } from './views/ClientDashboardView.tsx';
import { AdminDashboardView } from './views/AdminDashboardView.tsx';
import { AdminProductsView } from './views/AdminProductsView.tsx';
import { AdminPromosView } from './views/AdminPromosView.tsx';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_PROMOS,
  OrderRecord,
} from './data/mock-data.ts';
import { Product, CartItem, PromoCode } from './utils/shop-logic.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('accueil');
  const [selectedProductId, setSelectedProductId] = useState<string>('nexus-saas');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [promos, setPromos] = useState<PromoCode[]>(INITIAL_PROMOS);
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'XAF'>('EUR');
  const [latestOrder, setLatestOrder] = useState<OrderRecord>(INITIAL_ORDERS[0]);

  // Initial cart with Nexus SaaS and Solopreneur Ebook as seen in Image_8
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      product: INITIAL_PRODUCTS[0],
      licenseTier: 'standard',
      priceEur: 69,
    },
    {
      product: INITIAL_PRODUCTS[3],
      licenseTier: 'standard',
      priceEur: 29,
    },
  ]);

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProductId]);

  const handleNavigate = (view: string, productId?: string) => {
    if (productId) {
      setSelectedProductId(productId);
    }
    if (view === 'catalogue-templates') {
      setCurrentView('catalogue');
    } else if (view === 'catalogue-formations') {
      setCurrentView('catalogue');
    } else if (view === 'offres-speciales') {
      setCurrentView('accueil');
      setTimeout(() => {
        document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setCurrentView(view);
    }
  };

  const handleAddToCart = (product: Product, licenseTier: 'standard' | 'agency' = 'standard') => {
    const price = licenseTier === 'standard' ? product.priceEur : 179;
    setCartItems((prev) => [...prev, { product, licenseTier, priceEur: price }]);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

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
        cartCount={cartItems.length}
      />

      <main className="w-full pt-20 flex-1 bg-[#0f131c]">
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

        {currentView === 'confirmation' && (
          <OrderSuccessView
            order={latestOrder}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'mon-espace-client' && (
          <ClientDashboardView
            orders={orders}
            onNavigate={handleNavigate}
            currency={currency}
          />
        )}
        </div>
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
