export function parseMoney(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid money value: ${value}`);
  }
  return parsed;
}

export function roundMoney(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function moneyOrNull(value: string | number | null | undefined): string | null {
  if (value == null || value === '') return null;
  return roundMoney(parseMoney(value));
}
