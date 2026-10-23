import { formatPriceEur, formatPriceUsd, formatPriceXaf } from '../../utils/shop-logic.ts';

type Currency = 'EUR' | 'USD' | 'XAF';

interface PriceDisplayProps {
  amountEur: number;
  currency?: Currency;
  className?: string;
  showApproximation?: boolean;
}

const formatters: Record<Currency, (amountEur: number) => string> = {
  EUR: formatPriceEur,
  USD: formatPriceUsd,
  XAF: formatPriceXaf,
};

export function PriceDisplay({ amountEur, currency = 'EUR', className = '', showApproximation = false }: PriceDisplayProps) {
  return (
    <span className={className}>
      {showApproximation && currency !== 'EUR' ? '~' : ''}{formatters[currency](amountEur)}
    </span>
  );
}
