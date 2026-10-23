/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminLayout } from './components/AdminLayout.tsx';
import { INITIAL_PROMOS, OrderRecord } from './data/mock-data.ts';
const HomeView = lazy(() => import('./views/HomeView.tsx').then((module) => ({ default: module.HomeView })));
const CatalogView = lazy(() => import('./views/CatalogView.tsx').then((module) => ({ default: module.CatalogView })));
const ProductDetailView = lazy(() => import('./views/ProductDetailView.tsx').then((module) => ({ default: module.ProductDetailView })));
const CheckoutView = lazy(() => import('./views/CheckoutView.tsx').then((module) => ({ default: module.CheckoutView })));
const OrderSuccessView = lazy(() => import('./views/OrderSuccessView.tsx').then((module) => ({ default: module.OrderSuccessView })));
const LearningDashboardView = lazy(() => import('./views/LearningDashboardView.tsx').then((module) => ({ default: module.LearningDashboardView })));
const CourseOverviewView = lazy(() => import('./views/CourseOverviewView.tsx').then((module) => ({ default: module.CourseOverviewView })));
const CourseReaderView = lazy(() => import('./views/CourseReaderView.tsx').then((module) => ({ default: module.CourseReaderView })));
const AdminDashboardView = lazy(() => import('./views/AdminDashboardView.tsx').then((module) => ({ default: module.AdminDashboardView })));
const AdminProductsView = lazy(() => import('./views/AdminProductsView.tsx').then((module) => ({ default: module.AdminProductsView })));
const AdminPromosView = lazy(() => import('./views/AdminPromosView.tsx').then((module) => ({ default: module.AdminPromosView })));
const AdminCoursesView = lazy(() => import('./views/AdminCoursesView.tsx').then((module) => ({ default: module.AdminCoursesView })));
import { Product, CartItem, PromoCode } from './utils/shop-logic.ts';
import { isSupabaseConfigured, supabase } from './lib/supabase.ts';

const courseCategories = new Set(['ai_automation', 'web_development', 'design_visual', 'digital_marketing', 'video_content', 'productivity', 'data_bi', 'cybersecurity', 'entrepreneurship', 'career']);

