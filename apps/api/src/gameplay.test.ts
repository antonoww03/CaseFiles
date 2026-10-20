import { describe, expect, it } from 'vitest';
import { noteSchema, availableContradictions, scoreCase, suspects } from './gameplay.js';

describe('CaseFiles 0.3 rules', () => {
  it('validates notebook input without arbitrary categories', () => {
    expect(noteSchema.safeParse({ title: 'Алиби', body: 'Провери записа', category: 'lead' }).success).toBe(true);
    expect(noteSchema.safeParse({ title: 'A', body: 'B', category: 'admin' }).success).toBe(false);
    expect(noteSchema.safeParse({ title: 'A', body: 'B' }).success).toBe(false);
  });
  it('requires all clues to verify contradictions', () => {
    const partial = availableContradictions(new Set(['E03', 'E04']));
    expect(partial.find(c => c.id === 'C01')?.ready).toBe(false);
    expect(availableContradictions(new Set(['E03', 'E11'])).find(c => c.id === 'C01')?.ready).toBe(true);
  });
  it('does not accuse the wrong person via an ambiguous access log', () => {
    const lead = availableContradictions(new Set(['E04', 'E05', 'E10']))[1];
    expect(lead.ready).toBe(true);
    expect(lead.kind).toBe('lead');
    expect(lead.finding).toContain('не доказва');
  });
  it('scores within bounds and caps unproven outcomes', () => {
    const allFound = new Set(['E01','E02','E03','E04','E05','E06','E07','E08','E09','E10','E11','E12']);
    const args = {
      found: allFound, links: new Set(['D01','D02','D03','D04','D05']),
      interviews: { martin: [{}, {}], elena: [{}, {}], petar: [{}, {}] },
      verified: new Set(['C01','C02'])
    };
    expect(scoreCase({ ...args, verdict:'solved' }).total).toBe(100);
    expect(scoreCase({ ...args, verdict:'incorrect' }).total).toBeLessThanOrEqual(49);
    expect(scoreCase({ found: new Set(), links: new Set(), interviews: {}, verified: new Set(), verdict:'insufficient' }).total).toBe(0);
  });
  it('exposes only public suspect biographies', () => {
    expect(suspects).toHaveLength(3);
    expect(new Set(suspects.map(s=>s.id)).size).toBe(3);
  });
});
