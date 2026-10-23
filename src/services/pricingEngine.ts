import { PricingRule } from '../types';

export const DEFAULT_PRICING_RULES: PricingRule[] = [
  {
    city: 'Mumbai',
    country: 'India',
    currency: 'INR',
    baseHourlyRate: 650,
    touristMultiplier: 0.1,
    tourTypeMultiplier: {
      'Historical': 1.0,
      'Cultural': 1.05,
      'Food Tour': 1.2,
      'Sightseeing': 0.95,
      'Custom': 1.15
    }
  },
  {
    city: 'Kyoto',
    country: 'Japan',
    currency: 'JPY',
    baseHourlyRate: 3800,
    touristMultiplier: 0.08,
    tourTypeMultiplier: {
      'Historical': 1.0,
      'Cultural': 1.1,
      'Food Tour': 1.25,
      'Sightseeing': 0.95,
      'Custom': 1.2
    }
  },
  {
    city: 'Rome',
    country: 'Italy',
    currency: 'EUR',
    baseHourlyRate: 32,
    touristMultiplier: 0.1,
    tourTypeMultiplier: {
      'Historical': 1.05,
      'Cultural': 1.0,
      'Food Tour': 1.2,
      'Sightseeing': 0.95,
      'Custom': 1.2
    }
  },
  {
    city: 'Paris',
    country: 'France',
    currency: 'EUR',
    baseHourlyRate: 38,
    touristMultiplier: 0.1,
    tourTypeMultiplier: {
      'Historical': 1.05,
      'Cultural': 1.0,
      'Food Tour': 1.25,
      'Sightseeing': 0.95,
      'Custom': 1.2
    }
  }
];

export function calculateEstimatedPrice(
  city: string,
  durationHours: number,
  numberOfTourists: number,
  tourType: string,
  pricingRules: PricingRule[] = DEFAULT_PRICING_RULES
): { min: number; max: number; currency: string } {
  const rule = pricingRules.find(r => r.city.toLowerCase() === city.toLowerCase()) || {
    city,
    country: 'International',
    currency: 'USD',
    baseHourlyRate: 25,
    touristMultiplier: 0.1,
    tourTypeMultiplier: { 'Historical': 1.0, 'Cultural': 1.0, 'Food Tour': 1.2, 'Sightseeing': 0.95, 'Custom': 1.15 }
  };

  const typeMult = rule.tourTypeMultiplier[tourType] || 1.0;
  const groupSurcharge = numberOfTourists > 2 ? (numberOfTourists - 2) * rule.touristMultiplier : 0;
  const base = durationHours * rule.baseHourlyRate * typeMult * (1 + groupSurcharge);

  // Provide a realistic indicative range: -15% to +25%
  const min = Math.round(base * 0.88 / 10) * 10;
  const max = Math.round(base * 1.25 / 10) * 10;

  return {
    min: Math.max(min, 10),
    max: Math.max(max, min + 10),
    currency: rule.currency
  };
}

export function formatCurrency(amount: number, currency: string): string {
  const symbolMap: Record<string, string> = {
    INR: '₹',
    JPY: '¥',
    EUR: '€',
    USD: '$',
    GBP: '£',
    SGD: 'S$',
    CAD: 'C$',
    AUD: 'A$'
  };
  const sym = symbolMap[currency] || currency + ' ';
  return `${sym}${Math.round(amount).toLocaleString()}`;
}

export const FX_RATES_TO_INR: Record<string, number> = {
  INR: 1,
  EUR: 91.50,
  USD: 84.20,
  JPY: 0.55,
  GBP: 109.80,
  SGD: 64.30,
  CAD: 61.20,
  AUD: 55.40
};

export function convertCurrencyToINR(amount: number, fromCurrency: string): number {
  const rate = FX_RATES_TO_INR[fromCurrency.toUpperCase()] ?? 1;
  return Math.round(amount * rate);
}

export function getDualCurrencyCharge(
  amount: number,
  currency: string
): {
  foreignCurrency: string;
  foreignAmount: number;
  foreignFormatted: string;
  inrAmount: number;
  inrFormatted: string;
  fxRate: number;
  rateLabel: string;
} {
  const cur = currency.toUpperCase();
  const fxRate = FX_RATES_TO_INR[cur] || 1;
  const inrAmount = Math.round(amount * fxRate);
  return {
    foreignCurrency: cur,
    foreignAmount: amount,
    foreignFormatted: formatCurrency(amount, cur),
    inrAmount,
    inrFormatted: formatCurrency(inrAmount, 'INR'),
    fxRate,
    rateLabel: cur === 'INR' ? 'Domestic (Home Currency)' : `1 ${cur} ≈ ₹${fxRate} INR`
  };
}

