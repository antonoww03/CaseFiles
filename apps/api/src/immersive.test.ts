import { describe, expect, it } from 'vitest';
import {
  newImmersiveState, interaction, chooseDialogue, searchRecords,
  interactionSchema, immersiveSnapshot, searchSchema
} from './immersive.js';

describe('CASEFILES 0.6 immersive investigation',()=>{
  it('requires the physical key before opening the desk drawer',()=>{
    const state=newImmersiveState();
    expect(interaction(state,new Set(),{kind:'inspect',objectId:'drawer'}).status).toBe(403);
    expect(interaction(state,new Set(),{kind:'inspect',objectId:'doormat'}).status).toBe(200);
    expect(state.inventory).toContain('brass_key');
    expect(interaction(state,new Set(),{kind:'inspect',objectId:'drawer'}).status).toBe(200);
    expect(state.inventory).toContain('negative');
    expect(state.inventory.filter(id=>id==='negative')).toHaveLength(1);
  });
  it('gates the hidden paper behind discovered evidence',()=>{
    const state=newImmersiveState();
    expect(interaction(state,new Set(),{kind:'inspect',objectId:'papers'}).status).toBe(403);
    expect(interaction(state,new Set(['E04']),{kind:'inspect',objectId:'papers'}).status).toBe(200);
    expect(state.inventory).toContain('cipher_strip');
  });
  it('rejects invented combinations and requires UV context before opening the safe',()=>{
    const state=newImmersiveState();
    expect(interaction(state,new Set(),{kind:'puzzle',puzzleId:'safe_dial',digits:[3,7,1]}).status).toBe(403);
    interaction(state,new Set(),{kind:'inspect',objectId:'lamp'});
    interaction(state,new Set(['E04']),{kind:'inspect',objectId:'papers'});
    expect(interaction(state,new Set(),{kind:'combine',first:'uv_lamp',second:'brass_key'}).status).toBe(403);
    expect(interaction(state,new Set(),{kind:'combine',first:'uv_lamp',second:'cipher_strip'}).status).toBe(200);
    expect(state.discoveries).toContain('uv_marker');
    expect(interaction(state,new Set(),{kind:'puzzle',puzzleId:'safe_dial',digits:[3,7,2]}).status).toBe(422);
    expect(interaction(state,new Set(),{kind:'puzzle',puzzleId:'safe_dial',digits:[3,7,1]}).status).toBe(200);
    expect(state.solved).toEqual(['safe_dial']);
  });
  it('requires validated player actions',()=>{
    expect(interactionSchema.safeParse({kind:'inspect',objectId:'drawer'}).success).toBe(true);
    expect(interactionSchema.safeParse({kind:'puzzle',puzzleId:'safe_dial',digits:[3,7,99]}).success).toBe(false);
    expect(searchSchema.safeParse({query:'a'}).success).toBe(false);
  });
  it('changes trust with consequential branches but does not modify factual case evidence',()=>{
    const state=newImmersiveState();
    expect(chooseDialogue(state,new Set(), 'martin_facts').status).toBe(403);
    expect(chooseDialogue(state,new Set(),'martin_threat').status).toBe(200);
    expect(state.trust.martin).toBe(17);
    expect(chooseDialogue(state,new Set(['E04']),'martin_facts').status).toBe(403);
    expect(chooseDialogue(state,new Set(),'martin_intro').status).toBe(200);
    expect(chooseDialogue(state,new Set(),'martin_intro').status).toBe(409);
    expect(state.dialogue).toHaveLength(2);
  });
  it('police archive never reveals unearned evidence',()=>{
    expect(searchRecords(new Set(),'камера')).toHaveLength(0);
    expect(searchRecords(new Set(['E06']),'камера')).toHaveLength(1);
    expect(searchRecords(new Set(['E04']),'фактури')).toHaveLength(0);
    expect(searchRecords(new Set(['E04','E09']),'фактури')).toHaveLength(1);
    expect(immersiveSnapshot(newImmersiveState(),new Set()).inventory).toHaveLength(0);
  });
});
