import { describe, expect, it } from 'vitest';
import { formatMoney, locationOf } from './format';
import { safeNext } from './constants';

describe('formatters', () => {
  it('hides an undisclosed price', () => {
    expect(formatMoney(850000, 'ON_REQUEST')).toBe('Price on request');
    expect(formatMoney(null, 'PUBLIC')).toBe('Price on request');
    expect(formatMoney(850000, 'PUBLIC')).toBe('$850,000');
  });

  it('joins a city and region without inventing an address', () => {
    expect(locationOf('Portland', 'Oregon')).toBe('Portland, Oregon');
    expect(locationOf('', '')).toBe('Location not provided');
  });

  it('only follows a same-site relative path after sign-in', () => {
    expect(safeNext('/practices/123', 'BUYER')).toBe('/practices/123');
    expect(safeNext('https://example.com', 'BUYER')).toBe('/dashboard/buyer');
    expect(safeNext('//example.com', 'SELLER')).toBe('/dashboard/seller');
    expect(safeNext(null, 'ADMIN')).toBe('/dashboard/admin');
  });
});
