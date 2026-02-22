export const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NZ', name: 'New Zealand' },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];
export type CountryName = (typeof COUNTRIES)[number]['name'];

const CODE_TO_NAME = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.name]),
) as Record<string, string>;

const NAME_TO_CANONICAL = Object.fromEntries(
  COUNTRIES.map((c) => [c.name.toLowerCase(), c.name]),
) as Record<string, string>;
export function normalizeCountry(value: string): string {
  if (!value) return value;
  if (CODE_TO_NAME[value.toUpperCase()]) return CODE_TO_NAME[value.toUpperCase()];
  if (NAME_TO_CANONICAL[value.toLowerCase()]) return NAME_TO_CANONICAL[value.toLowerCase()];
  return value;
}