export default function App() {
  const [currentView, setCurrentView] = useState<string>('accueil');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>(INITIAL_PROMOS);
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'XAF'>('EUR');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(!supabase);
  const navigateRef = useRef<(view: string, productId?: string) => void>(() => undefined);
  const [latestOrder, setLatestOrder] = useState<OrderRecord | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartToast, setCartToast] = useState<{ message: string; kind: 'added' | 'removed' } | null>(null);

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setProductsError('Le catalogue est momentanément indisponible. La connexion à la base de données doit être configurée.');
        setProductsLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('public_course_catalogue');
      if (!active) return;
      if (error) {
        setProductsError('Impossible de charger le catalogue. Réessayez dans quelques instants.');
      } else {
        const categoryLabels: Record<string, string> = {
          ai_automation: 'Intelligence artificielle', web_development: 'Développement web',
          design_visual: 'Design & UI/UX', digital_marketing: 'Marketing digital',
          video_content: 'Vidéo & création de contenu', productivity: 'Bureautique & productivité',
          data_bi: 'Data & Business Intelligence', cybersecurity: 'Cybersécurité',
          entrepreneurship: 'Entrepreneuriat & finances', career: 'Carrière numérique',
        };
        setProducts((data ?? []).map((row: any): Product => ({
          id: row.id,
          sku: row.code,
          title: row.title,
          subtitle: row.subtitle || (row.status === 'published' ? '' : 'Formation en préparation'),
          category: row.category,
          categoryLabel: categoryLabels[row.category] ?? row.category,
          priceEur: Number(row.price_eur ?? 0),
          rating: 0,
          reviewCount: 0,
          image: row.cover_image_url || '/assets/images/logo.png',
          badge: row.status === 'published' ? undefined : 'En préparation',
          deliveryType: 'video',
          formatLabel: row.level ? `${({ beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', all_levels: 'Tous niveaux' } as Record<string, string>)[row.level] ?? row.level}${row.estimated_minutes ? ` · ${Math.round(row.estimated_minutes / 60)} h` : ''}` : 'Formation',
          fileSize: '',
          tags: [],
          techStack: [],
          description: row.short_description || '',
          isDraft: false,
          isAvailable: false,
          courseStatus: row.status,
        })));
        setProductsError('');
      }
      setProductsLoading(false);
    };
    void loadProducts();
    return () => { active = false; };
  }, []);

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

  navigateRef.current = handleNavigate;

  useEffect(() => {
    if (!supabase) { setAuthResolved(true); return; }
    const client = supabase;
    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAuthRole(null);
        setAuthResolved(true);
        return;
      }
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;

      // Query after the auth callback returns to avoid blocking Supabase's auth lock.
      queueMicrotask(async () => {
        const { data: profile, error } = await client
          .from('profiles').select('role').eq('id', session.user.id).maybeSingle();
        if (!active) return;
        const role = error ? null : profile?.role || null;
        setAuthRole(role);
        setAuthResolved(true);
        if (event === 'SIGNED_IN') {
          navigateRef.current(role === 'admin' ? 'admin-dashboard' : 'mon-espace-client');
        }
      });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    window.history.replaceState({ currentView, selectedProductId, catalogCategory }, '', window.location.href);
    const restoreNavigation = (event: PopStateEvent) => {
      const destination = event.state as { currentView?: string; selectedProductId?: string; catalogCategory?: string } | null;
      setCurrentView(destination?.currentView || 'accueil');
      setSelectedProductId(destination?.selectedProductId || '');
      setCatalogCategory(destination?.catalogCategory || 'all');
    };
    window.addEventListener('popstate', restoreNavigation);
    return () => window.removeEventListener('popstate', restoreNavigation);
  }, []);

  const handleAddToCart = (product: Product, licenseTier: 'standard' | 'agency' = 'standard') => {
    const price = licenseTier === 'standard' ? product.priceEur : product.agencyPriceEur;
    if (price == null) return;
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
    setOrders((previous) => [order, ...previous]);
    setCartItems([]);
  };

  const handleUpdateProduct = (updated: Product) => setProducts((previous) => previous.map((product) => product.id === updated.id ? updated : product));
  const handleCreateProduct = (created: Product) => setProducts((previous) => [created, ...previous]);
  const handleCreatePromo = (created: PromoCode) => setPromos((previous) => [created, ...previous]);
  const handleTogglePromo = (code: string) => setPromos((previous) => previous.map((promo) => promo.code === code ? { ...promo, active: !promo.active } : promo));

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const isAdminView =
    currentView === 'admin-dashboard' ||
    currentView === 'admin-produits' ||
    currentView === 'admin-promos' ||
    currentView === 'admin-formations';

  useEffect(() => {
    if (isAdminView && authResolved && authRole !== 'admin') {
      navigateRef.current('mon-espace-client');
    }
  }, [isAdminView, authResolved, authRole]);

  if (isAdminView && (!authResolved || authRole !== 'admin')) {
    return <div role="status" className="min-h-screen bg-[#0f131c] px-4 py-20 text-center text-sm text-[#c7c4d7]">Vérification de l’accès…</div>;
  }

  // Render Admin views inside AdminLayout
  if (isAdminView) {
    return (
      <AdminLayout currentView={currentView} onNavigate={handleNavigate}>
        <Suspense fallback={<div className="p-8 text-sm text-[#c7c4d7]" role="status">Chargement de la vue...</div>}>
        {currentView === 'admin-dashboard' && (
          <AdminDashboardView onNavigate={handleNavigate} />
        )}
        {currentView === 'admin-produits' && (
          <AdminProductsView products={products} onUpdateProduct={handleUpdateProduct} onCreateProduct={handleCreateProduct} onNavigate={handleNavigate} />
        )}
        {currentView === 'admin-promos' && (
          <AdminPromosView promos={promos} onCreatePromo={handleCreatePromo} onTogglePromo={handleTogglePromo} onNavigate={handleNavigate} />
        )}
        {currentView === 'admin-formations' && <AdminCoursesView />}
      </Suspense>
      </AdminLayout>
    );
  }

  // Render Public / Storefront views
  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] flex flex-col justify-between selection:bg-[#8083ff] selection:text-[#0d0096]">
      <Navbar
        currentView={currentView}
        isAdmin={authRole === 'admin'}
        onNavigate={handleNavigate}
        currency={currency}
        onCurrencyChange={setCurrency}
        cartCount={cartItems.reduce((total, item) => total + (item.quantity || 1), 0)}
        products={products.filter((product) => !product.isDraft)}
      />

      <main className="w-full pt-20 flex-1 bg-[#0f131c]">
        <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-16 text-sm text-[#c7c4d7]" role="status">Chargement de la page...</div>}>
        <div key={`${currentView}-${currentView === 'produit' ? selectedProductId : ''}`} className="page-transition">
        {productsLoading && <div role="status" className="mx-auto max-w-7xl px-4 py-3 text-sm text-[#c7c4d7]">Chargement du catalogue Nova Digital…</div>}
        {productsError && <div role="alert" className="mx-auto max-w-7xl px-4 py-3 text-sm text-amber-100">{productsError}</div>}
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
          selectedProduct && (courseCategories.has(selectedProduct.category) ? <CourseOverviewView product={selectedProduct} canPreviewDrafts={authRole === 'admin'} onNavigate={handleNavigate} /> : <ProductDetailView
            product={selectedProduct}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            currency={currency}
          />)
        )}

        {currentView === 'lecteur' && <CourseReaderView courseId={selectedProductId} onNavigate={handleNavigate} />}

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

        {currentView === 'confirmation' && (latestOrder ? <OrderSuccessView order={latestOrder} onNavigate={handleNavigate} /> : (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
              <h1 className="text-xl font-bold text-white">Vérification de paiement requise</h1>
              <p className="mt-2 text-sm text-[#c7c4d7]">La confirmation de commande s’affichera après vérification du paiement par le serveur.</p>
              <button type="button" onClick={() => handleNavigate('catalogue')} className="mt-5 min-h-11 rounded-xl bg-[#8083ff] px-5 text-sm font-semibold text-[#0d0096]">Voir le catalogue</button>
            </div>
          ))}

        {currentView === 'mon-espace-client' && (
          <LearningDashboardView onNavigate={handleNavigate} />
        )}
        </div>
        </Suspense>
      </main>

      <Footer onNavigate={handleNavigate} />
      {cartToast && <div role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-[#4cd7f6]/40 bg-[#181c24] p-4 text-[#dfe2ee] shadow-2xl sm:bottom-6 sm:left-auto sm:right-6"><span className="material-symbols-outlined mt-0.5 text-[#4cd7f6]">{cartToast.kind === 'added' ? 'check_circle' : 'remove_shopping_cart'}</span><span className="min-w-0 flex-1 text-sm"><strong className="block">{cartToast.kind === 'added' ? 'Ajoute au panier !' : 'Retire du panier'}</strong><span className="mt-1 block text-xs text-[#c7c4d7]">{cartToast.message}</span></span><button type="button" aria-label="Fermer la notification" onClick={() => setCartToast(null)} className="text-[#908fa0] hover:text-white"><span className="material-symbols-outlined">close</span></button></div>}
    </div>
  );
}
