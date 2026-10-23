import type { Product } from '../../utils/shop-logic.ts';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';
import { PriceDisplay } from '../ui/PriceDisplay.tsx';

type Currency = 'EUR' | 'USD' | 'XAF';
interface Props {
  product: Product;
  currency: Currency;
  layout?: 'grid' | 'list';
  compact?: boolean;
  onOpen: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onQuickBuy?: (product: Product) => void;
}

export function ProductCard({ product, currency, layout = 'grid', compact = false, onOpen, onAddToCart, onQuickBuy }: Props) {
  const horizontal = layout === 'list';
  const hasOld = typeof product.oldPriceEur === 'number' && product.oldPriceEur > product.priceEur;
  return (
    <article className={`group flex overflow-hidden rounded-lg border-[0.5px] border-[#31353e]/70 bg-[#181c24] shadow-sm transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#8083ff]/50 hover:bg-[#1c2028] hover:shadow-[0_12px_32px_rgb(0_0_0_/_0.18)] motion-reduce:transform-none ${horizontal ? 'flex-col sm:flex-row' : 'flex-col'}`}>
      <button type="button" onClick={() => onOpen(product)} aria-label={`Voir le produit ${product.title}`} className={`relative block overflow-hidden bg-[#0a0e16] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4cd7f6] ${horizontal ? 'aspect-video w-full shrink-0 sm:aspect-auto sm:w-56' : compact ? 'aspect-[16/8] w-full' : 'aspect-[16/9] w-full'}`}>
        <img src={product.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" />
        <span className="absolute bottom-2 left-2 max-w-[calc(100%-3.5rem)] truncate"><Badge tone="neutral" className="rounded-md bg-[#0a0e16]/90 backdrop-blur-sm">{product.formatLabel}</Badge></span>
        <span aria-hidden="true" className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-md border border-white/20 bg-[#0a0e16]/90 text-white shadow"><span className="material-symbols-outlined text-lg">visibility</span></span>
      </button>
      <div className={`flex min-w-0 flex-1 flex-col justify-between ${compact ? 'gap-3 p-3' : 'gap-4 p-4'}`}>
        <div className="space-y-1.5">
          <Badge tone="accent" className="rounded-md px-2 py-1">{product.categoryLabel}</Badge>
          <button type="button" onClick={() => onOpen(product)} className="block text-left font-['Plus_Jakarta_Sans'] text-base font-bold text-white transition-colors hover:text-[#c0c1ff] focus-visible:underline">{product.title}</button>
          <p className={`${compact ? 'line-clamp-1' : 'line-clamp-2'} text-sm leading-5 text-[#c7c4d7]`}>{product.description || product.subtitle}</p>
          {!compact && <div className="flex flex-wrap gap-1.5 pt-1">{product.techStack.slice(0, 3).map((tech) => <span key={tech} className="rounded-md border border-[#31353e] bg-[#0f131c] px-2 py-1 text-[11px] text-[#908fa0]">{tech}</span>)}</div>}
        </div>
        <div className={`flex flex-wrap items-end justify-between gap-2 border-t border-[#31353e] ${compact ? 'pt-2' : 'pt-3'}`}>
          <div className="space-y-0.5"><PriceDisplay amountEur={product.priceEur} currency={currency} className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white" showApproximation />{hasOld && <PriceDisplay amountEur={product.oldPriceEur!} currency={currency} className="block text-xs text-[#908fa0] line-through" showApproximation />}</div>
          <div className="flex items-center gap-1.5">{onQuickBuy && <Button size="sm" onClick={() => onQuickBuy(product)}>Acheter</Button>}<Button size="sm" variant={onQuickBuy ? 'secondary' : 'primary'} onClick={() => onAddToCart(product)} leadingIcon={<span aria-hidden="true" className="material-symbols-outlined text-base">add_shopping_cart</span>}>Ajouter</Button></div>
        </div>
      </div>
    </article>
  );
}
