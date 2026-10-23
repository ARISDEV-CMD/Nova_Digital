/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubtotal,
  formatPriceEur,
  formatPriceXaf,
  validatePromoCode,
  generateLicenseKey,
  filterCatalogProducts,
  PromoCode,
  Product,
} from './shop-logic.ts';

const mockPromos: PromoCode[] = [
  {
    code: 'WELCOME10',
    description: 'Bienvenue',
    type: 'fixed',
    value: 10,
    minSpendEur: 0,
    usageCount: 142,
    maxUsage: 500,
    active: true,
  },
  {
    code: 'NOVA20',
    description: 'Promo -20€',
    type: 'fixed',
    value: 20,
    minSpendEur: 50,
    usageCount: 40,
    maxUsage: 100,
    active: true,
  },
  {
    code: 'FOUNDER45',
    description: 'Promo -45%',
    type: 'percent',
    value: 45,
    minSpendEur: 100,
    usageCount: 10,
    maxUsage: 50,
    active: true,
  },
  {
    code: 'EXPIRED100',
    description: 'Expiré',
    type: 'fixed',
    value: 10,
    minSpendEur: 0,
    usageCount: 100,
    maxUsage: 100,
    active: false,
  },
];

const mockProducts: Product[] = [
  {
    id: 'p1',
    sku: 'SKU-1',
    title: 'Nexus SaaS Starter Kit',
    subtitle: 'Next.js 15, Tailwind, Supabase',
    category: 'boilerplates',
    categoryLabel: 'SaaS Boilerplate',
    priceEur: 69,
    rating: 4.95,
    reviewCount: 142,
    image: '',
    deliveryType: 'instant',
    formatLabel: 'Next.js 15',
    fileSize: '34 Mo',
    tags: ['Next.js', 'Supabase'],
    techStack: ['Next.js', 'Stripe'],
    description: 'Full stack starter kit',
  },
  {
    id: 'p2',
    sku: 'SKU-2',
    title: 'Figma UI Kit 2025',
    subtitle: 'Tokens, auto layout',
    category: 'ui',
    categoryLabel: 'Design System',
    priceEur: 49,
    rating: 4.9,
    reviewCount: 80,
    image: '',
    deliveryType: 'instant',
    formatLabel: 'Figma .fig',
    fileSize: '82 Mo',
    tags: ['Figma', 'UI Kit'],
    techStack: ['Figma'],
    description: 'Comprehensive design system',
  },
  {
    id: 'p3',
    sku: 'SKU-3',
    title: 'Draft Product',
    subtitle: 'WIP',
    category: 'boilerplates',
    categoryLabel: 'Draft',
    priceEur: 100,
    rating: 0,
    reviewCount: 0,
    image: '',
    deliveryType: 'instant',
    formatLabel: 'Draft',
    fileSize: '1 Mo',
    tags: [],
    techStack: [],
    description: 'Draft item',
    isDraft: true,
  },
];

test('formatPriceEur and formatPriceXaf produce accurate formatted strings', () => {
  assert.equal(formatPriceEur(88), '88,00 €');
  assert.equal(formatPriceEur(69.5), '69,50 €');
  // 88 * 655.957 ≈ 57724
  assert.match(formatPriceXaf(88), /57\s*724\s*FCFA/);
});

test('calculateSubtotal sums item prices accurately', () => {
  const items = [
    { product: mockProducts[0], licenseTier: 'standard' as const, priceEur: 69 },
    { product: mockProducts[1], licenseTier: 'standard' as const, priceEur: 29 },
  ];
  assert.equal(calculateSubtotal(items), 98);
});

test('validatePromoCode correctly applies valid and invalid promo codes', () => {
  // Valid fixed promo
  const res1 = validatePromoCode('WELCOME10', 98, mockPromos);
  assert.equal(res1.valid, true);
  assert.equal(res1.discount, 10);

  // Min spend not met
  const res2 = validatePromoCode('NOVA20', 40, mockPromos);
  assert.equal(res2.valid, false);
  assert.equal(res2.discount, 0);

  // Percent discount
  const res3 = validatePromoCode('FOUNDER45', 200, mockPromos);
  assert.equal(res3.valid, true);
  assert.equal(res3.discount, 90); // 45% of 200

  // Non-existent code
  const res4 = validatePromoCode('INVALID_CODE', 100, mockPromos);
  assert.equal(res4.valid, false);

  // Expired code
  const res5 = validatePromoCode('EXPIRED100', 100, mockPromos);
  assert.equal(res5.valid, false);
});

test('generateLicenseKey generates proper format with segment count', () => {
  const key = generateLicenseKey('NOVA-NX');
  assert.match(key, /^NOVA-NX-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-AUTH$/);
});

test('filterCatalogProducts filters drafts and searches text correctly', () => {
  // Filters draft
  const allNonDraft = filterCatalogProducts(mockProducts, {});
  assert.equal(allNonDraft.length, 2);

  // Search by keyword
  const searchResults = filterCatalogProducts(mockProducts, { search: 'Next.js' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, 'p1');

  // Filter by category
  const uiOnly = filterCatalogProducts(mockProducts, { category: 'ui' });
  assert.equal(uiOnly.length, 1);
  assert.equal(uiOnly[0].id, 'p2');
});
