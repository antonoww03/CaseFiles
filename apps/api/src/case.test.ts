import { describe, expect, it } from 'vitest';
import { evaluate, accusationSchema, evidence } from './case.js';

describe('Case 001 rules', () => {
 it('rejects wrong suspects', () => { expect(evaluate('elena', ['E04','E05','E08'], 'Financial motive', 'Complete timeline').status).toBe('incorrect'); });
 it('requires independent evidence groups', () => { expect(evaluate('martin', ['E04','E09','E03'], 'Financial motive', 'Complete timeline').status).toBe('insufficient'); });
 it('accepts corroborated evidence', () => { expect(evaluate('martin', ['E04','E09','E05','E06','E08'], 'Financial motive', 'Complete timeline', ['D01','D02']).status).toBe('solved'); });
 it('rejects accusations without connected evidence', () => { expect(evaluate('martin', ['E04','E09','E05','E06','E08'], 'Financial motive', 'Complete timeline', []).status).toBe('insufficient'); });
 it('contains twelve distinct evidence items', () => { expect(evidence.length).toBe(12); expect(new Set(evidence.map(e=>e.id)).size).toBe(12); });
 it('validates accusations', () => { expect(accusationSchema.safeParse({suspectId:'martin',motive:'',timeline:'',evidenceIds:[]}).success).toBe(false); });
});
