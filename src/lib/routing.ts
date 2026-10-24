import type { Product } from '../utils/shop-logic.ts';

export type AppRoute = {
  view: string;
  productSlug: string;
  catalogCategory: string;
};

const courseCategories = new Set([
  'ai_automation',
  'web_development',
  'design_visual',
  'digital_marketing',
  'video_content',
  'productivity',
  'data_bi',
  'cybersecurity',
  'entrepreneurship',
  'career',
]);

const categoryLabels: Record<string, string> = {
  all: 'Tous les produits',
  boilerplates: 'Templates',
  ui: 'Kits d’interface',
  formations: 'Formations numériques',
  ebooks: 'Livres numériques',
  presets: 'Presets créatifs',
  ai_automation: 'Intelligence artificielle',
  web_development: 'Développement web',
  design_visual: 'Design graphique',
  digital_marketing: 'Marketing digital',
  video_content: 'Vidéo et création de contenu',
  productivity: 'Bureautique et productivité',
  data_bi: 'Data et Business Intelligence',
  cybersecurity: 'Cybersécurité',
  entrepreneurship: 'Entrepreneuriat et finances',
  career: 'Carrière numérique',
};

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/&/g, ' et ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProductSlug(product: Product, products: Product[] = []): string {
  const titleSlug = slugify(product.title) || slugify(product.sku) || slugify(product.id);
  const duplicateTitle = products.some((candidate) => candidate.id !== product.id && slugify(candidate.title) === titleSlug);
  if (!duplicateTitle) return titleSlug;
  const idSuffix = slugify(product.id).replace(/-/g, '').slice(-8);
  return `${titleSlug}-${idSuffix}`;
}

