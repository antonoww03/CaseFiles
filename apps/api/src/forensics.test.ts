import { describe, expect, it } from 'vitest';
import { clipObservations, documents, frameFor, verifyObservation, documentPage, observationSchema, hintLevels } from './forensics.js';
describe('CaseFiles 0.4 forensic rules', () => {
  it('rejects video unlocks based on the wrong moment or detail', () => {
    expect(verifyObservation('elevator',0,'врати')).toBeNull();
    expect(verifyObservation('elevator',120,'врати')).toBeNull();
    expect(verifyObservation('elevator',120,'презрамка')).toBe('E06');
    expect(verifyObservation('exit',120,'презрамка')).toBe('E07');
    expect(verifyObservation('unknown',120,'презрамка')).toBeNull();
  });
  it('exposes coherent timestamped video frames', () => {
    expect(frameFor('elevator',119)?.clock).toBe('01:11:00');
    expect(frameFor('elevator',120)?.clock).toBe('01:12:00');
    expect(clipObservations.length).toBe(2);
  });
  it('ties document unlocking to a real page', () => {
    expect(documentPage('draft','signature')?.finding).toContain('фактурите');
    expect(documentPage('access','bad')).toBeNull();
    expect(documents[0].requires).toContain('E04');
  });
  it('accepts only timeline observations in range', () => {
    expect(observationSchema.safeParse({second:120,detail:'презрамка'}).success).toBe(true);
    expect(observationSchema.safeParse({second:999,detail:'презрамка'}).success).toBe(false);
  });
  it('offers exactly three progressive hints', () => {
    expect(hintLevels.length).toBe(3);
    expect(hintLevels.map(h=>h.level)).toEqual([1,2,3]);
  });
});
