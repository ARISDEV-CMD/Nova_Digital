/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  sku: string;
  title: string;
  subtitle: string;
  category: 'boilerplates' | 'ui' | 'formations' | 'ebooks' | 'presets'
    | 'ai_automation' | 'web_development' | 'design_visual' | 'digital_marketing'
    | 'video_content' | 'productivity' | 'data_bi' | 'cybersecurity'
    | 'entrepreneurship' | 'career';
  categoryLabel: string;
  priceEur: number;
  agencyPriceEur?: number;
  oldPriceEur?: number;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: string;
  deliveryType: 'instant' | 'github' | 'video' | 'book';
  formatLabel: string;
  fileSize: string;
  tags: string[];
  techStack: string[];
  description: string;
  githubRepo?: string;
  isDraft?: boolean;
  isAvailable?: boolean;
  courseStatus?: string;
}

export interface CartItem {
  product: Product;
  licenseTier: 'standard' | 'agency';
  priceEur: number;
  quantity?: number;
}

export interface PromoCode {
  code: string;
  description: string;
  type: 'percent' | 'fixed';
  value: number; // e.g. 10 for 10% or 25 for 25€
  minSpendEur: number;
  categoryEligible?: string;
  usageCount: number;
  maxUsage: number;
  active: boolean;
  expiresIn?: string;
}

export const EUR_TO_XAF_RATE = 655.957;
export const EUR_TO_USD_RATE = 1.08;

export function formatPriceEur(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} €`;
}

export function formatPriceXaf(amountEur: number): string {
  const xaf = Math.round(amountEur * EUR_TO_XAF_RATE);
  return `${xaf.toLocaleString('fr-FR')} FCFA`;
}

export function formatPriceUsd(amountEur: number): string {
  const usd = Math.round(amountEur * EUR_TO_USD_RATE);
  return `$ ${usd.toLocaleString('en-US')}`;
}

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.priceEur * (item.quantity || 1), 0);
}

export function validatePromoCode(
  code: string,
  subtotal: number,
  promos: PromoCode[]
): { valid: boolean; discount: number; message: string; promo?: PromoCode } {
  const normalized = code.trim().toUpperCase();
  const found = promos.find((p) => p.code.toUpperCase() === normalized && p.active);

  if (!found) {
    return { valid: false, discount: 0, message: 'Code promo inexistant ou expiré.' };
  }

  if (found.usageCount >= found.maxUsage) {
    return { valid: false, discount: 0, message: 'Ce code promo a atteint son quota maximal.' };
  }

  if (subtotal < found.minSpendEur) {
    return {
      valid: false,
      discount: 0,
      message: `Panier minimum de ${found.minSpendEur} € requis pour ce code.`,
    };
  }

  let discount = 0;
  if (found.type === 'percent') {
    discount = Math.round((subtotal * found.value) / 100);
  } else {
    discount = found.value;
  }

  // Discount cannot exceed subtotal
  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    discount,
    message: `Code ${found.code} activé (-${discount} € offerts)`,
    promo: found,
  };
}

export function generateLicenseKey(prefix = 'NOVA'): string {
  const segments = [
    prefix,
    Math.random().toString(36).substring(2, 6).toUpperCase(),
    Math.random().toString(36).substring(2, 6).toUpperCase(),
    Math.random().toString(36).substring(2, 6).toUpperCase(),
    'AUTH',
  ];
  return segments.join('-');
}

export function generateHmacMockToken(orderId: string, sku: string): string {
  const raw = `${orderId}:${sku}:${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `live_hmac_${Math.abs(hash).toString(16).padStart(12, '0')}`;
}

export function filterCatalogProducts(
  products: Product[],
  options: {
    search?: string;
    category?: string;
    maxPrice?: number;
    minRating?: number;
    format?: string;
    deliveryType?: Product['deliveryType'];
    sort?: 'price-asc' | 'price-desc';
  }
): Product[] {
  let list = products.filter((p) => !p.isDraft);

  if (options.search && options.search.trim() !== '') {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.techStack.some((ts) => ts.toLowerCase().includes(q))
    );
  }

  if (options.category && options.category !== 'all') {
    list = list.filter((p) => options.category === 'formations'
      ? p.category === 'formations' || [
        'ai_automation', 'web_development', 'design_visual', 'digital_marketing',
        'video_content', 'productivity', 'data_bi', 'cybersecurity',
        'entrepreneurship', 'career',
      ].includes(p.category)
      : p.category === options.category);
  }

  if (typeof options.maxPrice === 'number') {
    list = list.filter((p) => p.priceEur <= options.maxPrice!);
  }

  if (options.deliveryType) list = list.filter((p) => p.deliveryType === options.deliveryType);

  if (options.sort) {
    switch (options.sort) {
      case 'price-asc':
        list.sort((a, b) => a.priceEur - b.priceEur);
        break;
      case 'price-desc':
        list.sort((a, b) => b.priceEur - a.priceEur);
        break;
      default:
        break;
    }
  }

  return list;
}