export function findProductBySlug(products: Product[], slug: string): Product | undefined {
  const normalizedSlug = slugify(slug);
  return products.find((product) => getProductSlug(product, products) === normalizedSlug)
    || products.find((product) => slugify(product.id) === normalizedSlug || slugify(product.sku) === normalizedSlug);
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function parseAppRoute(pathname: string): AppRoute {
  const normalizedPath = `/${pathname.split('/').filter(Boolean).map(decodePathSegment).join('/')}`;
  const segments = normalizedPath.split('/').filter(Boolean);

  if (segments.length === 0) return { view: 'accueil', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/catalogue') return { view: 'catalogue', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/catalogue/formations') return { view: 'catalogue', productSlug: '', catalogCategory: 'formations' };
  if (normalizedPath === '/catalogue/templates') return { view: 'catalogue', productSlug: '', catalogCategory: 'boilerplates' };
  if (normalizedPath === '/politique-de-confidentialite') return { view: 'politique-confidentialite', productSlug: '', catalogCategory: 'all' };

  if (segments[0] === 'catalogue' && segments[1] === 'categorie' && segments[2]) {
    return { view: 'catalogue', productSlug: '', catalogCategory: segments[2].replace(/-/g, '_') };
  }

  if (segments[0] === 'formation' && segments[1]) {
    const isReaderPath = segments.length === 3 && segments[2] === 'apprendre';
    const isOverviewPath = segments.length === 2;
    return {
      view: isReaderPath ? 'lecteur' : isOverviewPath ? 'produit' : 'not-found',
      productSlug: segments[1],
      catalogCategory: 'all',
    };
  }

  if (segments[0] === 'produit' && segments[1] && segments.length === 2) {
    return { view: 'produit', productSlug: segments[1], catalogCategory: 'all' };
  }

  if (normalizedPath === '/offres-speciales') return { view: 'offres-speciales', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/panier') return { view: 'checkout', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/commande/confirmation') return { view: 'confirmation', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/espace-client') return { view: 'mon-espace-client', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/admin') return { view: 'admin-dashboard', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/admin/produits') return { view: 'admin-produits', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/admin/codes-promo') return { view: 'admin-promos', productSlug: '', catalogCategory: 'all' };
  if (normalizedPath === '/admin/formations') return { view: 'admin-formations', productSlug: '', catalogCategory: 'all' };

  return { view: 'not-found', productSlug: '', catalogCategory: 'all' };
}

export function getPathForNavigation(
  requestedView: string,
  productId: string,
  product: Product | undefined,
  catalogCategory: string,
  productSlug?: string,
): string {
  const categoryPrefix = 'catalogue-categorie-';
  if (requestedView.startsWith(categoryPrefix)) {
    const category = requestedView.slice(categoryPrefix.length);
    if (category === 'formations') return '/catalogue/formations';
    if (category === 'boilerplates') return '/catalogue/templates';
    return `/catalogue/categorie/${slugify(category)}`;
  }
  if (requestedView === 'catalogue-templates') return '/catalogue/templates';
  if (requestedView === 'catalogue-formations') return '/catalogue/formations';

  if (requestedView === 'catalogue') {
    if (catalogCategory === 'formations') return '/catalogue/formations';
    if (catalogCategory === 'boilerplates') return '/catalogue/templates';
    if (catalogCategory !== 'all') return `/catalogue/categorie/${slugify(catalogCategory)}`;
    return '/catalogue';
  }

  if (requestedView === 'produit' || requestedView === 'lecteur') {
    const slug = productSlug || (product ? getProductSlug(product) : slugify(productId));
    const isCourse = product ? courseCategories.has(product.category) : true;
    if (requestedView === 'lecteur') return `/formation/${slug || 'formation'}/apprendre`;
    return isCourse ? `/formation/${slug || 'formation'}` : `/produit/${slug || 'produit'}`;
  }

  const paths: Record<string, string> = {
    accueil: '/',
    'politique-confidentialite': '/politique-de-confidentialite',
    'offres-speciales': '/offres-speciales',
    checkout: '/panier',
    confirmation: '/commande/confirmation',
    'mon-espace-client': '/espace-client',
    'admin-dashboard': '/admin',
    'admin-produits': '/admin/produits',
    'admin-promos': '/admin/codes-promo',
    'admin-formations': '/admin/formations',
  };

  return paths[requestedView] || '/';
}

export type PageMetadata = { title: string; description: string; robots: string; image?: string };

export function getPageMetadata(view: string, product: Product | undefined, catalogCategory: string): PageMetadata {
  if (view === 'politique-confidentialite') {
    return {
      title: 'Politique de confidentialité | NovaDigital',
      description: 'Découvrez comment NovaDigital traite et protège vos données personnelles et les données utilisées pour la connexion Google.',
      robots: 'index,follow',
    };
  }

  if (view === 'accueil' || view === 'offres-speciales') {
    const offers = view === 'offres-speciales';
    return {
      title: offers ? 'Offres spéciales | NovaDigital' : 'NovaDigital — Formations et ressources numériques',
      description: offers
        ? 'Découvrez les offres et packs numériques de NovaDigital.'
        : 'Développez vos compétences numériques avec des formations pratiques, des ressources et des outils conçus pour vos projets.',
      robots: 'index,follow',
    };
  }

  if (view === 'catalogue') {
    const label = categoryLabels[catalogCategory] || categoryLabels[catalogCategory.replace(/-/g, '_')] || 'Catalogue';
    const isAll = catalogCategory === 'all';
    return {
      title: isAll ? 'Catalogue numérique | NovaDigital' : `${label} | NovaDigital`,
      description: isAll
        ? 'Parcourez le catalogue NovaDigital : formations numériques, ressources et outils pour développer vos compétences et vos projets.'
        : `Découvrez les ${label.toLocaleLowerCase('fr-FR')} proposés dans le catalogue NovaDigital.`,
      robots: 'index,follow',
    };
  }

  if (view === 'produit' || view === 'lecteur') {
    if (!product) {
      return {
        title: 'Formation numérique | NovaDigital',
        description: 'Découvrez le programme et les contenus de cette formation numérique.',
        robots: view === 'lecteur' ? 'noindex,nofollow' : 'index,follow',
      };
    }
    return {
      title: `${product.title}${view === 'lecteur' ? ' — Lecteur' : ''} | NovaDigital`,
      description: (product.description || product.subtitle || `Découvrez ${product.title}, une ressource numérique NovaDigital.`).slice(0, 300),
      robots: view === 'lecteur' ? 'noindex,nofollow' : 'index,follow',
      image: product.image,
    };
  }

  const privatePages: Record<string, string> = {
    checkout: 'Panier | NovaDigital',
    confirmation: 'Confirmation de commande | NovaDigital',
    'mon-espace-client': 'Espace client | NovaDigital',
    'admin-dashboard': 'Administration | NovaDigital',
    'admin-produits': 'Gestion des produits | NovaDigital',
    'admin-promos': 'Codes promotionnels | NovaDigital',
    'admin-formations': 'Gestion des formations | NovaDigital',
    'not-found': 'Page introuvable | NovaDigital',
  };

  return {
    title: privatePages[view] || 'NovaDigital — Formations et ressources numériques',
    description: 'NovaDigital : formations et ressources numériques.',
    robots: 'noindex,nofollow',
  };
}

export function applyPageMetadata(metadata: PageMetadata, pathname: string): void {
  document.title = metadata.title;

  const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
    let element = document.head.querySelector<HTMLMetaElement>(selector);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.content = content;
  };

  setMeta('meta[name="description"]', 'name', 'description', metadata.description);
  setMeta('meta[name="robots"]', 'name', 'robots', metadata.robots);
  setMeta('meta[property="og:title"]', 'property', 'og:title', metadata.title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', metadata.description);
  setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
  setMeta('meta[property="og:url"]', 'property', 'og:url', new URL(pathname, window.location.origin).href);
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'NovaDigital');
  setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'fr_FR');
  const imageUrl = new URL(metadata.image || '/assets/images/logo.png', window.location.origin).href;
  setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', metadata.title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', metadata.description);
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = new URL(pathname, window.location.origin).href;
}
