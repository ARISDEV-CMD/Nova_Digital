/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminLayout } from './components/AdminLayout.tsx';
import { PageSkeleton } from './components/feedback/Skeleton.tsx';
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
const PrivacyPolicyView = lazy(() => import('./views/PrivacyPolicyView.tsx').then((module) => ({ default: module.PrivacyPolicyView })));
import { Product, CartItem, PromoCode } from './utils/shop-logic.ts';
import { isSupabaseConfigured, supabase } from './lib/supabase.ts';
import { getAppSession } from './lib/auth-client.ts';
import {
  applyPageMetadata,
  findProductBySlug,
  getPageMetadata,
  getPathForNavigation,
  getProductSlug,
  parseAppRoute,
} from './lib/routing.ts';

const courseCategories = new Set(['ai_automation', 'web_development', 'design_visual', 'digital_marketing', 'video_content', 'productivity', 'data_bi', 'cybersecurity', 'entrepreneurship', 'career']);

export default function App() {
  const [currentView, setCurrentView] = useState<string>(() => parseAppRoute(window.location.pathname).view);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [routeProductSlug, setRouteProductSlug] = useState<string>(() => parseAppRoute(window.location.pathname).productSlug);
  const [locationPathname, setLocationPathname] = useState<string>(() => window.location.pathname);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>(INITIAL_PROMOS);
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'XAF'>('EUR');
  const [catalogCategory, setCatalogCategory] = useState<string>(() => parseAppRoute(window.location.pathname).catalogCategory);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
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
          design_visual: 'Design graphique', digital_marketing: 'Marketing digital',
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
          isDraft: row.status !== 'published',
          isAvailable: row.status === 'published' && Number(row.price_eur ?? 0) > 0,
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
  }, [currentView, selectedProductId, locationPathname]);

  const handleNavigate = (view: string, productId?: string) => {
    const categoryRoutePrefix = 'catalogue-categorie-';
    const requestedCategory = view.startsWith(categoryRoutePrefix) ? view.slice(categoryRoutePrefix.length) : null;
    const nextView = view.startsWith('catalogue-') || view === 'catalogue' ? 'catalogue' : view;
    const nextCategory = requestedCategory || (view === 'catalogue-templates' ? 'boilerplates' : view === 'catalogue-formations' ? 'formations' : view === 'catalogue' ? 'all' : catalogCategory);
    const isProductRoute = view === 'produit' || view === 'lecteur';
    const nextProductId = isProductRoute ? (productId || selectedProductId) : '';
    const nextProduct = isProductRoute ? products.find((product) => product.id === nextProductId) : undefined;
    const nextProductSlug = isProductRoute ? (nextProduct ? getProductSlug(nextProduct, products) : nextProductId) : '';
    const nextPath = getPathForNavigation(view, nextProductId, nextProduct, nextCategory, nextProductSlug);

    window.history.pushState({ currentView: nextView, selectedProductId: nextProductId, catalogCategory: nextCategory }, '', nextPath);
    setCurrentView(nextView);
    setCatalogCategory(nextCategory);
    setSelectedProductId(nextProductId);
    setRouteProductSlug(nextProductSlug);
    setLocationPathname(nextPath);
  };

  navigateRef.current = handleNavigate;

  useEffect(() => {
    let active = true;
    getAppSession().then((session) => {
      if (!active) return;
      const role = session?.user.role || null;
      setAuthRole(role);
      setAuthResolved(true);
      const params = new URLSearchParams(window.location.search);
      const callbackView = params.get('auth_view');
      const callbackCourse = params.get('auth_course') || undefined;
      if (session && callbackView) {
        params.delete('auth_view');
        params.delete('auth_course');
        const cleanUrl = `${window.location.pathname}${params.size ? `?${params}` : ''}${window.location.hash}`;
        window.history.replaceState(window.history.state, '', cleanUrl);
        navigateRef.current(callbackView, callbackCourse);
      }
    }).catch(() => {
      if (!active) return;
      setAuthRole(null);
      setAuthResolved(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    window.history.replaceState({ currentView, selectedProductId, catalogCategory }, '', window.location.href);
    const restoreNavigation = () => {
      const destination = parseAppRoute(window.location.pathname);
      setCurrentView(destination.view);
      setSelectedProductId('');
      setRouteProductSlug(destination.productSlug);
      setCatalogCategory(destination.catalogCategory);
      setLocationPathname(window.location.pathname);
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
    setCartToast({ message: `${product.title} a été ajouté au panier.`, kind: 'added' });
  };

  const handleRemoveFromCart = (index: number) => {
    const item = cartItems[index];
    setCartItems((prev) => prev.filter((_, i) => i !== index));
    if (item) setCartToast({ message: `${item.product.title} a été retiré du panier.`, kind: 'removed' });
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

  const selectedProduct = routeProductSlug
    ? findProductBySlug(products, routeProductSlug)
    : products.find((product) => product.id === selectedProductId);

  useEffect(() => {
    if (!routeProductSlug) return;
    const product = findProductBySlug(products, routeProductSlug);
    if (product && product.id !== selectedProductId) setSelectedProductId(product.id);
    if (!product && !productsLoading && currentView !== 'not-found') setCurrentView('not-found');
  }, [currentView, products, productsLoading, routeProductSlug, selectedProductId]);

  useEffect(() => {
    applyPageMetadata(getPageMetadata(currentView, selectedProduct, catalogCategory), locationPathname);
  }, [catalogCategory, currentView, locationPathname, selectedProduct]);

  useEffect(() => {
    if (currentView !== 'offres-speciales') return;
    const timer = window.setTimeout(() => document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' }), 250);
    return () => window.clearTimeout(timer);
  }, [currentView, locationPathname]);

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
        <Suspense fallback={<PageSkeleton label="Chargement de la console" />}>
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
        <Suspense fallback={<PageSkeleton />}>
        <div key={`${currentView}-${currentView === 'produit' ? selectedProductId : ''}`} className="page-transition">
        {productsError && <div role="alert" className="mx-auto max-w-7xl px-4 py-3 text-sm text-amber-100">{productsError}</div>}
        {(currentView === 'accueil' || currentView === 'offres-speciales') && (
          <HomeView
            products={products}
            loading={productsLoading}
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
            loading={productsLoading}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            currency={currency}
          />
        )}

        {(currentView === 'produit' || currentView === 'lecteur') && productsLoading && !selectedProduct && <PageSkeleton label="Chargement de la formation" />}
        {currentView === 'produit' && (
          selectedProduct && (courseCategories.has(selectedProduct.category) ? <CourseOverviewView product={selectedProduct} canPreviewDrafts={authRole === 'admin'} onNavigate={handleNavigate} /> : <ProductDetailView
            product={selectedProduct}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            currency={currency}
          />)
        )}

        {currentView === 'lecteur' && selectedProduct && <CourseReaderView courseId={selectedProduct.id} onNavigate={handleNavigate} />}

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
        {currentView === 'politique-confidentialite' && <PrivacyPolicyView />}
        {currentView === 'not-found' && (
          <section className="mx-auto max-w-3xl px-4 py-24 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#4cd7f6]">Erreur 404</p>
            <h1 className="mt-3 text-3xl font-bold text-white">Cette page est introuvable</h1>
            <p className="mt-3 text-sm text-[#a9afbf]">Le lien est peut-être incorrect ou la page a été déplacée.</p>
            <button type="button" onClick={() => handleNavigate('catalogue')} className="mt-6 min-h-11 rounded-lg bg-[#8083ff] px-5 text-sm font-semibold text-[#0d1020]">Parcourir le catalogue</button>
          </section>
        )}
        </div>
        </Suspense>
      </main>

      <Footer onNavigate={handleNavigate} />
      {cartToast && <div role="status" aria-live="polite" className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-[#4cd7f6]/40 bg-[#181c24] p-4 text-[#dfe2ee] shadow-2xl sm:bottom-6 sm:left-auto sm:right-6"><span className="material-symbols-outlined mt-0.5 text-[#4cd7f6]">{cartToast.kind === 'added' ? 'check_circle' : 'remove_shopping_cart'}</span><span className="min-w-0 flex-1 text-sm"><strong className="block">{cartToast.kind === 'added' ? 'Ajouté au panier !' : 'Retiré du panier'}</strong><span className="mt-1 block text-xs text-[#c7c4d7]">{cartToast.message}</span></span><button type="button" aria-label="Fermer la notification" onClick={() => setCartToast(null)} className="text-[#908fa0] hover:text-white"><span className="material-symbols-outlined">close</span></button></div>}
    </div>
  );
}
