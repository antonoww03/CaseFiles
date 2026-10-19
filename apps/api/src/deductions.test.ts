import { describe, expect, it } from 'vitest';
import { deductions, findDeduction } from './deductions.js';

describe('evidence deductions', () => {
  it('connects the invoice message and financial draft', () => {
    expect(findDeduction('E04','E09')?.id).toBe('D01');
    expect(findDeduction('E09','E04')?.id).toBe('D01');
  });
  it('does not award arbitrary or self connections', () => {
    expect(findDeduction('E04','E04')).toBeUndefined();
    expect(findDeduction('E04','E07')).toBeUndefined();
  });
  it('has unique deduction identifiers and no repeated evidence', () => {
    expect(new Set(deductions.map(d=>d.id)).size).toBe(deductions.length);
    expect(deductions.every(d=>new Set(d.evidenceIds).size===2)).toBe(true);
  });
});
